const { query } = require('../config/db');
const { createNotification } = require('./notificationService');
const { logAudit } = require('./auditService');
const { generateOfficialPDF } = require('./pdfService');
const logger = require('../utils/logger');

/**
 * Determine the initial status based on the first workflow stage approver
 */
function getStatusForRole(role) {
  switch (role) {
    case 'faculty':
      return 'Under Department Review';
    case 'hod':
      return 'Pending HOD Approval';
    case 'academic_office':
      return 'Pending Academic Office Verification';
    default:
      return 'Under Department Review';
  }
}

/**
 * Check if the given user is authorized to act on the current request stage
 */
function canUserApprove(user, request, currentStage) {
  // System administrators can act on any stage
  if (user.role === 'admin') return true;

  if (!currentStage) return false;

  // Role must match stage requirement
  if (user.role !== currentStage.approver_role) {
    return false;
  }

  // If department match is required, verify user's department matches request
  if (currentStage.department_required) {
    if (user.department_id !== request.department_id) {
      return false;
    }
  }

  return true;
}

/**
 * Advance request through approval workflow
 */
async function processApproval(requestId, approverUser, comments) {
  // 1. Fetch request details with student and document type
  const requests = await query(
    `SELECT r.*, dt.name as doc_name, dt.code as doc_code, 
            u.name as student_name, u.email as student_email, u.registration_number, u.program, u.academic_year,
            d.name as department_name, d.code as department_code
     FROM document_requests r
     JOIN document_types dt ON r.document_type_id = dt.id
     JOIN users u ON r.student_id = u.id
     JOIN departments d ON r.department_id = d.id
     WHERE r.id = ?`,
    [requestId]
  );

  if (requests.length === 0) {
    throw new Error('Document request not found.');
  }

  const reqData = requests[0];

  // Disallow approval if already finalized
  const terminalStatuses = ['Completed', 'Document Issued', 'Rejected', 'Cancelled'];
  if (terminalStatuses.includes(reqData.current_status)) {
    throw new Error(`Cannot process approval. Request is already in terminal status '${reqData.current_status}'.`);
  }

  // 2. Fetch current stage
  let currentStage = null;
  if (reqData.current_stage_id) {
    const stages = await query('SELECT * FROM workflow_stages WHERE id = ?', [reqData.current_stage_id]);
    if (stages.length > 0) currentStage = stages[0];
  }

  // If request has no stage assigned yet, assign stage 1
  if (!currentStage) {
    const firstStages = await query(
      'SELECT * FROM workflow_stages WHERE document_type_id = ? ORDER BY stage_order ASC LIMIT 1',
      [reqData.document_type_id]
    );
    if (firstStages.length > 0) currentStage = firstStages[0];
  }

  // 3. Verify permissions
  if (!canUserApprove(approverUser, reqData, currentStage)) {
    throw new Error(`Access denied. You do not have permission to approve this request at stage '${currentStage ? currentStage.stage_name : 'Initial'}'.`);
  }

  // 4. Look for next stage
  const nextStages = await query(
    `SELECT * FROM workflow_stages 
     WHERE document_type_id = ? AND stage_order > ? 
     ORDER BY stage_order ASC LIMIT 1`,
    [reqData.document_type_id, currentStage ? currentStage.stage_order : 0]
  );

  const prevStatus = reqData.current_status;
  let newStatus;
  let nextStageId = null;

  if (nextStages.length > 0 && !(currentStage && currentStage.is_final_approval)) {
    // Move to next stage
    const nextStage = nextStages[0];
    nextStageId = nextStage.id;
    newStatus = getStatusForRole(nextStage.approver_role);

    await query(
      'UPDATE document_requests SET current_stage_id = ?, current_status = ?, correction_notes = NULL, updated_at = NOW() WHERE id = ?',
      [nextStageId, newStatus, requestId]
    );

    // Record approval history
    await query(
      'INSERT INTO approval_history (request_id, workflow_stage_id, approver_id, action, comments, previous_status, new_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [requestId, currentStage ? currentStage.id : null, approverUser.id, 'Approved', comments || 'Approved and forwarded to next stage.', prevStatus, newStatus]
    );

    // Notify student
    await createNotification(
      reqData.student_id,
      requestId,
      `Request Updated: Forwarded to ${nextStage.stage_name}`,
      `Your request ${reqData.reference_number} was approved by ${approverUser.name} and forwarded to ${nextStage.stage_name}.`,
      'info'
    );

    // Notify approvers in next stage
    await notifyNextStageApprovers(nextStage, reqData);

    await logAudit(
      approverUser.id,
      'STAGE_APPROVAL',
      'document_requests',
      requestId,
      `Approved stage ${currentStage ? currentStage.stage_name : '1'} and forwarded to ${nextStage.stage_name}. Status: ${newStatus}`
    );

    return {
      status: newStatus,
      isFinal: false,
      message: `Request successfully approved and forwarded to stage: ${nextStage.stage_name}.`
    };
  } else {
    // Final stage reached! Approve and issue document
    newStatus = 'Document Issued';

    // Generate PDF document
    const generated = await generateOfficialPDF(
      reqData,
      {
        name: reqData.student_name,
        email: reqData.student_email,
        registration_number: reqData.registration_number,
        program: reqData.program,
        academic_year: reqData.academic_year,
        department_name: reqData.department_name
      },
      {
        name: reqData.doc_name,
        code: reqData.doc_code
      },
      approverUser
    );

    // Save issued document record
    await query(
      `INSERT INTO issued_documents (request_id, document_number, file_path, issue_date, issued_by, verification_code)
       VALUES (?, ?, ?, NOW(), ?, ?)
       ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), issue_date = NOW(), issued_by = VALUES(issued_by)`,
      [requestId, generated.documentNumber, generated.relativePath, approverUser.id, generated.verificationCode]
    );

    // Update request status to Document Issued
    await query(
      'UPDATE document_requests SET current_status = ?, completion_date = NOW(), correction_notes = NULL, updated_at = NOW() WHERE id = ?',
      [newStatus, requestId]
    );

    // Record approval history
    await query(
      'INSERT INTO approval_history (request_id, workflow_stage_id, approver_id, action, comments, previous_status, new_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [requestId, currentStage ? currentStage.id : null, approverUser.id, 'Issued', comments || 'Final approval granted. Official document generated and issued.', prevStatus, newStatus]
    );

    // Notify student
    await createNotification(
      reqData.student_id,
      requestId,
      `Document Issued: ${reqData.doc_name}`,
      `Your document request ${reqData.reference_number} has been fully approved! Your official certificate (${generated.documentNumber}) is now ready to download.`,
      'success'
    );

    await logAudit(
      approverUser.id,
      'DOCUMENT_ISSUE',
      'issued_documents',
      requestId,
      `Final approval granted. Issued document ${generated.documentNumber} for reference ${reqData.reference_number}`
    );

    return {
      status: newStatus,
      isFinal: true,
      documentNumber: generated.documentNumber,
      message: `Final stage approved! Official document ${generated.documentNumber} generated and issued successfully.`
    };
  }
}

/**
 * Reject request with mandatory reason
 */
async function processRejection(requestId, approverUser, comments) {
  if (!comments || comments.trim().length < 5) {
    throw new Error('Mandatory comments/reason (minimum 5 characters) are required to reject a request.');
  }

  const requests = await query(
    `SELECT r.*, u.name as student_name, dt.name as doc_name 
     FROM document_requests r
     JOIN users u ON r.student_id = u.id
     JOIN document_types dt ON r.document_type_id = dt.id
     WHERE r.id = ?`,
    [requestId]
  );

  if (requests.length === 0) {
    throw new Error('Document request not found.');
  }

  const reqData = requests[0];
  const prevStatus = reqData.current_status;

  // Check stage permission
  let currentStage = null;
  if (reqData.current_stage_id) {
    const stages = await query('SELECT * FROM workflow_stages WHERE id = ?', [reqData.current_stage_id]);
    if (stages.length > 0) currentStage = stages[0];
  }

  if (!canUserApprove(approverUser, reqData, currentStage)) {
    throw new Error('Access denied. You do not have permission to reject this request.');
  }

  await query(
    'UPDATE document_requests SET current_status = ?, rejection_reason = ?, updated_at = NOW() WHERE id = ?',
    ['Rejected', comments, requestId]
  );

  await query(
    'INSERT INTO approval_history (request_id, workflow_stage_id, approver_id, action, comments, previous_status, new_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [requestId, currentStage ? currentStage.id : null, approverUser.id, 'Rejected', comments, prevStatus, 'Rejected']
  );

  await createNotification(
    reqData.student_id,
    requestId,
    `Request Rejected: ${reqData.reference_number}`,
    `Your request for ${reqData.doc_name} was rejected by ${approverUser.name}. Reason: "${comments}"`,
    'danger'
  );

  await logAudit(
    approverUser.id,
    'REQUEST_REJECT',
    'document_requests',
    requestId,
    `Rejected request ${reqData.reference_number}. Reason: ${comments}`
  );

  return {
    status: 'Rejected',
    message: 'Request rejected successfully.'
  };
}

/**
 * Request correction from student
 */
async function processCorrectionRequest(requestId, approverUser, comments) {
  if (!comments || comments.trim().length < 5) {
    throw new Error('Specific instructions/notes are required for requesting corrections.');
  }

  const requests = await query(
    `SELECT r.*, dt.name as doc_name FROM document_requests r
     JOIN document_types dt ON r.document_type_id = dt.id
     WHERE r.id = ?`,
    [requestId]
  );

  if (requests.length === 0) {
    throw new Error('Document request not found.');
  }

  const reqData = requests[0];
  const prevStatus = reqData.current_status;

  let currentStage = null;
  if (reqData.current_stage_id) {
    const stages = await query('SELECT * FROM workflow_stages WHERE id = ?', [reqData.current_stage_id]);
    if (stages.length > 0) currentStage = stages[0];
  }

  if (!canUserApprove(approverUser, reqData, currentStage)) {
    throw new Error('Access denied. You do not have permission to request corrections on this request.');
  }

  await query(
    'UPDATE document_requests SET current_status = ?, correction_notes = ?, updated_at = NOW() WHERE id = ?',
    ['Correction Required', comments, requestId]
  );

  await query(
    'INSERT INTO approval_history (request_id, workflow_stage_id, approver_id, action, comments, previous_status, new_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [requestId, currentStage ? currentStage.id : null, approverUser.id, 'Correction Requested', comments, prevStatus, 'Correction Required']
  );

  await createNotification(
    reqData.student_id,
    requestId,
    `Action Needed: Correction Required for ${reqData.reference_number}`,
    `${approverUser.name} requested changes: "${comments}". Please update your request details or documents.`,
    'warning'
  );

  await logAudit(
    approverUser.id,
    'REQUEST_CORRECTION',
    'document_requests',
    requestId,
    `Requested correction on ${reqData.reference_number}: ${comments}`
  );

  return {
    status: 'Correction Required',
    message: 'Correction request submitted. Student notified.'
  };
}

/**
 * Notify approvers when a request lands on their stage
 */
async function notifyNextStageApprovers(stage, reqData) {
  try {
    let approverQuery = 'SELECT id FROM users WHERE role = ? AND account_status = "active"';
    let params = [stage.approver_role];

    if (stage.department_required && stage.approver_role !== 'academic_office' && stage.approver_role !== 'admin') {
      approverQuery += ' AND department_id = ?';
      params.push(reqData.department_id);
    }

    const approvers = await query(approverQuery, params);
    for (const app of approvers) {
      await createNotification(
        app.id,
        reqData.id,
        `New Pending Approval: ${reqData.reference_number}`,
        `Document request for ${reqData.doc_name} from ${reqData.student_name} requires your review in stage "${stage.stage_name}".`,
        'action'
      );
    }
  } catch (err) {
    logger.error('Failed to notify next stage approvers:', err.message);
  }
}

module.exports = {
  getStatusForRole,
  canUserApprove,
  processApproval,
  processRejection,
  processCorrectionRequest
};
