const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { logAudit } = require('../services/auditService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_academic_jwt_key_2026_xyz!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function register(req, res, next) {
  try {
    const { name, email, password, department_id, registration_number, phone, academic_year, program } = req.body;

    // Check if email already registered
    const existingEmail = await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ success: false, message: 'Email address is already registered.' });
    }

    // Check if registration number already registered
    const existingReg = await query('SELECT id FROM users WHERE registration_number = ?', [registration_number.trim()]);
    if (existingReg.length > 0) {
      return res.status(409).json({ success: false, message: 'Registration number is already in use by another student.' });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert student
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, department_id, registration_number, phone, academic_year, program, account_status)
       VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, 'active')`,
      [name.trim(), email.trim().toLowerCase(), password_hash, department_id, registration_number.trim(), phone || null, academic_year || 'Current', program || 'Degree Program']
    );

    const newUserId = result.insertId;

    const token = jwt.sign(
      { id: newUserId, email: email.trim().toLowerCase(), role: 'student' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logAudit(newUserId, 'USER_REGISTER', 'users', newUserId, `Student self-registered with RegNo: ${registration_number}`, req.ip);

    // Fetch complete user profile
    const users = await query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.registration_number, u.phone, u.academic_year, u.program, d.name as department_name, d.code as department_code
       FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?`,
      [newUserId]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to the portal.',
      token,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const users = await query(
      `SELECT u.*, d.name as department_name, d.code as department_code
       FROM users u LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email = ?`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    if (user.account_status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated or suspended. Please contact the administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    await logAudit(user.id, 'USER_LOGIN', 'users', user.id, `User logged in from ${req.ip}`, req.ip);

    // Return safe user object (omit password_hash)
    const { password_hash, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const users = await query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.registration_number, u.phone, u.academic_year, u.program, u.account_status,
              d.name as department_name, d.code as department_code
       FROM users u LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    return res.status(200).json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone, academic_year, program } = req.body;

    await query(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), academic_year = COALESCE(?, academic_year), program = COALESCE(?, program), updated_at = NOW() WHERE id = ?',
      [name || null, phone || null, academic_year || null, program || null, req.user.id]
    );

    await logAudit(req.user.id, 'PROFILE_UPDATE', 'users', req.user.id, 'User updated their profile information', req.ip);

    const updated = await query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.registration_number, u.phone, u.academic_year, u.program, u.account_status,
              d.name as department_name, d.code as department_code
       FROM users u LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated[0]
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const rows = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, req.user.id]);

    await logAudit(req.user.id, 'PASSWORD_CHANGE', 'users', req.user.id, 'User changed password', req.ip);

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};
