const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * Authenticate JWT Bearer token
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_academic_jwt_key_2026_xyz!');
    
    // Fetch fresh user data from database
    const users = await query(
      'SELECT id, name, email, role, department_id, registration_number, phone, account_status, academic_year, program FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User account no longer exists.'
      });
    }

    const user = users[0];
    if (user.account_status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated or suspended. Please contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
}

/**
 * Authorize specified roles
 * @param  {...string} roles Allowed roles ('student', 'faculty', 'hod', 'academic_office', 'admin')
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};
