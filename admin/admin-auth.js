// Admin authentication utility functions

// Check if admin is logged in
function isAdminLoggedIn() {
    return localStorage.getItem('adminToken') !== null;
}

// Get the current admin user
function getCurrentAdmin() {
    if (!isAdminLoggedIn()) {
        return null;
    }
    
    try {
        return JSON.parse(localStorage.getItem('adminUser'));
    } catch (error) {
        console.error('Error parsing admin user data:', error);
        return null;
    }
}

// Verify admin token (could be expanded to check token validity with server)
function verifyAdminToken() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        return false;
    }
    
    // Token exists, but we could add more checks here
    return true;
}

// Admin logout function
function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/admin-login.html';
}

// Protect admin routes
function requireAdminAuth() {
    if (!isAdminLoggedIn() || !verifyAdminToken()) {
        window.location.href = '/admin/admin-login.html';
        return false;
    }
    
    const user = getCurrentAdmin();
    if (!user || user.role !== 'Admin') {
        window.location.href = '/admin/admin-login.html';
        return false;
    }
    
    return true;
}

// Update UI elements based on admin info
function updateAdminUI() {
    if (!isAdminLoggedIn()) {
        return;
    }
    
    const adminUser = getCurrentAdmin();
    if (!adminUser) {
        return;
    }
    
    // Update any admin UI elements here
    const adminTextElements = document.querySelectorAll('.admin-text span');
    adminTextElements.forEach(element => {
        element.innerHTML = `${adminUser.first_name} <i class="fa-solid fa-angle-down"></i>`;
    });
}

// Set up logout functionality
function setupAdminLogout() {
    const logoutLinks = document.querySelectorAll('.dropdown-menu a');
    logoutLinks.forEach(link => {
        if (link.textContent.trim() === 'Logout') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                adminLogout();
            });
        }
    });
}

// Initialize admin protection and UI updates
document.addEventListener('DOMContentLoaded', function() {
    // Only run on admin pages (excluding login page)
    if (window.location.pathname.includes('admin-login.html')) {
        return;
    }
    
    if (!requireAdminAuth()) {
        return; // This will redirect to login
    }
    
    updateAdminUI();
    setupAdminLogout();
    
    // Other admin initialization can be added here
}); 