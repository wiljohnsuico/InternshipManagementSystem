/**
 * Employer Applications UI Handler
 * This script handles the UI interactions for the applications page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    init().catch(error => {
        console.error('Initialization error:', error);
        showToast('Error initializing page: ' + error.message, 'error');
    });
});

// Global state
let applications = [];
let filteredApplications = [];
let currentPage = 1;
const itemsPerPage = 10;

// Initialize the page
async function init() {
    console.log('Initializing applications page');
    
    // Define APPLICATIONS_CONNECTOR if not available
    if (typeof APPLICATIONS_CONNECTOR === 'undefined') {
        console.warn('APPLICATIONS_CONNECTOR not found, using fallback');
        // Create a basic connector if the external one isn't loaded
        window.APPLICATIONS_CONNECTOR = {
            loadApplications: async function() {
                return JSON.parse(localStorage.getItem('mockApplications') || '[]');
            }
        };
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await loadAndDisplayApplications();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    // Initialize application stats
    updateApplicationStats();
}

// Load and display applications
async function loadAndDisplayApplications(showLoading = true) {
    try {
        if (showLoading) {
            document.getElementById('applicationsTable').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Loading applications...</td>
                </tr>
            `;
        }
        
        // Load applications using the connector
        applications = await APPLICATIONS_CONNECTOR.loadApplications();
        console.log('Loaded applications:', applications);
        
        // Update job filter dropdown
        updateJobFilterDropdown();
        
        // Apply filters and display
        filterAndDisplayApplications();
        
    } catch (error) {
        console.error('Error loading applications:', error);
        document.getElementById('applicationsTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    Error loading applications. Please try again later.
                </td>
            </tr>
        `;
        showToast('Error loading applications: ' + error.message, 'error');
    }
}

// Update job filter dropdown
function updateJobFilterDropdown() {
    const jobFilter = document.getElementById('jobFilter');
    if (!jobFilter) return;
    
    // Get unique job titles
    const jobTitles = [...new Set(applications.map(app => app.jobTitle))];
    
    // Sort alphabetically
    jobTitles.sort();
    
    // Update dropdown options
    jobFilter.innerHTML = '<option value="all">All Job Postings</option>' +
        jobTitles.map(title => `<option value="${title}">${title}</option>`).join('');
}

// Filter and display applications
function filterAndDisplayApplications() {
    // Get filter values
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    const jobFilter = document.getElementById('jobFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchApplications')?.value.toLowerCase() || '';
    
    console.log('Applying filters:', { statusFilter, dateFilter, jobFilter, searchTerm });
    
    // Update filter UI state
    updateFilterVisualState(statusFilter);
    
    // Apply filters
    filteredApplications = applications.filter(app => {
        // Status filter
        if (statusFilter !== 'all' && app.status.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
        }
        
        // Job filter
        if (jobFilter !== 'all' && app.jobTitle !== jobFilter) {
            return false;
        }
        
        // Date filter
        if (dateFilter !== 'all') {
        const appDate = new Date(app.appliedDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            weekAgo.setHours(0, 0, 0, 0);
            
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            monthAgo.setHours(0, 0, 0, 0);
            
            if (dateFilter === 'today' && appDate < today) {
                return false;
            } else if (dateFilter === 'week' && appDate < weekAgo) {
                return false;
            } else if (dateFilter === 'month' && appDate < monthAgo) {
                return false;
            }
        }
        
        // Search term across multiple fields
        if (searchTerm) {
            const searchFields = [
                app.studentName || '',
                app.studentId || '',
                app.jobTitle || '',
                app.studentEmail || '',
                app.studentCourse || '',
                (app.skills || []).join(' ')
            ].map(field => String(field).toLowerCase());
            
            return searchFields.some(field => field.includes(searchTerm));
        }
        
        return true;
    });
    
    // Apply sorting - newest first by default
    filteredApplications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    
    // Display applications
    displayApplications();
    
    // Update application count
    const totalCount = document.getElementById('totalCount');
    if (totalCount) {
        totalCount.textContent = filteredApplications.length;
    }
}

// Update filter visual state to highlight active filter
function updateFilterVisualState(statusFilter) {
    // Add a visual indicator to the status filter dropdown
    const statusFilterElement = document.getElementById('statusFilter');
    if (statusFilterElement) {
        // Update the style of the dropdown based on selected value
        if (statusFilter !== 'all') {
            statusFilterElement.classList.add('active-filter');
            
            // Set background color based on status
            let bgColor = '';
            switch (statusFilter.toLowerCase()) {
                case 'pending':
                    bgColor = '#fff3cd';
                    break;
                case 'accepted':
                    bgColor = '#d4edda';
                    break;
                case 'rejected':
                    bgColor = '#f8d7da';
                    break;
                default:
                    bgColor = '';
            }
            
            if (bgColor) {
                statusFilterElement.style.backgroundColor = bgColor;
            }
        } else {
            statusFilterElement.classList.remove('active-filter');
            statusFilterElement.style.backgroundColor = '';
        }
    }
    
    // Update page heading to show current filter
    const pageHeading = document.querySelector('.page-header h1');
    if (pageHeading) {
        if (statusFilter !== 'all') {
            pageHeading.textContent = `${statusFilter} Applications`;
        } else {
            pageHeading.textContent = 'All Internship Applications';
        }
    }
    
    // Update filter summary
    updateFilterSummary(statusFilter);
}

// Update the filter summary information
function updateFilterSummary(statusFilter) {
    const filteredCountElement = document.getElementById('filteredCount');
    const currentFilterElement = document.getElementById('currentFilter');
    
    if (filteredCountElement) {
        filteredCountElement.textContent = filteredApplications.length;
    }
    
    if (currentFilterElement) {
        if (statusFilter !== 'all') {
            currentFilterElement.textContent = ` with status "${statusFilter}"`;
        } else {
            currentFilterElement.textContent = '';
        }
    }
}

// Display applications with pagination
function displayApplications() {
    const tableBody = document.getElementById('applicationsTable');
    if (!tableBody) return;
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageApplications = filteredApplications.slice(start, end);
    
    // Display applications
    if (pageApplications.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No applications found</td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = pageApplications.map(app => {
            // Get application ID - check multiple possible properties
            const applicationId = app.id || app._id || app.applicationId || app.application_id || '';
            
            // Determine if buttons should be disabled based on status
            const isPending = app.status.toLowerCase() === 'pending';
            const isAccepted = app.status.toLowerCase() === 'accepted';
            const isRejected = app.status.toLowerCase() === 'rejected';
            
            return `
            <tr>
                <td>${app.studentName || 'N/A'}</td>
                <td>${app.jobTitle || 'N/A'}</td>
                <td>${formatDate(app.appliedDate)}</td>
                <td><span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></td>
                <td>
                    ${app.resumeUrl ? 
                        `<a href="${app.resumeUrl}" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-file-alt"></i> View
                        </a>` : 
                        `<button class="btn btn-sm btn-outline-secondary disabled">
                            <i class="fas fa-file-alt"></i> N/A
                        </button>`
                    }
                </td>
                <td>
                    <div class="btn-group action-buttons">
                    ${applicationId ? `
                        <button class="btn btn-primary btn-sm" onclick="openApplicationDetail('${applicationId}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-success btn-sm ${isAccepted ? 'disabled' : ''}" 
                            onclick="updateApplicationStatus('${applicationId}', 'Accepted')"
                            ${isAccepted ? 'disabled' : ''}>
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn btn-danger btn-sm ${isRejected ? 'disabled' : ''}" 
                            onclick="updateApplicationStatus('${applicationId}', 'Rejected')"
                            ${isRejected ? 'disabled' : ''}>
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : `
                        <button class="btn btn-primary btn-sm disabled" title="Application ID not available">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-success btn-sm disabled" title="Application ID not available">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn btn-danger btn-sm disabled" title="Application ID not available">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    `}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }
    
    // Update pagination
    updatePagination(totalPages);
    
    // Make sure filter summary is updated
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    updateFilterSummary(statusFilter);
}

// Update pagination controls
function updatePagination(totalPages) {
    const pagination = document.getElementById('applicationsPagination');
    if (!pagination) return;
    
    let paginationHtml = '';
    
    // Previous button
    paginationHtml += `
        <button class="btn btn-sm btn-secondary ${currentPage === 1 ? 'disabled' : ''}"
                onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-secondary'}"
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHtml += `
        <button class="btn btn-sm btn-secondary ${currentPage === totalPages ? 'disabled' : ''}"
                onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
    
    pagination.innerHTML = paginationHtml;
}

// Change page
function changePage(page) {
    currentPage = page;
    displayApplications();
}

// Setup event listeners
function setupEventListeners() {
    // Filter dropdowns
    const filterElements = ['statusFilter', 'dateFilter', 'jobFilter'];
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                console.log(`${id} changed to ${element.value}`);
                currentPage = 1;
                filterAndDisplayApplications();
            });
        }
    });
    
    // Search input
    const searchInput = document.getElementById('searchApplications');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            console.log('Search term changed to:', searchInput.value);
            currentPage = 1;
            filterAndDisplayApplications();
        }, 300));
    }
    
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            filterAndDisplayApplications();
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('exportApplicationsBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportApplications);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshApplicationsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadAndDisplayApplications();
            showToast('Applications refreshed', 'info');
        });
    }
    
    // Listen for application-updated events (from detail view or other sources)
    document.addEventListener('applications-updated', async () => {
        console.log('Applications updated event received, refreshing data');
        await loadAndDisplayApplications(false);
        updateApplicationStats();
    });
    
    // Handle application detail view closure to refresh list
    window.addEventListener('focus', async () => {
        // Check if we need to refresh (if there were status changes)
        const statusChanges = JSON.parse(localStorage.getItem('applicationStatusChanges') || '{}');
        if (Object.keys(statusChanges).length > 0) {
            console.log('Status changes detected on window focus, refreshing');
            await loadAndDisplayApplications(false);
        }
    });
}

// Setup auto-refresh
function setupAutoRefresh() {
    // Refresh every 2 minutes if the page is visible
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadAndDisplayApplications(false);
        }
    }, 120000);
    
    // Refresh when the page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            loadAndDisplayApplications(false);
        }
    });
}

// Export applications
function exportApplications() {
    try {
        // Create CSV content
        const headers = ['Student Name', 'Student ID', 'Email', 'Job Title', 'Applied Date', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredApplications.map(app => [
                app.studentName,
                app.studentId,
                app.studentEmail,
                app.jobTitle,
                formatDate(app.appliedDate),
                app.status
            ].map(field => `"${field || ''}"`).join(','))
        ].join('\n');
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `applications_export_${formatDate(new Date())}.csv`;
        link.click();
        
        showToast('Applications exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting applications:', error);
        showToast('Error exporting applications', 'error');
    }
}

// Format date
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

// Debounce function
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), timeout);
    };
}

// Show toast notification
function showToast(message, type = 'info', duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    const toastId = 'toast-' + Math.random().toString(36).substr(2, 9);
    toast.id = toastId;
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Only auto-remove if duration > 0
    if (duration > 0) {
    setTimeout(() => {
        toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
    
    return toastId;
}

/**
 * Open application detail view
 * @param {string} applicationId - The ID of the application to view
 */
function openApplicationDetail(applicationId) {
    if (!applicationId) {
        console.error('Cannot open detail view: No application ID provided');
        return;
    }
    
    console.log(`Opening application detail for ID: ${applicationId}`);
    
    // Find the application in our local data
    const application = applications.find(app => {
        const appId = app.id || app._id || app.applicationId || app.application_id || '';
        return appId === applicationId;
    });
    
    // If application modal exists on this page, show it with the data
    const applicationModal = document.getElementById('applicationModal');
    if (applicationModal && application) {
        // Populate modal with application data
        document.getElementById('applicationModalLabel').textContent = `Application: ${application.jobTitle}`;
        document.getElementById('applicantName').textContent = application.studentName || 'Unknown Student';
        document.getElementById('applicantCourse').textContent = application.studentCourse || 'Course Information Not Available';
        document.getElementById('applicantEmail').textContent = application.studentEmail || 'Email Not Available';
        document.getElementById('applicantPhone').textContent = application.studentPhone || 'Phone Not Available';
        document.getElementById('jobTitle').textContent = application.jobTitle || 'Unknown Position';
        document.getElementById('coverLetter').textContent = application.coverLetter || 'No cover letter provided.';
        
        // Update resume link
        const resumeLink = document.getElementById('resumeLink');
        if (resumeLink) {
            if (application.resumeUrl) {
                resumeLink.href = application.resumeUrl;
                resumeLink.classList.remove('disabled');
            } else {
                resumeLink.href = '#';
                resumeLink.classList.add('disabled');
            }
        }
        
        // Update skills list
        const skillsList = document.getElementById('skillsList');
        if (skillsList) {
            if (application.skills && application.skills.length > 0) {
                skillsList.innerHTML = application.skills.map(skill => 
                    `<span class="skill-tag">${skill}</span>`
                ).join('');
            } else {
                skillsList.innerHTML = '<p>No skills listed</p>';
            }
        }
        
        // Update status badge
        const statusBadge = document.getElementById('applicationStatus');
        if (statusBadge) {
            statusBadge.textContent = application.status;
            statusBadge.className = 'badge';
            
            // Add appropriate status class
            switch (application.status.toLowerCase()) {
                case 'accepted':
                    statusBadge.classList.add('bg-success');
                    break;
                case 'rejected':
                    statusBadge.classList.add('bg-danger');
                    break;
                case 'pending':
                    statusBadge.classList.add('bg-warning');
                    break;
                default:
                    statusBadge.classList.add('bg-secondary');
            }
        }
        
        // Enable/disable accept/reject buttons based on current status
        const acceptBtn = document.getElementById('acceptBtn');
        const rejectBtn = document.getElementById('rejectBtn');
        
        if (acceptBtn && rejectBtn) {
            const isAccepted = application.status.toLowerCase() === 'accepted';
            const isRejected = application.status.toLowerCase() === 'rejected';
            
            acceptBtn.disabled = isAccepted;
            rejectBtn.disabled = isRejected;
            
            // Set up event handlers for the buttons
            acceptBtn.onclick = () => updateApplicationStatus(applicationId, 'Accepted');
            rejectBtn.onclick = () => updateApplicationStatus(applicationId, 'Rejected');
        }
        
        // Show the modal
        const bsModal = new bootstrap.Modal(applicationModal);
        bsModal.show();
    } else {
        // If no modal exists on this page, redirect to the detail page
        const detailUrl = `application-detail.html?id=${applicationId}`;
        
        // Check if application-detail.html exists, otherwise navigate to the correct path
        fetch('application-detail.html').then(response => {
            if (response.ok) {
                window.location.href = detailUrl;
            } else {
                // Try alternative paths
                window.location.href = `../employers/application-detail.html?id=${applicationId}`;
            }
        }).catch(() => {
            // Fallback to a likely path
            window.location.href = `../employers/application-detail.html?id=${applicationId}`;
        });
    }
}

/**
 * Update application status directly from the table
 * @param {string} applicationId - The ID of the application
 * @param {string} newStatus - The new status to set
 */
async function updateApplicationStatus(applicationId, newStatus) {
    if (!applicationId) {
        console.error('Cannot update status: No application ID provided');
        showToast('Cannot update status: No application ID provided', 'error');
        return;
    }
    
    // Confirm before updating
    if (!confirm(`Are you sure you want to mark this application as ${newStatus}?`)) {
        return;
    }
    
    // Show loading toast
    const toastId = showToast(`Updating application status to ${newStatus}...`, 'info', 0);
    
    try {
        // Get token for authentication
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required. Please log in.');
        }
        
        // Try a direct API call first
        let apiSuccess = false;
        const apiBaseUrl = document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api';
        
        try {
            // Create a controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            // Try simplified endpoint approach with direct POST
            try {
                console.log(`Attempting status update via single endpoint`);
                
                const response = await fetch(`${apiBaseUrl}/applications/update-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        applicationId: applicationId,
                        status: newStatus
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    console.log('Status successfully updated via API');
                    apiSuccess = true;
                } else {
                    console.warn(`Failed to update status: ${response.status} ${response.statusText}`);
                }
            } catch (err) {
                clearTimeout(timeoutId);
                if (err.name === 'AbortError') {
                    console.warn('Request timed out after 5 seconds');
                } else {
                    console.warn('Error with status update endpoint:', err);
                }
            }
        } catch (error) {
            console.warn('Error during API update:', error);
        }
        
        // Always store the status change in localStorage for persistence
        try {
            // Get existing application status changes
            const appStatusChanges = JSON.parse(localStorage.getItem('applicationStatusChanges') || '{}');
            
            // Update for this application
            appStatusChanges[applicationId] = {
                status: newStatus,
                updatedAt: new Date().toISOString(),
                pendingSync: !apiSuccess
            };
            
            // Save back to localStorage
            localStorage.setItem('applicationStatusChanges', JSON.stringify(appStatusChanges));
            console.log(`Status for application ${applicationId} saved to localStorage (pendingSync: ${!apiSuccess})`);
        } catch (storageError) {
            console.warn('Error saving to localStorage:', storageError);
        }
        
        // Update the application in the local array
        const application = applications.find(app => {
            const appId = app.id || app._id || app.applicationId || app.application_id || '';
            return appId === applicationId;
        });
        
        if (application) {
            application.status = newStatus;
            
            // Re-filter and display applications
            filterAndDisplayApplications();
            
            // Update button states in row
            const rowButtons = document.querySelectorAll(`button[onclick*="${applicationId}"]`);
            if (rowButtons.length > 0) {
                rowButtons.forEach(btn => {
                    if (btn.textContent.includes('Accept')) {
                        if (newStatus.toLowerCase() === 'accepted') {
                            btn.disabled = true;
                            btn.classList.add('disabled');
                        } else {
                            btn.disabled = false;
                            btn.classList.remove('disabled');
                        }
                    } else if (btn.textContent.includes('Reject')) {
                        if (newStatus.toLowerCase() === 'rejected') {
                            btn.disabled = true;
                            btn.classList.add('disabled');
                        } else {
                            btn.disabled = false;
                            btn.classList.remove('disabled');
                        }
                    }
                });
            }
        }
        
        // Update the stats display
        updateApplicationStats();
        
        // Hide loading toast and show success message
        if (toastId) {
            const toastElement = document.getElementById(toastId);
            if (toastElement) toastElement.remove();
        }
        showToast(`Application status updated to ${newStatus}`, 'success');
        
        // Show indicator if using client-side storage only
        if (!apiSuccess) {
            const indicator = document.createElement('div');
            indicator.id = 'offlineIndicator';
            indicator.style.position = 'fixed';
            indicator.style.bottom = '10px';
            indicator.style.right = '10px';
            indicator.style.backgroundColor = '#ff9800';
            indicator.style.color = 'white';
            indicator.style.padding = '8px 16px';
            indicator.style.borderRadius = '4px';
            indicator.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            indicator.style.zIndex = '9999';
            indicator.innerHTML = 'Status saved offline (will sync when API available)';
            
            // Remove any existing indicator first
            const existingIndicator = document.getElementById('offlineIndicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
            
            document.body.appendChild(indicator);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 5000);
        }
        
    } catch (error) {
        console.error('Error updating application status:', error);
        if (toastId) {
            const toastElement = document.getElementById(toastId);
            if (toastElement) toastElement.remove();
        }
        showToast(`Error: ${error.message || 'Failed to update status'}`, 'error');
    }
}

/**
 * Update application statistics display
 */
function updateApplicationStats() {
    // Count applications by status
    const counts = {
        total: applications.length,
        pending: applications.filter(app => app.status.toLowerCase() === 'pending').length,
        accepted: applications.filter(app => app.status.toLowerCase() === 'accepted').length,
        rejected: applications.filter(app => app.status.toLowerCase() === 'rejected').length
    };
    
    // Update counters if they exist
    const totalCountEl = document.getElementById('totalApplicationsCount');
    if (totalCountEl) totalCountEl.textContent = counts.total;
    
    const pendingCountEl = document.getElementById('pendingApplicationsCount');
    if (pendingCountEl) pendingCountEl.textContent = counts.pending;
    
    const acceptedCountEl = document.getElementById('acceptedApplicationsCount');
    if (acceptedCountEl) acceptedCountEl.textContent = counts.accepted;
    
    const rejectedCountEl = document.getElementById('rejectedApplicationsCount');
    if (rejectedCountEl) rejectedCountEl.textContent = counts.rejected;
}

window.changePage = changePage; 