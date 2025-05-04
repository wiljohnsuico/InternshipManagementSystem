// Job listing script

// Default API URL (will be updated from meta tag if available)
let API_URL = "http://localhost:5004/api";

// Global state for job listings
let isLoading = false;
let userApplications = [];
let currentPage = 1;
let totalPages = 1;
let totalListings = 0;
let pageSize = 9; // Show 9 listings per page (3x3 grid)
let lastSearchParams = {};

// Prevent notification flood during initial load
window.initialLoadInProgress = true;

// Initialize API URL from meta tag
function initApiUrl() {
    try {
        const metaTag = document.querySelector('meta[name="api-url"]');
        if (metaTag && metaTag.content && metaTag.content.trim() !== '') {
            API_URL = metaTag.content.endsWith('/') ? metaTag.content.slice(0, -1) : metaTag.content;
            console.log("API URL initialized from meta tag:", API_URL);
        } else {
            console.log("Using default API URL:", API_URL);
        }
    } catch (e) {
        console.warn("Error initializing API URL from meta tag:", e);
    }
}

// Call initialization function
initApiUrl();

// Helper function to get the API URL
function getApiUrl() {
    return API_URL;
}

// Helper function to get user ID
function getUserId() {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    
    try {
        const parsed = JSON.parse(userData);
        return parsed.id || parsed.userId || null;
    } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
    }
}

// DOM Elements
const jobListingsContainer = document.getElementById("job-listings");
const searchTitleInput = document.getElementById("search-input");
const searchLocationInput = document.getElementById("location-input");
const searchButton = document.querySelector(".search-bar button");
const radioButtons = document.querySelectorAll('input[name="filter"]');
const resultCount = document.getElementById("results-count");

// Initialize modal (using the new modal structure)
// These will be initialized properly in the setupModal function
let modal = null;
let modalContainer = null;
let closeModalBtn = null;
let currentJobId = null;

// Store user's applications to track what they've already applied for
// Note: userApplications is already declared at the top of the file

// Fix for location dropdown
function setupSearchFields() {
    // Define possible search input selectors for different pages
    const searchInputs = [
        { title: document.getElementById("search-input"), location: document.getElementById("location-input") },
        { title: document.getElementById("search-title"), location: document.getElementById("search-location") }
    ];
    
    // Find the first valid set of inputs
    let activeInputs = null;
    for (const inputSet of searchInputs) {
        if (inputSet.title && inputSet.location) {
            activeInputs = inputSet;
            break;
        }
    }
    
    if (!activeInputs) {
        return;
    }
    
    // Search button click
    const searchButtons = document.querySelectorAll(".search-bar button");
    searchButtons.forEach(button => {
        button.addEventListener("click", function(e) {
            e.preventDefault();
            performSearch(activeInputs);
        });
    });
    
    // Enter key in search inputs
    activeInputs.title.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch(activeInputs);
        }
    });
    
    activeInputs.location.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch(activeInputs);
        }
    });
    
    // Filter change
    const radioButtons = [
        document.getElementById("all"),
        document.getElementById("paid"),
        document.getElementById("unpaid")
    ];
    
    radioButtons.forEach(radio => {
        if (radio) {
            radio.addEventListener("change", () => performSearch(activeInputs));
        }
    });
}

// Perform search
function performSearch(inputs = null) {
    console.log('Performing search...');
    
    // If inputs not provided, try to find them
    if (!inputs) {
        // Try multiple possible input ID combinations
        const searchTitleElem = document.getElementById("search-input") || 
                                document.getElementById("search-title") || 
                                document.getElementById("job-search-input");
        
        const searchLocationElem = document.getElementById("location-input") || 
                                  document.getElementById("search-location");
        
        inputs = {
            title: searchTitleElem,
            location: searchLocationElem
        };
    }
    
    // Skip query update if specified (for internal calls)
    if (inputs.skipQueryUpdate) {
        if (typeof fetchJobListings === 'function') {
            fetchJobListings();
        }
        return;
    }

    // Get search values - default to empty string if elements don't exist
    const searchTitle = inputs.title && inputs.title.value ? inputs.title.value.trim() : "";
    const searchLocation = inputs.location && inputs.location.value ? inputs.location.value.trim() : "";
    
    // Get the selected filter - check all possible combinations
    let isPaid = null; // Default: null means "all"
    
    // Try different possible radio button IDs for better compatibility
    const paidRadio = document.getElementById("paid") || document.querySelector('input[name="filter"][value="paid"]');
    const unpaidRadio = document.getElementById("unpaid") || document.querySelector('input[name="filter"][value="unpaid"]');
    const allRadio = document.getElementById("all") || document.querySelector('input[name="filter"][value="all"]');
    
    if (paidRadio && paidRadio.checked) {
        isPaid = true;
        console.log('Filter: Paid selected');
    } else if (unpaidRadio && unpaidRadio.checked) {
        isPaid = false;
        console.log('Filter: Unpaid selected');
    } else {
        console.log('Filter: All selected or default');
    }
    
    // Store search parameters to restore after page reload
    try {
        localStorage.setItem('lastSearchTitle', searchTitle);
        localStorage.setItem('lastSearchLocation', searchLocation);
        localStorage.setItem('lastSearchFilter', isPaid === null ? 'all' : (isPaid ? 'paid' : 'unpaid'));
    } catch (e) {
        console.warn('Could not save search parameters to localStorage', e);
    }
    
    // Log search parameters
    console.log(`Search parameters: title="${searchTitle}", location="${searchLocation}", isPaid=${isPaid}`);
    
    // Call fetchJobListings with the search parameters
    fetchJobListings(searchTitle, searchLocation, isPaid);
}

// Helper function to get locally stored applications
function getLocallyStoredApplications() {
    const localAppsStr = localStorage.getItem('locallyStoredApplications');
    if (!localAppsStr) {
        return [];
    }
    try {
        return JSON.parse(localAppsStr);
    } catch (error) {
        console.error('Error parsing locally stored applications:', error);
        return [];
    }
}

// Save a job application to local storage
function saveLocallyStoredApplication(jobId) {
    if (!jobId) return false;
    
    try {
        const jobIdStr = String(jobId);
        const applications = getLocallyStoredApplications();
        
        if (applications.includes(jobIdStr)) {
            return false;
        }
        
        applications.push(jobIdStr);
        localStorage.setItem('locallyStoredApplications', JSON.stringify(applications));
        return true;
    } catch (e) {
        console.error("Error saving locally stored application:", e);
        return false;
    }
}

/**
 * Check if the user has already applied to a job
 * This is a critical function that determines whether buttons show as "Apply" or "Applied"
 */
function hasAppliedToJob(jobId) {
    if (!jobId) return false;
    
    try {
        // Always convert to string for consistent comparison
        jobId = String(jobId);
        
        // Use a cache for repeated calls to improve performance
        if (!window.appliedJobCache) {
            window.appliedJobCache = {};
            window.appliedJobCacheTimestamp = Date.now();
        }
        
        // Check if we have a cached result that's less than 30 seconds old
        const cacheAge = Date.now() - window.appliedJobCacheTimestamp;
        if (cacheAge < 30000 && jobId in window.appliedJobCache) {
            return window.appliedJobCache[jobId];
        }
        
        // If cache is too old, reset it
        if (cacheAge >= 30000) {
            window.appliedJobCache = {};
            window.appliedJobCacheTimestamp = Date.now();
        }
        
        // Check all withdrawal records first
        const withdrawnJobsMap = JSON.parse(localStorage.getItem('withdrawnJobsMap') || '{}');
        const withdrawnJobs = JSON.parse(localStorage.getItem('withdrawnJobs') || '[]');
        const completedWithdrawals = JSON.parse(localStorage.getItem('completedWithdrawals') || '[]');
        
        // If job is in any withdrawal list, check if it was reapplied
        const isWithdrawn = withdrawnJobsMap[jobId] || 
                           withdrawnJobs.includes(jobId) || 
                           completedWithdrawals.includes(jobId);
        
        // Now check if the application was added after withdrawal
        const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
        const appliedJobsFromServer = JSON.parse(localStorage.getItem('appliedJobsFromServer') || '[]');
        const locallyStoredApplications = JSON.parse(localStorage.getItem('locallyStoredApplications') || '[]');
        
        // If job is in applied lists, it means it was reapplied after withdrawal
        const isApplied = appliedJobs.includes(jobId) || 
                         appliedJobsFromServer.includes(jobId) ||
                         locallyStoredApplications.includes(jobId);
        
        // If both withdrawn and reapplied, prioritize the applied status
        if (isApplied) {
            window.appliedJobCache[jobId] = true;
            return true;
        }
        
        // If only withdrawn and not reapplied, consider it not applied
        if (isWithdrawn) {
            window.appliedJobCache[jobId] = false;
            return false;
        }
        
        // Final check: Look for this job in cached applications
        let cachedApplications = JSON.parse(localStorage.getItem('cachedApplications') || '[]');
        // Ensure cachedApplications is always an array
        if (!Array.isArray(cachedApplications)) {
            if (cachedApplications && Array.isArray(cachedApplications.applications)) {
                cachedApplications = cachedApplications.applications;
            } else {
                cachedApplications = [];
            }
        }
        
        const hasActiveApp = cachedApplications.some(app => {
            // Match by job_id, listing_id, or jobId
            const isMatchingJob = 
                (app.job_id && String(app.job_id) === jobId) || 
                (app.listing_id && String(app.listing_id) === jobId) ||
                (app.jobId && String(app.jobId) === jobId);
            
            // Check if not withdrawn
            const isNotWithdrawn = !app.status || app.status.toLowerCase() !== 'withdrawn';
            
            return isMatchingJob && isNotWithdrawn;
        });
        
        if (hasActiveApp) {
            // Ensure it's also in our primary storage for future checks
            if (!appliedJobs.includes(jobId)) {
                appliedJobs.push(jobId);
                localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
            }
            
            window.appliedJobCache[jobId] = true;
            return true;
        }
        
        // If we've made it here, user has not applied
        window.appliedJobCache[jobId] = false;
        return false;
    } catch (e) {
        console.error(`Error checking if applied to job ${jobId}:`, e);
        
        // If there's an error, default to false (show apply button)
        return false;
    }
}

// Helper functions for loading indicators
function showLoadingIndicator() {
    // Find or create loading indicator
    let loadingIndicator = document.querySelector('.global-loading-indicator');
    
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'global-loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
                </div>
            `;
        document.body.appendChild(loadingIndicator);
    }
    
    loadingIndicator.style.display = 'flex';
}

function hideLoadingIndicator() {
    const loadingIndicator = document.querySelector('.global-loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Fetch user applications
async function fetchUserApplications(forceRefresh = false) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found for fetchUserApplications');
            return [];
        }

        // Show loading indicator if available 
        if (typeof showLoadingIndicator === 'function') {
            showLoadingIndicator();
        }

        console.log(`Fetching user applications (force=${forceRefresh ? 'true' : 'false'})...`);
        
        // If not forcing refresh, try to use cached data first (if recent)
        if (!forceRefresh) {
            const cachedApps = JSON.parse(localStorage.getItem('cachedApplications') || '[]');
            const cacheTimestamp = parseInt(localStorage.getItem('applicationsLastFetched') || '0');
            const cacheAge = Date.now() - cacheTimestamp;
            
            // Use cache only if less than 30 seconds old and has data
            if (cachedApps.length > 0 && cacheAge < 30000) {
                console.log(`Using ${cachedApps.length} cached applications (cache age: ${Math.floor(cacheAge / 1000)}s)`);
                window.userApplications = cachedApps;
                updateAppliedJobsUI();
                
                if (typeof hideLoadingIndicator === 'function') {
                    hideLoadingIndicator();
                }
                
                return cachedApps;
            }
        }

        // Get the API URL
        const apiUrl = getApiUrl();
        console.log(`Using API URL: ${apiUrl} for applications fetch`);
        
        // Try to fetch from server first
        try {
            console.log("Fetching applications from server...");
            const response = await fetch(`${apiUrl}/applications/my-applications`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const serverData = await response.json();
                
                if (serverData.success && Array.isArray(serverData.applications)) {
                    console.log(`Successfully fetched ${serverData.applications.length} applications from server`);
                    console.log('Sample application data structure:', serverData.applications.length > 0 ? serverData.applications[0] : 'No applications found');
                    
                    // Save fetch timestamp
                    localStorage.setItem('applicationsLastFetched', Date.now().toString());
                    
                    // Process the server data
                    processApplicationData({
                        success: true,
                        applications: serverData.applications
                    });
                    
                    if (typeof hideLoadingIndicator === 'function') {
                        hideLoadingIndicator();
                    }
                    
                    return window.userApplications;
                }
            } else {
                console.warn(`Server returned status ${response.status} when fetching applications`);
            }
        } catch (serverError) {
            console.warn("Error fetching from server, falling back to local data:", serverError);
        }

        // Fallback to mock data from localStorage
        console.log("Using fallback: Creating applications from localStorage data");
        const mockData = {
            success: true,
            applications: []
        };
        
        // Get applied jobs from localStorage
        const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
        const appliedJobsFromServer = JSON.parse(localStorage.getItem('appliedJobsFromServer') || '[]');
        const withdrawnJobs = JSON.parse(localStorage.getItem('withdrawnJobs') || '[]');
        
        // Create mock applications from appliedJobs
        const allAppliedJobs = [...new Set([...appliedJobs, ...appliedJobsFromServer])];
        
        allAppliedJobs.forEach(jobId => {
            // Skip withdrawn jobs
            if (withdrawnJobs.includes(jobId)) {
                // Add as withdrawn application
                mockData.applications.push({
                    job_id: jobId,
                    listing_id: jobId,
                    status: 'Withdrawn',
                    created_at: new Date().toISOString()
                });
            } else {
                // Add as active application
                mockData.applications.push({
                    job_id: jobId,
                    listing_id: jobId,
                    status: 'Pending',
                    created_at: new Date().toISOString()
                });
            }
        });
        
        console.log(`Created mock applications data with ${mockData.applications.length} applications`);
        
        // Process the mock data
        processApplicationData(mockData);
        
        if (typeof hideLoadingIndicator === 'function') {
            hideLoadingIndicator();
        }
        
        return window.userApplications;
    } catch (error) {
        console.error("Error fetching user applications:", error);
        
        if (typeof hideLoadingIndicator === 'function') {
            hideLoadingIndicator();
        }
        
        return [];
    }
}

// Function to process application data
function processApplicationData(data) {
    if (data.success && data.applications && Array.isArray(data.applications)) {
        console.log(`Processing ${data.applications.length} applications`);
        
        // Store applications in memory
        window.userApplications = data.applications;
        
        // Cache the applications
        localStorage.setItem('cachedApplications', JSON.stringify(data.applications));
        
        // Extract application IDs for faster lookups
        const appliedJobsFromServer = data.applications
            .filter(app => app.status?.toLowerCase() !== 'withdrawn')
            .map(app => String(app.listing_id));
        
        console.log('Applied jobs from server:', appliedJobsFromServer);
        
        // Store server-confirmed applications
        localStorage.setItem('appliedJobsFromServer', JSON.stringify(appliedJobsFromServer));
        
        // Update UI elements
        updateAppliedJobsUI();
    } else {
        console.warn("Unexpected data format received:", data);
        window.userApplications = [];
    }
}

// Function to update UI elements based on user applications
function updateAppliedJobsUI() {
    console.log("Updating UI for applied jobs");
    
    try {
        // Get all the relevant storage data for accurate status checks
        const completedWithdrawals = JSON.parse(localStorage.getItem('completedWithdrawals') || '[]');
        const withdrawnJobs = JSON.parse(localStorage.getItem('withdrawnJobs') || '[]');
        const withdrawnJobsMap = JSON.parse(localStorage.getItem('withdrawnJobsMap') || '{}');
        const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
        const appliedJobsFromServer = JSON.parse(localStorage.getItem('appliedJobsFromServer') || '[]');
        const locallyStoredApplications = JSON.parse(localStorage.getItem('locallyStoredApplications') || '[]');
        
        console.log(`Found ${appliedJobs.length} applied jobs, ${appliedJobsFromServer.length} server-confirmed jobs`);
        
        // Update any UI elements that show applied status
        // Target ALL buttons that have data-job-id attributes, not just apply-btn class
        const allSelectors = [
            'button[data-job-id]',
            'button[data-listing-id]',
            '.card-actions button',
            '.job-card button',
            'button.applied',
            'button.btn-success'
        ];
        const applyButtons = document.querySelectorAll(allSelectors.join(', '));
        console.log(`Found ${applyButtons.length} total apply buttons to check`);
        
        let updatedCount = 0;
        
        applyButtons.forEach(button => {
            let jobId = button.getAttribute('data-job-id');
            
            // If button doesn't have job ID, try to get it from parent job card
            if (!jobId) {
                const jobCard = button.closest('.job-card') || button.closest('[data-job-id]');
                if (jobCard) {
                    jobId = jobCard.getAttribute('data-job-id');
                    console.log(`Found job ID ${jobId} from parent card for button:`, button.textContent);
                }
            }
            
            if (!jobId) {
                console.warn("Found apply button without data-job-id attribute and can't determine job ID from parent");
                return;
            }
            
            const jobIdStr = String(jobId);
            
            // Check if job has been withdrawn - if so, reset to apply state
            if (completedWithdrawals.includes(jobIdStr) || withdrawnJobs.includes(jobIdStr) || withdrawnJobsMap[jobIdStr]) {
                console.log(`Job ${jobId} was previously withdrawn - resetting button to Apply Now state`);
                button.textContent = 'Apply Now';
                button.disabled = false;
                button.classList.remove('btn-success', 'btn-warning', 'applied', 'applied-pending');
                button.classList.add('btn-primary');
                
                // Remove applied class from job card if present
                const jobCard = button.closest('.job-card');
                if (jobCard && jobCard.classList.contains('job-applied')) {
                    jobCard.classList.remove('job-applied');
                }
                updatedCount++;
                return;
            }

            // Log all possible application states for debugging
            console.log(`Checking job ${jobId}: ${appliedJobs.includes(jobIdStr) ? 'In appliedJobs' : 'Not in appliedJobs'}, ${appliedJobsFromServer.includes(jobIdStr) ? 'In serverJobs' : 'Not in serverJobs'}`);

            // If it's not withdrawn, check if applied using BOTH appliedJobs and appliedJobsFromServer
            const isInAppliedJobs = appliedJobs.includes(jobIdStr);
            const isInServerJobs = appliedJobsFromServer.includes(jobIdStr);
            const isApplied = isInAppliedJobs || isInServerJobs || hasAppliedToJob(jobId);
            const isLocalApplication = locallyStoredApplications.includes(jobIdStr) && 
                                      !appliedJobsFromServer.includes(jobIdStr);
            
            if (isApplied) {
                console.log(`Marking job ${jobId} as applied in UI (${isInAppliedJobs ? 'local' : ''}${isInServerJobs ? 'server' : ''})`);
                // Update button to "Applied" state
                button.textContent = 'Applied';
                button.disabled = true;
                button.classList.remove('btn-primary', 'btn-warning', 'applied-pending');
                button.classList.add('btn-success', 'applied');
                
                // Find and update the job card if it exists
                const jobCard = button.closest('.job-card');
                if (jobCard) {
                    jobCard.classList.add('job-applied');
                }
                updatedCount++;
            } else if (isLocalApplication) {
                // This job has a pending local application
                button.textContent = 'Applied (Pending Sync)';
                button.classList.add('applied-pending');
                button.classList.remove('btn-primary', 'btn-success');
                button.classList.add('btn-warning');
                button.disabled = true;
                
                // Find and update the job card if it exists
                const jobCard = button.closest('.job-card');
                if (jobCard) {
                    jobCard.classList.add('job-applied');
                }
                updatedCount++;
            } else {
                // Always reset button and card to Apply Now state if not applied and not withdrawn
                button.textContent = 'Apply Now';
                button.disabled = false;
                button.classList.remove('btn-success', 'btn-warning', 'applied', 'applied-pending');
                button.classList.add('btn-primary');
                
                // Remove applied class from job card if present
                const jobCard = button.closest('.job-card');
                if (jobCard && jobCard.classList.contains('job-applied')) {
                    jobCard.classList.remove('job-applied');
                }
                updatedCount++;
            }
        });
        
        console.log(`Updated ${updatedCount} buttons in the UI`);
    } catch (error) {
        console.error("Error updating applied jobs UI:", error);
    }
}

// Fetch job listings
function fetchJobListings(searchTitle, searchLocation, isPaid) {
    // Get the job listings container
    const jobListingsContainer = document.getElementById('job-listings');
    if (!jobListingsContainer) {
        console.error('Job listings container not found');
        return;
    }

    // Show loading state
    jobListingsContainer.innerHTML = '<div class="loading-indicator">Loading job listings...</div>';
    
    // Get authentication token - check both possible storage keys
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
        jobListingsContainer.innerHTML = '<div class="error">Please log in to view job listings</div>';
        return;
    }

    try {
        console.log(`Fetching job listings with searchTitle: "${searchTitle}", location: "${searchLocation}", isPaid: ${isPaid}`);
        
        // Build query parameters more efficiently
        const queryParams = new URLSearchParams();
        
        // Add search parameters if they exist - prioritize parameters passed directly to the function
        if (searchTitle) {
            queryParams.append('search', searchTitle);
        } else {
            // Fallback to input elements if no direct parameters
            const searchInput = document.getElementById('search-input') || document.getElementById('job-search-input');
            if (searchInput && searchInput.value) {
                queryParams.append('search', searchInput.value);
            }
        }
        
        if (searchLocation) {
            queryParams.append('location', searchLocation);
        } else {
            const locationInput = document.getElementById('location-input');
            if (locationInput && locationInput.value) {
                queryParams.append('location', locationInput.value);
            }
        }
        
        // Handle isPaid parameter - can be true, false, or null (for "all")
        if (isPaid === true) {
            queryParams.append('isPaid', 'true');
        } else if (isPaid === false) {
            queryParams.append('isPaid', 'false');
        }
        // If isPaid is null, don't add the parameter (show all)
        
        // Add pagination
        const currentPage = parseInt(localStorage.getItem('currentJobPage') || '1');
        queryParams.append('page', currentPage);
        queryParams.append('limit', 10);
        
        // Get the correct API URL
        const apiUrl = getApiUrl();
        
        // Set a timeout to handle potential fetch failures
        const timeoutId = setTimeout(() => {
            console.log('Job listing fetch timeout - showing cached data');
            showCachedJobListings();
        }, 5000);
        
        // Log the request URL for debugging
        console.log(`Fetching jobs from: ${apiUrl}/jobs?${queryParams.toString()}`);
        
        // Fetch job listings with timeout
        fetch(`${apiUrl}/jobs?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.listings && data.listings.length > 0) {
                // Cache the listings
                cacheJobListings(data.listings);
                
                // Display job listings
                displayJobListings(data.listings);
                
                // Update pagination if needed
                if (typeof displayPaginationControls === 'function') {
                    displayPaginationControls();
                }
                
                // Update applied buttons state
                updateAppliedJobsUI();
            } else {
                jobListingsContainer.innerHTML = '<div class="no-results">No job listings found</div>';
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            console.error('Error fetching job listings:', error);
            showCachedJobListings();
        });
    } catch (error) {
        console.error('Error in fetchJobListings:', error);
        showCachedJobListings();
    }
}

// Cache job listings for faster loading
function cacheJobListings(listings) {
    if (!listings || !Array.isArray(listings)) return;
    try {
        localStorage.setItem('cachedJobListings', JSON.stringify(listings));
        localStorage.setItem('jobListingsLastFetched', Date.now().toString());
    } catch (error) {
        console.error('Error caching job listings:', error);
    }
}

// Show cached job listings when fetch fails or is slow
function showCachedJobListings() {
    const jobListingsContainer = document.getElementById('job-listings');
    if (!jobListingsContainer) return;
    
    try {
        const cachedListings = JSON.parse(localStorage.getItem('cachedJobListings') || '[]');
        if (cachedListings.length > 0) {
            console.log(`Using ${cachedListings.length} cached job listings`);
            displayJobListings(cachedListings);
            
            // Show a notice that data might be stale
            if (window.notification && typeof window.notification.info === 'function') {
                window.notification.info('Showing cached job listings. Pull to refresh for latest data.', true);
            }
            
            // Update applied buttons state
            updateAppliedJobsUI();
        } else {
            jobListingsContainer.innerHTML = '<div class="error">Failed to fetch job listings. Please try again later.</div>';
        }
    } catch (error) {
        console.error('Error showing cached listings:', error);
        jobListingsContainer.innerHTML = '<div class="error">Failed to fetch job listings. Please try again later.</div>';
    }
}

// Function to update the state of Apply buttons based on locally stored applications
function updateApplyButtonsState() {
    // This functionality is now handled by updateAppliedJobsUI
    updateAppliedJobsUI();
}

// Function to ensure application is tracked properly even with UI errors
function ensureApplicationTracked(jobId) {
    if (!jobId) return;
    
    try {
        // Track locally regardless of server state
        saveLocallyStoredApplication(jobId);
        
        // Mark the UI as applied
        const applyButtons = document.querySelectorAll(`.apply-btn[data-job-id="${jobId}"]`);
        applyButtons.forEach(button => {
            button.textContent = "Applied";
            button.classList.add("applied");
            button.disabled = true;
        });
        
        // Update our local tracking
        if (!userApplications.some(app => 
            String(app.job_id) === String(jobId) || 
            String(app.listing_id) === String(jobId)
        )) {
            userApplications.push({
                job_id: jobId,
                listing_id: jobId,
                status: 'Pending',
                applied_at: new Date().toISOString()
            });
        }
        
        console.log(`Application for job ID ${jobId} tracked successfully`);
    } catch (e) {
        console.error(`Error ensuring application is tracked for job ID ${jobId}:`, e);
    }
}

// Listen for application-cancel-complete events
document.addEventListener('application-cancel-complete', function(event) {
    const { applicationId, jobId } = event.detail;
    console.log(`Received application-cancel-complete event for application ${applicationId}, job ${jobId}`);
    
    // CRITICAL: Check if we should process this event - ONLY block VERY recent submissions
    // This helps avoid race conditions between submission and withdrawal
    const lastSubmitTime = parseInt(localStorage.getItem('lastApplicationSubmit') || '0');
    const now = Date.now();
    const isVeryRecentSubmission = (now - lastSubmitTime) < 3000; // Only block for 3 seconds
    
    if (isVeryRecentSubmission) {
        console.log('BLOCKING withdrawal notification - VERY recent submission detected');
        return;
    }
    
    if (jobId) {
        // Check if this is a direct user-initiated withdrawal
        const isDirectWithdrawal = localStorage.getItem('directWithdrawal') === 'true';
        localStorage.removeItem('directWithdrawal'); // Clear the flag immediately
        
        // Clear application data from local storage
        clearApplicationState(jobId);
        
        // IMPORTANT: Only show notification if it's a direct withdrawal
        if (isDirectWithdrawal) {
            try {
                localStorage.setItem('lastWithdrawalNotification', Date.now().toString());
                
                if (window.notification && typeof window.notification.warning === 'function') {
                    window.notification.warning('Your application has been withdrawn successfully.', true);
                    console.log("Showed withdrawal notification");
                } else {
                    // Fallback notification
                    alert("Your application has been withdrawn successfully.");
                }
            } catch (e) {
                console.warn('Error showing withdrawal notification:', e);
                // Final fallback
                alert("Your application has been withdrawn successfully.");
            }
        }
        
        // Force refresh UI
        updateAppliedJobsUI();
        
        // Refresh job listings if function is available
        if (typeof window.fetchJobListings === 'function') {
            console.log('Refreshing job listings after cancellation');
            window.fetchJobListings();
        }
    }
});

// Block application-withdrawn events during submission
document.addEventListener('application-withdrawn', function(event) {
    console.log("Received application-withdrawn event", event.detail);
    
    // CRITICAL: Block withdrawal handling if very recent submission
    const lastSubmitTime = parseInt(localStorage.getItem('lastApplicationSubmit') || '0');
    const now = Date.now();
    const isVeryRecentSubmission = (now - lastSubmitTime) < 3000; // Only block for 3 seconds
    
    if (isVeryRecentSubmission) {
        console.log('BLOCKING withdrawal event handling - very recent submission detected');
        return;
    }
    
    if (event.detail && event.detail.jobId) {
        const jobId = event.detail.jobId;
        
        // Check if this is a direct user-initiated withdrawal
        const isDirectWithdrawal = localStorage.getItem('directWithdrawal') === 'true';
        
        // Only show notification if it's a direct withdrawal
        if (isDirectWithdrawal) {
            localStorage.setItem('lastWithdrawalNotification', Date.now().toString());
            
            if (window.notification && typeof window.notification.warning === 'function') {
                window.notification.warning('Your application has been withdrawn successfully.', true);
                console.log("Showed withdrawal notification from application-withdrawn event");
            } else {
                // Fallback notification
                alert("Your application has been withdrawn successfully.");
            }
        }
        
        // Refresh job listings to update the UI
        fetchUserApplications(true).then(() => {
            // Update UI immediately
            updateAppliedJobsUI();
            
            // Refresh listings if needed
            if (typeof fetchJobListings === 'function') {
                fetchJobListings();
            }
        }).catch(err => {
            console.error("Error refreshing applications:", err);
            // Continue with UI update even if fetch fails
            updateAppliedJobsUI();
            if (typeof fetchJobListings === 'function') {
                fetchJobListings();
            }
        });
    }
});

// Add event listener to update button states when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing job listings page');
    
    // Initialize performance monitoring
    if (!window.perfStartTime) {
        window.perfStartTime = performance.now();
    }
    console.log(`Page load to DOMContentLoaded: ${(performance.now() - window.perfStartTime).toFixed(2)}ms`);
    
    // Setup radio filters directly (in addition to the setupSearchFields function)
    const allRadio = document.getElementById('all');
    const paidRadio = document.getElementById('paid');
    const unpaidRadio = document.getElementById('unpaid');
    
    // Add listeners to radio buttons to trigger search
    [allRadio, paidRadio, unpaidRadio].forEach(radio => {
        if (radio) {
            console.log(`Adding listener to radio button: ${radio.id}`);
            radio.addEventListener('change', function() {
                console.log(`Radio button changed: ${this.id} is now checked`);
                performSearch();
            });
        }
    });
    
    // Setup search button
    const searchButton = document.querySelector('.search-button') || document.querySelector('.search-bar button');
    if (searchButton) {
        console.log('Setting up search button');
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch();
        });
    }
    
    // Check if this is the job listings page
    const isJobListingsPage = document.getElementById('job-listings') !== null;
    if (isJobListingsPage) {
        console.log('Job listings page detected, initializing with optimized loader...');
        initJobListingsPage();
        
        // Add pull-to-refresh capability
        window.addEventListener('scroll', function() {
            if (document.documentElement.scrollTop === 0) {
                // User has scrolled to top - show refresh option
                const refreshNotice = document.getElementById('pull-refresh-notice');
                if (!refreshNotice) {
                    const notice = document.createElement('div');
                    notice.id = 'pull-refresh-notice';
                    notice.className = 'pull-refresh-notice';
                    notice.innerHTML = 'Pull down to refresh <i class="fas fa-arrow-down"></i>';
                    document.body.insertBefore(notice, document.body.firstChild);
                    
                    // Auto-hide after 3 seconds
                    setTimeout(() => {
                        if (notice.parentNode) {
                            notice.parentNode.removeChild(notice);
                        }
                    }, 3000);
                }
            }
        });
        
        // Add pull-to-refresh function
        let touchStartY = 0;
        document.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', function(e) {
            const touchEndY = e.changedTouches[0].clientY;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            
            // If user has pulled down at least 100px from top
            if (scrollTop === 0 && touchEndY - touchStartY > 100) {
                refreshJobListings();
                
                // Show refreshing indicator
                if (window.notification && typeof window.notification.info === 'function') {
                    window.notification.info('Refreshing job listings...', true);
                }
            }
        });
    } else {
        // Not the job listings page - setup minimal requirements
        console.log('Not a job listings page - setting up minimum requirements');
        
        // Setup search fields if available
        if (typeof setupSearchFields === 'function') {
            setupSearchFields();
        }
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
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
            
            // Clear ALL localStorage - important for security and to prevent data leakage between users
            localStorage.clear();
            
            // Restore only non-user-specific preferences
            Object.keys(preservedValues).forEach(key => {
                localStorage.setItem(key, preservedValues[key]);
            });
            
            console.log('Cleared all user data from localStorage during logout');
            console.log('Preserved only UI preferences:', Object.keys(preservedValues));
            
            // Redirect to login page
            window.location.href = '../index.html';
        });
    }
    
    // Set up a mutation observer to check for dynamically added job listings
    const jobListingsContainer = document.getElementById('job-listings');
    if (jobListingsContainer) {
        const observer = new MutationObserver(function(mutations) {
            console.log('Job listings changed - updating applied state');
            updateAppliedJobsUI();
        });
        
        observer.observe(jobListingsContainer, { childList: true, subtree: true });
    }
    
    // Set up listener for application-submitted events
    document.addEventListener('application-submitted', function(e) {
        if (e.detail && e.detail.jobId) {
            console.log('Caught application-submitted event for job:', e.detail.jobId);
            forceUpdateApplyButtons(e.detail.jobId);
        }
    });
});

// Function to set up the application form
function setupApplicationForm(form, initialJobId = null) {
    // If the form is not provided directly, try to find it
    if (!form) {
        form = document.getElementById('applicationForm') || document.getElementById('application-form');
        if (!form) {
            console.error("Application form not found");
            return;
        }
    }
    
    // Check if handler already attached
    if (form.getAttribute('data-handler-attached') === 'true') {
        console.log("Form handler already attached, skipping");
        return;
    }
    
    // Mark form as having handler attached
    form.setAttribute('data-handler-attached', 'true');
    console.log("Attaching submit handler to application form");
    
    // Get submit button
    const submitButton = form.querySelector('button[type="submit"]') || 
                        document.getElementById('submitApplication');
    if (!submitButton) {
        console.error("Submit button not found in form");
        return;
    }
    
    // Add submit event listener
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log("*** Application form submitted ***");
        
        // Prevent multiple submissions
        if (submitButton.disabled) {
            console.log("Form already submitting, ignoring");
            return;
        }
        
        // Update button state
        submitButton.disabled = true;
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = "Submitting...";
        
        try {
            // Get job ID from the form's hidden field
            const jobIdField = document.getElementById('listingId') || 
                              document.getElementById('jobIdField') || 
                              document.getElementById('job-listing-id');
            
            let jobId = null;
            
            if (jobIdField && jobIdField.value) {
                jobId = jobIdField.value;
                console.log("Found job ID in form field:", jobId);
            } else if (initialJobId) {
                jobId = initialJobId;
                console.log("Using initial job ID:", jobId);
            } else {
                // Try to extract from the modal title
                const jobTitleElement = document.getElementById('jobTitleInModal');
                if (jobTitleElement) {
                    // Look for a button with this job title
                    const buttons = document.querySelectorAll('button[data-title]');
                    for (let btn of buttons) {
                        if (btn.getAttribute('data-title') === jobTitleElement.textContent) {
                            jobId = btn.getAttribute('data-job-id');
                            console.log("Found job ID from title match:", jobId);
                            break;
                        }
                    }
                }
            }
            
            if (!jobId) {
                throw new Error("No job ID provided - cannot submit application");
            }
            
            console.log("Submitting application for job ID:", jobId);
            
            // Get other required fields
            const coverLetterField = form.querySelector('[name="cover_letter"]') || document.getElementById('coverLetter');
            const resumeFileField = form.querySelector('[name="resume_file"]') || document.getElementById('resumeFile');
            const startDateField = form.querySelector('[name="start_date"]') || document.getElementById('startDate');
            
            if (!coverLetterField || !coverLetterField.value.trim()) {
                throw new Error("Cover letter is required");
            }
            
            if (!resumeFileField || !resumeFileField.files || resumeFileField.files.length === 0) {
                throw new Error("Resume file is required");
            }
            
            if (!startDateField || !startDateField.value) {
                throw new Error("Start date is required");
            }
            
            // Get auth token
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                throw new Error("You must be logged in to apply for jobs");
            }
            
            // Create form data directly from the form
            const formData = new FormData(form);
            
            // Ensure job ID is included in form data if not already
            if (!formData.has('listingId') && !formData.has('job_id')) {
                formData.append('listingId', jobId);
            }
            
            // Get API base URL
            const apiBaseUrl = getApiUrl();
            console.log(`Using API URL: ${apiBaseUrl}/applications/${jobId}`);
            
            // Set a temporary application ID for immediate UI feedback
            const tempApplicationId = `temp_${Date.now()}`;
            
            // Immediately mark the job as applied for instant feedback
            // This will be verified when the server response comes back
            markJobAsApplied(jobId, tempApplicationId);
            
            // Mark locally for applied state
            saveLocallyStoredApplication(jobId);
            
            // Update UI immediately before submission completes
            updateAppliedJobsUI();
            forceUpdateApplyButtons(jobId);
            
            // Show applying indicator
            if (window.notification && typeof window.notification.info === 'function') {
                window.notification.info('Submitting your application...', true);
            }
            
            // Submit the application
            const response = await fetch(`${apiBaseUrl}/applications/${jobId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type with FormData - browser will set it with correct boundary
                },
                body: formData
            });
            
            // Debug response
            console.log("Response status:", response.status);
            
            let responseData;
            try {
                responseData = await response.json();
                console.log("Response data:", responseData);
            } catch (e) {
                console.warn("Could not parse response as JSON:", e);
                responseData = { success: response.ok };
            }
            
            // Process response
            if (response.ok || responseData.success) {
                console.log("Application submitted successfully!");
                
                // Set flag to indicate application was submitted successfully
                localStorage.setItem('lastApplicationSubmit', Date.now().toString());
                
                // Get the real application ID from response if available
                const applicationId = responseData.application_id || 
                                    responseData.applicationId || 
                                    tempApplicationId;
                
                // Mark job as applied with the correct application ID
                markJobAsApplied(jobId, applicationId);
                
                // Update all caches to ensure consistent state
                window.appliedJobCache = window.appliedJobCache || {};
                window.appliedJobCache[jobId] = true;
                
                // Update UI again with confirmed data
                forceUpdateApplyButtons(jobId);
                updateAppliedJobsUI();
                
                // Show success notification
                if (window.notification && typeof window.notification.success === 'function') {
                    window.notification.success('Application submitted successfully!', true);
                }
                
                // Show success alert
                alert("Application submitted successfully!");
                
                // Close the modal
                closeApplicationModal();
                
                // Trigger custom event for application submission
                document.dispatchEvent(new CustomEvent('application-submitted', { 
                    detail: { 
                        jobId: jobId,
                        applicationId: applicationId,
                        timestamp: Date.now()
                    }
                }));
                
                // Force page reload to ensure UI is updated
                window.location.reload();
            } else {
                // Revert the applied state since submission failed
                clearApplicationState(jobId);
                updateAppliedJobsUI();
                
                throw new Error(responseData.message || `Error submitting application (HTTP ${response.status})`);
            }
        } catch (error) {
            console.error("Error submitting application:", error);
            
            // Show error notification
            if (window.notification && typeof window.notification.error === 'function') {
                window.notification.error('Failed to submit application: ' + (error.message || "Unknown error"), true);
            }
            
            alert("Error: " + (error.message || "Failed to submit application"));
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText || "Submit Application";
        }
    });
}

// Add a special function to force-update all apply buttons for a given job
function forceUpdateApplyButtons(jobId) {
    if (!jobId) return;
    
    console.log(`FORCE-updating all buttons for job ${jobId}`);
    jobId = String(jobId);
    
    let totalUpdated = 0;
    
    // Make sure the job is marked as applied in localStorage first
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
    if (!appliedJobs.includes(jobId)) {
        appliedJobs.push(jobId);
        localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
        console.log(`Added ${jobId} to appliedJobs array`);
    }
    
    // Try multiple approaches to find and update buttons
    
    // Approach 1: Direct class + data attribute - most specific selector
    const directButtons = document.querySelectorAll(`.apply-btn[data-job-id="${jobId}"]`);
    if (directButtons.length > 0) {
        console.log(`Found ${directButtons.length} buttons with direct selection`);
        directButtons.forEach(btn => {
            updateButtonToApplied(btn);
            totalUpdated++;
        });
    }
    
    // Approach 2: Any button with the job ID attribute
    const allJobButtons = document.querySelectorAll(`button[data-job-id="${jobId}"]`);
    if (allJobButtons.length > 0) {
        console.log(`Found ${allJobButtons.length} buttons with job ID attribute`);
        allJobButtons.forEach(btn => {
            updateButtonToApplied(btn);
            totalUpdated++;
        });
    }
    
    // Approach 3: Look for job card and find buttons inside
    const jobCards = document.querySelectorAll(`.job-card[data-job-id="${jobId}"], [data-job-id="${jobId}"].job-card, div[data-job-id="${jobId}"]`);
    if (jobCards.length > 0) {
        console.log(`Found ${jobCards.length} job cards`);
        jobCards.forEach(card => {
            // Add applied class to card
            card.classList.add('job-applied');
            
            // Find buttons inside
            const cardButtons = card.querySelectorAll('button');
            cardButtons.forEach(btn => {
                updateButtonToApplied(btn);
                totalUpdated++;
            });
        });
    }
    
    // Approach 4: Check for buttons with data-listing-id (sometimes used instead of data-job-id)
    const listingIdButtons = document.querySelectorAll(`button[data-listing-id="${jobId}"]`);
    if (listingIdButtons.length > 0) {
        console.log(`Found ${listingIdButtons.length} buttons with listing ID attribute`);
        listingIdButtons.forEach(btn => {
            updateButtonToApplied(btn);
            totalUpdated++;
        });
    }
    
    // Approach 5: Check all buttons on the page (fallback)
    const allButtons = document.querySelectorAll('button.apply-btn, button.btn-primary');
    if (allButtons.length > 0) {
        console.log(`Checking all ${allButtons.length} potential apply buttons on page`);
        allButtons.forEach(btn => {
            const btnJobId = btn.getAttribute('data-job-id') || btn.getAttribute('data-listing-id');
            if (btnJobId === jobId) {
                console.log('Found matching button through all-buttons search');
                updateButtonToApplied(btn);
                totalUpdated++;
                
                // Also update parent job card if any
                const parentCard = btn.closest('.job-card') || btn.closest(`[data-job-id="${jobId}"]`);
                if (parentCard) {
                    parentCard.classList.add('job-applied');
                }
            }
        });
    }
    
    // If we still haven't found any buttons, try looking in specific containers
    if (totalUpdated === 0) {
        // Look for job listings container
        const jobListingsContainer = document.querySelector('.job-listings-container') || 
                                    document.querySelector('.job-list') || 
                                    document.querySelector('#job-listings');
        
        if (jobListingsContainer) {
            // Find all buttons inside
            const containerButtons = jobListingsContainer.querySelectorAll('button');
            containerButtons.forEach(btn => {
                // Check if this button could be for our job
                const card = btn.closest('.job-card') || btn.closest(`[data-job-id]`);
                if (card && card.getAttribute('data-job-id') === jobId) {
                    updateButtonToApplied(btn);
                    totalUpdated++;
                    card.classList.add('job-applied');
                }
            });
        }
    }
    
    console.log(`Total buttons updated: ${totalUpdated}`);
    
    // Helper function to update a button to applied state
    function updateButtonToApplied(button) {
        if (!button) return;
        if (button.textContent === 'Applied' && button.classList.contains('btn-success')) return;
        
        console.log('Updating button to Applied state:', button);
        button.textContent = 'Applied';
        button.disabled = true;
        button.classList.remove('btn-primary', 'btn-warning', 'applied-pending');
        button.classList.add('btn-success', 'applied');
        
        // Also check if there's a parent job card to mark
        const parentCard = button.closest('.job-card') || button.closest(`[data-job-id="${jobId}"]`);
        if (parentCard) {
            parentCard.classList.add('job-applied');
        }
    }
}

// Call this function immediately after updating localStorage in submission handlers
// At the end of each successful submission block, add:
// forceUpdateApplyButtons(listingId); // or jobListingId

// Function to display job listings
function displayJobListings(listings) {
    const jobListingsContainer = document.getElementById("job-listings");
    if (!jobListingsContainer) {
        console.error("Job listings container not found");
        return;
    }
    
    // Clear existing content
    jobListingsContainer.innerHTML = "";
    
    if (!listings || listings.length === 0) {
        jobListingsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No job listings found matching your search criteria</p>
            </div>
        `;
        return;
    }
    
    // Update result count if element exists
    const resultCount = document.getElementById("results-count");
    if (resultCount) {
        resultCount.textContent = listings.length;
    }
    
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    const hasAppliedCache = {};
    
    // Pre-load applied status for all jobs in batch
    listings.forEach(listing => {
        const jobId = listing.id || listing.listing_id;
        if (jobId) {
            hasAppliedCache[jobId] = hasAppliedToJob(jobId);
        }
    });
    
    // Display each job listing
    listings.forEach(listing => {
        const isPaid = listing.is_paid === true || listing.is_paid === "true" || listing.is_paid === 1;
        const jobId = listing.id || listing.listing_id;
        const jobTitle = listing.job_title || listing.title || "Job Position";
        
        // Get company name - check all possible fields
        let companyName = listing.company_name || listing.companyName || "Company";
        
        // If we have an employer ID but no company name, try to find it
        if (companyName === "Company" && (listing.employer_id || listing.employerId)) {
            // Try to get from employer profile cache
            try {
                const cachedProfileStr = localStorage.getItem('employerProfileCache');
                if (cachedProfileStr) {
                    const cachedProfile = JSON.parse(cachedProfileStr);
                    if (cachedProfile.employerData && cachedProfile.employerData.name) {
                        companyName = cachedProfile.employerData.name;
                    }
                }
            } catch (e) {
                console.error("Error getting company name from cache:", e);
            }
        }
        
        // Create job card element
        const card = document.createElement("div");
        card.className = "job-card";
        card.setAttribute("data-job-id", jobId);
        
        // Check if user has already applied (use cached result)
        const hasApplied = hasAppliedCache[jobId] || false;
        if (hasApplied) {
            card.classList.add("job-applied");
        }
        
        // Clean job title for HTML attributes
        const safeJobTitle = jobTitle
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Parse skills if available - optimize this operation
        let skills = [];
        try {
            if (listing.skills) {
                if (typeof listing.skills === 'string') {
                    // Only parse if it starts with [ which indicates JSON array
                    if (listing.skills.trim().startsWith('[')) {
                        skills = JSON.parse(listing.skills);
                    } else {
                        // Handle comma-separated string
                        skills = listing.skills.split(',').map(s => s.trim()).filter(Boolean);
                    }
                } else if (Array.isArray(listing.skills)) {
                    skills = listing.skills;
                }
            }
        } catch (e) {
            console.error("Error parsing skills:", e);
        }
        
        // Ensure skills is an array
        if (!Array.isArray(skills)) {
            skills = [];
        }
        
        // Create HTML content - use template strings for better performance
        card.innerHTML = `
            <h3 class="job-title">${safeJobTitle}</h3>
            <div class="company-name">${companyName}</div>
            <div class="job-details">
                <span><i class="fas fa-map-marker-alt"></i> ${listing.location || "Location not specified"}</span>
                <span><i class="fas fa-clock"></i> ${listing.duration || "Duration not specified"}</span>
            </div>
            <div class="compensation-badge ${isPaid ? 'paid' : 'unpaid'}">
                <i class="${isPaid ? 'fas fa-money-bill-wave' : 'fas fa-hand-holding-heart'}"></i>
                ${isPaid ? 'Paid' : 'Unpaid'} Internship
            </div>
            <div class="job-description">
                ${listing.description?.substring(0, 150) || "No description provided"}${listing.description?.length > 150 ? '...' : ''}
            </div>
            ${skills.length > 0 ? `
            <div class="skills-container">
                ${skills.slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                ${skills.length > 3 ? `<span class="skill-tag">+${skills.length - 3} more</span>` : ''}
            </div>
            ` : ''}
            <div class="card-actions">
                <button class="btn ${hasApplied ? 'btn-success applied' : 'btn-primary apply-btn'}" 
                        data-job-id="${jobId}" 
                        data-title="${safeJobTitle}"
                        ${hasApplied ? 'disabled' : ''}>
                    ${hasApplied ? 'Applied' : 'Apply Now'}
                </button>
            </div>
        `;
        
        // Add to fragment
        fragment.appendChild(card);
    });
    
    // Add all cards to container at once for better performance
    jobListingsContainer.appendChild(fragment);
    
    // Add click event listeners to apply buttons - do this after DOM insertion
    const applyButtons = jobListingsContainer.querySelectorAll('.apply-btn:not([disabled])');
    applyButtons.forEach(btn => {
        btn.addEventListener('click', openApplicationModal);
    });
    
    // Dispatch an event that job listings have loaded
    document.dispatchEvent(new CustomEvent('job-listings-loaded'));
}

// Function to open the application modal
function openApplicationModal(jobIdOrEvent, jobTitle) {
    // Check if we have a real job ID
    let jobId;
    if (typeof jobIdOrEvent === 'object' && jobIdOrEvent.currentTarget) {
        // It's an event
        jobId = jobIdOrEvent.currentTarget.getAttribute('data-job-id');
        jobTitle = jobIdOrEvent.currentTarget.getAttribute('data-title') || 'this position';
    } else {
        // It's a direct job ID
        jobId = jobIdOrEvent;
    }
    
    if (!jobId) {
        console.error("No job ID provided to openApplicationModal");
        alert("Error: Cannot identify the job. Please try again.");
        return;
    }
    
    console.log(`Opening application modal for job ID: ${jobId}, title: ${jobTitle}`);
    
    // First check if the user can apply
    const apiBaseUrl = getApiUrl();
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    // Show loading indicator
    if (window.notification && typeof window.notification.info === 'function') {
        window.notification.info('Checking application eligibility...', true);
    }
    
    // Check verification status before showing the modal
    fetch(`${apiBaseUrl}/applications/${jobId}/can-apply`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.canApply === false) {
            // Handle different reasons why user can't apply
            if (data.reason === 'rejected') {
                // Show a specific message for rejected interns
                alert('Your account verification has been rejected. You cannot apply for internships. Please contact an administrator for assistance.');
                return;
            } else if (data.reason === 'not_approved') {
                // Show a specific message for not approved interns
                const status = data.status || 'Pending';
                let statusMessage = '';
                
                if (status === 'Pending') {
                    statusMessage = 'Your account is currently pending approval.';
                } else if (status === 'Rejected') {
                    statusMessage = 'Your account verification was rejected.';
                }
                
                alert(`You cannot apply for jobs yet. ${statusMessage} Please contact an administrator for assistance.`);
                return;
            } else if (data.reason === 'already_applied') {
                alert("You have already applied for this position.");
                return;
            } else if (data.reason === 'job_not_found') {
                alert("This job listing is no longer active.");
                return;
            } else {
                // Generic message for other reasons
                alert(data.message || "You cannot apply for this position at this time.");
                return;
            }
        }
        
        // If we get here, user can apply - show the modal
        const modal = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');
        
        if (!modal || !modalContainer) {
            console.error("Modal elements not found");
            alert("Error: Application form could not be loaded.");
            return;
        }
        
        // Set the job title in the modal
        const jobTitleInModal = document.getElementById('jobTitleInModal');
        if (jobTitleInModal) {
            jobTitleInModal.textContent = jobTitle;
        }
        
        // Set the listing ID in the hidden field
        const listingIdField = document.getElementById('listingId');
        if (listingIdField) {
            listingIdField.value = jobId;
        }
        
        // Reset form if it exists
        const form = document.getElementById('applicationForm');
        if (form) {
            form.reset();
            
            // Make sure we have the submit handler attached
            setupApplicationForm(form, jobId);
        }
        
        // Show the modal
        modal.style.display = 'block';
        modalContainer.style.display = 'block';
        
        // Add close button functionality
        const closeBtn = document.getElementById('modalClose');
        if (closeBtn) {
            closeBtn.onclick = closeApplicationModal;
        }
        
        // Allow clicking outside the modal to close it
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeApplicationModal();
            }
        };
    })
    .catch(error => {
        console.error("Error checking application eligibility:", error);
        alert("Error: Could not verify your eligibility to apply. Please try again later.");
    });
}

// Function to close the application modal
function closeApplicationModal() {
    // Try different modal structures
    const modalOverlay = document.getElementById('modalOverlay') || document.getElementById('applyModal');
    const modalContainer = document.getElementById('modalContainer');
    
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
    
    if (modalContainer) {
        modalContainer.style.display = 'none';
    }
    
    // Reset form if it exists
    const applicationForm = document.getElementById('applicationForm') || 
                           document.getElementById('application-form');
    
    if (applicationForm) {
        applicationForm.reset();
    }
}

// Function to clear application state from localStorage for a specific job - OPTIMIZED FOR SPEED
function clearApplicationState(jobId) {
    if (!jobId) {
        console.error("No job ID provided to clearApplicationState");
        return false;
    }
    
    try {
        // All operations in a single try block for performance
        jobId = String(jobId);
        console.log(`Clearing application state for job ${jobId} - optimized`);
        
        // Use direct reassignment instead of filter operations for better performance
        const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
        const appliedJobsIndex = appliedJobs.indexOf(jobId);
        if (appliedJobsIndex !== -1) {
            appliedJobs.splice(appliedJobsIndex, 1);
            localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
        }
        
        const appliedJobsFromServer = JSON.parse(localStorage.getItem('appliedJobsFromServer') || '[]');
        const serverJobsIndex = appliedJobsFromServer.indexOf(jobId);
        if (serverJobsIndex !== -1) {
            appliedJobsFromServer.splice(serverJobsIndex, 1);
            localStorage.setItem('appliedJobsFromServer', JSON.stringify(appliedJobsFromServer));
        }
        
        // Remove from locallyStoredApplications if present
        const locallyStoredApps = JSON.parse(localStorage.getItem('locallyStoredApplications') || '[]');
        const localAppIndex = locallyStoredApps.indexOf(jobId);
        if (localAppIndex !== -1) {
            locallyStoredApps.splice(localAppIndex, 1);
            localStorage.setItem('locallyStoredApplications', JSON.stringify(locallyStoredApps));
        }
        
        // Remove application ID directly without parsing entire object
        const applicationIdMap = JSON.parse(localStorage.getItem('applicationIdMap') || '{}');
        if (applicationIdMap[jobId]) {
            delete applicationIdMap[jobId];
            localStorage.setItem('applicationIdMap', JSON.stringify(applicationIdMap));
        }
        
        // Track this job as withdrawn to prevent UI flicker
        const completedWithdrawals = JSON.parse(localStorage.getItem('completedWithdrawals') || '[]');
        if (!completedWithdrawals.includes(jobId)) {
            completedWithdrawals.push(jobId);
            localStorage.setItem('completedWithdrawals', JSON.stringify(completedWithdrawals));
        }
        
        // Add to withdrawnJobsMap for persistent tracking across sessions
        const withdrawnJobsMap = JSON.parse(localStorage.getItem('withdrawnJobsMap') || '{}');
        withdrawnJobsMap[jobId] = Date.now(); // timestamp when withdrawn
        localStorage.setItem('withdrawnJobsMap', JSON.stringify(withdrawnJobsMap));
        
        // Successfully completed
        return true;
    } catch (error) {
        console.error("Error clearing application state:", error);
        return false;
    }
}

// Function to mark a job as applied and update all relevant storage and UI
function markJobAsApplied(jobId, applicationId) {
    if (!jobId) {
        console.error("Cannot mark job as applied: No job ID provided");
        return false;
    }
    
    try {
        // Convert to string for consistent comparison
        jobId = String(jobId);
        console.log(`Marking job ${jobId} as applied${applicationId ? ' with application ID ' + applicationId : ''}`);
        
        // Update localStorage - Use this pattern for all arrays to avoid duplication
        function updateStorageArray(key, value) {
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            if (!arr.includes(value)) {
                arr.push(value);
                localStorage.setItem(key, JSON.stringify(arr));
                return true; // Added
            }
            return false; // Already exists
        }
        
        // Update all storage locations for maximum compatibility
        updateStorageArray('appliedJobs', jobId);
        updateStorageArray('appliedJobsFromServer', jobId);
        updateStorageArray('locallyStoredApplications', jobId);
        
        // Store application ID if provided
        if (applicationId) {
            const applicationIdMap = JSON.parse(localStorage.getItem('applicationIdMap') || '{}');
            applicationIdMap[jobId] = applicationId;
            localStorage.setItem('applicationIdMap', JSON.stringify(applicationIdMap));
        }
        
        // Update cached applications
        const cachedApplications = JSON.parse(localStorage.getItem('cachedApplications') || '[]');
        
        // Check if job already exists in cache
        const existingAppIndex = cachedApplications.findIndex(app => 
            (app.job_id && String(app.job_id) === jobId) || 
            (app.listing_id && String(app.listing_id) === jobId) ||
            (app.jobId && String(app.jobId) === jobId)
        );
        
        if (existingAppIndex === -1) {
            // Add a new application to the cache
            cachedApplications.push({
                job_id: jobId,
                listing_id: jobId,
                jobId: jobId,
                status: 'Pending',
                created_at: new Date().toISOString(),
                application_id: applicationId || null
            });
        } else {
            // Update existing application
            cachedApplications[existingAppIndex].status = 'Pending';
            if (applicationId) {
                cachedApplications[existingAppIndex].application_id = applicationId;
            }
        }
        
        // Save updated cache
        localStorage.setItem('cachedApplications', JSON.stringify(cachedApplications));
        
        // Remove from any withdrawal lists
        function removeFromStorageArray(key, value) {
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            const index = arr.indexOf(value);
            if (index !== -1) {
                arr.splice(index, 1);
                localStorage.setItem(key, JSON.stringify(arr));
                return true; // Removed
            }
            return false; // Not found
        }
        
        removeFromStorageArray('completedWithdrawals', jobId);
        
        // Remove from withdrawn jobs map
        const withdrawnJobsMap = JSON.parse(localStorage.getItem('withdrawnJobsMap') || '{}');
        if (withdrawnJobsMap[jobId]) {
            delete withdrawnJobsMap[jobId];
            localStorage.setItem('withdrawnJobsMap', JSON.stringify(withdrawnJobsMap));
        }
        
        // Update in-memory applications array if it exists
        if (typeof userApplications !== 'undefined') {
            if (!Array.isArray(userApplications)) {
                userApplications = [];
            }
            
            // Check if job exists in user applications
            const existingUserAppIndex = userApplications.findIndex(app => 
                (app.job_id && String(app.job_id) === jobId) || 
                (app.listing_id && String(app.listing_id) === jobId) ||
                (app.jobId && String(app.jobId) === jobId)
            );
            
            if (existingUserAppIndex === -1) {
                // Add to user applications
                userApplications.push({
                    job_id: jobId,
                    listing_id: jobId,
                    status: 'Pending',
                    created_at: new Date().toISOString(),
                    application_id: applicationId || null
                });
            } else {
                // Update existing application
                userApplications[existingUserAppIndex].status = 'Pending';
                if (applicationId) {
                    userApplications[existingUserAppIndex].application_id = applicationId;
                }
            }
        }
        
        // Update in-memory cache for hasAppliedToJob function
        if (window.appliedJobCache) {
            window.appliedJobCache[jobId] = true;
        }
        
        // Update all buttons for this job
        const applyButtons = document.querySelectorAll(`.apply-btn[data-job-id="${jobId}"], button[data-job-id="${jobId}"]`);
        applyButtons.forEach(button => {
            button.textContent = 'Applied';
            button.disabled = true;
            button.classList.remove('btn-primary', 'btn-warning', 'applied-pending');
            button.classList.add('btn-success', 'applied');
            
            // Also update job card if it exists
            const jobCard = button.closest('.job-card') || button.closest(`[data-job-id="${jobId}"]`);
            if (jobCard) {
                jobCard.classList.add('job-applied');
            }
        });
        
        // Dispatch event for other parts of the application to respond to
        document.dispatchEvent(new CustomEvent('application-submitted', {
            detail: {
                jobId: jobId,
                applicationId: applicationId,
                timestamp: Date.now()
            }
        }));
        
        return true;
    } catch (error) {
        console.error(`Error marking job ${jobId} as applied:`, error);
        return false;
    }
}

// Debounce function to prevent too many function calls in a short period
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Setup pagination controls
function setupPagination() {
    console.log('Setting up pagination controls');
    
    const paginationContainer = document.querySelector('.pagination-controls');
    if (!paginationContainer) {
        console.log('No pagination container found - skipping pagination setup');
        return;
    }
    
    // Create pagination controls if they don't exist
    if (paginationContainer.children.length === 0) {
        paginationContainer.innerHTML = `
            <button id="prevPage" class="pagination-btn">
                <i class="fas fa-chevron-left"></i> Previous
            </button>
            <span id="pageInfo">Page <span id="currentPageNum">1</span> of <span id="totalPages">1</span></span>
            <button id="nextPage" class="pagination-btn">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }
    
    // Set up event listeners for pagination buttons
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const currentPageEl = document.getElementById('currentPageNum');
    const totalPagesEl = document.getElementById('totalPages');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                fetchJobListings(currentPage);
                updatePaginationUI();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                fetchJobListings(currentPage);
                updatePaginationUI();
            }
        });
    }
    
    // Update pagination UI elements
    function updatePaginationUI() {
        if (currentPageEl) currentPageEl.textContent = currentPage;
        if (totalPagesEl) totalPagesEl.textContent = totalPages;
        
        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    // Initial UI update
    updatePaginationUI();
}

// Performance monitoring helper
const perfMonitor = {
    marks: {},
    
    // Start timing a process
    start: function(processName) {
        this.marks[processName] = {
            startTime: performance.now(),
            endTime: null
        };
    },
    
    // End timing a process
    end: function(processName) {
        if (this.marks[processName]) {
            this.marks[processName].endTime = performance.now();
            const duration = this.marks[processName].endTime - this.marks[processName].startTime;
            console.log(`Performance: ${processName} took ${duration.toFixed(2)}ms`);
            return duration;
        }
        return 0;
    },
    
    // Check if a process is taking too long
    checkTimeout: function(processName, timeoutMs = 5000) {
        if (this.marks[processName] && !this.marks[processName].endTime) {
            const currentDuration = performance.now() - this.marks[processName].startTime;
            if (currentDuration > timeoutMs) {
                console.warn(`Performance warning: ${processName} is taking longer than ${timeoutMs}ms`);
                return true;
            }
        }
        return false;
    }
};

// Optimize page initialization
function initJobListingsPage() {
    perfMonitor.start('pageInit');
    
    console.log('Initializing job listings page...');
    
    // Check for job listings container
    const jobListingsElement = document.getElementById('job-listings');
    if (!jobListingsElement) {
        console.warn('Job listings container not found - may not be the job listings page');
        return;
    }
    
    // Add sync button to the page
    const topNav = document.querySelector('.nav-links') || document.querySelector('nav') || document.body;
    const syncButton = document.createElement('button');
    syncButton.className = 'btn btn-secondary sync-button';
    syncButton.innerHTML = '<i class="fas fa-sync"></i> Sync Applications';
    syncButton.style.marginLeft = '10px';
    syncButton.addEventListener('click', function() {
        forceApplicationStateSyncWithServer().then(() => {
            if (window.notification && typeof window.notification.success === 'function') {
                window.notification.success('Application data synchronized with server', true);
            } else {
                alert('Application data synchronized with server');
            }
        });
    });
    
    // Try to add to the nav or fallback to another location
    if (topNav) {
        if (topNav.appendChild) {
            topNav.appendChild(syncButton);
        } else {
            // Fallback option if element doesn't support appendChild
            const searchContainer = document.querySelector('.search-bar') || document.querySelector('.filter-container');
            if (searchContainer) {
                searchContainer.parentNode.insertBefore(syncButton, searchContainer.nextSibling);
            }
        }
    }
    
    // Restore search state from localStorage
    restoreSearchState();
    
    // Initialize in parallel to avoid blocking UI
    Promise.all([
        // Promise to set up UI elements
        new Promise(resolve => {
            // Setup search fields 
            if (typeof setupSearchFields === 'function') {
                setupSearchFields();
            }
            
            // Setup pagination controls
            if (typeof setupPagination === 'function') {
                setupPagination();
            }
            
            resolve();
        }),
        
        // Promise to load cached data and start fetching
        new Promise(resolve => {
            // First check for cached job listings to show immediately
            const cachedListings = JSON.parse(localStorage.getItem('cachedJobListings') || '[]');
            const lastFetchTime = parseInt(localStorage.getItem('jobListingsLastFetched') || '0');
            const isCacheRecent = (Date.now() - lastFetchTime) < 60000; // 1 minute cache
            
            if (cachedListings.length > 0 && isCacheRecent) {
                // Show cached listings first for instant display
                console.log('Showing cached job listings while fetching fresh data');
                displayJobListings(cachedListings);
                
                // Update applied status
                updateAppliedJobsUI();
            }
            
            // Then start fetch for fresh data
            setTimeout(() => {
                // Use the stored search parameters for initial fetch
                const searchTitle = localStorage.getItem('lastSearchTitle') || '';
                const searchLocation = localStorage.getItem('lastSearchLocation') || '';
                const lastFilter = localStorage.getItem('lastSearchFilter') || 'all';
                
                let isPaid = null;
                if (lastFilter === 'paid') isPaid = true;
                else if (lastFilter === 'unpaid') isPaid = false;
                
                fetchJobListings(searchTitle, searchLocation, isPaid);
            }, 100);
            
            resolve();
        }),
        
        // Promise to fetch user applications in background
        new Promise(resolve => {
            setTimeout(() => {
                if (typeof fetchUserApplications === 'function') {
                    fetchUserApplications(false).then(resolve).catch(resolve);
                } else {
                    resolve();
                }
            }, 200);
        })
    ])
    .then(() => {
        perfMonitor.end('pageInit');
        console.log('Job listings page initialization complete');
    })
    .catch(error => {
        console.error('Error during page initialization:', error);
    });
}

// Restore search state from localStorage
function restoreSearchState() {
    try {
        // Restore search fields
        const lastSearchTitle = localStorage.getItem('lastSearchTitle');
        const lastSearchLocation = localStorage.getItem('lastSearchLocation');
        const lastSearchFilter = localStorage.getItem('lastSearchFilter') || 'all';
        
        // Restore text fields
        const searchTitleElem = document.getElementById("search-input") || 
                               document.getElementById("search-title") || 
                               document.getElementById("job-search-input");
        
        const searchLocationElem = document.getElementById("location-input") || 
                                  document.getElementById("search-location");
        
        if (searchTitleElem && lastSearchTitle) {
            searchTitleElem.value = lastSearchTitle;
        }
        
        if (searchLocationElem && lastSearchLocation) {
            searchLocationElem.value = lastSearchLocation;
        }
        
        // Restore radio button selection
        const allRadio = document.getElementById('all') || document.querySelector('input[name="filter"][value="all"]');
        const paidRadio = document.getElementById('paid') || document.querySelector('input[name="filter"][value="paid"]');
        const unpaidRadio = document.getElementById('unpaid') || document.querySelector('input[name="filter"][value="unpaid"]');
        
        // Reset all radios first
        if (allRadio) allRadio.checked = false;
        if (paidRadio) paidRadio.checked = false;
        if (unpaidRadio) unpaidRadio.checked = false;
        
        // Then check the appropriate one
        if (lastSearchFilter === 'paid' && paidRadio) {
            paidRadio.checked = true;
        } else if (lastSearchFilter === 'unpaid' && unpaidRadio) {
            unpaidRadio.checked = true;
        } else if (allRadio) {
            allRadio.checked = true;
        }
        
        console.log(`Restored search state: title="${lastSearchTitle}", location="${lastSearchLocation}", filter=${lastSearchFilter}`);
    } catch (e) {
        console.warn('Error restoring search state:', e);
    }
}

// Add a refresh function
function refreshJobListings() {
    // Clear caches
    window.appliedJobCache = {};
    window.appliedJobCacheTimestamp = Date.now();
    
    // Show loading state
    const jobListingsContainer = document.getElementById('job-listings');
    if (jobListingsContainer) {
        jobListingsContainer.innerHTML = '<div class="loading-indicator">Refreshing job listings...</div>';
    }
    
    // Fetch fresh data
    fetchJobListings();
    
    // Fetch user applications
    if (typeof fetchUserApplications === 'function') {
        fetchUserApplications(true);
    }
}

// Function to mark a job as withdrawn and update UI - OPTIMIZED FOR SPEED
function markJobAsWithdrawn(jobId) {
    if (!jobId) {
        console.error("No job ID provided to markJobAsWithdrawn");
        return false;
    }
    
    try {
        jobId = String(jobId);
        console.log(`Marking job ${jobId} as withdrawn - optimized`);
        
        // Clear application state from localStorage - without touching cached applications yet for performance
        clearApplicationState(jobId);
        
        // Update UI elements first so the user sees immediate feedback
        const updateButtons = () => {
            // Direct selector for buttons with matching job ID - more specific for performance
            const buttons = document.querySelectorAll(`button[data-job-id="${jobId}"], button[data-listing-id="${jobId}"]`);
            buttons.forEach(btn => {
                btn.textContent = 'Apply Now';
                btn.disabled = false;
                btn.classList.remove('btn-success', 'btn-warning', 'applied', 'applied-pending');
                btn.classList.add('btn-primary');
            });
            
            // Direct selector for cards with matching job ID
            const cards = document.querySelectorAll(`[data-job-id="${jobId}"], [data-listing-id="${jobId}"]`);
            cards.forEach(card => {
                card.classList.remove('job-applied');
            });
        };
        
        // Run button updates immediately
        updateButtons();
        
        // Clear in-memory cache and hasAppliedToJob cache for this job
        if (window.appliedJobCache) {
            window.appliedJobCache[jobId] = false;
        }
        if (window.hasAppliedCache) {
            window.hasAppliedCache[jobId] = false;
        }
        
        // Remove jobId from all localStorage arrays/maps that track applied jobs
        const keysToRemove = ['appliedJobs', 'appliedJobsFromServer', 'locallyStoredApplications'];
        keysToRemove.forEach(key => {
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            const idx = arr.indexOf(jobId);
            if (idx !== -1) {
                arr.splice(idx, 1);
                localStorage.setItem(key, JSON.stringify(arr));
            }
        });
        // Remove from withdrawnJobsMap if present
        const withdrawnJobsMap = JSON.parse(localStorage.getItem('withdrawnJobsMap') || '{}');
        if (withdrawnJobsMap[jobId]) {
            delete withdrawnJobsMap[jobId];
            localStorage.setItem('withdrawnJobsMap', JSON.stringify(withdrawnJobsMap));
        }
        // Remove from completedWithdrawals
        const completedWithdrawals = JSON.parse(localStorage.getItem('completedWithdrawals') || '[]');
        const idx = completedWithdrawals.indexOf(jobId);
        if (idx !== -1) {
            completedWithdrawals.splice(idx, 1);
            localStorage.setItem('completedWithdrawals', JSON.stringify(completedWithdrawals));
        }
        
        // --- Remove from cachedApplications (handle both array and {applications: []} object) ---
        let cachedApplications = localStorage.getItem('cachedApplications');
        if (cachedApplications) {
            try {
                let parsed = JSON.parse(cachedApplications);
                if (Array.isArray(parsed)) {
                    parsed = parsed.filter(app => {
                        return !(
                            (app.job_id && String(app.job_id) === jobId) || 
                            (app.listing_id && String(app.listing_id) === jobId) ||
                            (app.jobId && String(app.jobId) === jobId)
                        );
                    });
                    localStorage.setItem('cachedApplications', JSON.stringify(parsed));
                } else if (parsed && Array.isArray(parsed.applications)) {
                    parsed.applications = parsed.applications.filter(app => {
                        return !(
                            (app.job_id && String(app.job_id) === jobId) || 
                            (app.listing_id && String(app.listing_id) === jobId) ||
                            (app.jobId && String(app.jobId) === jobId)
                        );
                    });
                    localStorage.setItem('cachedApplications', JSON.stringify(parsed));
                }
            } catch (e) {
                console.warn('Error updating cachedApplications after withdrawal:', e);
            }
        }
        // ---
        
        // --- Ensure UI is fully refreshed ---
        // Force refresh of user applications and job listings to ensure all buttons update
        fetchUserApplications(true).then(() => {
            if (typeof fetchJobListings === 'function') {
                fetchJobListings();
            }
        });
        // ---
        
        return true;
    } catch (error) {
        console.error("Error marking job as withdrawn:", error);
        return false;
    }
}

// When document is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Document loaded - initializing job listings page');
    
    // Initialize API URL
    initApiUrl();
    
    // IMPORTANT: Force sync with server first
    await forceApplicationStateSyncWithServer();
    
    // Check intern verification status and show appropriate notification
    await checkVerificationStatus();
    
    // Check if this is the job listings page
    if (document.querySelector('.job-listings-container') || 
        document.getElementById('job-listings') ||
        document.querySelector('.job-cards')) {
        console.log('This is a job listings page - setting up functionality');
        
        // Set up full page functionality
        initJobListingsPage();
        
        // Set up search fields
        setupSearchFields();
        
        // Set up pulling to refresh
        let touchStartY = 0;
        document.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', function(e) {
            const touchEndY = e.changedTouches[0].clientY;
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            
            // If user has pulled down at least 100px from top
            if (scrollTop === 0 && touchEndY - touchStartY > 100) {
                refreshJobListings();
                
                // Show refreshing indicator
                if (window.notification && typeof window.notification.info === 'function') {
                    window.notification.info('Refreshing job listings...', true);
                }
            }
        });
    } else {
        // Not the job listings page - setup minimal requirements
        console.log('Not a job listings page - setting up minimum requirements');
        
        // Setup search fields if available
        if (typeof setupSearchFields === 'function') {
            setupSearchFields();
        }
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
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
            
            // Clear ALL localStorage - important for security and to prevent data leakage between users
            localStorage.clear();
            
            // Restore only non-user-specific preferences
            Object.keys(preservedValues).forEach(key => {
                localStorage.setItem(key, preservedValues[key]);
            });
            
            console.log('Cleared all user data from localStorage during logout');
            console.log('Preserved only UI preferences:', Object.keys(preservedValues));
            
            // Redirect to login page
            window.location.href = '../index.html';
        });
    }
    
    // Set up a mutation observer to check for dynamically added job listings
    const jobListingsContainer = document.getElementById('job-listings');
    if (jobListingsContainer) {
        const observer = new MutationObserver(function(mutations) {
            console.log('Job listings changed - updating applied state');
            updateAppliedJobsUI();
        });
        
        observer.observe(jobListingsContainer, { childList: true, subtree: true });
    }
    
    // Set up listener for application-submitted events
    document.addEventListener('application-submitted', function(e) {
        if (e.detail && e.detail.jobId) {
            console.log('Caught application-submitted event for job:', e.detail.jobId);
            forceUpdateApplyButtons(e.detail.jobId);
        }
    });
});

// Check verification status of the current intern
async function checkVerificationStatus() {
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            console.log('No authentication token found, cannot check verification status');
            return;
        }
        
        const apiBaseUrl = getApiUrl();
        
        // Make a request to get intern's verification status
        // Using a generic job ID (1) just to utilize the existing endpoint
        const response = await fetch(`${apiBaseUrl}/applications/1/can-apply`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('Verification status check response:', data);
        
        // Add banner based on verification status
        if (data.reason === 'rejected') {
            // Intern account is rejected
            addStatusBanner('Rejected');
        } else if (data.reason === 'not_approved') {
            // Intern account is not approved/pending
            const status = data.status || 'Pending';
            addStatusBanner(status);
        } else if (data.reason === 'intern_not_found') {
            // No intern profile
            addStatusBanner('profile_missing');
        }
    } catch (error) {
        console.error('Error checking verification status:', error);
    }
}

// Add status banner to the page
function addStatusBanner(status) {
    // Remove any existing banner
    const existingBanner = document.querySelector('.status-banner');
    if (existingBanner) {
        existingBanner.remove();
    }
    
    let bannerClass = '';
    let bannerText = '';
    
    if (status === 'Pending') {
        bannerClass = 'pending';
        bannerText = 'Your account is pending verification. You cannot apply for internships until your account is approved.';
    } else if (status === 'Rejected') {
        bannerClass = 'rejected';
        bannerText = 'Your account verification has been rejected. Please contact an administrator for assistance.';
    } else if (status === 'profile_missing') {
        bannerClass = 'missing';
        bannerText = 'Your intern profile is incomplete. Please complete your profile before applying for internships.';
    }
    
    if (bannerText) {
        const banner = document.createElement('div');
        banner.className = `status-banner ${bannerClass}`;
        banner.innerHTML = `<p>${bannerText}</p>`;
        
        // Insert at the top of the main content
        const mainContent = document.querySelector('main') || document.body;
        mainContent.insertBefore(banner, mainContent.firstChild);
        
        // Add some basic styling if not defined in CSS
        banner.style.padding = '10px 15px';
        banner.style.margin = '0 0 20px 0';
        banner.style.borderRadius = '4px';
        
        if (bannerClass === 'pending') {
            banner.style.backgroundColor = '#fff3cd';
            banner.style.color = '#856404';
            banner.style.border = '1px solid #ffeeba';
        } else if (bannerClass === 'rejected') {
            banner.style.backgroundColor = '#f8d7da';
            banner.style.color = '#721c24';
            banner.style.border = '1px solid #f5c6cb';
        } else if (bannerClass === 'missing') {
            banner.style.backgroundColor = '#d1ecf1';
            banner.style.color = '#0c5460';
            banner.style.border = '1px solid #bee5eb';
        }
    }
}

// Function to force a complete refresh of application data
function forceApplicationStateSyncWithServer() {
    console.log("Forcing application state sync with server");
    
    // Clear all application-related data from localStorage
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
    
    // Clear each key
    applicationKeys.forEach(key => {
        console.log(`Clearing ${key} from localStorage`);
        localStorage.removeItem(key);
    });
    
    // Also clear in-memory caches
    window.appliedJobCache = {};
    window.hasAppliedCache = {};
    
    // Force refresh from server
    console.log("Fetching fresh application data from server");
    return fetchUserApplications(true)
        .then(() => {
            console.log("Refreshing job listings UI");
            updateAppliedJobsUI();
            if (typeof fetchJobListings === 'function') {
                fetchJobListings();
            }
        })
        .catch(error => {
            console.error("Error syncing application state:", error);
        });
}
