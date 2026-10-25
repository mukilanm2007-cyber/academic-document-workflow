const { query } = require('../config/db');
const { processApproval, processRejection, processCorrectionRequest } = require('../services/workflowService');

async function getPendingApprovals(req, res, next) {
  try {
    const user = req.user;
    const { status, search, department_id, doc_type_id } = req.query;

    let sql = `
      SELECT r.*, dt.name as document_type_name, dt.code as document_type_code, dt.processing_days,
             d.name as department_name, d.code as department_code,
             u.name as student_name, u.email as student_email, u.registration_number, u.program, u.academic_year,
             ws.stage_name as current_stage_name, ws.stage_order as current_stage_order, ws.approver_role
      FROM document_requests r
      JOIN document_types dt ON r.document_type_id = dt.id
      JOIN departments d ON r.department_id = d.id
      JOIN users u ON r.student_id = u.id
      LEFT JOIN workflow_stages ws ON r.current_stage_id = ws.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by approver authority
    if (user.role === 'admin') {
      // Admin can see everything
    } else if (user.role === 'academic_office') {
      // Academic office handles university-wide stages
      sql += ' AND (ws.approver_role = "academic_office" OR r.current_status = "Pending Academic Office Verification")';
    } else if (user.role === 'hod') {
      // HOD handles HOD stage for their department
      sql += ' AND (ws.approver_role = "hod" OR r.current_status = "Pending HOD Approval") AND r.department_id = ?';
      params.push(user.department_id);
    } else if (user.role === 'faculty') {
      // Faculty handles faculty review for their department
      sql += ' AND (ws.approver_role = "faculty" OR r.current_status IN ("Submitted", "Under Department Review")) AND r.department_id = ?';
      params.push(user.department_id);
    } else {
      return res.status(403).json({ success: false, message: 'Students cannot access approver queues.' });
    }

    // Optional status filter
    if (status && status !== 'All') {
      sql += ' AND r.current_status = ?';
      params.push(status);
    } else {
      // Default to non-terminal active requests
      sql += ' AND r.current_status NOT IN ("Draft", "Cancelled")';
    }

    if (department_id) {
      sql += ' AND r.department_id = ?';
      params.push(department_id);
    }

    if (doc_type_id) {
      sql += ' AND r.document_type_id = ?';
      params.push(doc_type_id);
    }

    if (search) {
      sql += ' AND (r.reference_number LIKE ? OR u.name LIKE ? OR u.registration_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY r.submission_date ASC';

    const requests = await query(sql, params);

    // Compute metrics
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN r.current_status IN ('Submitted', 'Under Department Review', 'Pending HOD Approval', 'Pending Academic Office Verification') THEN 1 END) as pending_count,
        COUNT(CASE WHEN r.current_status = 'Correction Required' THEN 1 END) as correction_count,
        COUNT(CASE WHEN r.current_status IN ('Approved', 'Document Issued', 'Completed') THEN 1 END) as approved_count,
        COUNT(CASE WHEN r.current_status = 'Rejected' THEN 1 END) as rejected_count,
        COUNT(*) as total_count
      FROM document_requests r
      WHERE ${user.role === 'admin' || user.role === 'academic_office' ? '1=1' : 'r.department_id = ' + user.department_id}
    `;
    const [stats] = await query(statsQuery);

    return res.status(200).json({
      success: true,
      requests,
      stats: stats || {}
    });
  } catch (error) {
    next(error);
  }
}

async function getApprovalHistory(req, res, next) {
  try {
    const user = req.user;

    const sql = `
      SELECT h.*, r.reference_number, r.purpose,
             dt.name as document_type_name,
             u.name as student_name, u.registration_number,
             d.name as department_name
      FROM approval_history h
      JOIN document_requests r ON h.request_id = r.id
      JOIN document_types dt ON r.document_type_id = dt.id
      JOIN departments d ON r.department_id = d.id
      JOIN users u ON r.student_id = u.id
      WHERE ${user.role === 'admin' ? '1=1' : 'h.approver_id = ?'}
      ORDER BY h.decision_timestamp DESC
    `;

    const history = await query(sql, user.role === 'admin' ? [] : [user.id]);

    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
}

async function approve(req, res, next) {
  try {
    const requestId = req.params.id;
    const { comments } = req.body;

    const result = await processApproval(requestId, req.user, comments);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function reject(req, res, next) {
  try {
    const requestId = req.params.id;
    const { comments } = req.body;

    const result = await processRejection(requestId, req.user, comments);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

async function requestCorrection(req, res, next) {
  try {
    const requestId = req.params.id;
    const { comments } = req.body;

    const result = await processCorrectionRequest(requestId, req.user, comments);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPendingApprovals,
  getApprovalHistory,
  approve,
  reject,
  requestCorrection
};
