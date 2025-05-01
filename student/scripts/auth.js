// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token !== null && token !== undefined;
}

// Get current user data
function getCurrentUser() {
    // Try different possible storage keys for user data
    const possibleKeys = ['user', 'userData', 'userInfo'];
    let userData = null;
    
    for (const key of possibleKeys) {
        const data = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (data) {
            try {
                userData = JSON.parse(data);
                break;
            } catch (e) {
                console.warn(`Error parsing user data from ${key}:`, e);
            }
        }
    }
    
    return userData;
}

// Logout function
function logout() {
    // Clear all potential user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('userInfo');
    
    // Clear from sessionStorage too
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('userInfo');
    
    // Redirect to login page using relative path for better compatibility
    window.location.href = 'mpl-login.html';
}

// Update UI based on auth state
function updateAuthUI() {
    const user = getCurrentUser();
    const logoutLinks = document.querySelectorAll('.logout-link');
    const profileLinks = document.querySelectorAll('.profile-link');
    const loginButtons = document.querySelectorAll('.login-button');

    if (isLoggedIn()) {
        // User is logged in
        logoutLinks.forEach(link => link.style.display = 'block');
        profileLinks.forEach(link => {
            link.style.display = 'block';
            // Update profile link text if it exists
            const nameSpan = link.querySelector('.user-name');
            if (nameSpan && user) {
                nameSpan.textContent = `${user.first_name || user.firstName || 'User'} ${user.last_name || user.lastName || ''}`;
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
        window.location.href = 'mpl-login.html';
        return false;
    }
    return true;
}

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Initialize auth state when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if token exists but no user data (incomplete auth)
    if (isLoggedIn() && !getCurrentUser()) {
        console.warn("Auth token exists but no user data found. This may cause issues.");
    }
    
    // Add click handlers to all logout buttons/links
    const logoutElements = document.querySelectorAll('.logout-link, .logout-btn, #logoutBtn');
    logoutElements.forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });

    // Update UI based on current auth state
    updateAuthUI();
    
    // If this is a protected page and user is not logged in, redirect
    const isProtectedPage = !window.location.pathname.includes('login') && 
                            !window.location.pathname.includes('index.html');
    
    if (isProtectedPage && !isLoggedIn()) {
        console.warn("Unauthorized access to protected page. Redirecting to login.");
        window.location.href = 'mpl-login.html';
    }
}); 