/**
 * Employer Profile Connector
 * This script handles loading and synchronizing employer profile data 
 * across the application, ensuring job listings display the correct company name
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Employer Profile Connector');
    
    // Load the employer profile data when the page loads
    loadEmployerProfile();
    
    // Set up event listener for profile updates
    window.addEventListener('employer-profile-updated', function(event) {
        console.log('Employer profile updated event received');
        loadEmployerProfile(true);
    });
});

/**
 * Loads the employer profile data from API or localStorage
 * @param {boolean} forceRefresh - Whether to force a refresh from the API
 */
async function loadEmployerProfile(forceRefresh = false) {
    console.log('Loading employer profile, forceRefresh:', forceRefresh);
    
    try {
        // Check for authentication token
        const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
        
        // Skip if not authenticated as employer
        if (!authToken || (userRole !== 'Employer' && userRole !== 'employer')) {
            console.log('Not authenticated as employer, skipping profile load');
            return;
        }
        
        // Get employer ID from local storage
        const employerId = getEmployerId();
        console.log('Employer ID:', employerId);
        
        if (!employerId && !authToken) {
            console.error('No employer ID found and not authenticated');
            return;
        }
        
        // If not forcing refresh, try to use cached data
        if (!forceRefresh) {
            const cachedData = localStorage.getItem('employerProfileCache');
            if (cachedData) {
                try {
                    const cache = JSON.parse(cachedData);
                    const cacheAge = new Date() - new Date(cache.timestamp || 0);
                    
                    // Use cache if it's less than 5 minutes old
                    if (cacheAge < 5 * 60 * 1000) {
                        console.log('Using cached employer profile data');
                        updateUserDataWithEmployerProfile(cache.employerData);
                        return;
                    }
                } catch (cacheError) {
                    console.error('Error parsing cached data:', cacheError);
                }
            }
        }
        
        // Check API connectivity
        const isApiAvailable = await checkApiConnectivity();
        console.log('API available:', isApiAvailable);
        
        if (!isApiAvailable) {
            console.log('API not available, using cached data if available');
            const cachedData = localStorage.getItem('employerProfileCache');
            if (cachedData) {
                try {
                    const cache = JSON.parse(cachedData);
                    updateUserDataWithEmployerProfile(cache.employerData);
                } catch (error) {
                    console.error('Error using cached profile data:', error);
                }
            }
            return;
        }
        
        // Determine which endpoint to use
        const endpoint = authToken && (userRole === 'Employer' || userRole === 'employer')
            ? `${getApiUrl()}/employers/me`
            : `${getApiUrl()}/employers/${employerId}`;
        
        console.log(`Fetching employer data from ${endpoint}`);
        
        // Set up headers
        const headers = authToken ? {
            'Authorization': `Bearer ${authToken}`
        } : {};
        
        // Fetch employer data
        const response = await fetch(endpoint, { headers });
        
        if (!response.ok) {
            console.error(`Error response from API: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch employer data: ${response.status} ${response.statusText}`);
        }
        
        const employerData = await response.json();
        console.log('Received employer data:', employerData);
        
        // Store the employer ID for future use
        if (employerData.id && !localStorage.getItem('currentEmployerId')) {
            localStorage.setItem('currentEmployerId', employerData.id);
        }
        
        // Cache the data
        try {
            localStorage.setItem('employerProfileCache', JSON.stringify({
                employerData,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.warn('Failed to cache employer profile data:', error);
        }
        
        // Update the user data with employer profile info
        updateUserDataWithEmployerProfile(employerData);
        
    } catch (error) {
        console.error('Error in loadEmployerProfile:', error);
    }
}

/**
 * Updates the user data in localStorage with employer profile information
 * @param {Object} employerData - The employer profile data
 */
function updateUserDataWithEmployerProfile(employerData) {
    if (!employerData) return;
    
    try {
        // Get current user data
        const userDataStr = localStorage.getItem('userData') || localStorage.getItem('user');
        let userData = userDataStr ? JSON.parse(userDataStr) : {};
        
        // Update with employer profile data
        userData = {
            ...userData,
            company_name: employerData.name || employerData.companyName,
            companyName: employerData.name || employerData.companyName, // Add both formats for compatibility
            industry: employerData.industry,
            location: employerData.location
        };
        
        // Save back to localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('User data updated with employer profile:', userData);
        
        // Dispatch event that profile data has been updated
        document.dispatchEvent(new CustomEvent('employer-data-updated', {
            detail: employerData
        }));
    } catch (error) {
        console.error('Error updating user data with employer profile:', error);
    }
}

/**
 * Gets the employer ID from localStorage or URL parameter
 * @returns {string} The employer ID
 */
function getEmployerId() {
    // Try to get from localStorage first
    const employerId = localStorage.getItem('currentEmployerId') || 
                       localStorage.getItem('employerId');
    
    if (employerId) return employerId;
    
    // If not in localStorage, try to get from URL
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id') || urlParams.get('employerId');
    
    if (idFromUrl) return idFromUrl;
    
    // If still no ID, try to extract from user data
    try {
        const userDataStr = localStorage.getItem('userData') || localStorage.getItem('user');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            return userData.id || userData.employerId || userData.employer_id;
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
    }
    
    return null;
}

/**
 * Checks if the API is available
 * @returns {Promise<boolean>} Whether the API is available
 */
async function checkApiConnectivity() {
    try {
        const apiUrl = getApiUrl();
        console.log(`Checking API connectivity at ${apiUrl}/health`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${apiUrl}/health`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.warn('API connectivity check failed:', error);
        return false;
    }
}

/**
 * Gets the API URL from meta tag or default
 * @returns {string} The API URL
 */
function getApiUrl() {
    const metaTag = document.querySelector('meta[name="api-url"]');
    if (metaTag && metaTag.content) {
        return metaTag.content.endsWith('/') 
            ? metaTag.content.slice(0, -1) 
            : metaTag.content;
    }
    return 'http://localhost:5004/api';
} 