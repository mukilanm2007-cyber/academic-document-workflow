const { query } = require('../config/db');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');
const { getStatusForRole } = require('../services/workflowService');

/**
 * Generate unique reference number: REQ-YYYY-RANDOM
 */
function generateReferenceNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${year}-${random}`;
}

async function createRequest(req, res, next) {
  try {
    const studentId = req.user.id;
    const departmentId = req.user.department_id;
    const { document_type_id, purpose, additional_details, is_draft } = req.body;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Your student profile must be assigned to an academic department before requesting documents.'
      });
    }

    // Verify document type exists and is active
    const docTypes = await query('SELECT * FROM document_types WHERE id = ? AND is_active = 1', [document_type_id]);
    if (docTypes.length === 0) {
      return res.status(404).json({ success: false, message: 'Academic document type not found or is currently inactive.' });
    }
    const docType = docTypes[0];

    // Find first workflow stage for this document type
    const stages = await query(
      'SELECT * FROM workflow_stages WHERE document_type_id = ? ORDER BY stage_order ASC LIMIT 1',
      [document_type_id]
    );

    const firstStage = stages.length > 0 ? stages[0] : null;
    const initialStatus = is_draft === 'true' || is_draft === true ? 'Draft' : 'Submitted';

    // Unique reference number
    let referenceNumber = generateReferenceNumber();
    // Ensure uniqueness
    let exists = await query('SELECT id FROM document_requests WHERE reference_number = ?', [referenceNumber]);
    while (exists.length > 0) {
      referenceNumber = generateReferenceNumber();
      exists = await query('SELECT id FROM document_requests WHERE reference_number = ?', [referenceNumber]);
    }

    const insertResult = await query(
      `INSERT INTO document_requests (reference_number, student_id, document_type_id, department_id, purpose, additional_details, current_stage_id, current_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [referenceNumber, studentId, document_type_id, departmentId, purpose.trim(), additional_details ? additional_details.trim() : null, firstStage ? firstStage.id : null, initialStatus]
    );

    const requestId = insertResult.insertId;

    // Handle uploaded supporting documents
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await query(
          `INSERT INTO supporting_documents (request_id, file_name, stored_name, file_path, file_size, file_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [requestId, file.originalname, file.filename, `uploads/${file.filename}`, file.size, file.mimetype]
        );
      }
    }

    // Notifications and audit log
    if (initialStatus === 'Submitted') {
      await createNotification(
        studentId,
        requestId,
        'Request Submitted Successfully',
        `Your application for ${docType.name} (Ref: ${referenceNumber}) has been submitted and queued for review.`,
        'success'
      );

      // Notify approver
      if (firstStage) {
        const approverQuery = firstStage.department_required && firstStage.approver_role !== 'academic_office'
          ? 'SELECT id FROM users WHERE role = ? AND department_id = ? AND account_status = "active"'
          : 'SELECT id FROM users WHERE role = ? AND account_status = "active"';
        const params = firstStage.department_required && firstStage.approver_role !== 'academic_office'
          ? [firstStage.approver_role, departmentId]
          : [firstStage.approver_role];
        
        const approvers = await query(approverQuery, params);
        for (const app of approvers) {
          await createNotification(
            app.id,
            requestId,
            'New Request for Review',
            `Student ${req.user.name} submitted request ${referenceNumber} for ${docType.name}.`,
            'action'
          );
        }
      }
    }

    await logAudit(studentId, 'REQUEST_CREATE', 'document_requests', requestId, `Created request ${referenceNumber} (${docType.name}) in status ${initialStatus}`, req.ip);

    return res.status(201).json({
      success: true,
      message: initialStatus === 'Draft' ? 'Request saved as draft.' : 'Document request submitted successfully!',
      requestId,
      referenceNumber
    });
  } catch (error) {
    next(error);
  }
}

async function getMyRequests(req, res, next) {
  try {
    const studentId = req.user.id;
    const { status, doc_type } = req.query;

    let sql = `
      SELECT r.*, dt.name as document_type_name, dt.code as document_type_code, dt.processing_days,
             d.name as department_name, d.code as department_code,
             ws.stage_name as current_stage_name, ws.approver_role as current_stage_role,
             idoc.document_number as issued_document_number, idoc.id as issued_document_id
      FROM document_requests r
      JOIN document_types dt ON r.document_type_id = dt.id
      JOIN departments d ON r.department_id = d.id
      LEFT JOIN workflow_stages ws ON r.current_stage_id = ws.id
      LEFT JOIN issued_documents idoc ON r.id = idoc.request_id
      WHERE r.student_id = ?
    `;

    const params = [studentId];

    if (status && status !== 'All') {
      sql += ' AND r.current_status = ?';
      params.push(status);
    }

    if (doc_type && doc_type !== 'All') {
      sql += ' AND dt.id = ?';
      params.push(doc_type);
    }

    sql += ' ORDER BY r.submission_date DESC';

    const requests = await query(sql, params);

    return res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
}

async function getRequestById(req, res, next) {
  try {
    const requestId = req.params.id;

    const sql = `
      SELECT r.*, dt.name as document_type_name, dt.code as document_type_code, dt.description as document_type_desc, dt.processing_days, dt.requirements as document_requirements,
             d.name as department_name, d.code as department_code,
             u.name as student_name, u.email as student_email, u.registration_number, u.phone as student_phone, u.program, u.academic_year,
             ws.stage_name as current_stage_name, ws.stage_order as current_stage_order, ws.approver_role as current_stage_role,
             idoc.id as issued_document_id, idoc.document_number, idoc.issue_date, idoc.verification_code
      FROM document_requests r
      JOIN document_types dt ON r.document_type_id = dt.id
      JOIN departments d ON r.department_id = d.id
      JOIN users u ON r.student_id = u.id
      LEFT JOIN workflow_stages ws ON r.current_stage_id = ws.id
      LEFT JOIN issued_documents idoc ON r.id = idoc.request_id
      WHERE r.id = ?
    `;

    const requests = await query(sql, [requestId]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Document request not found.' });
    }

    const request = requests[0];

    // Security Check: Students can only view their own requests
    if (req.user.role === 'student' && request.student_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to view another student\'s request.' });
    }

    // Fetch Approval History
    const history = await query(
      `SELECT h.*, u.name as approver_name, u.role as approver_role, ws.stage_name
       FROM approval_history h
       JOIN users u ON h.approver_id = u.id
       LEFT JOIN workflow_stages ws ON h.workflow_stage_id = ws.id
       WHERE h.request_id = ?
       ORDER BY h.decision_timestamp ASC`,
      [requestId]
    );

    // Fetch Supporting Documents
    const attachments = await query(
      'SELECT id, file_name, file_size, file_type, upload_timestamp FROM supporting_documents WHERE request_id = ?',
      [requestId]
    );

    // Fetch All Workflow Stages for this document type to render complete progress timeline
    const allStages = await query(
      'SELECT * FROM workflow_stages WHERE document_type_id = ? ORDER BY stage_order ASC',
      [request.document_type_id]
    );

    return res.status(200).json({
      success: true,
      request,
      history,
      attachments,
      stages: allStages
    });
  } catch (error) {
    next(error);
  }
}

async function cancelRequest(req, res, next) {
  try {
    const requestId = req.params.id;
    const studentId = req.user.id;

    const requests = await query('SELECT * FROM document_requests WHERE id = ?', [requestId]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const request = requests[0];

    if (request.student_id !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only cancel your own requests.' });
    }

    const cancellableStatuses = ['Draft', 'Submitted', 'Correction Required'];
    if (!cancellableStatuses.includes(request.current_status)) {
      return res.status(400).json({
        success: false,
        message: `Request cannot be cancelled once review has commenced or completed. Current status: '${request.current_status}'.`
      });
    }

    await query('UPDATE document_requests SET current_status = "Cancelled", updated_at = NOW() WHERE id = ?', [requestId]);

    await createNotification(
      studentId,
      requestId,
      'Request Cancelled',
      `Your request ${request.reference_number} has been cancelled.`,
      'info'
    );

    await logAudit(studentId, 'REQUEST_CANCEL', 'document_requests', requestId, `Request ${request.reference_number} cancelled by student`, req.ip);

    return res.status(200).json({ success: true, message: 'Request has been successfully cancelled.' });
  } catch (error) {
    next(error);
  }
}

async function resubmitRequest(req, res, next) {
  try {
    const requestId = req.params.id;
    const studentId = req.user.id;
    const { purpose, additional_details } = req.body;

    const requests = await query('SELECT * FROM document_requests WHERE id = ?', [requestId]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const request = requests[0];

    if (request.student_id !== studentId) {
      return res.status(403).json({ success: false, message: 'You can only resubmit your own requests.' });
    }

    if (request.current_status !== 'Correction Required') {
      return res.status(400).json({
        success: false,
        message: `Resubmission is only allowed when status is 'Correction Required'. Current status: '${request.current_status}'.`
      });
    }

    // Determine target status (Under Department Review)
    const newStatus = 'Under Department Review';

    await query(
      `UPDATE document_requests 
       SET purpose = COALESCE(?, purpose), additional_details = COALESCE(?, additional_details),
           current_status = ?, correction_notes = NULL, updated_at = NOW()
       WHERE id = ?`,
      [purpose ? purpose.trim() : null, additional_details ? additional_details.trim() : null, newStatus, requestId]
    );

    // Save any newly uploaded supporting attachments
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await query(
          `INSERT INTO supporting_documents (request_id, file_name, stored_name, file_path, file_size, file_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [requestId, file.originalname, file.filename, `uploads/${file.filename}`, file.size, file.mimetype]
        );
      }
    }

    await createNotification(
      studentId,
      requestId,
      'Request Resubmitted',
      `Your request ${request.reference_number} has been resubmitted with corrections and returned to department review.`,
      'info'
    );

    await logAudit(studentId, 'REQUEST_RESUBMIT', 'document_requests', requestId, `Resubmitted request ${request.reference_number} with updated details`, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Request successfully resubmitted! It is now under department review.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  getRequestById,
  cancelRequest,
  resubmitRequest
};
