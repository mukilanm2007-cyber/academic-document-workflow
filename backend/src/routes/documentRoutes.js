const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', documentController.getAllDocuments);
router.get('/:id', documentController.getDocumentById);
router.get('/:id/download', documentController.downloadDocument);
router.get('/attachments/:id/download', documentController.downloadAttachment);

module.exports = router;
