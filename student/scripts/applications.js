// Application tracking script

// Global variables and configurations
const DEVELOPMENT_MODE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_TIMEOUT = 10000; // 10 seconds

// Initialize API base URL with fallbacks
let BASE_URL = 'http://localhost:5004/api';
const API_HOST = 'http://localhost:5004';

// Cache timestamp tracking
let lastApiCallTimestamp = 0;
let lastCacheUpdateTimestamp = 0;
const CACHE_FRESHNESS_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

// Global variables
window.currentApplicationId = null;
window.currentJobId = null;
let withdrawnApplicationIds = [];
let applicationBlacklist = [];

// Mock data for development/fallback
const MOCK_APPLICATIONS = [
    // Mock data entries can be defined here
];

// Try multiple potential base URLs
const POSSIBLE_BASE_URLS = [
    'http://localhost:5004/api',  // Default port
    'http://127.0.0.1:5004/api'   // Alternative localhost
];

// Function to find a working API base URL
async function findWorkingApiBaseUrl() {
    for (const url of POSSIBLE_BASE_URLS) {
        try {
            console.log(`Trying API base URL: ${url}`);
            const response = await fetch(`${url}/status`, {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 2000
            });
            
            if (response.ok) {
                console.log(`Found working API base URL: ${url}`);
                return url;
            }
        } catch (error) {
            console.warn(`API URL ${url} failed:`, error.message);
        }
    }
    
    // Default to the first one if none work
    console.warn('No working API URL found, using default');
    return POSSIBLE_BASE_URLS[0];
}

// Try to find a working API URL when the script loads
findWorkingApiBaseUrl().then(url => {
    BASE_URL = url;
    console.log(`Using API base URL: ${BASE_URL}`);
}).catch(error => {
    console.error('Error finding working API URL:', error);
});

const API_ENDPOINTS = [
    '/applications',
    '/student/applications',
    '/api/applications',
    '/api/student/applications'
];

function getApiUrl() {
    try {
        // Try to get from meta tag first
        const metaTag = document.querySelector('meta[name="api-url"]');
        if (metaTag && metaTag.content && metaTag.content.trim() !== '') {
            const url = metaTag.content.endsWith('/') ? metaTag.content.slice(0, -1) : metaTag.content;
            console.log(`Found API URL in meta tag: ${url}`);
            return url;
        }
    } catch (e) {
        console.warn("Error reading API URL from meta tag:", e);
    }
    
    // If meta tag is not available, use the base URL we've established
    console.log(`Using base URL as API URL: ${BASE_URL}`);
    return BASE_URL;
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
        // Find the modal
        const confirmModal = document.getElementById('confirmModal');
        if (confirmModal) {
            // Use Bootstrap modal if available
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                try {
                    const bsModal = bootstrap.Modal.getInstance(confirmModal);
                if (bsModal) {
                    bsModal.hide();
                        console.log("Modal hidden using Bootstrap");
                    } else {
                        confirmModal.style.display = 'none';
                }
                } catch (e) {
                    console.warn("Error hiding Bootstrap modal:", e);
                    confirmModal.style.display = 'none';
            }
            } else if (typeof $ !== 'undefined') {
                // Try jQuery if Bootstrap isn't available
                try {
                    $(confirmModal).modal('hide');
                    console.log("Modal hidden using jQuery");
                } catch (e) {
                    console.warn("Error hiding jQuery modal:", e);
                    confirmModal.style.display = 'none';
                }
            } else {
                // Direct DOM manipulation
                confirmModal.style.display = 'none';
                confirmModal.classList.remove('show');
            document.body.classList.remove('modal-open');
                
                // Remove backdrop
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
            }
        }
        
        // Reset global variables
        window.currentApplicationId = null;
        window.currentJobId = null;
    } catch (error) {
        console.error("Error hiding cancel confirmation:", error);
    }
}

// Notification functions
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element if it doesn't exist
    let statusNotification = document.getElementById("status-notification");
    
    if (!statusNotification) {
        // Create notification element dynamically if not found
        statusNotification = document.createElement('div');
        statusNotification.id = 'status-notification';
        statusNotification.className = 'status-notification';
        statusNotification.style.display = 'none';
        
        const notificationContent = document.createElement('div');
        notificationContent.className = 'notification-content';
        
        const icon = document.createElement('i');
        icon.className = 'notification-icon';
        
        const messageElem = document.createElement('span');
        messageElem.className = 'notification-message';
        
        notificationContent.appendChild(icon);
        notificationContent.appendChild(messageElem);
        statusNotification.appendChild(notificationContent);
        
        document.body.appendChild(statusNotification);
        console.log("Created notification element dynamically");
    }
    
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

// Function to get user authentication token
function getAuthToken() {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            console.warn("Authentication token not found");
        }
        return token;
    } catch (e) {
        console.error("Error getting auth token:", e);
        return null;
    }
}

// Function to get user data from storage
function getUserData() {
    try {
        // Try different possible storage keys
        const possibleKeys = ['userData', 'user', 'userInfo'];
        let userData = null;
        
        for (const key of possibleKeys) {
            const data = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (data) {
                try {
                    userData = JSON.parse(data);
                    console.log(`Found user data in storage key: ${key}`);
                    break;
                } catch (parseError) {
                    console.warn(`Failed to parse data from ${key}:`, parseError);
                }
            }
        }
        
        return userData;
    } catch (e) {
        console.error("Error getting user data:", e);
        return null;
    }
}

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

// Function to check API connectivity
async function checkApiConnectivity() {
    try {
        // Try multiple endpoints to check connectivity
        const statusEndpoints = [
            `${BASE_URL}/status`,
            `${BASE_URL}/health`,
            `${BASE_URL}/api/status`,
            `${BASE_URL}/api/health`,
            `${BASE_URL}`
        ];
        
        for (const endpoint of statusEndpoints) {
            try {
                console.log(`Checking API connectivity with: ${endpoint}`);
                const response = await fetch(endpoint, {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    signal: AbortSignal.timeout(3000) // 3 second timeout
                });
                
                if (response.ok) {
                    console.log(`API connectivity check passed using ${endpoint}`);
                    return true;
                }
                
                console.warn(`Endpoint ${endpoint} returned status ${response.status}`);
            } catch (endpointError) {
                console.warn(`Error checking endpoint ${endpoint}:`, endpointError.message);
            }
        }
        
        console.error("All API connectivity endpoints failed");
        return false;
    } catch (error) {
        console.warn("API connectivity check failed:", error.message);
                        return false;
    }
}

// Function to show loading indicator
function showLoadingIndicator() {
    // Create or get loading indicator
    let loadingIndicator = document.getElementById('loading-indicator');
    
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading applications...</p>
        `;
        
        // Find where to append the loading indicator
        const container = document.getElementById('application-list') || document.getElementById('applicationListContainer');
        if (container) {
            container.innerHTML = '';
            container.appendChild(loadingIndicator);
        } else {
            document.body.appendChild(loadingIndicator);
        }
    }
    
    loadingIndicator.style.display = 'flex';
}

// Function to hide loading indicator
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Function to render applications
function renderApplications(applications) {
    if (!applications || applications.length === 0) {
        showEmptyState();
        return;
    }
    
    // Get the container
    const container = document.getElementById('application-list') || document.getElementById('applicationListContainer');
    if (!container) {
        console.error("Application list container not found");
        return;
    }
    
    // Clear the container
    container.innerHTML = '';
    
    // Sort applications by date (newest first)
    applications.sort((a, b) => {
        const dateA = new Date(a.application_date || a.applied_at || a.created_at);
        const dateB = new Date(b.application_date || b.applied_at || b.created_at);
        return dateB - dateA;
    });
    
    // Create and append application cards
    applications.forEach(application => {
        const card = createApplicationCard(application);
        container.appendChild(card);
    });
    
    // Update the application count if element exists
    const countElement = document.getElementById('applicationCount');
    if (countElement) {
        countElement.textContent = applications.length;
        countElement.classList.remove('hidden');
    }
    
    console.log(`Displayed ${applications.length} applications`);
}

// Create application card element
function createApplicationCard(application) {
    const card = document.createElement('div');
    card.className = 'application-card';
    card.dataset.applicationId = application.id || application.application_id;
    card.dataset.jobId = application.job_id || application.listing_id;
    
    // Format date
    const appliedDate = new Date(application.application_date || application.applied_at || application.created_at);
    const formattedDate = formatDate(appliedDate);
    
    // Get status class
    const statusClass = getStatusClass(application.status);
    
    // Format position title and company name
    const positionTitle = application.position_title || application.job_title || "Unknown Position";
    const companyName = application.company_name || application.employer_name || "Unknown Company";
    
    // Get job ID for preview
    const jobId = application.job_id || application.listing_id || '';
    
    card.innerHTML = `
        <div class="application-header">
            <h3 class="position-title">${escapeHtml(positionTitle)}</h3>
            <span class="status-badge ${statusClass}">${escapeHtml(application.status || 'Pending')}</span>
        </div>
        <div class="company-name">${escapeHtml(companyName)}</div>
        <div class="application-details">
            <div class="detail">
                <i class="fas fa-calendar-alt"></i>
                <span>Applied: ${formattedDate}</span>
            </div>
            ${application.location ? `
            <div class="detail">
                <i class="fas fa-map-marker-alt"></i>
                <span>${escapeHtml(application.location)}</span>
            </div>
            ` : ''}
        </div>
        <div class="application-actions">
            <div class="action-buttons" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                <button class="action-btn preview-btn" data-application-id="${application.id || application.application_id}" data-job-id="${jobId}" title="Preview Application">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" data-application-id="${application.id || application.application_id}" data-job-id="${jobId}" title="Edit Application">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-application-id="${application.id || application.application_id}" data-job-id="${jobId}" title="Delete Application">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners for action buttons
    const previewBtn = card.querySelector('.preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            console.log('Preview button clicked for application:', application.id || application.application_id);
            if (jobId) {
                loadJobPreview(jobId);
            } else {
                showApplicationDetails(application);
            }
        });
    }
    
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            console.log('Edit button clicked for application:', application.id || application.application_id);
            editApplication(application);
        });
    }
    
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Delete button clicked for application:', application.id || application.application_id);
            
            // Store IDs in global variables for access in confirmation handler
            window.currentApplicationId = application.id || application.application_id;
            window.currentJobId = jobId;
            
            // Update confirmation modal for delete action
            const confirmModal = document.getElementById('confirmModal');
            if (confirmModal) {
                const modalTitle = confirmModal.querySelector('.modal-title');
                if (modalTitle) {
                    modalTitle.textContent = 'Delete Application';
                }
                
                const confirmMessage = confirmModal.querySelector('.confirm-message');
                if (confirmMessage) {
                    confirmMessage.textContent = "Are you sure you want to delete this application? This action cannot be undone.";
                }
                
                // Update confirm button text
                const confirmBtn = document.getElementById('confirmCancelBtn');
                if (confirmBtn) {
                    confirmBtn.textContent = 'Delete Application';
                    
                    // Remove existing event listeners
                    const newBtn = confirmBtn.cloneNode(true);
                    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
                    
                    // Add delete-specific event listener
                    newBtn.addEventListener('click', function() {
                        deleteApplication(window.currentApplicationId);
                    });
                }
                
                confirmModal.style.display = 'block';
            }
        });
    }
    
    return card;
}

// Format date for display
function formatDate(date) {
    if (!date || isNaN(date.getTime())) {
        return 'Unknown date';
    }
    
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get CSS class based on application status
function getStatusClass(status) {
    if (!status) return 'status-pending';
    
    status = status.toLowerCase();
    
    if (status === 'accepted' || status === 'approved') {
        return 'status-accepted';
    } else if (status === 'rejected' || status === 'declined') {
        return 'status-rejected';
    } else if (status === 'pending' || status === 'under review') {
        return 'status-pending';
    } else if (status === 'withdrawn' || status === 'canceled' || status === 'cancelled') {
        return 'status-withdrawn';
    } else {
        return 'status-pending';
    }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
        return unsafe || '';
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Show empty state when no applications
function showEmptyState(message) {
    const container = document.getElementById('application-list') || document.getElementById('applicationListContainer');
    if (!container) return;
    
    const isError = message && (message.includes('Failed') || message.includes('Error') || message.includes('Cannot'));
    
    // In development mode with errors, suggest using mock data
    if (isError) {
        container.innerHTML = `
            <div class="empty-state error-state">
                <i class="fas fa-exclamation-circle" style="font-size: 54px; color: #e74c3c; margin-bottom: 20px;"></i>
                <h3 style="font-size: 24px; color: #2c3e50; margin-bottom: 15px;">${message || 'Error loading applications'}</h3>
                <p style="color: #7f8c8d; margin-bottom: 20px; font-size: 16px;">
                    We encountered an issue with the application server.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="useMockDataBtn" class="btn btn-primary" style="background-color: #27ae60; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block; border: none; cursor: pointer;">
                        Use Demo Data
                    </button>
                    <button id="retryServerBtn" class="btn btn-outline" style="background-color: transparent; border: 1px solid #3498db; color: #3498db; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        setTimeout(() => {
            const useMockDataBtn = document.getElementById('useMockDataBtn');
            if (useMockDataBtn) {
                useMockDataBtn.addEventListener('click', function() {
                    renderApplications(MOCK_APPLICATIONS);
                    showNotification('Using demo data instead of live server', 'info');
                });
            }
            
            const retryServerBtn = document.getElementById('retryServerBtn');
            if (retryServerBtn) {
                retryServerBtn.addEventListener('click', function() {
                    loadApplications(true);
                });
            }
        }, 100);
        
            return;
        }
        
    container.innerHTML = `
        <div class="empty-state ${isError ? 'error-state' : ''}">
            ${isError ? 
                `<i class="fas fa-exclamation-circle" style="font-size: 54px; color: #e74c3c; margin-bottom: 20px;"></i>` : 
                `<img src="imgs/qcuims-logo.png" alt="No applications" class="empty-state-image" style="max-width: 120px; margin-bottom: 20px;">`
            }
            <h3 style="font-size: 24px; color: #2c3e50; margin-bottom: 15px;">${message || 'No applications found'}</h3>
            <p style="color: #7f8c8d; margin-bottom: 20px; font-size: 16px;">
                ${isError ? 
                    'We encountered an issue while retrieving your applications. Please try again later.' : 
                    'You haven\'t applied to any internships yet. Start exploring opportunities!'
                }
            </p>
            <a href="jobListings.html" class="btn btn-primary" style="background-color: #3498db; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
                ${isError ? 'Refresh' : 'Browse Jobs'}
            </a>
                </div>
            `;
    
    // Add click event to refresh button if it's an error state
    if (isError) {
        const refreshBtn = container.querySelector('.btn-primary');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function(e) {
                e.preventDefault();
                loadApplications(true);
            });
        }
    }
}

/**
 * Enhance applications with job details if needed
 * @param {Array} applications - Array of application objects
 */
async function enhanceApplicationsWithJobDetails(applications) {
    if (!applications || applications.length === 0) return;
    
    const token = getAuthToken();
    if (!token) return;
    
    const jobDetailsCache = JSON.parse(localStorage.getItem('jobDetailsCache') || '{}');
    const jobDetailPromises = [];
    
    // Identify applications needing job details
    for (const app of applications) {
        // Skip if application already has all necessary job details
        if (app.position_title && app.company_name) continue;
        
        const jobId = app.job_id || app.listing_id;
        if (!jobId) continue;
        
        // Skip if we have this job in cache and it's not too old
        const cachedJob = jobDetailsCache[jobId];
        const currentTime = new Date().getTime();
        if (cachedJob && cachedJob.fetchedAt && (currentTime - cachedJob.fetchedAt < 24 * 60 * 60 * 1000)) {
            // Apply cached job details to this application
            app.position_title = app.position_title || cachedJob.position_title || 'Unknown Position';
            app.company_name = app.company_name || cachedJob.company_name || 'Unknown Company';
            app.job_location = app.job_location || cachedJob.location;
            app.job_type = app.job_type || cachedJob.job_type;
            continue;
        }
        
        // Need to fetch job details
        const fetchJobPromise = fetch(`${BASE_URL}/jobs/${jobId}`, {
                    method: 'GET',
                    headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) return null;
            return response.json();
        })
        .then(data => {
            if (!data) return;
            
            const jobData = data.job || data.data || data;
            
            // Update application with job details
            app.position_title = app.position_title || jobData.title || jobData.position_title || 'Unknown Position';
            app.company_name = app.company_name || jobData.company_name || jobData.employer_name || 'Unknown Company';
            app.job_location = app.job_location || jobData.location;
            app.job_type = app.job_type || jobData.job_type;
            
            // Cache job details
            jobDetailsCache[jobId] = {
                position_title: jobData.title || jobData.position_title,
                company_name: jobData.company_name || jobData.employer_name,
                location: jobData.location,
                job_type: jobData.job_type,
                fetchedAt: new Date().getTime()
            };
        })
        .catch(error => {
            console.warn(`Error fetching job details for job ${jobId}:`, error);
        });
        
        jobDetailPromises.push(fetchJobPromise);
    }
    
    // Wait for all job detail fetches to complete
    if (jobDetailPromises.length > 0) {
        await Promise.allSettled(jobDetailPromises);
        
        // Update job details cache
        localStorage.setItem('jobDetailsCache', JSON.stringify(jobDetailsCache));
        console.log(`Enhanced ${jobDetailPromises.length} applications with job details`);
    }
}

/**
 * Debug function to help diagnose button/modal issues
 */
function debugModalButtons() {
    console.log('=== CANCEL BUTTON DEBUG INFO ===');
    console.log('Modal elements:');
    console.log('confirmModal:', document.getElementById('confirmModal'));
    console.log('confirmCancelBtn:', document.getElementById('confirmCancelBtn'));
    console.log('Close buttons:', document.querySelectorAll('.close-modal-btn, .btn-close, [data-dismiss="modal"]'));
    
    console.log('Global variables:');
    console.log('currentApplicationId:', window.currentApplicationId);
    console.log('currentJobId:', window.currentJobId);
    
    // Try direct event attachment
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    if (confirmCancelBtn) {
        console.log('Attaching debug event listener to confirm button');
        confirmCancelBtn.addEventListener('click', function() {
            console.log('Debug: confirmCancelBtn clicked');
            if (window.currentApplicationId) {
                console.log(`Debug: Canceling application ${window.currentApplicationId}`);
            } else {
                console.log('Debug: No application ID available');
            }
        });
    } else {
        console.error('Debug: confirmCancelBtn not found in DOM');
    }
    
    // Check for withdraw buttons
    const withdrawBtns = document.querySelectorAll('.cancel-application-btn');
    console.log(`Found ${withdrawBtns.length} withdraw buttons`, withdrawBtns);
    
    console.log('=== END DEBUG INFO ===');
}

/**
 * Show confirmation modal for canceling an application
 * @param {string|number} applicationId - The ID of the application to cancel
 * @param {string|number} jobId - The ID of the job associated with the application
 */
function showCancelConfirmation(applicationId, jobId) {
    try {
        console.log(`Showing cancel confirmation for application ${applicationId}, job ${jobId}`);
        
        // Store IDs in global variables for access in confirmation handler
        window.currentApplicationId = applicationId;
        window.currentJobId = jobId;
        
        // Validate inputs
        if (!applicationId) {
            console.error("Missing application ID in showCancelConfirmation");
            showErrorNotification("Error: Application information is incomplete");
                    return;
        }
        
        // Find the modal
        const confirmModal = document.getElementById('confirmModal');
        if (!confirmModal) {
            console.error("Confirm modal not found");
            showErrorNotification("Error: Confirmation dialog not found");
                    return;
                }
        
        // Update modal content if needed
        const confirmMessage = confirmModal.querySelector('.confirm-message');
        if (confirmMessage) {
            confirmMessage.textContent = "Are you sure you want to withdraw this application? This action cannot be undone.";
        }
        
        // Show the modal
        confirmModal.style.display = 'block';
        
        // Use Bootstrap modal if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            try {
                const bsModal = new bootstrap.Modal(confirmModal);
                bsModal.show();
                console.log("Modal shown using Bootstrap");
            } catch (e) {
                console.warn("Error showing Bootstrap modal:", e);
                confirmModal.style.display = 'block';
            }
        } else if (typeof $ !== 'undefined') {
            // Try jQuery if Bootstrap isn't available
            try {
                $(confirmModal).modal('show');
                console.log("Modal shown using jQuery");
            } catch (e) {
                console.warn("Error showing jQuery modal:", e);
                confirmModal.style.display = 'block';
            }
        } else {
            // Direct DOM manipulation
            confirmModal.style.display = 'block';
            confirmModal.classList.add('show');
            document.body.classList.add('modal-open');
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        }
    } catch (error) {
        console.error("Error in showCancelConfirmation:", error);
        showErrorNotification("Failed to display confirmation dialog");
    }
}

/**
 * Cancel/withdraw an application
 * @param {number|string} applicationId - ID of the application
 * @param {number|string} jobId - ID of the associated job listing
 */
function cancelApplication(applicationId, jobId) {
    console.log(`Cancelling application ${applicationId} for job ${jobId}`);
    
    // Mark as direct withdrawal for notification purposes
    localStorage.setItem('directWithdrawal', 'true');
    
    // Show confirmation modal
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Set application ID and job ID on confirm button
        const confirmButton = document.getElementById('confirmCancelBtn');
        if (confirmButton) {
            confirmButton.dataset.applicationId = applicationId;
            confirmButton.dataset.jobId = jobId;
        }
    } else {
        // If no modal, ask for confirmation directly
        if (confirm('Are you sure you want to withdraw this application?')) {
            completeApplicationCancellation(applicationId, jobId);
        }
    }
}

/**
 * Complete the application cancellation process after confirmation
 * @param {number|string} applicationId - ID of the application
 * @param {number|string} jobId - ID of the associated job listing
 */
function completeApplicationCancellation(applicationId, jobId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showErrorNotification("You must be logged in to cancel applications");
        return;
    }
    
    // Get API base URL
    let baseUrl = localStorage.getItem('apiBaseUrl') || API_URL || 'http://localhost:5004/api';
    
    // Ensure jobId and applicationId are strings for consistency in comparisons
    jobId = String(jobId);
    applicationId = String(applicationId);
    
    // Show cancellation in progress notification
    showInfoNotification("Cancelling application...");
    
    // IMPORTANT: Update localStorage IMMEDIATELY for responsive UI
    // This ensures other pages like job listings will show the correct status
    updateLocalStorageAfterCancellation(jobId);
    
    // Track server request success
    let serverRequestAttempted = false;
    let success = false;
    
    // Call the API to cancel the application
    fetch(`${baseUrl}/applications/${applicationId}/cancel`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        serverRequestAttempted = true;
        
        if (!response.ok) {
            // Still try to parse error message
            return response.json().then(data => {
                throw new Error(data.message || `Server error (${response.status})`);
            }).catch(() => {
                throw new Error(`Server error (${response.status})`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Application cancelled successfully on server:', data);
        success = true;
        
        // Update UI by reloading applications
        loadAndDisplayApplications();
        
        // Show success notification
        showSuccessNotification("Application withdrawn successfully");
        
        // Perform a complete sync with the server to ensure all data is fresh
        if (typeof window.forceApplicationStateSyncWithServer === 'function') {
            console.log('Performing complete application state sync with server');
            window.forceApplicationStateSyncWithServer();
        } else {
            // If the sync function isn't available, update localStorage again
            updateLocalStorageAfterCancellation(jobId);
        }
        
        // Dispatch event for other components to respond
        document.dispatchEvent(new CustomEvent('application-cancel-complete', {
            detail: { applicationId, jobId, timestamp: Date.now() }
        }));
    })
    .catch(error => {
        console.error('Error cancelling application on server:', error);
        
        // If server request was attempted but failed
        if (serverRequestAttempted) {
            showErrorNotification("Server error: " + error.message + ". Changes applied locally.");
            
            // Mark API as temporarily unavailable
            localStorage.setItem('apiUnavailable', 'true');
            // Clear this flag after 5 minutes
            setTimeout(() => {
                localStorage.removeItem('apiUnavailable');
            }, 5 * 60 * 1000);
        } else {
            showErrorNotification("Network error: Unable to reach server. Changes applied locally.");
        }
        
        // Still update the UI and localStorage for better user experience
        updateLocalStorageAfterCancellation(jobId);
        
        // Mark as withdrawn in cached applications
        try {
            let cachedApplications = JSON.parse(localStorage.getItem('cachedApplications') || '[]');
            if (Array.isArray(cachedApplications)) {
                cachedApplications = cachedApplications.map(app => {
                    if ((app.job_id && String(app.job_id) === jobId) || 
                        (app.listing_id && String(app.listing_id) === jobId) ||
                        (app.jobId && String(app.jobId) === jobId)) {
                        return {...app, status: 'Withdrawn'};
                    }
                    return app;
                });
                localStorage.setItem('cachedApplications', JSON.stringify(cachedApplications));
            }
        } catch (e) {
            console.error('Error updating cached applications:', e);
        }
        
        // Dispatch event for other components to respond
        document.dispatchEvent(new CustomEvent('application-cancel-complete', {
            detail: { applicationId, jobId, timestamp: Date.now() }
        }));
        
        // Reload the application list
        loadAndDisplayApplications();
    });
}

/**
 * Update all localStorage items after cancellation
 * @param {string} jobId - The job ID to remove from localStorage arrays
 */
function updateLocalStorageAfterCancellation(jobId) {
    if (!jobId) return;
    
    console.log(`Updating localStorage after cancellation of job ${jobId}`);
    jobId = String(jobId);
    
    // Remove from all applied jobs arrays
    const keysToUpdate = [
        'appliedJobs',
        'appliedJobsFromServer',
        'locallyStoredApplications'
    ];
    
    keysToUpdate.forEach(key => {
        try {
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            const index = arr.indexOf(jobId);
            if (index !== -1) {
                arr.splice(index, 1);
                localStorage.setItem(key, JSON.stringify(arr));
                console.log(`Removed job ${jobId} from ${key}`);
            }
        } catch (e) {
            console.error(`Error updating ${key}:`, e);
        }
    });
    
    // Remove from applicationIdMap
    try {
        const applicationIdMap = JSON.parse(localStorage.getItem('applicationIdMap') || '{}');
        if (applicationIdMap[jobId]) {
            delete applicationIdMap[jobId];
            localStorage.setItem('applicationIdMap', JSON.stringify(applicationIdMap));
            console.log(`Removed job ${jobId} from applicationIdMap`);
        }
    } catch (e) {
        console.error('Error updating applicationIdMap:', e);
    }
    
    // Update cachedApplications
    try {
        let cachedApplications = localStorage.getItem('cachedApplications');
        if (cachedApplications) {
            let parsed = JSON.parse(cachedApplications);
            
            // Handle both array and object formats
            if (Array.isArray(parsed)) {
                parsed = parsed.filter(app => {
                    const appJobId = app.job_id || app.listing_id || app.jobId;
                    return String(appJobId) !== jobId;
                });
                localStorage.setItem('cachedApplications', JSON.stringify(parsed));
                console.log(`Removed job ${jobId} from cachedApplications array`);
            } else if (parsed && Array.isArray(parsed.applications)) {
                parsed.applications = parsed.applications.filter(app => {
                    const appJobId = app.job_id || app.listing_id || app.jobId;
                    return String(appJobId) !== jobId;
                });
                localStorage.setItem('cachedApplications', JSON.stringify(parsed));
                console.log(`Removed job ${jobId} from cachedApplications.applications`);
            }
        }
    } catch (e) {
        console.error('Error updating cachedApplications:', e);
    }
    
    // Clear any in-memory caches if they exist
    if (window.appliedJobCache) {
        window.appliedJobCache[jobId] = false;
    }
    if (window.hasAppliedCache) {
        window.hasAppliedCache[jobId] = false;
    }
    
    console.log(`Successfully updated all localStorage after cancellation of job ${jobId}`);
}

/**
 * Load and display user applications
 * @param {boolean} forceRefresh - Whether to force a refresh from the server instead of using cache
 * @returns {Promise<Array>} - Array of applications
 */
async function loadApplications(forceRefresh = false) {
    try {
        // Show loading indicator
        showLoadingIndicator();
        
        console.log('Starting to load applications, API Base URL:', BASE_URL);
        
        const token = getAuthToken();
        if (!token) {
            console.warn('Authentication required. No token found.');
            
            // In development mode, still show mock data
            if (DEVELOPMENT_MODE) {
                console.log('Using mock data in development mode without authentication');
                renderApplications(MOCK_APPLICATIONS);
                showNotification('Using demo data - authentication required', 'warning');
                hideLoadingIndicator();
                return MOCK_APPLICATIONS;
            }
            
            showNotification('Authentication required. Please log in to view your applications', 'error');
            setTimeout(() => {
                window.location.href = '/student/mpl-login.html';
            }, 2000);
            return [];
        }
        
        // Check if we should use cached data
        const cachedData = localStorage.getItem('cachedApplications');
        const cacheTimestamp = localStorage.getItem('applicationsLastFetched');
        const currentTime = new Date().getTime();
        const cacheAge = cacheTimestamp ? currentTime - parseInt(cacheTimestamp) : Infinity;
        const maxCacheAge = 5 * 60 * 1000; // 5 minutes
        
        let applications = [];
        
        // Use cache if available, not too old, and not forcing refresh
        if (cachedData && cacheAge < maxCacheAge && !forceRefresh) {
            console.log(`Using cached applications data (${Math.round(cacheAge/1000)}s old)`);
            try {
                const parsedData = JSON.parse(cachedData);
                applications = parsedData.applications || [];
                
                // Render the cached applications right away
                renderApplications(applications);
                
                // If cache is older than 1 minute, trigger a background refresh
                if (cacheAge > 60000) {
                    console.log('Cache is older than 1 minute, refreshing in background');
                    setTimeout(() => loadApplications(true), 100);
                    return applications;
                }
            } catch (parseError) {
                console.error('Error parsing cached applications:', parseError);
                // Continue to fetch fresh data if cache parsing fails
            }
        }
        
        // Check for connectivity
        const isConnected = await checkApiConnectivity();
        if (!isConnected) {
            // If we have cache (even if old), use it when offline
            if (cachedData) {
                try {
                    const parsedData = JSON.parse(cachedData);
                    applications = parsedData.applications || [];
                    renderApplications(applications);
                    showNotification('Offline mode - Showing cached applications data', 'warning');
                    hideLoadingIndicator();
                    return applications;
                } catch (e) {
                    console.warn('Error using cached data:', e);
                }
            }
            
            showEmptyState('Cannot load applications while offline');
            hideLoadingIndicator();
            return [];
        }
        
        // Fetch applications from server - try multiple endpoints
        console.log('Fetching applications from server...');
        
        // Define possible API endpoints to try in order
        const endpoints = [
            `${BASE_URL}/applications/my-applications`
        ];
        
        console.log('Trying these endpoints in order:', endpoints);
        
        let fetchSuccess = false;
        let fetchError = null;
        
        // Try each endpoint until one succeeds
        for (const endpoint of endpoints) {
            try {
                console.log(`Attempting to fetch applications from: ${endpoint}`);
                const response = await fetch(endpoint, {
                    method: 'GET',
            headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    // Check if the response is JSON
                    const contentType = response.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) {
                        throw new Error(`Server returned non-JSON response (Content-Type: ${contentType})`);
                    }
        const data = await response.json();
                    applications = data.applications || data.data || [];
                    console.log(`Successfully fetched ${applications.length} applications from ${endpoint}`);
                    fetchSuccess = true;
                    break;
                } else if (response.status === 401) {
                    // Handle auth error
                    console.error('Authentication error:', response.statusText);
                    throw new Error('Your session has expired. Please log in again.');
        } else {
                    console.warn(`Endpoint ${endpoint} returned status ${response.status}`);
                    fetchError = new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
                console.warn(`Error fetching from ${endpoint}:`, error.message);
                fetchError = error;
            }
        }
        
        if (!fetchSuccess) {
            console.error('Failed to fetch applications from all API endpoints');
            
            // If we're in development mode, use mock data
            if (DEVELOPMENT_MODE) {
                console.log('Using mock applications data in development mode');
                applications = MOCK_APPLICATIONS;
                renderApplications(applications);
                showNotification('Using demo data - API server unreachable', 'warning');
                hideLoadingIndicator();
                return applications;
            }
            
            if (fetchError && fetchError.message.includes('expired')) {
                // Clear invalid token and redirect to login
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                throw new Error('Authentication expired. Please log in again.');
            } else {
                throw fetchError || new Error('Failed to fetch applications from all endpoints');
            }
        }
        
        // Process and cache applications
        console.log(`Loaded ${applications.length} applications from server`);
        
        // Enhance applications with additional job details if needed
        await enhanceApplicationsWithJobDetails(applications);
        
        // Update cache
        localStorage.setItem('cachedApplications', JSON.stringify({ applications }));
        localStorage.setItem('applicationsLastFetched', currentTime.toString());
        
        // Render applications
        renderApplications(applications);
        
        return applications;
    } catch (error) {
        console.error('Error loading applications:', error);
        
        // Show helpful error based on error type
        let errorMessage = 'Failed to load applications.';
        
        if (error.message.includes('fetch')) {
            errorMessage = 'Network error: Failed to connect to the application server.';
        } else if (error.message.includes('parse')) {
            errorMessage = 'Error processing application data.';
        } else if (error.message.includes('login') || error.message.includes('expired') || error.message.includes('Authentication')) {
            errorMessage = 'Authentication error: Please log in again.';
            setTimeout(() => {
                window.location.href = '/student/mpl-login.html';
            }, 3000);
        } else if (error.message.includes('404')) {
            errorMessage = 'Server error: The requested resource was not found.';
        } else if (error.message) {
            // Use the original error message if it's helpful
            errorMessage = `Error: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
        showEmptyState('Failed to load applications. Please try again later.');
        return [];
    } finally {
        hideLoadingIndicator();
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    console.log('Setting up event listeners for application actions');
    
    // Close buttons for modals
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            // Close the parent modal
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Global event listener for action buttons - handles dynamically created buttons
    document.addEventListener('click', function(event) {
        // Handle preview button clicks
        const previewBtn = event.target.closest('.preview-btn');
        if (previewBtn) {
            event.preventDefault();
            const applicationId = previewBtn.dataset.applicationId;
            const jobId = previewBtn.dataset.jobId;
            console.log(`Preview button clicked for application ${applicationId}, job ${jobId}`);
            
            // Find the application in the cached data
            const cachedData = localStorage.getItem('cachedApplications');
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    if (parsed.applications && Array.isArray(parsed.applications)) {
                        const application = parsed.applications.find(app => 
                            (app.id && app.id.toString() === applicationId) || 
                            (app.application_id && app.application_id.toString() === applicationId)
                        );
                        
                        if (application) {
                            // Get job ID from application
                            const jobIdToPreview = jobId || application.job_id || application.listing_id;
                            
                            if (jobIdToPreview) {
                                loadJobPreview(jobIdToPreview);
            } else {
                                showApplicationDetails(application);
                            }
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('Error finding application in cache:', e);
                }
            }
            
            // If we couldn't find the application in the cache, try to show application details
            showApplicationDetails(applicationId);
            return;
        }
        
        // Handle edit button clicks
        const editBtn = event.target.closest('.edit-btn');
        if (editBtn) {
            event.preventDefault();
            const applicationId = editBtn.dataset.applicationId;
            console.log(`Edit button clicked for application ${applicationId}`);
            
            // Find the application in the cached data
            const cachedData = localStorage.getItem('cachedApplications');
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    if (parsed.applications && Array.isArray(parsed.applications)) {
                        const application = parsed.applications.find(app => 
                            (app.id && app.id.toString() === applicationId) || 
                            (app.application_id && app.application_id.toString() === applicationId)
                        );
                        
                        if (application) {
                            editApplication(application);
                return;
                        }
                    }
            } catch (e) {
                    console.warn('Error finding application in cache:', e);
                }
            }
            
            showErrorNotification("Cannot edit: Application data not found");
                return;
        }
        
        // Handle delete button clicks
        const deleteBtn = event.target.closest('.delete-btn');
        if (deleteBtn) {
            event.preventDefault();
            const applicationId = deleteBtn.dataset.applicationId;
            const jobId = deleteBtn.dataset.jobId;
            console.log(`Delete button clicked for application ${applicationId}, job ${jobId}`);
            
            if (applicationId) {
                // Store IDs in global variables for access in confirmation handler
                window.currentApplicationId = applicationId;
                window.currentJobId = jobId;
                
                // Update confirmation modal for delete action
                const confirmModal = document.getElementById('confirmModal');
                const modalTitle = confirmModal?.querySelector('.modal-title');
                if (modalTitle) {
                    modalTitle.textContent = 'Delete Application';
                }
                
                const confirmMessage = confirmModal?.querySelector('.confirm-message');
                if (confirmMessage) {
                    confirmMessage.textContent = "Are you sure you want to delete this application? This action cannot be undone.";
                }
                
                // Update confirm button text
                const confirmBtn = document.getElementById('confirmCancelBtn');
                if (confirmBtn) {
                    confirmBtn.textContent = 'Delete Application';
                    
                    // Remove previous event listeners by cloning the button
                    const newBtn = confirmBtn.cloneNode(true);
                    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
                    
                    // Add delete-specific event listener
                    newBtn.addEventListener('click', function() {
                        if (window.currentApplicationId) {
                            console.log(`Confirming deletion of application ${window.currentApplicationId}`);
                            deleteApplication(window.currentApplicationId);
                        } else {
                            console.error("No application ID available for deletion");
                            showErrorNotification("Error: Application information is missing");
                            hideCancelConfirmation();
                        }
                    });
                }
                
                // Show the modal
                if (confirmModal) {
                    confirmModal.style.display = 'block';
    } else {
                    showErrorNotification("Error: Confirmation dialog not found");
                }
            } else {
                showErrorNotification("Cannot delete: Missing application information");
            }
            return;
        }
        
        // Legacy support for cancel application buttons
        const cancelButton = event.target.closest('.cancel-application-btn');
        if (cancelButton) {
            event.preventDefault();
            const applicationId = cancelButton.dataset.applicationId;
            const jobId = cancelButton.dataset.jobId;
            console.log(`Cancel button clicked for application ${applicationId}, job ${jobId}`);
            
            if (applicationId) {
                showCancelConfirmation(applicationId, jobId);
            } else {
                showErrorNotification("Cannot cancel: Missing application information");
            }
        }
    });
    
    // Set up event listeners for confirm/cancel buttons in the modal
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    if (confirmCancelBtn) {
        console.log('Found confirmCancelBtn, attaching click event');
        confirmCancelBtn.addEventListener('click', function() {
            console.log('Confirm cancel button clicked');
            if (window.currentApplicationId) {
                console.log(`Confirming cancellation of application ${window.currentApplicationId}`);
                cancelApplication(window.currentApplicationId)
                    .then(success => {
                        if (success) {
                            console.log("Application successfully canceled");
                        }
                    })
                    .catch(error => {
                        console.error("Error in application cancellation:", error);
                    });
            } else {
                console.error("No application ID available for cancellation");
                showErrorNotification("Error: Application information is missing");
                hideCancelConfirmation();
            }
        });
    } else {
        console.warn('confirmCancelBtn not found in the DOM during setup');
        
        // Try again after a short delay as the DOM might not be fully loaded
        setTimeout(() => {
            const delayedBtn = document.getElementById('confirmCancelBtn');
            if (delayedBtn) {
                console.log('Found confirmCancelBtn on delayed check, attaching click event');
                delayedBtn.addEventListener('click', function() {
                    if (window.currentApplicationId) {
                        console.log(`Confirming cancellation of application ${window.currentApplicationId}`);
                        cancelApplication(window.currentApplicationId);
                    } else {
                        console.error("No application ID available for cancellation");
                        showErrorNotification("Error: Application information is missing");
                        hideCancelConfirmation();
                    }
                });
            } else {
                console.error('confirmCancelBtn still not found after delay');
            }
        }, 500);
    }
    
    // Add event listener for the cancel button in the modal
    const closeModalBtns = document.querySelectorAll('.close-modal-btn, .btn-close, [data-dismiss="modal"]');
    closeModalBtns.forEach(btn => {
        console.log('Found close button, attaching event', btn);
        btn.addEventListener('click', hideCancelConfirmation);
    });
    
    // Add refresh button event listener
    const refreshButton = document.getElementById('refreshBtn');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            loadApplications(true); // Force refresh
        });
    }
    
    // Setup pull-to-refresh functionality if supported
    if ('PullToRefresh' in window) {
        PullToRefresh.init({
            mainElement: '#application-list-container',
            onRefresh: function() {
                return loadApplications(true);
            }
        });
    }
    
    // When the user clicks anywhere outside of a modal, close it
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Function to handle API unavailability and still render applications
function useMockDataIfNeeded() {
    // Check if API is down and we're showing an error
    const errorMessage = document.querySelector('.empty-state.error-state');
    if (errorMessage) {
        console.log('API appears to be down, using mock data');
        renderApplications(MOCK_APPLICATIONS);
        showNotification('Using demo data - API server unavailable', 'info');
    }
}

/**
 * Load and display applications with most current data
 * @param {boolean} forceRefresh - Whether to force refresh from server
 */
async function loadAndDisplayApplications(forceRefresh = true) {
    try {
        showLoadingIndicator();
        
        console.log('Loading and displaying applications with fresh data');
        
        // Fetch applications, force refresh from server
        const applications = await loadApplications(forceRefresh);
        
        // Expose sync function globally if it doesn't exist already
        if (typeof window.forceApplicationStateSyncWithServer !== 'function') {
            window.forceApplicationStateSyncWithServer = async function() {
                console.log('Global sync function called');
                const freshApps = await loadApplications(true);
                
                // Update all localStorage entries with fresh data
                const appliedJobs = freshApps
                    .filter(app => app.status?.toLowerCase() !== 'withdrawn')
                    .map(app => String(app.job_id || app.listing_id));
                
                localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
                localStorage.setItem('appliedJobsFromServer', JSON.stringify(appliedJobs));
                
                // Update withdrawnJobsMap
                const withdrawnJobsMap = {};
                freshApps
                    .filter(app => app.status?.toLowerCase() === 'withdrawn')
                    .forEach(app => {
                        const jobId = String(app.job_id || app.listing_id);
                        withdrawnJobsMap[jobId] = Date.now();
                    });
                
                localStorage.setItem('withdrawnJobsMap', JSON.stringify(withdrawnJobsMap));
                
                // Trigger UI update if the function exists
                if (typeof updateJobListingUI === 'function') {
                    updateJobListingUI();
                }
                
                return freshApps;
            };
            
            console.log('Global sync function registered');
        }
        
        // Add a refresh button if it doesn't exist
        if (!document.getElementById('refresh-apps-btn')) {
            const actionBar = document.querySelector('.action-bar') || 
                             document.querySelector('.filters') || 
                             document.querySelector('header');
            
            if (actionBar) {
                const refreshBtn = document.createElement('button');
                refreshBtn.id = 'refresh-apps-btn';
                refreshBtn.className = 'btn btn-refresh';
                refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh Data';
                refreshBtn.addEventListener('click', () => loadAndDisplayApplications(true));
                actionBar.appendChild(refreshBtn);
            }
        }
        
        return applications;
    } catch (error) {
        console.error('Error loading and displaying applications:', error);
        showErrorNotification('Failed to load applications: ' + error.message);
    } finally {
        hideLoadingIndicator();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Applications script loaded, setting up event listeners and initializing');
    
    // Initialize tracking of withdrawn applications
    initializeWithdrawalTracking();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load applications with fresh server data
    loadAndDisplayApplications(true).catch(err => {
        console.error("Error loading applications:", err);
        // Fall back to mock data after 2 seconds if loading fails
        setTimeout(useMockDataIfNeeded, 2000);
    });
    
    // Request notification permission if needed
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
});

/**
 * Show application details in modal
 * @param {Object|string} applicationOrId - Application object or application ID
 */
async function showApplicationDetails(applicationOrId) {
    try {
        // Show loading in modal
        const applicationModal = document.getElementById('applicationModal');
        const applicationDetailsContainer = document.getElementById('application-details');
        
        if (!applicationModal || !applicationDetailsContainer) {
            console.error('Application modal or details container not found');
            return;
        }
        
        // Show the modal with loading
        applicationModal.style.display = 'block';
        applicationDetailsContainer.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading application details...</p>
            </div>
        `;
        
        // Get application details
        let application;
        let applicationId;
        
        if (typeof applicationOrId === 'string' || typeof applicationOrId === 'number') {
            applicationId = applicationOrId;
            
            // Try to find application in cached applications
            const cachedData = localStorage.getItem('cachedApplications');
            if (cachedData) {
                try {
                    const parsedData = JSON.parse(cachedData);
                    const applications = parsedData.applications || [];
                    application = applications.find(app => 
                        (app.id && app.id.toString() === applicationId.toString()) || 
                        (app.application_id && app.application_id.toString() === applicationId.toString())
                    );
                } catch (e) {
                    console.warn('Error parsing cached applications:', e);
                }
            }
            
            // If not found in cache, fetch from server
            if (!application) {
                const token = getAuthToken();
                if (!token) {
                    throw new Error('Authentication required');
                }
                
                // Fetch application details from server
                const response = await fetch(`${BASE_URL}/applications/${applicationId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch application details: ${response.statusText}`);
                }
                
                    const data = await response.json();
                application = data.application || data;
            }
                } else {
            // Use provided application object
            application = applicationOrId;
            applicationId = application.id || application.application_id;
        }
        
        if (!application) {
            throw new Error('Application not found');
        }
        
        // Get job details for this application
        const jobId = application.job_id || application.listing_id;
        let jobDetails = null;
        
        if (jobId) {
            try {
                // Try to get from cache first
                const jobDetailsCache = JSON.parse(localStorage.getItem('jobDetailsCache') || '{}');
                const cachedJob = jobDetailsCache[jobId];
                
                if (cachedJob) {
                    jobDetails = cachedJob;
                } else {
                    // Fetch job details from server
                    const token = getAuthToken();
                    const response = await fetch(`${BASE_URL}/jobs/${jobId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        jobDetails = data.job || data;
                        
                        // Update cache
                        jobDetailsCache[jobId] = jobDetails;
                        localStorage.setItem('jobDetailsCache', JSON.stringify(jobDetailsCache));
                    }
                }
            } catch (error) {
                console.warn(`Error fetching job details for job ${jobId}:`, error);
            }
        }
        
        // Combine application with job details
        const combinedData = {
            ...application,
            job: jobDetails || {}
        };
        
        // Ensure we have position title and company name
        combinedData.position_title = combinedData.position_title || 
                                     combinedData.job.title || 
                                     combinedData.job.position_title || 
                                     'Unknown Position';
                                     
        combinedData.company_name = combinedData.company_name || 
                                   combinedData.job.company_name || 
                                   combinedData.job.employer_name || 
                                   'Unknown Company';
        
        // Render application details
        renderApplicationDetails(combinedData);
        
    } catch (error) {
        console.error('Error showing application details:', error);
        
        // Show error in modal
        const applicationDetailsContainer = document.getElementById('application-details');
        if (applicationDetailsContainer) {
            applicationDetailsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading application details: ${error.message}</p>
                    <button class="btn btn-primary retry-btn">Retry</button>
                </div>
            `;
            
            // Add retry button event listener
            const retryBtn = applicationDetailsContainer.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    showApplicationDetails(applicationOrId);
                });
            }
        }
    }
}

/**
 * Render application details in the modal
 * @param {Object} application - The application object with job details
 */
function renderApplicationDetails(application) {
    const applicationDetailsContainer = document.getElementById('application-details');
    if (!applicationDetailsContainer) return;
    
    // Format the status for display
    const status = application.status || 'pending';
    const statusClass = getStatusClass(status);
    const formattedStatus = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Format the date
    const appliedDate = new Date(application.applied_at || application.application_date || application.created_at);
    const formattedDate = formatDate(appliedDate);
    
    // Job and company details
    const positionTitle = application.position_title || application.job_title || 'Unknown Position';
    const companyName = application.company_name || application.employer_name || 'Unknown Company';
    const jobLocation = application.location || application.job?.location || '';
    
    // Cover letter
    const coverLetter = application.cover_letter || application.coverLetter || '';
    
    // Additional job details from the associated job
    const jobDescription = application.job?.description || application.description || '';
    const requirements = application.job?.requirements || [];
    const salary = application.job?.salary || application.job?.salary_range || '';
    const jobType = application.job?.job_type || application.job_type || '';
    
    // Check if user can withdraw application
    const canWithdraw = status.toLowerCase() === 'pending' || status.toLowerCase() === 'under_review' || status.toLowerCase() === 'under review';
    
    applicationDetailsContainer.innerHTML = `
        <div class="application-header">
            <h3 class="job-title">${escapeHtml(positionTitle)}</h3>
            <span class="application-status ${statusClass}">${escapeHtml(formattedStatus)}</span>
        </div>
        
        <div class="application-detail">
            <div class="detail-label">Company</div>
            <div class="detail-value">${escapeHtml(companyName)}</div>
        </div>
        
        ${jobLocation ? `
        <div class="application-detail">
            <div class="detail-label">Location</div>
            <div class="detail-value">${escapeHtml(jobLocation)}</div>
        </div>
        ` : ''}
        
        <div class="application-detail">
            <div class="detail-label">Date Applied</div>
            <div class="detail-value">${formattedDate}</div>
        </div>
        
        ${jobType ? `
        <div class="application-detail">
            <div class="detail-label">Job Type</div>
            <div class="detail-value">${escapeHtml(jobType)}</div>
        </div>
        ` : ''}
        
        ${salary ? `
        <div class="application-detail">
            <div class="detail-label">Salary</div>
            <div class="detail-value">${escapeHtml(salary)}</div>
        </div>
        ` : ''}
        
        ${jobDescription ? `
        <div class="application-detail">
            <div class="detail-label">Job Description</div>
            <div class="detail-value job-description">${escapeHtml(jobDescription)}</div>
        </div>
        ` : ''}
        
        ${requirements && requirements.length > 0 ? `
        <div class="application-detail">
            <div class="detail-label">Requirements</div>
            <div class="detail-value">
                <ul class="requirements-list">
                    ${requirements.map(req => `<li>${escapeHtml(req)}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}
        
        ${coverLetter ? `
        <div class="application-detail">
            <div class="detail-label">Your Cover Letter</div>
            <div class="cover-letter">${escapeHtml(coverLetter)}</div>
        </div>
        ` : ''}
        
        ${canWithdraw ? `
        <div class="modal-actions">
            <button class="btn btn-outline withdraw-btn cancel-application-btn" data-application-id="${application.id || application.application_id}" data-job-id="${application.job_id || application.listing_id}">
                <i class="fas fa-times-circle"></i> Withdraw Application
            </button>
        </div>
        ` : ''}
    `;
    
    // Add event listener to withdraw button if present
    const withdrawBtn = applicationDetailsContainer.querySelector('.withdraw-btn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Close the details modal
            const applicationModal = document.getElementById('applicationModal');
            if (applicationModal) {
                applicationModal.style.display = 'none';
            }
            
            // Show confirmation
            const applicationId = this.dataset.applicationId;
            const jobId = this.dataset.jobId;
            showCancelConfirmation(applicationId, jobId);
        });
    }
}

/**
 * Handles editing an application
 * @param {Object} application - The application object to edit
 */
function editApplication(application) {
    try {
        // Get the application ID
        const applicationId = application.id || application.application_id;
        if (!applicationId) {
            showErrorNotification("Cannot edit: Missing application ID");
            return;
        }
        
        console.log(`Editing application ${applicationId}`);
        
        // Check if we have a token
        const token = getAuthToken();
        if (!token) {
            showErrorNotification("Authentication required to edit applications");
            return;
        }
        
        // Show the application edit modal
        const applicationModal = document.getElementById('applicationModal');
        const applicationDetailsContainer = document.getElementById('application-details');
        
        if (!applicationModal || !applicationDetailsContainer) {
            showErrorNotification("Error: Application edit dialog not found");
            return;
        }
        
        // Update modal title
        const modalTitle = applicationModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Application';
        }
        
        // Show the modal with loading state
        applicationModal.style.display = 'block';
        applicationDetailsContainer.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading application for editing...</p>
            </div>
        `;
        
        // Prepare application data for editing
        setTimeout(() => {
            const positionTitle = application.position_title || application.job_title || "Unknown Position";
            const companyName = application.company_name || application.employer_name || "Unknown Company";
            const coverLetter = application.cover_letter || application.coverLetter || '';
            const status = application.status || 'pending';
            
            // Create edit form
            applicationDetailsContainer.innerHTML = `
                <form id="editApplicationForm" class="edit-application-form">
                    <input type="hidden" name="applicationId" value="${applicationId}">
                    
                    <div class="form-group">
                        <label for="positionTitle">Position Title</label>
                        <input type="text" id="positionTitle" name="positionTitle" class="form-control" 
                               value="${escapeHtml(positionTitle)}" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label for="companyName">Company</label>
                        <input type="text" id="companyName" name="companyName" class="form-control" 
                               value="${escapeHtml(companyName)}" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label for="status">Application Status</label>
                        <select id="status" name="status" class="form-control">
                            <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="under_review" ${status === 'under_review' || status === 'under review' ? 'selected' : ''}>Under Review</option>
                            <option value="interview" ${status === 'interview' ? 'selected' : ''}>Interview</option>
                            <option value="accepted" ${status === 'accepted' ? 'selected' : ''}>Accepted</option>
                            <option value="rejected" ${status === 'rejected' ? 'selected' : ''}>Rejected</option>
                            <option value="withdrawn" ${status === 'withdrawn' ? 'selected' : ''}>Withdrawn</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="coverLetter">Cover Letter</label>
                        <textarea id="coverLetter" name="coverLetter" class="form-control" rows="8">${escapeHtml(coverLetter)}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="cancelEditBtn">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="saveApplicationBtn">Save Changes</button>
                    </div>
                </form>
            `;
            
            // Add event listeners for the form
            const editForm = document.getElementById('editApplicationForm');
            if (editForm) {
                editForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    saveApplicationChanges(this, application);
                });
            }
            
            // Add event listener for cancel button
            const cancelEditBtn = document.getElementById('cancelEditBtn');
            if (cancelEditBtn) {
                cancelEditBtn.addEventListener('click', function() {
                    // Hide the modal
                    if (applicationModal) {
                        applicationModal.style.display = 'none';
                    }
                });
            }
        }, 500);
    } catch (error) {
        console.error("Error in editApplication:", error);
        showErrorNotification("Failed to open application for editing");
    }
}

/**
 * Save changes to an application
 * @param {HTMLFormElement} form - The form element containing the data
 * @param {Object} originalApplication - The original application data
 */
async function saveApplicationChanges(form, originalApplication) {
    try {
        showLoadingIndicator();
        
        // Get form data
        const formData = new FormData(form);
        const applicationId = formData.get('applicationId');
        const status = formData.get('status');
        const coverLetter = formData.get('coverLetter');
        
        if (!applicationId) {
            throw new Error("Application ID is required");
        }
        
        console.log(`Saving changes to application ${applicationId}`);
        
        const token = getAuthToken();
        if (!token) {
            throw new Error("Authentication required");
        }
        
        // Prepare the update data
        const updateData = {
            status: status,
            cover_letter: coverLetter
        };
        
        // Define possible API endpoints to try
        const endpoints = [
            `${BASE_URL}/applications/${applicationId}`,
            `${BASE_URL}/applications/${applicationId}/update`,
            `${BASE_URL}/student/applications/${applicationId}`,
        ];
        
        let success = false;
        let error = null;
        
        // Try each endpoint in sequence
        for (let i = 0; i < endpoints.length; i++) {
            try {
                const endpoint = endpoints[i];
                console.log(`Attempting to save application changes with endpoint: ${endpoint}`);
                
                const response = await fetch(endpoint, {
                    method: 'PUT',  // Use PUT for updates
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (response.ok) {
                    console.log(`Successfully updated application with endpoint ${i+1}`);
                    success = true;
                    break;
                } else {
                    console.warn(`Endpoint ${i+1} failed with status: ${response.status}`);
                    error = new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
            } catch (err) {
                console.warn(`Error with endpoint ${i+1}:`, err);
                error = err;
            }
        }
        
        if (success) {
            // Update the application in local cache
            const cachedData = localStorage.getItem('cachedApplications');
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    if (parsed.applications && Array.isArray(parsed.applications)) {
                        // Find and update the application
                        const appIndex = parsed.applications.findIndex(app => 
                            (app.id && app.id.toString() === applicationId.toString()) || 
                            (app.application_id && app.application_id.toString() === applicationId.toString())
                        );
                        
                        if (appIndex !== -1) {
                            parsed.applications[appIndex] = {
                                ...parsed.applications[appIndex],
                                status: status,
                                cover_letter: coverLetter,
                                coverLetter: coverLetter
                            };
                            
                            localStorage.setItem('cachedApplications', JSON.stringify(parsed));
                        }
                    }
                } catch (e) {
                    console.warn('Error updating cached application:', e);
                }
            }
            
            // Show success notification
            showSuccessNotification('Application successfully updated');
            
            // Close the modal
            const applicationModal = document.getElementById('applicationModal');
            if (applicationModal) {
                applicationModal.style.display = 'none';
            }
            
            // Refresh applications list after a short delay
            setTimeout(() => loadApplications(true), 1000);
        } else {
            // If API call failed but we're in development mode, simulate success
            if (DEVELOPMENT_MODE) {
                // Update the application locally only
                showSuccessNotification('Application updated in demo mode');
                
                // Close the modal
                const applicationModal = document.getElementById('applicationModal');
                if (applicationModal) {
                    applicationModal.style.display = 'none';
                }
                
                // Refresh with local updates
                setTimeout(() => {
                    const cachedData = localStorage.getItem('cachedApplications');
                    if (cachedData) {
                        try {
                            const parsed = JSON.parse(cachedData);
                            if (parsed.applications && Array.isArray(parsed.applications)) {
                                // Find and update the application
                                const appIndex = parsed.applications.findIndex(app => 
                                    (app.id && app.id.toString() === applicationId.toString()) || 
                                    (app.application_id && app.application_id.toString() === applicationId.toString())
                                );
                                
                                if (appIndex !== -1) {
                                    parsed.applications[appIndex] = {
                                        ...parsed.applications[appIndex],
                                        status: status,
                                        cover_letter: coverLetter,
                                        coverLetter: coverLetter
                                    };
                                    
                                    localStorage.setItem('cachedApplications', JSON.stringify(parsed));
                                    renderApplications(parsed.applications);
                                }
                            }
                        } catch (e) {
                            console.warn('Error updating cached application:', e);
                        }
                    }
                }, 1000);
                
                return;
            }
            
            throw error || new Error("Failed to update application");
        }
    } catch (error) {
        console.error("Error saving application changes:", error);
        showErrorNotification(`Failed to update application: ${error.message}`);
    } finally {
        hideLoadingIndicator();
    }
}

/**
 * Loads and displays a job preview in a modal
 * @param {string|number} jobId - The ID of the job to preview
 */
async function loadJobPreview(jobId) {
    try {
        if (!jobId) {
            throw new Error("Job ID is required for preview");
        }
        
        console.log(`Loading preview for job ${jobId}`);
        
        // Show the application modal with loading state
        const applicationModal = document.getElementById('applicationModal');
        const applicationDetailsContainer = document.getElementById('application-details');
        
        if (!applicationModal || !applicationDetailsContainer) {
            throw new Error("Preview dialog not found");
        }
        
        // Update modal title
        const modalTitle = applicationModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Job Preview';
        }
        
        // Show the modal with loading state
        applicationModal.style.display = 'block';
        applicationDetailsContainer.innerHTML = `
            <div class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading job details...</p>
            </div>
        `;
        
        // Check if we have a token
        const token = getAuthToken();
        
        // Try to find job details in cache first
        const jobDetailsCache = JSON.parse(localStorage.getItem('jobDetailsCache') || '{}');
        const cachedJob = jobDetailsCache[jobId];
        
        let jobDetails = null;
        
        if (cachedJob) {
            console.log('Using cached job details');
            jobDetails = cachedJob;
            renderJobPreview(jobDetails);
        } else {
            // Need to fetch from server
            console.log('Fetching job details from server');
            
            // Define possible API endpoints to try
            const endpoints = [
                `${BASE_URL}/jobs/${jobId}`,
                `${BASE_URL}/job-listings/${jobId}`,
                `${BASE_URL}/listings/${jobId}`
            ];
            
            let fetchSuccess = false;
            
            // Try each endpoint
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying to fetch job details from: ${endpoint}`);
                    
                    const headers = {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };
                    
                    // Add auth token if available
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                    
                    const response = await fetch(endpoint, {
                        method: 'GET',
                        headers: headers
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        jobDetails = data.job || data.listing || data;
                        
                        // Cache the job details
                        jobDetailsCache[jobId] = jobDetails;
                        localStorage.setItem('jobDetailsCache', JSON.stringify(jobDetailsCache));
                        
                        console.log('Successfully fetched job details');
                        fetchSuccess = true;
                        break;
                    } else {
                        console.warn(`Failed to fetch from ${endpoint}: ${response.status}`);
                    }
                } catch (error) {
                    console.warn(`Error fetching from ${endpoint}:`, error);
                }
            }
            
            if (fetchSuccess && jobDetails) {
                renderJobPreview(jobDetails);
            } else {
                // If all endpoints failed but we're in development mode
                if (DEVELOPMENT_MODE) {
                    // Create mock job details
                    jobDetails = {
                        id: jobId,
                        title: "Sample Job Position",
                        company_name: "Demo Company",
                        description: "This is a sample job description for demonstration purposes.",
                        location: "Sample Location",
                        salary_range: "$40,000 - $60,000",
                        job_type: "Full-time",
                        created_at: new Date().toISOString(),
                        requirements: [
                            "Bachelor's degree in related field",
                            "1-2 years of experience",
                            "Strong communication skills"
                        ]
                    };
                    
                    renderJobPreview(jobDetails);
                    showInfoNotification('Using demo data - job details not available from server');
                } else {
                    throw new Error("Failed to load job details from server");
                }
            }
        }
    } catch (error) {
        console.error("Error loading job preview:", error);
        showErrorNotification(`Failed to load job preview: ${error.message}`);
        
        // Update modal with error
        const applicationDetailsContainer = document.getElementById('application-details');
        if (applicationDetailsContainer) {
            applicationDetailsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading job details: ${error.message}</p>
                    <button class="btn btn-primary close-modal-btn">Close</button>
                </div>
            `;
            
            // Add event listener to close button
            const closeBtn = applicationDetailsContainer.querySelector('.close-modal-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    const modal = document.getElementById('applicationModal');
                    if (modal) modal.style.display = 'none';
                });
            }
        }
    }
}

/**
 * Renders job preview in the modal
 * @param {Object} jobDetails - The job details to render
 */
function renderJobPreview(jobDetails) {
    const applicationDetailsContainer = document.getElementById('application-details');
    if (!applicationDetailsContainer) return;
    
    // Format creation date
    const createdDate = new Date(jobDetails.created_at || jobDetails.posted_date || new Date());
    const formattedDate = formatDate(createdDate);
    
    // Prepare requirements list if available
    const requirementsList = jobDetails.requirements && Array.isArray(jobDetails.requirements) 
        ? jobDetails.requirements.map(req => `<li>${escapeHtml(req)}</li>`).join('')
        : '';
    
    applicationDetailsContainer.innerHTML = `
        <div class="job-preview">
        <div class="application-detail">
                <div class="detail-label">Position Title</div>
                <div class="detail-value">${escapeHtml(jobDetails.title || jobDetails.position_title || 'Not specified')}</div>
        </div>
        
        <div class="application-detail">
            <div class="detail-label">Company</div>
                <div class="detail-value">${escapeHtml(jobDetails.company_name || jobDetails.employer_name || 'Not specified')}</div>
        </div>
        
            ${jobDetails.location ? `
        <div class="application-detail">
            <div class="detail-label">Location</div>
                <div class="detail-value">${escapeHtml(jobDetails.location)}</div>
        </div>
            ` : ''}
        
            ${jobDetails.job_type ? `
        <div class="application-detail">
                <div class="detail-label">Job Type</div>
                <div class="detail-value">${escapeHtml(jobDetails.job_type)}</div>
        </div>
            ` : ''}
        
            ${jobDetails.salary_range ? `
        <div class="application-detail">
                <div class="detail-label">Salary Range</div>
                <div class="detail-value">${escapeHtml(jobDetails.salary_range)}</div>
            </div>
            ` : ''}
        
        <div class="application-detail">
                <div class="detail-label">Posted Date</div>
                <div class="detail-value">${formattedDate}</div>
        </div>
        
            ${jobDetails.description ? `
        <div class="application-detail">
                <div class="detail-label">Description</div>
                <div class="detail-value job-description">${escapeHtml(jobDetails.description)}</div>
        </div>
            ` : ''}
        
            ${requirementsList ? `
        <div class="application-detail">
                <div class="detail-label">Requirements</div>
            <div class="detail-value">
                    <ul class="requirements-list">
                        ${requirementsList}
                </ul>
            </div>
        </div>
            ` : ''}
        
            <div class="modal-actions">
                <button class="btn btn-outline close-modal-btn">Close</button>
        </div>
        </div>
    `;
    
    // Add event listener to close button
    const closeBtn = applicationDetailsContainer.querySelector('.close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const modal = document.getElementById('applicationModal');
            if (modal) modal.style.display = 'none';
        });
    }
}

/**
 * Delete an application permanently
 * @param {string|number} applicationId - The ID of the application to delete
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
async function deleteApplication(applicationId) {
    try {
        // Use the global variable if no ID was provided
        applicationId = applicationId || window.currentApplicationId;
        
        if (!applicationId) {
            throw new Error("Application ID is required");
        }
        
        console.log(`Deleting application ${applicationId}`);
        showLoadingIndicator();
        
        const token = getAuthToken();
    if (!token) {
            throw new Error("Authentication required");
        }
        
        // Define possible API endpoints to try
        const endpoints = [
            `${BASE_URL}/applications/${applicationId}`,
            `${BASE_URL}/applications/${applicationId}/delete`,
            `${BASE_URL}/student/applications/${applicationId}`
        ];
        
        console.log(`Will try these endpoints to delete application ${applicationId}:`, endpoints);
        
        let success = false;
        let error = null;
        
        // Try each endpoint in sequence
        for (let i = 0; i < endpoints.length; i++) {
            try {
                const endpoint = endpoints[i];
                console.log(`Attempting deletion with endpoint: ${endpoint}`);
                
                const response = await fetch(endpoint, {
                    method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                        'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
                    }
        });
        
        if (response.ok) {
                    console.log(`Successfully deleted application with endpoint ${i+1}`);
                    success = true;
                    break;
                } else {
                    console.warn(`Endpoint ${i+1} failed with status: ${response.status}`);
                    error = new Error(`Server returned ${response.status}: ${response.statusText}`);
                }
            } catch (err) {
                console.warn(`Error with endpoint ${i+1}:`, err);
                error = err;
            }
        }
        
        if (success) {
            // Update UI
            const appElement = document.querySelector(`.application-card[data-application-id="${applicationId}"]`);
            if (appElement) {
                appElement.remove();
            }
            
            // Show success notification
            showSuccessNotification('Application successfully deleted');
            
            // Clear global variable
            window.currentApplicationId = null;
            window.currentJobId = null;
            
            // Refresh applications list after a short delay
            setTimeout(() => loadApplications(true), 1000);
            
            return true;
        } else if (DEVELOPMENT_MODE) {
            // In development mode, simulate success even if API calls fail
            console.log('DEV MODE: Simulating successful deletion');
            
            // Update cached data
            try {
                const cachedData = localStorage.getItem('cachedApplications');
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    if (parsed.applications && Array.isArray(parsed.applications)) {
                        // Filter out the deleted application
                        parsed.applications = parsed.applications.filter(app => 
                            (app.id && app.id.toString() !== applicationId.toString()) && 
                            (app.application_id && app.application_id.toString() !== applicationId.toString())
                        );
                        
                        localStorage.setItem('cachedApplications', JSON.stringify(parsed));
                    }
                }
            } catch (e) {
                console.warn('Error updating cached applications after deletion:', e);
            }
            
            // Update UI
            const appElement = document.querySelector(`.application-card[data-application-id="${applicationId}"]`);
            if (appElement) {
                appElement.remove();
            }
            
            // Show success notification
            showSuccessNotification('Application deleted (dev mode)');
            
            // Clear global variable
            window.currentApplicationId = null;
            window.currentJobId = null;
            
            return true;
        } else {
            throw error || new Error("Failed to delete application");
        }
    } catch (error) {
        console.error("Error deleting application:", error);
        showErrorNotification(`Failed to delete application: ${error.message}`);
        return false;
    } finally {
        hideLoadingIndicator();
        hideCancelConfirmation();
    }
}

// Add this to the end of loadApplications function in student/scripts/applications.js
function updateJobListingUI() {
  // Only target apply buttons, not all buttons with data-job-id
  const applyButtons = document.querySelectorAll('.apply-btn');
  
  // Get cached applications
  const cachedApplications = JSON.parse(localStorage.getItem('cachedApplications') || '{}');
  const applications = Array.isArray(cachedApplications) ? cachedApplications : 
                      (cachedApplications.applications || []);
  
  // Get locally stored application IDs
  const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
  const appliedJobsFromServer = JSON.parse(localStorage.getItem('appliedJobsFromServer') || '[]');
  
  // Check each button
  applyButtons.forEach(button => {
    const jobId = button.getAttribute('data-job-id');
    if (!jobId) return;
    
    // Check if this job is in any of our applied lists
    const isApplied = 
      appliedJobs.includes(jobId) || 
      appliedJobsFromServer.includes(jobId) ||
      applications.some(app => 
        (app.job_id == jobId || app.listing_id == jobId) && 
        app.status !== 'Withdrawn'
      );
    
    if (isApplied) {
      button.textContent = 'Applied';
      button.disabled = true;
      button.classList.remove('btn-primary');
      button.classList.add('btn-success', 'applied');
      
      // Also update the job card if it exists
      const jobCard = button.closest('.job-card');
      if (jobCard) {
        jobCard.classList.add('job-applied');
      }
    }
  });
}

// Call this function when page loads
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(updateJobListingUI, 500); // Small delay to let the page fully load
});

// Also add an event listener for when job listings are loaded
document.addEventListener('job-listings-loaded', updateJobListingUI);