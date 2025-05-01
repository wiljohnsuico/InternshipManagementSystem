// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get current user data
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout function
function logout() {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page using absolute path
    window.location.href = '/student/mpl-login.html';
}

// Update UI based on auth state
function updateAuthUI() {
    const user = getCurrentUser();
    const logoutLinks = document.querySelectorAll('.logout-link');
    const profileLinks = document.querySelectorAll('.profile-link');
    const loginButtons = document.querySelectorAll('.login-button');

    if (user) {
        // User is logged in
        logoutLinks.forEach(link => link.style.display = 'block');
        profileLinks.forEach(link => {
            link.style.display = 'block';
            // Update profile link text if it exists
            const nameSpan = link.querySelector('.user-name');
            if (nameSpan) {
                nameSpan.textContent = `${user.first_name} ${user.last_name}`;
            }
        });
        loginButtons.forEach(btn => btn.style.display = 'none');
    } else {
        // User is logged out
        logoutLinks.forEach(link => link.style.display = 'none');
        profileLinks.forEach(link => link.style.display = 'none');
        loginButtons.forEach(btn => btn.style.display = 'block');
    }
}

// Protect routes that require authentication
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/student/mpl-login.html';
        return false;
    }
    return true;
}

// Initialize auth state when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to all logout links
    document.querySelectorAll('.logout-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    // Update UI based on current auth state
    updateAuthUI();
}); 