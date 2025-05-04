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
    // Only preserve these non-user-specific settings
    const keysToPreserve = [
        // UI preferences only - NO USER DATA
        'theme',
        'uiPreferences',
        'notificationPreferences',
        'language'
    ];
    
    // Save values before clearing localStorage
    const preservedValues = {};
    keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            preservedValues[key] = value;
        }
    });
    
    // Clear ALL localStorage - important for security
    localStorage.clear();
    
    // Clear ALL sessionStorage
    sessionStorage.clear();
    
    // Restore only non-user-specific preferences
    Object.keys(preservedValues).forEach(key => {
        localStorage.setItem(key, preservedValues[key]);
    });
    
    console.log('Cleared all user data during logout');
    
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

// Function to sync application data with server after login
function syncApplicationDataAfterLogin() {
    console.log('Syncing application data after login');
    
    // Clear any stale application data that might exist
    const applicationKeys = [
        'appliedJobs',
        'appliedJobsFromServer',
        'locallyStoredApplications',
        'cachedApplications',
        'withdrawnJobs',
        'withdrawnJobsMap',
        'completedWithdrawals',
        'applicationIdMap'
    ];
    
    // Clear all keys related to applications
    applicationKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            console.log(`Clearing stale ${key} data`);
            localStorage.removeItem(key);
        }
    });
    
    // Note: The next time the user visits a page that needs application data,
    // it will be fetched fresh from the server
    console.log('Application data cleared, will be fetched fresh from server when needed');
    
    // Also clear any in-memory caches if they exist
    if (window.appliedJobCache) window.appliedJobCache = {};
    if (window.hasAppliedCache) window.hasAppliedCache = {};
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

// In your login handler or wherever users successfully log in, add:
function handleSuccessfulLogin(userData, token) {
    // Store auth token
    localStorage.setItem('token', token);
    
    // Store user data
    if (userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify({
            id: userData.id || userData.user_id,
            email: userData.email,
            role: userData.role
        }));
    }
    
    // Sync application data to ensure fresh state
    syncApplicationDataAfterLogin();
    
    // Update UI
    updateAuthUI();
    
    // Determine redirect URL
    let redirectUrl = 'mplhome.html';
    if (userData && userData.role === 'Employer') {
        redirectUrl = 'employers/dashboard.html';
    } else if (userData && userData.role === 'Admin') {
        redirectUrl = '/admin/dashboard.html';
    }
    
    // Redirect user
    window.location.href = redirectUrl;
} 