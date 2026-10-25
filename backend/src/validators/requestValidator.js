function validateDocumentRequest(req, res, next) {
  const { document_type_id, purpose } = req.body;

  if (!document_type_id) {
    return res.status(400).json({ success: false, message: 'Document type selection is required.' });
  }

  if (!purpose || typeof purpose !== 'string' || purpose.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Please provide a clear purpose for the request (min 5 characters).' });
  }

  next();
}

function validateApprovalAction(req, res, next) {
  const { action, comments } = req.body;
  const allowedActions = ['Approve', 'Reject', 'Request Correction'];

  if (!action || !allowedActions.includes(action)) {
    return res.status(400).json({
      success: false,
      message: `Invalid action. Must be one of: ${allowedActions.join(', ')}`
    });
  }

  if ((action === 'Reject' || action === 'Request Correction') && (!comments || comments.trim().length < 5)) {
    return res.status(400).json({
      success: false,
      message: `Mandatory comments are required when performing '${action}' (min 5 characters).`
    });
  }

  next();
}

module.exports = {
  validateDocumentRequest,
  validateApprovalAction
};
