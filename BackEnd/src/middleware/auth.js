const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
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