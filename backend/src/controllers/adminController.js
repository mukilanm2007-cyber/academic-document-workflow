const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { logAudit } = require('../services/auditService');

async function getDashboardStats(req, res, next) {
  try {
    // 1. High-level metric counts
    const [counts] = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role IN ('faculty', 'hod', 'academic_office')) as total_faculty,
        (SELECT COUNT(*) FROM document_requests) as total_requests,
        (SELECT COUNT(*) FROM document_requests WHERE current_status IN ('Submitted', 'Under Department Review', 'Pending HOD Approval', 'Pending Academic Office Verification')) as pending_approvals,
        (SELECT COUNT(*) FROM document_requests WHERE current_status IN ('Approved', 'Document Issued', 'Completed')) as approved_requests,
        (SELECT COUNT(*) FROM document_requests WHERE current_status = 'Rejected') as rejected_requests,
        (SELECT COUNT(*) FROM document_requests WHERE current_status = 'Correction Required') as correction_requests,
        (SELECT COUNT(*) FROM issued_documents) as issued_documents_count
    `);

    // 2. Average processing time in days for completed requests
    const [avgTimeResult] = await query(`
      SELECT 
        ROUND(AVG(TIMESTAMPDIFF(HOUR, submission_date, completion_date)) / 24, 1) as avg_processing_days
      FROM document_requests 
      WHERE completion_date IS NOT NULL
    `);

    // 3. Request counts by Document Type
    const requestsByDocType = await query(`
      SELECT dt.name, dt.code, COUNT(r.id) as count
      FROM document_types dt
      LEFT JOIN document_requests r ON dt.id = r.document_type_id
      GROUP BY dt.id, dt.name, dt.code
      ORDER BY count DESC
    `);

    // 4. Request counts by Department
    const requestsByDept = await query(`
      SELECT d.name, d.code, COUNT(r.id) as count
      FROM departments d
      LEFT JOIN document_requests r ON d.id = r.department_id
      GROUP BY d.id, d.name, d.code
    `);

    // 5. Status distribution
    const statusDistribution = await query(`
      SELECT current_status as status, COUNT(*) as count
      FROM document_requests
      GROUP BY current_status
    `);

    // 6. Recent requests
    const recentRequests = await query(`
      SELECT r.id, r.reference_number, r.current_status, r.submission_date,
             dt.name as document_type_name,
             u.name as student_name, u.registration_number,
             d.name as department_name
      FROM document_requests r
      JOIN document_types dt ON r.document_type_id = dt.id
      JOIN users u ON r.student_id = u.id
      JOIN departments d ON r.department_id = d.id
      ORDER BY r.submission_date DESC
      LIMIT 6
    `);

    return res.status(200).json({
      success: true,
      stats: {
        ...counts,
        avg_processing_days: avgTimeResult && avgTimeResult.avg_processing_days ? avgTimeResult.avg_processing_days : 2.5
      },
      requestsByDocType,
      requestsByDept,
      statusDistribution,
      recentRequests
    });
  } catch (error) {
    next(error);
  }
}

// User Management
async function getUsers(req, res, next) {
  try {
    const { role, department_id, search, status } = req.query;

    let sql = `
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.registration_number, u.phone, u.account_status, u.academic_year, u.program, u.created_at,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'All') {
      sql += ' AND u.role = ?';
      params.push(role);
    }

    if (department_id && department_id !== 'All') {
      sql += ' AND u.department_id = ?';
      params.push(department_id);
    }

    if (status && status !== 'All') {
      sql += ' AND u.account_status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.registration_number LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY u.created_at DESC';

    const users = await query(sql, params);
    return res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, department_id, registration_number, phone, program, academic_year } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, department_id, registration_number, phone, program, academic_year, account_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [name.trim(), email.trim().toLowerCase(), password_hash, role, department_id || null, registration_number || null, phone || null, program || null, academic_year || null]
    );

    await logAudit(req.user.id, 'USER_CREATE', 'users', result.insertId, `Admin created user ${email} (${role})`, req.ip);

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      userId: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = req.params.id;
    const { name, email, role, department_id, registration_number, phone, account_status, password } = req.body;

    let updateSql = `
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          role = COALESCE(?, role),
          department_id = ?,
          registration_number = COALESCE(?, registration_number),
          phone = COALESCE(?, phone),
          account_status = COALESCE(?, account_status),
          updated_at = NOW()
    `;
    const params = [
      name || null,
      email ? email.trim().toLowerCase() : null,
      role || null,
      department_id || null,
      registration_number || null,
      phone || null,
      account_status || null
    ];

    if (password && password.trim().length >= 6) {
      const hash = await bcrypt.hash(password.trim(), 10);
      updateSql += ', password_hash = ?';
      params.push(hash);
    }

    updateSql += ' WHERE id = ?';
    params.push(userId);

    await query(updateSql, params);

    await logAudit(req.user.id, 'USER_UPDATE', 'users', userId, `Admin updated user ID ${userId}`, req.ip);

    return res.status(200).json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    next(error);
  }
}

// Department Management
async function getDepartments(req, res, next) {
  try {
    const departments = await query(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM users WHERE department_id = d.id AND role = 'student') as student_count,
        (SELECT COUNT(*) FROM users WHERE department_id = d.id AND role IN ('faculty', 'hod')) as faculty_count,
        (SELECT COUNT(*) FROM document_requests WHERE department_id = d.id) as request_count
      FROM departments d
      ORDER BY d.name ASC
    `);
    return res.status(200).json({ success: true, departments });
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { name, code, hod_name, hod_email, contact_phone } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and unique code are required.' });
    }

    const result = await query(
      'INSERT INTO departments (name, code, hod_name, hod_email, contact_phone) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), code.trim().toUpperCase(), hod_name || null, hod_email || null, contact_phone || null]
    );

    await logAudit(req.user.id, 'DEPT_CREATE', 'departments', result.insertId, `Created department ${code}`, req.ip);
    return res.status(201).json({ success: true, message: 'Department created successfully.', departmentId: result.insertId });
  } catch (error) {
    next(error);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const deptId = req.params.id;
    const { name, code, hod_name, hod_email, contact_phone } = req.body;

    await query(
      `UPDATE departments 
       SET name = COALESCE(?, name), code = COALESCE(?, code), hod_name = COALESCE(?, hod_name), hod_email = COALESCE(?, hod_email), contact_phone = COALESCE(?, contact_phone), updated_at = NOW()
       WHERE id = ?`,
      [name || null, code ? code.trim().toUpperCase() : null, hod_name || null, hod_email || null, contact_phone || null, deptId]
    );

    await logAudit(req.user.id, 'DEPT_UPDATE', 'departments', deptId, `Updated department ID ${deptId}`, req.ip);
    return res.status(200).json({ success: true, message: 'Department updated successfully.' });
  } catch (error) {
    next(error);
  }
}

// Document Type Management
async function getDocumentTypes(req, res, next) {
  try {
    const docTypes = await query(`
      SELECT dt.*,
        (SELECT COUNT(*) FROM workflow_stages WHERE document_type_id = dt.id) as stage_count,
        (SELECT COUNT(*) FROM document_requests WHERE document_type_id = dt.id) as request_count
      FROM document_types dt
      ORDER BY dt.id ASC
    `);
    return res.status(200).json({ success: true, documentTypes: docTypes });
  } catch (error) {
    next(error);
  }
}

async function createDocumentType(req, res, next) {
  try {
    const { name, code, description, processing_days, requirements, fee_amount, is_active } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Document name and code are required.' });
    }

    const result = await query(
      `INSERT INTO document_types (name, code, description, processing_days, requirements, fee_amount, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), code.trim().toUpperCase(), description || null, processing_days || 3, requirements || null, fee_amount || 0, is_active !== false ? 1 : 0]
    );

    await logAudit(req.user.id, 'DOC_TYPE_CREATE', 'document_types', result.insertId, `Created document type ${name}`, req.ip);
    return res.status(201).json({ success: true, message: 'Document type created successfully.', docTypeId: result.insertId });
  } catch (error) {
    next(error);
  }
}

async function updateDocumentType(req, res, next) {
  try {
    const typeId = req.params.id;
    const { name, code, description, processing_days, requirements, fee_amount, is_active } = req.body;

    await query(
      `UPDATE document_types 
       SET name = COALESCE(?, name), code = COALESCE(?, code), description = COALESCE(?, description),
           processing_days = COALESCE(?, processing_days), requirements = COALESCE(?, requirements),
           fee_amount = COALESCE(?, fee_amount), is_active = COALESCE(?, is_active), updated_at = NOW()
       WHERE id = ?`,
      [name || null, code ? code.trim().toUpperCase() : null, description || null, processing_days || null, requirements || null, fee_amount !== undefined ? fee_amount : null, is_active !== undefined ? (is_active ? 1 : 0) : null, typeId]
    );

    await logAudit(req.user.id, 'DOC_TYPE_UPDATE', 'document_types', typeId, `Updated document type ID ${typeId}`, req.ip);
    return res.status(200).json({ success: true, message: 'Document type updated successfully.' });
  } catch (error) {
    next(error);
  }
}

// Workflow Stages Configuration
async function getWorkflows(req, res, next) {
  try {
    const docTypes = await query('SELECT id, name, code, description FROM document_types ORDER BY id ASC');
    const stages = await query('SELECT * FROM workflow_stages ORDER BY document_type_id, stage_order ASC');

    const result = docTypes.map(dt => ({
      ...dt,
      stages: stages.filter(s => s.document_type_id === dt.id)
    }));

    return res.status(200).json({ success: true, workflows: result });
  } catch (error) {
    next(error);
  }
}

async function updateWorkflowStages(req, res, next) {
  try {
    const docTypeId = req.params.id;
    const { stages } = req.body; // array of stages: [{ stage_name, stage_order, approver_role, department_required, is_final_approval }]

    if (!Array.isArray(stages) || stages.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one workflow stage is required.' });
    }

    // Delete existing stages for this doc type
    await query('DELETE FROM workflow_stages WHERE document_type_id = ?', [docTypeId]);

    // Insert new stages
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];
      await query(
        `INSERT INTO workflow_stages (document_type_id, stage_name, stage_order, approver_role, department_required, is_final_approval)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [docTypeId, s.stage_name, i + 1, s.approver_role, s.department_required ? 1 : 0, i === stages.length - 1 ? 1 : (s.is_final_approval ? 1 : 0)]
      );
    }

    await logAudit(req.user.id, 'WORKFLOW_UPDATE', 'workflow_stages', docTypeId, `Updated workflow stages for doc type ID ${docTypeId}`, req.ip);

    return res.status(200).json({ success: true, message: 'Workflow stages updated successfully.' });
  } catch (error) {
    next(error);
  }
}

// Reports & Analytics
async function getReports(req, res, next) {
  try {
    const { startDate, endDate, department_id, doc_type_id, status, registration_number, format } = req.query;

    let sql = `
      SELECT r.id, r.reference_number, r.purpose, r.current_status, r.submission_date, r.completion_date,
             TIMESTAMPDIFF(HOUR, r.submission_date, COALESCE(r.completion_date, NOW())) / 24 as turnaround_days,
             dt.name as document_type_name, dt.code as document_type_code, dt.processing_days as expected_days,
             d.name as department_name, d.code as department_code,
             u.name as student_name, u.registration_number, u.email as student_email,
             idoc.document_number as issued_doc_number, idoc.issue_date
      FROM document_requests r
      JOIN document_types dt ON r.document_type_id = dt.id
      JOIN departments d ON r.department_id = d.id
      JOIN users u ON r.student_id = u.id
      LEFT JOIN issued_documents idoc ON r.id = idoc.request_id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND r.submission_date >= ?';
      params.push(`${startDate} 00:00:00`);
    }

    if (endDate) {
      sql += ' AND r.submission_date <= ?';
      params.push(`${endDate} 23:59:59`);
    }

    if (department_id && department_id !== 'All') {
      sql += ' AND r.department_id = ?';
      params.push(department_id);
    }

    if (doc_type_id && doc_type_id !== 'All') {
      sql += ' AND r.document_type_id = ?';
      params.push(doc_type_id);
    }

    if (status && status !== 'All') {
      sql += ' AND r.current_status = ?';
      params.push(status);
    }

    if (registration_number) {
      sql += ' AND u.registration_number LIKE ?';
      params.push(`%${registration_number}%`);
    }

    sql += ' ORDER BY r.submission_date DESC';

    const records = await query(sql, params);

    // If CSV export is requested
    if (format === 'csv') {
      const headers = ['Reference Number', 'Student Name', 'Registration No', 'Email', 'Department', 'Document Type', 'Status', 'Submission Date', 'Completion Date', 'Turnaround (Days)', 'Issued Document Number'];
      const rows = records.map(r => [
        `"${r.reference_number}"`,
        `"${r.student_name}"`,
        `"${r.registration_number}"`,
        `"${r.student_email}"`,
        `"${r.department_name}"`,
        `"${r.document_type_name}"`,
        `"${r.current_status}"`,
        `"${r.submission_date ? new Date(r.submission_date).toISOString() : ''}"`,
        `"${r.completion_date ? new Date(r.completion_date).toISOString() : ''}"`,
        `"${r.turnaround_days ? Number(r.turnaround_days).toFixed(1) : ''}"`,
        `"${r.issued_doc_number || ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="academic_document_report.csv"');
      return res.send(csvContent);
    }

    // Summary statistics for the filtered dataset
    const summary = {
      total: records.length,
      approved: records.filter(r => ['Approved', 'Document Issued', 'Completed'].includes(r.current_status)).length,
      pending: records.filter(r => ['Submitted', 'Under Department Review', 'Pending HOD Approval', 'Pending Academic Office Verification'].includes(r.current_status)).length,
      rejected: records.filter(r => r.current_status === 'Rejected').length,
      corrections: records.filter(r => r.current_status === 'Correction Required').length
    };

    return res.status(200).json({
      success: true,
      records,
      summary
    });
  } catch (error) {
    next(error);
  }
}

// Audit Logs
async function getAuditLogs(req, res, next) {
  try {
    const { action, search, limit = 100 } = req.query;

    let sql = `
      SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action && action !== 'All') {
      sql += ' AND al.action = ?';
      params.push(action);
    }

    if (search) {
      sql += ' AND (al.details LIKE ? OR u.name LIKE ? OR al.affected_entity LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY al.timestamp DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const logs = await query(sql, params);
    return res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
  getUsers,
  createUser,
  updateUser,
  getDepartments,
  createDepartment,
  updateDepartment,
  getDocumentTypes,
  createDocumentType,
  updateDocumentType,
  getWorkflows,
  updateWorkflowStages,
  getReports,
  getAuditLogs
};
