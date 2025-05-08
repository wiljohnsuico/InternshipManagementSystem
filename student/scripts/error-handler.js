/**
 * Global error handling utility for frontend
 * 
 * This script provides standardized error handling for the entire frontend
 * application, including friendly error messages, logging, and recovery options.
 */

// Configuration
const ERROR_CONFIG = {
    // How long to show notifications by default (ms)
    defaultNotificationDuration: 5000,
    // Whether to log errors to console in production
    logInProduction: true,
    // Number of errors to keep in history
    maxErrorHistory: 20,
    // Enable automatic recovery for certain errors
    enableAutoRecovery: true,
    // Send error reports to backend
    reportErrorsToBackend: true,
    // API endpoint for error reporting
    errorReportEndpoint: '/api/errors/report'
};

// Error history storage
let errorHistory = [];

// Error message mapping to user-friendly messages
const ERROR_MESSAGES = {
    // Network errors
    'Failed to fetch': 'Network error. Please check your internet connection.',
    'NetworkError': 'Network error. Please check your internet connection.',
    'Network request failed': 'Network error. Please check your internet connection.',
    'net::ERR_INTERNET_DISCONNECTED': 'You are offline. Please check your internet connection.',
    'net::ERR_CONNECTION_REFUSED': 'Cannot connect to the server. The service might be down.',
    'net::ERR_CONNECTION_RESET': 'Connection was reset. Please try again.',
    'net::ERR_CONNECTION_TIMED_OUT': 'Connection timed out. Please try again later.',
    'AbortError': 'Request was cancelled or timed out.',
    'TIMEOUT': 'Request timed out. The server might be busy.',
    
    // Auth errors
    'Unauthorized': 'Your session has expired. Please log in again.',
    'Invalid token': 'Your session has expired. Please log in again.',
    'Token expired': 'Your session has expired. Please log in again.',
    'Access denied': 'You do not have permission to perform this action.',
    'Forbidden': 'You do not have permission to perform this action.',
    
    // Common app errors
    'Not found': 'The requested resource was not found.',
    'Validation error': 'Please check your input and try again.',
    'Invalid input': 'Please check your input and try again.',
    'Duplicate entry': 'This record already exists.',
    'Database error': 'Database error occurred. Please try again later.',
    
    // Default fallback
    'default': 'An unexpected error occurred. Please try again later.'
};

/**
 * Get a user-friendly error message based on the error
 * @param {Error|string} error The error object or message
 * @returns {string} User-friendly error message
 */
function getUserFriendlyMessage(error) {
    // Extract the message if it's an error object
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for known error messages
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
        if (errorMessage.includes(key)) {
            return value;
        }
    }
    
    // Return the actual error message if in development, otherwise generic message
    return process.env.NODE_ENV === 'development' 
        ? errorMessage 
        : ERROR_MESSAGES.default;
}

/**
 * Show an error notification to the user
 * @param {Error|string} error The error to display
 * @param {boolean} [useOriginalMessage=false] Whether to use the original error message
 * @param {number} [duration] How long to show the notification (ms)
 */
function showErrorNotification(error, useOriginalMessage = false, duration = ERROR_CONFIG.defaultNotificationDuration) {
    const message = useOriginalMessage 
        ? (error instanceof Error ? error.message : String(error))
        : getUserFriendlyMessage(error);
    
    // Check for existing notification systems
    if (window.notification && typeof window.notification.error === 'function') {
        // Use the app's notification system
        window.notification.error(message, duration);
    } else if (window.toastr && typeof window.toastr.error === 'function') {
        // Use toastr if available
        window.toastr.error(message);
    } else if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        // Use Bootstrap toast
        showBootstrapToast(message, 'error', duration);
    } else {
        // Fallback to alert for critical errors only
        console.error(message);
    }
}

/**
 * Show a Bootstrap toast notification
 * @param {string} message The message to display
 * @param {string} type The type of notification (success, error, warning, info)
 * @param {number} duration How long to show the toast (ms)
 */
function showBootstrapToast(message, type = 'info', duration = 5000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create a unique ID for this toast
    const toastId = 'toast-' + Date.now();
    
    // Set color class based on type
    let bgColorClass = 'bg-info';
    if (type === 'error') bgColorClass = 'bg-danger';
    if (type === 'success') bgColorClass = 'bg-success';
    if (type === 'warning') bgColorClass = 'bg-warning';
    
    // Create the toast element
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgColorClass} text-white">
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Add the toast to the container
    toastContainer.innerHTML += toastHtml;
    
    // Initialize and show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: duration });
    toast.show();
    
    // Remove the element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * Log an error to the console and error history
 * @param {Error|string} error The error to log
 * @param {string} [context=''] Additional context about where the error occurred
 */
function logError(error, context = '') {
    // Only log in development or if configured to log in production
    if (process.env.NODE_ENV === 'development' || ERROR_CONFIG.logInProduction) {
        console.error(`[ERROR]${context ? ` [${context}]` : ''}:`, error);
    }
    
    // Add to error history
    const errorRecord = {
        timestamp: new Date(),
        error: error instanceof Error ? error.toString() : String(error),
        context,
        stack: error instanceof Error ? error.stack : undefined
    };
    
    errorHistory.unshift(errorRecord);
    
    // Trim history if needed
    if (errorHistory.length > ERROR_CONFIG.maxErrorHistory) {
        errorHistory = errorHistory.slice(0, ERROR_CONFIG.maxErrorHistory);
    }
    
    // Report error to backend if configured
    if (ERROR_CONFIG.reportErrorsToBackend) {
        reportErrorToBackend(errorRecord);
    }
}

/**
 * Report an error to the backend for logging/analysis
 * @param {Object} errorRecord The error record to report
 */
async function reportErrorToBackend(errorRecord) {
    try {
        // Skip reporting if we're offline
        if (!navigator.onLine) return;
        
        // Basic info to send
        const reportData = {
            ...errorRecord,
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        };
        
        // Use fetch to send the error report
        const response = await fetch(ERROR_CONFIG.errorReportEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData),
            // Use no-cors mode to avoid CORS issues
            mode: 'no-cors',
            // Don't wait too long
            signal: AbortSignal.timeout(5000)
        });
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Error report sent to server:', response.ok);
        }
    } catch (e) {
        // Don't log or do anything - we don't want an infinite loop
        // of error reporting failures
    }
}

/**
 * Get the error history
 * @returns {Array} Array of error records
 */
function getErrorHistory() {
    return [...errorHistory];
}

/**
 * Clear the error history
 */
function clearErrorHistory() {
    errorHistory = [];
}

/**
 * Handle global unhandled errors
 * @param {Event} event The error event
 */
function handleGlobalError(event) {
    const error = event.error || new Error(event.message || 'Unknown error');
    
    logError(error, 'Unhandled Exception');
    
    // Show a user-friendly notification
    showErrorNotification(error);
    
    // Prevent default browser error handling in development
    if (process.env.NODE_ENV === 'development') {
        event.preventDefault();
    }
}

/**
 * Handle unhandled promise rejections
 * @param {Event} event The promise rejection event
 */
function handleUnhandledRejection(event) {
    const error = event.reason || new Error('Unhandled Promise Rejection');
    
    logError(error, 'Unhandled Promise Rejection');
    
    // Show notification for certain errors that users should know about
    if (
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('unauthorized') ||
        error.message.includes('permission')
    ) {
        showErrorNotification(error);
    }
}

// Set up global error handlers
window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);

// Create a global error handler object
window.ErrorHandler = {
    showError: showErrorNotification,
    logError: logError,
    getErrorHistory,
    clearErrorHistory,
    getFriendlyMessage: getUserFriendlyMessage
};

// Export functions for module usage
export {
    showErrorNotification as showError,
    logError,
    getUserFriendlyMessage,
    getErrorHistory,
    clearErrorHistory
}; 