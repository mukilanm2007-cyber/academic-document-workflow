const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateApprovalAction } = require('../validators/requestValidator');

// Approvers only
router.use(authenticateToken);
router.use(authorizeRoles('faculty', 'hod', 'academic_office', 'admin'));

router.get('/pending', approvalController.getPendingApprovals);
router.get('/history', approvalController.getApprovalHistory);

router.post('/:id/approve', approvalController.approve);
router.post('/:id/reject', approvalController.reject);
router.post('/:id/request-correction', approvalController.requestCorrection);

module.exports = router;
