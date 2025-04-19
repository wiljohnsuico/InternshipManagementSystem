// Application tracking script

// Constants
const API_BASE_URL = 'http://localhost:5004/api';

// Function to get API URL from meta tag or use default
function getApiUrl() {
    try {
        const metaTag = document.querySelector('meta[name="api-url"]');
        if (metaTag && metaTag.content && metaTag.content.trim() !== '') {
            return metaTag.content.endsWith('/') ? metaTag.content.slice(0, -1) : metaTag.content;
        }
    } catch (e) {
        console.warn("Error reading API URL from meta tag:", e);
    }
    return API_BASE_URL; // Fall back to default
}

// DOM Elements
const applicationListContainer = document.getElementById("application-list");
const applicationModal = document.getElementById("applicationModal");
const applicationDetailsContainer = document.getElementById("application-details");
const confirmModal = document.getElementById("confirmModal");
const statusNotification = document.getElementById("status-notification");

// Helper function to hide the cancel confirmation modal
function hideCancelConfirmation() {
    try {
        // Try to find the modal by ID first
        const modal = document.getElementById('cancel-confirmation-modal');
        if (modal) {
            // Use Bootstrap modal hide if available
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                    console.log("Modal hidden using Bootstrap modal instance");
                    return;
                }
            }
            
            // Fallback: Try to use jQuery if available
            if (typeof $ !== 'undefined') {
                try {
                    $(modal).modal('hide');
                    console.log("Modal hidden using jQuery");
                    return;
                } catch (e) {
                    console.warn("jQuery modal hide failed:", e);
                }
            }
            
            // Direct DOM manipulation as last resort
            modal.style.display = 'none';
            modal.classList.remove('show');
            
            // Remove backdrop if it exists
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            
            // Remove modal-open class from body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            console.log("Modal hidden using direct DOM manipulation");
        } else {
            console.warn("Cancel confirmation modal not found by ID");
            
            // Try to find any open modal
            const openModals = document.querySelectorAll('.modal.show');
            if (openModals.length > 0) {
                openModals.forEach(m => {
                    m.style.display = 'none';
                    m.classList.remove('show');
                });
                
                // Remove backdrop
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
                
                // Remove modal-open class from body
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                
                console.log("Found and hidden open modals");
            }
        }
    } catch (error) {
        console.error("Error hiding cancel confirmation modal:", error);
    }
}

// Confirmation buttons
const modalCloseBtns = document.querySelectorAll(".close");
const confirmCancelBtn = document.querySelector(".confirm-cancel");
const confirmDeleteBtn = document.querySelector(".confirm-delete");

// Log DOM elements for debugging
console.log("DOM elements initialization:", {
    applicationListContainer: !!applicationListContainer,
    applicationModal: !!applicationModal,
    applicationDetailsContainer: !!applicationDetailsContainer,
    confirmModal: !!confirmModal,
    statusNotification: !!statusNotification,
    modalCloseBtns: modalCloseBtns ? modalCloseBtns.length : 0,
    confirmCancelBtn: !!confirmCancelBtn,
    confirmDeleteBtn: !!confirmDeleteBtn
});

// Notification functions
function showNotification(message, type = 'info', duration = 5000) {
    if (!statusNotification) return;
    
    // Set notification content
    const messageElem = statusNotification.querySelector('.notification-message');
    if (messageElem) messageElem.textContent = message;
    
    // Set notification type
    statusNotification.className = `status-notification ${type}`;
    
    // Show notification
    statusNotification.style.display = 'flex';
    
    // Hide after duration
    setTimeout(() => {
        statusNotification.style.display = 'none';
    }, duration);
}

function showSuccessNotification(message, duration = 3000) {
    showNotification(message, 'success', duration);
}

function showErrorNotification(message, duration = 5000) {
    showNotification(message, 'error', duration);
}

function showInfoNotification(message, duration = 3000) {
    showNotification(message, 'info', duration);
}

// State variables
let currentApplicationId = null;
let currentJobId = null;
let isWithdrawalActive = false;

// Function to initialize withdrawal tracking
function initializeWithdrawalTracking() {
    try {
        // Load from localStorage
        withdrawnApplicationIds = JSON.parse(localStorage.getItem('withdrawnApplicationIds') || '[]');
        applicationBlacklist = JSON.parse(localStorage.getItem('applicationBlacklist') || '[]');
        
        console.log(`Withdrawal tracking initialized with ${withdrawnApplicationIds.length} withdrawn IDs and ${applicationBlacklist.length} blacklisted IDs`);
    } catch (e) {
        console.error("Error initializing withdrawal tracking:", e);
        withdrawnApplicationIds = [];
        applicationBlacklist = [];
    }
}

// Directly override the standard fetch to filter out withdrawn applications
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    try {
        // Call the original fetch
        const response = await originalFetch.apply(this, args);
        
        // Clone the response so we can modify it
        const clone = response.clone();
        
        // Check if this is a request for applications
        const url = args[0].toString();
        if (url.includes('applications') && !url.includes('withdraw')) {
            // Try to parse the JSON response
            const data = await clone.json();
            
            // If this contains applications, filter out withdrawn ones
            if (data && data.applications && Array.isArray(data.applications)) {
                // Load the latest blacklist
                try {
                    applicationBlacklist = JSON.parse(localStorage.getItem('applicationBlacklist') || '[]');
                    withdrawnApplicationIds = JSON.parse(localStorage.getItem('withdrawnApplicationIds') || '[]');
                } catch (e) {
                    console.error("Error loading blacklist:", e);
                }
                
                // Filter out applications that are in our blacklist
                const originalCount = data.applications.length;
                data.applications = data.applications.filter(app => {
                    // Check application ID
                    const appId = app.id || app.application_id;
                    
                    // Skip if it's in our blacklist
                    if (applicationBlacklist.includes(appId) || withdrawnApplicationIds.includes(appId)) {
                        return false;
                    }
                    
                    // Skip if it's withdrawn
                    if (app.status && app.status.toLowerCase() === 'withdrawn') {
                        return false;
                    }
                    
                    return true;
                });
                
                // Update count if it exists
                if (data.count !== undefined) {
                    data.count = data.applications.length;
                }
                
                if (originalCount !== data.applications.length) {
                    console.log(`Filtered out ${originalCount - data.applications.length} withdrawn applications from response`);
                }
                
                // Create a modified response with the filtered data
                const modifiedResponse = new Response(JSON.stringify(data), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
                
                return modifiedResponse;
            }
        }
        
        // Return the original response for other requests
        return response;
    } catch (e) {
        console.error("Error in fetch override:", e);
        // Fall back to original fetch in case of error
        return originalFetch.apply(this, args);
    }
};

// Function to set up event listeners for the application page
function setupEventListeners() {
    // Set up close buttons for modals
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = "none";
        });
    });
    
    // Close modals when clicking outside the modal
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    });
    
    // Set up cancel button in confirm modal
    const confirmCancelBtn = document.querySelector('.confirm-cancel');
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = "none";
        });
    }
    
    // Add event delegation for cancel buttons
    if (applicationListContainer) {
        applicationListContainer.addEventListener('click', function(e) {
            // Handle cancel button clicks
            if (e.target.classList.contains('cancel-btn')) {
                e.preventDefault();
                
                // Extract application ID and job ID from button data attributes
                const appId = e.target.getAttribute("data-id");
                const jobId = e.target.getAttribute("data-job-id");
                
                console.log(`Cancel button clicked for application ${appId} (job ID: ${jobId})`);
                
                showCancelConfirmation(appId);
                
                // Store job ID in the currentJobId for later use
                if (jobId) {
                    currentJobId = jobId;
                    console.log(`Set currentJobId to: ${currentJobId}`);
                }
            }
            
            // Handle view details button clicks
            if (e.target.classList.contains('view-details-btn')) {
                e.preventDefault();
                const appId = e.target.getAttribute("data-id");
                viewApplicationDetails(appId);
            }
        });
    }
}

// Load user applications
async function loadApplications(forceRefresh = false) {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "../index.html";
            return;
        }
        
        // Display loading state
        if (applicationListContainer) {
            applicationListContainer.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading your applications...</p>
                </div>
            `;
        }
        
        showInfoNotification("Loading your applications...");
        
        // Always fetch fresh data if forcing refresh
        if (forceRefresh) {
            try {
                console.log("Fetching applications from server...");
                // Fetch applications from API with proper error handling
                const fetchUrl = `${API_BASE_URL}/applications/my-applications`;
                console.log(`Fetching from: ${fetchUrl}`);
                
                const response = await fetch(fetchUrl, {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    // For development, if on localhost
                    mode: 'cors',
                    credentials: 'same-origin'
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch applications: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Check if we have applications to display
                if (data.success && data.applications && data.applications.length > 0) {
                    console.log(`Received ${data.applications.length} applications from server`);
                    
                    // Normalize application status in each application
                    const normalizedApplications = data.applications.map(app => {
                        // Normalize application status
                        if (!app.status || app.status === "") {
                            app.status = "Pending";
                        } else if (typeof app.status === 'string') {
                            // Ensure first letter is capitalized for display
                            app.status = app.status.charAt(0).toUpperCase() + app.status.slice(1).toLowerCase();
                        }
                        return app;
                    });
                    
                    // Cache applications for future use
                    localStorage.setItem('cachedApplications', JSON.stringify(normalizedApplications));
                    
                    // Display applications
                    displayApplications(normalizedApplications);
                    showSuccessNotification(`Loaded ${normalizedApplications.length} applications successfully.`);
                    return;
                } else {
                    console.log("No applications found on server");
                    showEmptyState();
                    return;
                }
            } catch (fetchError) {
                console.error("Error fetching applications from server:", fetchError);
                // Try loading from cache as fallback
                loadFromCache();
            }
        } else {
            // Try to load from cache first
            loadFromCache();
        }
    } catch (error) {
        console.error("Error in loadApplications:", error);
        showErrorState(error);
    }
    
    // Helper function to load from cache
    function loadFromCache() {
        console.log("Attempting to load applications from cache");
        const cachedApps = localStorage.getItem('cachedApplications');
        
        if (cachedApps) {
            try {
                const parsedApps = JSON.parse(cachedApps);
                
                if (parsedApps.length > 0) {
                    console.log(`Loaded ${parsedApps.length} applications from cache`);
                    displayApplications(parsedApps);
                    showInfoNotification("Showing cached applications. Pull to refresh for latest data.");
                } else {
                    console.log("No applications in cache");
                    showEmptyState();
                }
            } catch (e) {
                console.error("Error parsing cached applications:", e);
                showEmptyState();
            }
        } else {
            console.log("No application cache found");
            showEmptyState();
        }
    }
    
    // Helper function to show empty state
    function showEmptyState() {
        if (applicationListContainer) {
            applicationListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No Applications Found</h3>
                    <p>You haven't applied for any internships yet.</p>
                    <a href="jobListings.html" class="btn btn-primary">Browse Opportunities</a>
                </div>
            `;
        }
        
        showInfoNotification("You haven't applied to any positions yet.");
    }
    
    // Helper function to show error state
    function showErrorState(error) {
        if (applicationListContainer) {
            applicationListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Applications</h3>
                    <p>${error.message || "An error occurred while loading your applications."}</p>
                    <button class="btn btn-primary" onclick="loadApplications(true)">Try Again</button>
                </div>
            `;
        }
        
        showErrorNotification(`Failed to load applications: ${error.message}`);
    }
}

// Display applications in the list
function displayApplications(applications) {
    if (!applicationListContainer) return;
    
    // Sort applications by date (newest first)
    applications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (applications.length === 0) {
        applicationListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No Applications Found</h3>
                <p>You haven't applied for any internships yet.</p>
                <a href="jobListings.html" class="btn btn-primary">Browse Opportunities</a>
            </div>
        `;
        return;
    }
    
    let applicationsHTML = '';
    
    // Generate HTML for each application as a card
    applications.forEach(application => {
        // Get application and job IDs
        const applicationId = application.id || application.application_id;
        const jobId = application.job_id || application.listing_id;
        
        // Normalize status for consistency
        const normalizedStatus = normalizeStatus(application.status);
        
        // Check status
        const isPending = normalizedStatus === "Pending";
        const isWithdrawn = normalizedStatus === "Withdrawn";
        
        // Debug log
        console.log(`Application ${applicationId} status: "${application.status}" → normalized: "${normalizedStatus}"`);
        
        applicationsHTML += `
            <div class="application-card" data-application-id="${applicationId}" data-job-id="${jobId}">
                <div class="card-header">
                    <h3 class="job-title" data-job-id="${jobId}">${application.job_title || "Unknown Position"}</h3>
                    <div class="company-info">
                        <i class="fas fa-building"></i>
                        <span>${application.company_name || "Unknown Company"}</span>
                    </div>
                    <div class="location-info">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${application.location || "Location not specified"}</span>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="date-applied">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Applied on ${formatDate(application.created_at)}</span>
                    </div>
                    
                    <span class="application-status status-${getStatusClass(normalizedStatus)}">
                        ${normalizedStatus}
                    </span>
                </div>
                
                <div class="card-actions">
                    <button class="btn btn-primary view-details-btn" data-id="${applicationId}" data-job-id="${jobId}">View Details</button>
                    ${isPending ? 
                        `<button class="btn btn-outline cancel-btn" data-id="${applicationId}" data-job-id="${jobId}">Cancel</button>` : 
                        (isWithdrawn ? 
                            `<button class="btn btn-outline" disabled>Canceled</button>` :
                            `<button class="btn btn-outline" disabled>Cannot Cancel</button>`
                        )
                    }
                </div>
            </div>
        `;
    });
    
    // Update the container
    applicationListContainer.innerHTML = applicationsHTML;
    
    // Add event listeners to buttons
    document.querySelectorAll(".view-details-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const appId = this.getAttribute("data-id");
            viewApplicationDetails(appId);
        });
    });
    
    document.querySelectorAll(".cancel-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            const appId = this.getAttribute("data-id");
            const jobId = this.getAttribute("data-job-id");
            showCancelConfirmation(appId);
            
            // Store job ID in the currentApplication object for later use
            if (jobId) {
                if (!window.currentApplication) window.currentApplication = {};
                window.currentApplication.jobId = jobId;
            }
        });
    });
}

// Show application details modal
async function viewApplicationDetails(applicationId) {
    if (!applicationId) {
        showErrorNotification("Invalid application ID");
        return;
    }
    
    try {
        // Display loading state
        if (applicationDetailsContainer) {
            applicationDetailsContainer.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading application details...</p>
                </div>
            `;
        }
        
        // Display the modal with loading state
        applicationModal.style.display = "block";
        
        showInfoNotification("Loading application details...");
        
        // Fetch application details
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch application details: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.application) {
            // Display application details in modal
            renderApplicationDetails(data.application);
        } else {
            throw new Error(data.message || "Failed to retrieve application details");
        }
    } catch (error) {
        console.error("Error viewing application details:", error);
        
        if (applicationDetailsContainer) {
            applicationDetailsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Details</h3>
                    <p>${error.message || "An error occurred while loading the application details."}</p>
                </div>
            `;
        }
        
        showErrorNotification(`Failed to load application details: ${error.message}`);
    }
}

// Show cancellation confirmation
function showCancelConfirmation(applicationId) {
    // Store the application ID for the confirmation button to use
    currentApplicationId = applicationId;
    
    console.log(`Setting up cancel confirmation for application ${applicationId}`);
    
    // Get job ID for this application if possible - first check the data attributes
    const cancelBtn = document.querySelector(`.cancel-btn[data-id="${applicationId}"]`);
    if (cancelBtn) {
        const jobId = cancelBtn.getAttribute('data-job-id');
        if (jobId) {
            currentJobId = jobId;
            console.log(`Found job ID ${jobId} from cancel button`);
        }
    }
    
    if (!currentJobId) {
        const applicationCard = document.querySelector(`.application-card[data-application-id="${applicationId}"]`);
        if (applicationCard) {
            const jobId = applicationCard.getAttribute('data-job-id');
            if (jobId) {
                currentJobId = jobId;
                console.log(`Found job ID ${jobId} from application card`);
            }
        }
    }
    
    // If we still don't have the job ID, try to get it asynchronously
    if (!currentJobId) {
        getJobIdFromApplication(applicationId).then(jobId => {
            if (jobId) {
                currentJobId = jobId;
                console.log(`Associated job ID: ${jobId}`);
            } else {
                console.warn('Could not determine job ID for this application');
            }
        }).catch(error => {
            console.error('Error getting job ID:', error);
        });
    }
    
    // Update modal text if available
    const confirmationText = document.getElementById('confirmationText');
    if (confirmationText) {
        confirmationText.textContent = 'Are you sure you want to cancel this application? This action cannot be undone.';
    }
    
    const confirmButton = document.getElementById('confirmDeleteBtn');
    if (confirmButton) {
        confirmButton.textContent = 'Cancel Application';
        confirmButton.classList.remove('disabled');
        confirmButton.removeAttribute('disabled');
    }
    
    // Try multiple approaches to display the modal
    const cancelConfirmationModal = document.getElementById('cancel-confirmation-modal') || 
                                  document.getElementById('confirmModal') || 
                                  document.querySelector('.confirm-modal');
    
    console.log("Modal elements found:", {
        confirmationText: confirmationText ? confirmationText.textContent : 'element not found',
        confirmationModal: cancelConfirmationModal ? 'found' : 'not found',
        modalId: cancelConfirmationModal ? cancelConfirmationModal.id : 'unknown',
        confirmDeleteBtn: !!confirmDeleteBtn,
        confirmCancelBtn: !!confirmCancelBtn
    });
    
    // Show the confirmation modal - try several methods
    if (cancelConfirmationModal) {
        // Try Bootstrap 5 method first
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            try {
                const bsModal = new bootstrap.Modal(cancelConfirmationModal);
                bsModal.show();
                console.log("Showing modal with Bootstrap 5");
                return;
            } catch (e) {
                console.warn("Error using Bootstrap 5 modal:", e);
            }
        }
        
        // Try jQuery next
        if (typeof $ !== 'undefined') {
            try {
                $(cancelConfirmationModal).modal('show');
                console.log("Showing modal with jQuery");
                return;
            } catch (e) {
                console.warn("Error using jQuery modal:", e);
            }
        }
        
        // Fall back to direct DOM manipulation
        cancelConfirmationModal.style.display = "block";
        cancelConfirmationModal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Add backdrop if it doesn't exist
        if (!document.querySelector('.modal-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        }
        
        console.log("Showing modal with direct DOM manipulation");
    } else {
        console.error("Could not find confirmation modal element");
        alert("Are you sure you want to cancel this application? Click OK to confirm cancellation.");
        cancelApplication(applicationId);
    }
}

// Helper function to get job ID from application
async function getJobIdFromApplication(applicationId) {
    try {
        const token = localStorage.getItem("token");
        if (!token) return null;
        
        // First check if we can find it in DOM or cached applications
        // Check in the DOM first (faster than API call)
        const cancelBtn = document.querySelector(`.cancel-btn[data-id="${applicationId}"]`);
        if (cancelBtn) {
            const jobId = cancelBtn.getAttribute('data-job-id');
            if (jobId) return jobId;
        }
        
        const applicationCard = document.querySelector(`.application-card[data-application-id="${applicationId}"]`);
        if (applicationCard) {
            const jobId = applicationCard.getAttribute('data-job-id');
            if (jobId) return jobId;
        }
        
        // Check in cached applications
        try {
            const cachedApps = JSON.parse(localStorage.getItem('cachedApplications') || '[]');
            const matchingApp = cachedApps.find(app => 
                app.id === applicationId || app.application_id === applicationId
            );
            if (matchingApp) {
                return matchingApp.job_id || matchingApp.listing_id;
            }
        } catch (e) {
            console.warn("Error checking cached applications:", e);
        }
        
        // Only try server as last resort to avoid 404 errors
        const apiUrl = getApiUrl();
        console.log(`Fetching application info from ${apiUrl}/applications/${applicationId}`);
        
        const response = await fetch(`${apiUrl}/applications/${applicationId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.application) {
                return data.application.job_id || data.application.listing_id;
            }
        } else {
            console.warn(`Server returned ${response.status} when fetching application details`);
        }
        
        return null;
    } catch (error) {
        console.warn("Error getting job ID from application:", error);
        return null;
    }
}

// Simplified function to cancel an application
async function cancelApplication(applicationId) {
    if (!applicationId) {
        console.error("No application ID provided for cancellation");
        showErrorNotification("Could not cancel application: Missing application ID");
        hideCancelConfirmation();
        return false;
    }
    
    console.log(`Cancelling application: ${applicationId}`);
    showInfoNotification("Cancelling application...");
    
    // Get job ID for this application - store the original jobId value
    const jobId = currentJobId || await getJobIdFromApplication(applicationId);
    console.log(`Associated job ID: ${jobId}`);
    
    // Set flag to indicate this is a direct user withdrawal
    // This helps ensure proper notification on the job-listing.js side
    localStorage.setItem('directWithdrawal', 'true');
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
    
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("You must be logged in to cancel an application");
        }
        
        const apiUrl = getApiUrl();
        let success = false;
        let serverRequestAttempted = false;
        
        // Only try API calls if we haven't determined it's unavailable
        if (!localStorage.getItem('apiUnavailable')) {
            console.log(`Trying cancellation request to ${apiUrl}/applications/${applicationId}/cancel`);
            
            // Try the cancel endpoint first
            try {
                serverRequestAttempted = true;
                const response = await fetch(`${apiUrl}/applications/${applicationId}/cancel`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    success = data.success;
                    console.log("Application cancelled successfully via /cancel endpoint");
                } else {
                    console.warn(`Cancel endpoint failed with status ${response.status}, trying withdraw endpoint`);
                }
            } catch (e) {
                console.warn("Error with cancel endpoint, trying withdraw endpoint", e);
            }
            
            // If cancel endpoint failed, try the withdraw endpoint
            if (!success) {
                try {
                    serverRequestAttempted = true;
                    const response = await fetch(`${apiUrl}/applications/${applicationId}/withdraw`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        success = data.success;
                        console.log("Application cancelled successfully via /withdraw endpoint");
                    } else {
                        console.warn(`Withdraw endpoint failed with status ${response.status}`);
                    }
                } catch (e) {
                    console.warn("Error with withdraw endpoint", e);
                }
            }
        } else {
            console.log("API marked as unavailable, skipping server requests");
        }
        
        // If server requests failed or weren't attempted, do a client-side cancellation
        if (!success) {
            // If we tried server requests and they all failed, mark API as unavailable to prevent future attempts
            if (serverRequestAttempted) {
                console.warn("All server-side cancellation attempts failed, marking API as temporarily unavailable");
                localStorage.setItem('apiUnavailable', 'true');
                // Clear this flag after 5 minutes
                setTimeout(() => {
                    localStorage.removeItem('apiUnavailable');
                }, 5 * 60 * 1000);
            }
            
            console.log("Performing client-side cancellation");
            if (jobId) {
                markJobAsWithdrawn(jobId, applicationId);
                success = true;
                console.log("Application marked as withdrawn client-side");
            } else {
                console.warn("Could not get job ID for client-side withdrawal");
            }
        }
        
        if (success) {
            console.log("Application cancellation completed");
            
            // Show success notification using the global notification system if available
            if (window.notification && typeof window.notification.warning === 'function') {
                window.notification.warning(`Your application has been withdrawn successfully.`, true);
            } else {
                // Fallback to local notification
                showSuccessNotification("Application cancelled successfully");
            }
            
            // Always mark job as withdrawn in local storage for UI consistency
            if (jobId) {
                markJobAsWithdrawn(jobId, applicationId);
                console.log(`Marked job ${jobId} as withdrawn`);
            }
            
            // Update UI
            hideCancelConfirmation();
            
            // Remove the application card from the UI immediately
            const appCard = document.querySelector(`.application-card[data-application-id="${applicationId}"]`);
            if (appCard) {
                appCard.style.opacity = "0";
                setTimeout(() => {
                    appCard.remove();
                }, 300);
            }
            
            // Reload applications list, but don't wait for it
            loadApplications(true).catch(err => 
                console.warn("Error refreshing applications list:", err)
            );
            
            return true;
        } else {
            console.error("All cancellation attempts failed");
            showErrorNotification("Failed to cancel application - please try again later");
            hideCancelConfirmation();
            return false;
        }
    } catch (error) {
        console.error("Error cancelling application:", error);
        showErrorNotification("Error cancelling application: " + error.message);
        hideCancelConfirmation();
        return false;
    } finally {
        // Hide loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }
    }
}

/**
 * Mark a job as withdrawn in the local storage
 * This is used to track withdrawn applications and prevent them from 
 * showing as applied in the UI
 * @param {string} jobId The ID of the job to mark as withdrawn
 * @param {string} applicationId The ID of the application that was withdrawn
 */
function markJobAsWithdrawn(jobId, applicationId) {
    if (!jobId) {
        console.error("No job ID provided to markJobAsWithdrawn");
        return;
    }
    
    // Convert to string to ensure consistent type when comparing
    jobId = String(jobId);
    
    console.log(`Marking job ${jobId} as withdrawn, applicationId: ${applicationId}`);
    
    // Get current withdrawn jobs
    const withdrawnJobs = JSON.parse(localStorage.getItem('withdrawnJobs') || '[]');
    const withdrawnJobsMap = JSON.parse(localStorage.getItem('withdrawnJobsMap') || '{}');
    
    // Add to withdrawn jobs if not already there
    if (!withdrawnJobs.includes(jobId)) {
        withdrawnJobs.push(jobId);
        localStorage.setItem('withdrawnJobs', JSON.stringify(withdrawnJobs));
    }
    
    // Update the withdrawnJobsMap with additional details
    withdrawnJobsMap[jobId] = {
        withdrawnAt: new Date().toISOString(),
        applicationId: applicationId
    };
    localStorage.setItem('withdrawnJobsMap', JSON.stringify(withdrawnJobsMap));
    
    // Also remove from applied jobs arrays
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
    const appliedJobsFromServer = JSON.parse(localStorage.getItem('appliedJobsFromServer') || '[]');
    
    // Filter out the withdrawn job
    if (appliedJobs.includes(jobId)) {
        const newAppliedJobs = appliedJobs.filter(id => id !== jobId);
        localStorage.setItem('appliedJobs', JSON.stringify(newAppliedJobs));
    }
    
    if (appliedJobsFromServer.includes(jobId)) {
        const newServerApplied = appliedJobsFromServer.filter(id => id !== jobId);
        localStorage.setItem('appliedJobsFromServer', JSON.stringify(newServerApplied));
    }
    
    // Dispatch event so other pages can update
    const event = new CustomEvent('applicationWithdrawn', { 
        detail: { jobId, applicationId }
    });
    document.dispatchEvent(event);
}

// Helper function to remove application data from local storage
function removeFromLocalStorage(jobId, applicationId) {
    try {
        console.log(`Removing application ${applicationId} for job ${jobId} from local storage`);
        
        // First check if a recent submission happened - if so, BLOCK ALL withdrawal events
        const lastSubmitTime = parseInt(localStorage.getItem('lastApplicationSubmit') || '0');
        const now = Date.now();
        const isRecentSubmission = (now - lastSubmitTime) < 30000; // Extended to 30 seconds
        
        if (isRecentSubmission) {
            console.log('BLOCKING: Not sending withdrawal events after recent submission');
            
            // Still update localStorage to keep state consistent
            _updateLocalStorage();
            
            // But don't dispatch any events
            return true;
        }
        
        // Convert to string for consistent comparison
        const jobIdStr = String(jobId);
        
        // Update localStorage
        _updateLocalStorage();
        
        // Prevent duplicate events - store the last event time
        const lastEventTime = parseInt(localStorage.getItem('lastWithdrawalEventTime') || '0');
        
        // Only dispatch events if it's been at least 5 seconds since the last one
        if ((now - lastEventTime) > 5000) {
            localStorage.setItem('lastWithdrawalEventTime', now.toString());
            
            // Use a small delay to ensure the DOM is ready for listeners
            setTimeout(() => {
                try {
                    // Dispatch a SINGLE event - the job-listing.js will handle both notifications and UI updates
                    console.log("Dispatching application-cancel-complete event");
                    document.dispatchEvent(new CustomEvent('application-cancel-complete', {
                        detail: { applicationId, jobId }
                    }));
                    
                    // Also dispatch an applicationsUpdated event for any other components
                    console.log("Dispatching applicationsUpdated event");
                    document.dispatchEvent(new CustomEvent('applicationsUpdated'));
                } catch (e) {
                    console.error("Error dispatching cancellation events:", e);
                }
            }, 50);
        } else {
            console.log("Suppressing duplicate withdrawal events");
        }
        
        console.log(`Successfully removed all application data from local storage for job ${jobId}`);
        return true;
        
        // Helper function to update localStorage entries
        function _updateLocalStorage() {
            // PART 1: Remove from array-based storage
            const arrayKeys = [
                'appliedJobs',
                'appliedJobsFromServer',
                'withdrawnJobs',
                'completedWithdrawals'
            ];
            
            arrayKeys.forEach(key => {
                try {
                    const items = JSON.parse(localStorage.getItem(key) || '[]');
                    if (Array.isArray(items)) {
                        const filtered = items.filter(id => String(id) !== jobIdStr);
                        if (items.length !== filtered.length) {
                            localStorage.setItem(key, JSON.stringify(filtered));
                            console.log(`Removed job ${jobIdStr} from ${key}`);
                        }
                    }
                } catch (err) {
                    console.error(`Error clearing ${key}:`, err);
                }
            });
            
            // PART 2: Remove from object-based storage
            const objectKeys = [
                'withdrawnJobsMap',
                'applicationStatuses'
            ];
            
            objectKeys.forEach(key => {
                try {
                    const obj = JSON.parse(localStorage.getItem(key) || '{}');
                    if (obj && typeof obj === 'object' && obj[jobIdStr]) {
                        delete obj[jobIdStr];
                        localStorage.setItem(key, JSON.stringify(obj));
                        console.log(`Removed job ${jobIdStr} from ${key} object`);
                    }
                } catch (err) {
                    console.error(`Error cleaning ${key} object:`, err);
                }
            });
            
            // PART 3: Clean from cachedApplications
            try {
                const cachedApps = JSON.parse(localStorage.getItem('cachedApplications') || '[]');
                if (cachedApps.length > 0) {
                    // Remove by applicationId if provided, or by jobId otherwise
                    const newCachedApps = cachedApps.filter(app => {
                        // If we have an applicationId, filter by it
                        if (applicationId) {
                            if (app.id === applicationId || app.application_id === applicationId) {
                                return false; // Remove this app
                            }
                        }
                        
                        // Also filter by jobId
                        if (String(app.job_id) === jobIdStr || String(app.listing_id) === jobIdStr) {
                            return false; // Remove this app
                        }
                        
                        return true; // Keep this app
                    });
                    
                    if (cachedApps.length !== newCachedApps.length) {
                        localStorage.setItem('cachedApplications', JSON.stringify(newCachedApps));
                        console.log(`Removed ${cachedApps.length - newCachedApps.length} entries from cachedApplications`);
                    }
                }
            } catch (error) {
                console.error("Error cleaning cachedApplications:", error);
            }
            
            // PART 4: Update global userApplications array if present
            if (window.userApplications && Array.isArray(window.userApplications)) {
                const origLength = window.userApplications.length;
                window.userApplications = window.userApplications.filter(app => {
                    // Remove by applicationId if provided
                    if (applicationId && (app.id === applicationId || app.application_id === applicationId)) {
                        return false;
                    }
                    
                    // Also remove by jobId
                    if (String(app.job_id) === jobIdStr || String(app.listing_id) === jobIdStr) {
                        return false;
                    }
                    
                    return true;
                });
                
                if (origLength !== window.userApplications.length) {
                    console.log(`Removed entries from window.userApplications array`);
                }
            }
        }
    } catch (error) {
        console.error("Error removing application data from local storage:", error);
        return false;
    }
}

// Note: The addToSyncQueue function was removed as part of simplifying the application cancellation logic.
// The new approach communicates directly with the server without needing a sync queue.

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return "Not specified";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

// Helper function to get status CSS class
function getStatusClass(status) {
    if (!status) return "pending";
    
    switch (status.toLowerCase()) {
        case "pending":
            return "pending";
        case "under review":
        case "reviewing":
            return "under-review";
        case "interview":
        case "interviewing":
            return "interview";
        case "accepted":
        case "hired":
        case "approved":
            return "hired";
        case "rejected":
        case "declined":
            return "rejected";
        case "withdrawn":
            return "withdrawn";
        default:
            return "pending";
    }
}

// Function to normalize application status
function normalizeStatus(status) {
    // If no status, default to "Pending"
    if (!status || status === "") {
        return "Pending";
    }
    
    // Convert to lowercase for consistent comparison
    const lowerStatus = String(status).toLowerCase();
    
    // Map of canonical status values
    const statusMap = {
        "pending": "Pending",
        "under review": "Under Review",
        "reviewing": "Under Review",
        "interview": "Interview Scheduled",
        "interviewing": "Interview Scheduled",
        "accepted": "Accepted", 
        "hired": "Hired",
        "approved": "Accepted",
        "rejected": "Rejected",
        "declined": "Rejected",
        "withdrawn": "Withdrawn"
    };
    
    // Return the canonical form if it exists
    if (statusMap[lowerStatus]) {
        return statusMap[lowerStatus];
    }
    
    // Otherwise, capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// Helper function to format status text
function formatStatus(status) {
    // Use the normalize function for consistent display
    return normalizeStatus(status);
}

// Helper function to format requirement text
function formatRequirement(requirement) {
    if (!requirement) return "";
    
    // Map of requirement keys to display text
    const requirementMap = {
        "cover_letter": "Cover Letter",
        "resume": "Resume",
        "portfolio": "Portfolio",
        "transcript": "Academic Transcript",
        "recommendation_letter": "Letter of Recommendation",
        "certification": "Relevant Certifications",
        "work_samples": "Work Samples",
        "background_check": "Background Check Consent",
        "available_for_interview": "Available for Interview"
    };
    
    return requirementMap[requirement] || 
        requirement.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

// Render application details
function renderApplicationDetails(application) {
    if (!applicationDetailsContainer) return;
    
    // Get application and job IDs
    const applicationId = application.id || application.application_id;
    const jobId = application.job_id || application.listing_id;
    
    // Normalize status for consistency
    const normalizedStatus = normalizeStatus(application.status);
    
    // Check status
    const isPending = normalizedStatus === "Pending";
    const isWithdrawn = normalizedStatus === "Withdrawn";
    
    // Debug log
    console.log(`Rendering details for application ${applicationId}, status: "${application.status}" → normalized: "${normalizedStatus}"`);
    
    // Parse additional info if available
    let additionalInfo = {};
    try {
        if (application.additional_info && typeof application.additional_info === "string") {
            additionalInfo = JSON.parse(application.additional_info);
        } else if (application.additional_info && typeof application.additional_info === "object") {
            additionalInfo = application.additional_info;
        }
    } catch (e) {
        console.error("Error parsing additional info:", e);
    }
    
    // Generate details HTML
    const detailsHTML = `
        <div class="application-detail">
            <div class="detail-label">Position</div>
            <div class="detail-value">${application.job_title || "Unknown Position"}</div>
        </div>
        
        <div class="application-detail">
            <div class="detail-label">Company</div>
            <div class="detail-value">${application.company_name || "Unknown Company"}</div>
        </div>
        
        <div class="application-detail">
            <div class="detail-label">Location</div>
            <div class="detail-value">${application.location || "Not specified"}</div>
        </div>
        
        <div class="application-detail">
            <div class="detail-label">Applied On</div>
            <div class="detail-value">${formatDate(application.created_at || application.applied_at)}</div>
        </div>
        
        <div class="application-detail">
            <div class="detail-label">Status</div>
            <div class="detail-value">
                <span class="application-status status-${getStatusClass(normalizedStatus)}">
                    ${normalizedStatus}
                </span>
            </div>
        </div>
        
        <div class="application-detail">
            <div class="detail-label">Cover Letter</div>
            <div class="cover-letter">${application.cover_letter || "No cover letter provided"}</div>
        </div>
        
        ${additionalInfo.availability ? `
        <div class="application-detail">
            <div class="detail-label">Available Start Date</div>
            <div class="detail-value">${formatDate(additionalInfo.availability)}</div>
        </div>
        ` : ""}
        
        ${additionalInfo.requirements && additionalInfo.requirements.length > 0 ? `
        <div class="application-detail">
            <div class="detail-label">Additional Requirements</div>
            <div class="detail-value">
                <ul>
                    ${additionalInfo.requirements.map(req => `<li>${formatRequirement(req)}</li>`).join("")}
                </ul>
            </div>
        </div>
        ` : ""}
        
        ${isPending ? `
        <div style="margin-top: 20px; text-align: right;">
            <button class="btn btn-outline cancel-btn" data-id="${applicationId}" data-job-id="${jobId}">Cancel Application</button>
        </div>
        ` : (isWithdrawn ? `
        <div style="margin-top: 20px; text-align: right;">
            <p class="withdrawn-message">This application has been withdrawn.</p>
            <a href="jobListings.html" class="btn btn-primary">Browse New Opportunities</a>
        </div>
        ` : "")}
    `;
    
    // Update the container
    applicationDetailsContainer.innerHTML = detailsHTML;
    
    // Add event listener to the cancel button if present
    const cancelBtn = applicationDetailsContainer.querySelector(".cancel-btn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", function() {
            const appId = this.getAttribute("data-id");
            const jobId = this.getAttribute("data-job-id");
            applicationModal.style.display = "none"; // Close details modal
            
            // Store job ID for cancel confirmation
            if (jobId) {
                if (!window.currentApplication) window.currentApplication = {};
                window.currentApplication.jobId = jobId;
            }
            
            showCancelConfirmation(appId);
        });
    }
}

// Function to clean up problematic application records for a specific job
async function cleanupJobApplications(jobId, forceCleanup = false) {
    if (!jobId) {
        console.error("No job ID provided to cleanupJobApplications");
        return false;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No authentication token found");
        return false;
    }

    try {
        showLoadingIndicator();
        
        const response = await fetch(`${API_BASE_URL}/applications/cleanup/${jobId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                force: forceCleanup ? 'true' : 'false'
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`Cleaned up ${data.cleaned} application records for job ${jobId}`);
            // Refresh the applications list if any records were cleaned
            if (data.cleaned > 0) {
                await loadApplications();
                
                // Refresh job listings page if it exists
                if (typeof refreshApplicationsAndListings === 'function') {
                    refreshApplicationsAndListings();
                } else {
                    // Dispatch an event for job-listing.js to catch
                    document.dispatchEvent(new CustomEvent('applicationsUpdated'));
                }
            }
            return true;
        } else {
            console.error("Error cleaning up applications:", data.message);
            return false;
        }
    } catch (error) {
        console.error("Error cleaning up applications:", error);
        return false;
    } finally {
        hideLoadingIndicator();
    }
}

// Initialize page
document.addEventListener("DOMContentLoaded", function() {
    console.log("Applications page initialized");
    
    // Setup event listeners for UI interactions
    setupEventListeners();
    
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../index.html";
        return;
    }
    
    // Add cancel confirmation button event listener
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async function() {
            console.log("Cancel confirmation button clicked");
            
            if (currentApplicationId) {
                console.log(`Processing cancellation for application ${currentApplicationId}`);
                await cancelApplication(currentApplicationId);
                currentApplicationId = null;
            } else {
                console.error("No application ID found for cancellation");
                showErrorNotification("Error: Could not determine which application to cancel");
            }
        });
    } else {
        console.error("Cancel confirmation button not found in the DOM");
    }
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear all local storage data
            localStorage.clear();
            // Redirect to login page
            window.location.href = '../index.html';
        });
    }
    
    // Load applications with forced refresh
    loadApplications(true);
});

// Helper functions for loading indicators
function showLoadingIndicator() {
    if (applicationListContainer) {
        applicationListContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
            </div>
        `;
    }
    
    showInfoNotification("Loading data...");
}

function hideLoadingIndicator() {
    // This is just a placeholder as the actual content is managed by other functions
    console.log("Loading complete");
}

// Make markJobAsWithdrawn globally available
window.markJobAsWithdrawn = markJobAsWithdrawn; 