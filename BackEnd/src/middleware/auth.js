const jwt = require('jsonwebtoken');
require('dotenv').config();

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

// New middleware for token authentication (same functionality, different name for clarity)
const authenticateToken = (req, res, next) => {
    console.log('Authenticate token middleware - headers:', req.headers);
    
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
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
        console.error('Authentication middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Role-based authorization middleware
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        console.log('Authorize roles middleware - allowed roles:', allowedRoles);
        console.log('Authorize roles middleware - user role:', req.user?.role);
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions'
            });
        }
        
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