const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateDocumentRequest } = require('../validators/requestValidator');

// All request routes require authentication
router.use(authenticateToken);

// Student submits request (with optional supporting file uploads)
router.post(
  '/',
  authorizeRoles('student', 'admin'),
  upload.array('attachments', 5),
  validateDocumentRequest,
  requestController.createRequest
);

// Student views their requests
router.get('/my', authorizeRoles('student', 'admin'), requestController.getMyRequests);

// View specific request details
router.get('/:id', requestController.getRequestById);

// Student cancels their pending request
router.post('/:id/cancel', authorizeRoles('student', 'admin'), requestController.cancelRequest);

// Student resubmits corrected request
router.post(
  '/:id/resubmit',
  authorizeRoles('student', 'admin'),
  upload.array('attachments', 5),
  requestController.resubmitRequest
);

module.exports = router;
