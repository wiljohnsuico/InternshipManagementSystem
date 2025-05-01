const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../config/database');

// Original auth middleware (for backward compatibility)
const auth = (req, res, next) => {
    console.log('Auth middleware - headers:', req.headers);
    
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token received:', token);

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Decoded token:', decoded);

        // Add user info to request
        req.user = {
            user_id: decoded.user_id,
            role: decoded.role,
            email: decoded.email
        };
        console.log('User info set:', req.user);

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    // Get the auth header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('Authenticating request. Token present:', !!token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Check if the user exists in the database
      try {
        const [users] = await db.query('SELECT * FROM users_tbl WHERE user_id = ?', [decoded.user_id]);
        
        if (users.length === 0) {
          console.error('User not found in database:', decoded.user_id);
          return res.status(403).json({
            success: false,
            message: 'User not found'
          });
        }
        
        const user = users[0];
        
        // Check if user is deleted or inactive
        if (user.is_deleted) {
          console.error('User account is deleted:', decoded.user_id);
          return res.status(403).json({
            success: false,
            message: 'Account is inactive or deleted'
          });
        }
        
        // Add user data to request
        req.user = {
          user_id: user.user_id,
          role: user.role || decoded.role
        };
        
        console.log('Authentication successful for user:', req.user.user_id, 'with role:', req.user.role);
        next();
      } catch (error) {
        console.error('Database error during authentication:', error);
        return res.status(500).json({
          success: false,
          message: 'Server error during authentication'
        });
      }
    });
  } catch (error) {
    console.error('Unexpected error in authentication middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Role-based authorization middleware
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.error('No user data in request for authorization');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log(`Authorizing user (${req.user.user_id}) with role "${req.user.role}" for roles:`, roles);
    
    if (!roles.includes(req.user.role)) {
      console.error(`User role "${req.user.role}" not authorized for this endpoint`);
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Insufficient permissions'
      });
    }

    console.log('Authorization successful');
    next();
  };
};

// Admin authorization middleware
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required'
        });
    }

    next();
};

// Export all middleware functions
module.exports = auth; // For backward compatibility
module.exports.authenticateToken = authenticateToken;
module.exports.authorizeRoles = authorizeRoles;
module.exports.isAdmin = isAdmin; 