/**
 * Centralized Error Handling Middleware
 * 
 * This middleware catches errors from routes and provides standardized error responses.
 * It also logs errors appropriately based on severity and environment.
 */

const fs = require('fs');
const path = require('path');

// Error log file setup
const LOG_DIR = path.join(__dirname, '../../logs');
const ERROR_LOG_PATH = path.join(LOG_DIR, 'error.log');

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Map of known error types to HTTP status codes
const ERROR_TYPES = {
    ValidationError: 400,
    BadRequestError: 400,
    UnauthorizedError: 401,
    AuthenticationError: 401,
    ForbiddenError: 403,
    NotFoundError: 404,
    ConflictError: 409,
    RateLimitError: 429,
    DatabaseError: 500,
    InternalServerError: 500
};

// Database error codes that need special handling
const DB_ERROR_CODES = {
    ER_DUP_ENTRY: {
        statusCode: 409,
        message: 'A duplicate entry was found. This record already exists.'
    },
    ER_NO_REFERENCED_ROW: {
        statusCode: 400,
        message: 'Referenced record does not exist.'
    },
    ER_NO_SUCH_TABLE: {
        statusCode: 500,
        message: 'Database schema error. Please contact an administrator.'
    },
    ER_BAD_FIELD_ERROR: {
        statusCode: 500,
        message: 'Database schema error. Please contact an administrator.'
    },
    ER_ACCESS_DENIED_ERROR: {
        statusCode: 500,
        message: 'Database connection error. Please contact an administrator.'
    },
    ECONNREFUSED: {
        statusCode: 503,
        message: 'Database service unavailable. Please try again later.'
    }
};

/**
 * Log the error to a file
 * @param {Error} err The error to log
 * @param {Object} req The request object
 */
function logError(err, req) {
    const timestamp = new Date().toISOString();
    const userId = req.user ? req.user.id : 'unauthenticated';
    const errorType = err.name || 'Error';
    
    // Format error message for the log
    const logEntry = `[${timestamp}] ${errorType}: ${err.message}
  User: ${userId}
  Path: ${req.method} ${req.originalUrl}
  Query: ${JSON.stringify(req.query)}
  Body: ${JSON.stringify(sanitizeRequestBody(req.body))}
  Stack: ${err.stack}
  ------------------------------
`;

    // Append to log file
    fs.appendFile(ERROR_LOG_PATH, logEntry, (writeErr) => {
        if (writeErr) {
            console.error('Failed to write to error log:', writeErr);
        }
    });
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.error(`\n[${errorType}] ${err.message}`);
        console.error(`User: ${userId}, Path: ${req.method} ${req.originalUrl}`);
        console.error('Stack:', err.stack, '\n');
    }
}

/**
 * Sanitize request body to remove sensitive data for logging
 * @param {Object} body The request body
 * @returns {Object} Sanitized body object
 */
function sanitizeRequestBody(body) {
    if (!body) return {};
    
    const sanitized = { ...body };
    
    // List of sensitive fields to redact
    const sensitiveFields = [
        'password', 'token', 'secret', 'apiKey', 'api_key', 'key',
        'authorization', 'credential', 'creditCard', 'credit_card'
    ];
    
    // Redact sensitive fields
    Object.keys(sanitized).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
            sanitized[key] = '[REDACTED]';
        }
    });
    
    return sanitized;
}

/**
 * Main error handling middleware
 */
function errorHandler(err, req, res, next) {
    // Log the error
    logError(err, req);
    
    // Determine the status code
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred';
    
    // Check for known error types
    if (err.name && ERROR_TYPES[err.name]) {
        statusCode = ERROR_TYPES[err.name];
        errorMessage = err.message;
    } 
    // Check for database error codes
    else if (err.code && DB_ERROR_CODES[err.code]) {
        statusCode = DB_ERROR_CODES[err.code].statusCode;
        errorMessage = DB_ERROR_CODES[err.code].message;
    }
    // Handle common error messages
    else if (err.message) {
        if (err.message.includes('not found') || err.message.includes('does not exist')) {
            statusCode = 404;
            errorMessage = err.message;
        } else if (err.message.includes('unauthorized') || err.message.includes('unauthenticated')) {
            statusCode = 401;
            errorMessage = err.message;
        } else if (err.message.includes('permission') || err.message.includes('forbidden')) {
            statusCode = 403;
            errorMessage = err.message;
        } else if (err.message.includes('validation') || err.message.includes('invalid')) {
            statusCode = 400;
            errorMessage = err.message;
        } else if (err.message.includes('duplicate') || err.message.includes('already exists')) {
            statusCode = 409;
            errorMessage = err.message;
        } else {
            // Use the actual error message in development
            errorMessage = process.env.NODE_ENV === 'development' 
                ? err.message 
                : 'An unexpected error occurred';
        }
    }
    
    // Send error response
    res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? {
            name: err.name,
            code: err.code,
            stack: err.stack
        } : undefined
    });
}

// Create custom error classes
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class NotFoundError extends Error {
    constructor(message) {
        super(message || 'Resource not found');
        this.name = 'NotFoundError';
    }
}

class UnauthorizedError extends Error {
    constructor(message) {
        super(message || 'Unauthorized access');
        this.name = 'UnauthorizedError';
    }
}

class ForbiddenError extends Error {
    constructor(message) {
        super(message || 'Forbidden access');
        this.name = 'ForbiddenError';
    }
}

class ConflictError extends Error {
    constructor(message) {
        super(message || 'Resource conflict');
        this.name = 'ConflictError';
    }
}

class DatabaseError extends Error {
    constructor(message, code) {
        super(message || 'Database error');
        this.name = 'DatabaseError';
        this.code = code;
    }
}

// Export middleware and custom errors
module.exports = {
    errorHandler,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    DatabaseError
}; 