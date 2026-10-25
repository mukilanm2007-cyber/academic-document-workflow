const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All admin routes require admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// Dashboard Stats
router.get('/dashboard', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);

// Department Management
router.get('/departments', adminController.getDepartments);
router.post('/departments', adminController.createDepartment);
router.put('/departments/:id', adminController.updateDepartment);

// Document Types Configuration
router.get('/document-types', adminController.getDocumentTypes);
router.post('/document-types', adminController.createDocumentType);
router.put('/document-types/:id', adminController.updateDocumentType);

// Workflow Stages Configuration
router.get('/workflows', adminController.getWorkflows);
router.put('/workflows/:id', adminController.updateWorkflowStages);

// Reports & CSV
router.get('/reports', adminController.getReports);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
