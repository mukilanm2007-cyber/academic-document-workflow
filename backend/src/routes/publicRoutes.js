const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// Public list of active document types
router.get('/document-types', async (req, res, next) => {
  try {
    const types = await query(
      'SELECT id, name, code, description, processing_days, requirements, fee_amount FROM document_types WHERE is_active = 1 ORDER BY id ASC'
    );
    return res.status(200).json({ success: true, documentTypes: types });
  } catch (error) {
    next(error);
  }
});

// Public list of departments (for registration and information)
router.get('/departments', async (req, res, next) => {
  try {
    const depts = await query('SELECT id, name, code, hod_name, contact_phone FROM departments ORDER BY name ASC');
    return res.status(200).json({ success: true, departments: depts });
  } catch (error) {
    next(error);
  }
});

// Public document verification by verification code or document number
router.get('/verify/:code', async (req, res, next) => {
  try {
    const code = req.params.code;
    const rows = await query(
      `SELECT idoc.document_number, idoc.issue_date, idoc.verification_code,
              dt.name as document_type_name,
              u.name as student_name, u.registration_number,
              d.name as department_name,
              issuer.name as issuer_name
       FROM issued_documents idoc
       JOIN document_requests r ON idoc.request_id = r.id
       JOIN document_types dt ON r.document_type_id = dt.id
       JOIN users u ON r.student_id = u.id
       JOIN departments d ON r.department_id = d.id
       JOIN users issuer ON idoc.issued_by = issuer.id
       WHERE idoc.verification_code = ? OR idoc.document_number = ?`,
      [code, code]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'No record matching this certificate number or verification hash was found in the official registry.'
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      certificate: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
