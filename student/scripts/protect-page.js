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

    // Update user name in profile dropdown if element exists
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = `${user.first_name} ${user.last_name}`;
    }

    // Set up logout functionality
    const logoutLinks = document.querySelectorAll('.logout-link');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Use the proper logout function instead of manually removing items
            if (typeof logout === 'function') {
                logout(); // This will properly clear all data and redirect
            } else {
                // Fallback if logout function is not available
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'mpl-login.html';
            }
        });
    });

    // Ensure all pages have consistent navigation
    ensureConsistentNavigation();
});

// Function to ensure all pages have the same navigation options
function ensureConsistentNavigation() {
    const profileContent = document.querySelector('.profile-content');
    
    if (profileContent) {
        // Check if profile dropdown exists but is missing the internship link
        const hasInternshipLink = Array.from(profileContent.querySelectorAll('a'))
            .some(link => link.textContent.includes('Internship'));
        
        if (!hasInternshipLink) {
            // Find where to insert the internship link (after Resume, before Applications)
            const resumeLink = Array.from(profileContent.querySelectorAll('a'))
                .find(link => link.textContent.includes('Resume'));
            
            if (resumeLink) {
                const internshipLink = document.createElement('a');
                internshipLink.href = 'internship-report.html';
                internshipLink.textContent = 'Internship';
                profileContent.insertBefore(internshipLink, resumeLink.nextSibling);
            }
        }
    }
} 