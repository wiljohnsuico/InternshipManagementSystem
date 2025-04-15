// This script should be included in all pages that require authentication
document.addEventListener('DOMContentLoaded', function() {
    // Check if auth.js is loaded
    if (typeof requireAuth !== 'function') {
        console.error('auth.js not loaded');
        window.location.href = 'mpl-login.html';
        return;
    }

    // Protect the page
    if (!requireAuth()) {
        return; // This will redirect to login if not authenticated
    }

    // Update navigation UI
    updateAuthUI();

    // Get current user
    const user = getCurrentUser();
    if (!user) {
        console.error('No user data found');
        logout(); // This will clean up and redirect to login
        return;
    }

    // Additional page-specific initialization can be added here
    console.log('Page protected and user authenticated:', user.email);
}); 