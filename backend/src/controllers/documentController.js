const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const { logAudit } = require('../services/auditService');

async function getAllDocuments(req, res, next) {
  try {
    const user = req.user;
    let sql = `
      SELECT idoc.*, r.reference_number, r.purpose, r.submission_date,
             dt.name as document_type_name, dt.code as document_type_code,
             u.name as student_name, u.registration_number, u.email as student_email,
             d.name as department_name,
             issuer.name as issuer_name
      FROM issued_documents idoc
      JOIN document_requests r ON idoc.request_id = r.id
      JOIN document_types dt ON r.document_type_id = dt.id
      JOIN users u ON r.student_id = u.id
      JOIN departments d ON r.department_id = d.id
      JOIN users issuer ON idoc.issued_by = issuer.id
      WHERE 1=1
    `;
    const params = [];

    if (user.role === 'student') {
      sql += ' AND r.student_id = ?';
      params.push(user.id);
    } else if (user.role === 'faculty' || user.role === 'hod') {
      sql += ' AND r.department_id = ?';
      params.push(user.department_id);
    }

    sql += ' ORDER BY idoc.issue_date DESC';

    const documents = await query(sql, params);
    return res.status(200).json({ success: true, documents });
  } catch (error) {
    next(error);
  }
}

async function getDocumentById(req, res, next) {
  try {
    const docId = req.params.id;
    const user = req.user;

    const sql = `
      SELECT idoc.*, r.reference_number, r.student_id, r.purpose,
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
      WHERE idoc.id = ?
    `;

    const docs = await query(sql, [docId]);
    if (docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = docs[0];
    if (user.role === 'student' && doc.student_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
}

async function downloadDocument(req, res, next) {
  try {
    const docId = req.params.id;
    const user = req.user;

    const sql = `
      SELECT idoc.*, r.reference_number, r.student_id, dt.name as document_type_name
      FROM issued_documents idoc
      JOIN document_requests r ON idoc.request_id = r.id
      JOIN document_types dt ON r.document_type_id = dt.id
      WHERE idoc.id = ? OR idoc.request_id = ?
    `;

    const docs = await query(sql, [docId, docId]);
    if (docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Official issued document record not found.' });
    }

    const doc = docs[0];

    // Security check: Only the student recipient or authorized staff/admin can download
    if (user.role === 'student' && doc.student_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this document.' });
    }

    const fullFilePath = path.join(__dirname, '../../../', doc.file_path);

    if (!fs.existsSync(fullFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'The generated PDF file is missing on the server storage. Please contact the administrator.'
      });
    }

    // Increment download count and timestamp
    await query(
      'UPDATE issued_documents SET download_count = download_count + 1, last_downloaded_at = NOW() WHERE id = ?',
      [doc.id]
    );

    // Also mark request as Completed if it was Document Issued
    await query(
      'UPDATE document_requests SET current_status = "Completed", updated_at = NOW() WHERE id = ? AND current_status = "Document Issued"',
      [doc.request_id]
    );

    await logAudit(
      user.id,
      'DOCUMENT_DOWNLOAD',
      'issued_documents',
      doc.id,
      `Downloaded document ${doc.document_number} (Ref: ${doc.reference_number})`,
      req.ip
    );

    const downloadFileName = `${doc.document_number}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${downloadFileName}"`);

    const fileStream = fs.createReadStream(fullFilePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
}

async function downloadAttachment(req, res, next) {
  try {
    const attachmentId = req.params.id;
    const user = req.user;

    const sql = `
      SELECT s.*, r.student_id, r.department_id 
      FROM supporting_documents s
      JOIN document_requests r ON s.request_id = r.id
      WHERE s.id = ?
    `;

    const rows = await query(sql, [attachmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Attachment not found.' });
    }

    const attachment = rows[0];

    // Student can only view their own
    if (user.role === 'student' && attachment.student_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Faculty/HOD can only view their department
    if ((user.role === 'faculty' || user.role === 'hod') && attachment.department_id !== user.department_id) {
      return res.status(403).json({ success: false, message: 'Access denied to other department documents.' });
    }

    const fullFilePath = path.join(__dirname, '../../../', attachment.file_path);

    if (!fs.existsSync(fullFilePath)) {
      return res.status(404).json({ success: false, message: 'Attachment file not found on disk.' });
    }

    res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);

    const stream = fs.createReadStream(fullFilePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDocuments,
  getDocumentById,
  downloadDocument,
  downloadAttachment
};
