const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

// Authentication middleware
const authMiddleware = async (req, res, next) => {
    try {
        // TEMPORARY: FOR DEVELOPMENT ONLY - REMOVE IN PRODUCTION
        // Bypass authentication for testing
        console.log('DEVELOPMENT MODE: Bypassing authentication');
        req.user = {
            user_id: 1,
            role: 'Admin',
            email: 'admin@test.com'
        };
        return next();

        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Get user from database
        const [users] = await pool.query(
            'SELECT * FROM users_tbl WHERE user_id = ?',
            [decoded.user_id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Get role-specific ID (intern_id, employer_id, etc.)
        let roleId = null;
        if (user.role) {
            switch (user.role) {
                case 'Intern':
                    const [intern] = await pool.query(
                        'SELECT id FROM interns_tbl WHERE user_id = ?',
                        [user.user_id]
                    );
                    if (intern.length > 0) {
                        roleId = intern[0].id;
                    }
                    break;
                    
                case 'Employer':
                    const [employer] = await pool.query(
                        'SELECT id FROM employers_tbl WHERE user_id = ?',
                        [user.user_id]
                    );
                    if (employer.length > 0) {
                        roleId = employer[0].id;
                    }
                    break;
                    
                case 'Faculty':
                    const [faculty] = await pool.query(
                        'SELECT id FROM faculties_tbl WHERE user_id = ?',
                        [user.user_id]
                    );
                    if (faculty.length > 0) {
                        roleId = faculty[0].id;
                    }
                    break;
                    
                case 'Admin':
                    const [admin] = await pool.query(
                        'SELECT id FROM admin_tbl WHERE user_id = ?',
                        [user.user_id]
                    );
                    if (admin.length > 0) {
                        roleId = admin[0].id;
                    }
                    break;
                    
                default:
                    break;
            }
        }

        // Add user info to request
        req.user = {
            id: roleId, // Role-specific ID (intern_id, employer_id, etc.)
            user_id: user.user_id, // User ID from users_tbl
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Role-based middleware
const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Insufficient permissions'
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    roleMiddleware
}; 