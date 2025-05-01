/**
 * Application Detail Handler
 * This script handles displaying and managing a single application's details
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    init().catch(error => {
        console.error('Initialization error:', error);
        showToast('Error initializing page: ' + error.message, 'error');
    });
});

// Initialize the page
async function init() {
    console.log('Initializing application detail page');
    
    // Get application ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const applicationId = urlParams.get('id');
    
    if (!applicationId) {
        showError('No application ID provided');
        return;
    }
    
    // Load application details
    await loadApplicationDetail(applicationId);
    
    // Setup event listeners
    setupEventListeners();
}

// Load application detail
async function loadApplicationDetail(applicationId) {
    try {
        showLoading();
        
        // Get application data
        const application = await APPLICATIONS_CONNECTOR.getApplicationById(applicationId);
        
        if (!application) {
            showError('Application not found');
            return;
        }
        
        // Display application data
        displayApplicationDetail(application);
        
    } catch (error) {
        console.error('Error loading application:', error);
        showError('Error loading application details');
    } finally {
        hideLoading();
    }
}

// Display application detail
function displayApplicationDetail(application) {
    // Basic information
    setElementText('applicantName', application.studentName);
    setElementText('studentId', application.studentId);
    setElementText('applicantEmail', application.studentEmail);
    setElementText('applicantPhone', application.studentPhone);
    setElementText('positionApplied', application.jobTitle);
    setElementText('applicationDate', 'Applied on: ' + formatDate(application.appliedDate));
    
    // Status badge
    const statusBadge = document.getElementById('applicationStatus');
    if (statusBadge) {
        statusBadge.textContent = application.status;
        statusBadge.className = 'status-badge status-' + application.status.toLowerCase();
    }
    
    // Cover letter
    setElementText('coverLetterText', application.coverLetter || 'No cover letter provided');
    
    // Resume buttons
    setupResumeButtons(application.resumeUrl);
    
    // Status buttons
    setupStatusButtons(application);
    
    // Activity log
    setupActivityLog(application);
    
    // Notes
    const notesTextarea = document.getElementById('applicationNotes');
    if (notesTextarea) {
        notesTextarea.value = application.notes || '';
    }
}

// Setup resume buttons
function setupResumeButtons(resumeUrl) {
    const downloadBtn = document.getElementById('downloadResumeBtn');
    const viewBtn = document.getElementById('viewFullResumeBtn');
    const preview = document.getElementById('resumePreview');
    
    if (resumeUrl) {
        // Enable buttons
        if (downloadBtn) {
            downloadBtn.classList.remove('disabled');
            downloadBtn.href = resumeUrl;
        }
        if (viewBtn) {
            viewBtn.classList.remove('disabled');
            viewBtn.href = resumeUrl;
        }
        
        // Setup preview
        if (preview) {
            const ext = resumeUrl.split('.').pop().toLowerCase();
            if (ext === 'pdf') {
                preview.innerHTML = `<iframe src="${resumeUrl}" width="100%" height="500px" frameborder="0"></iframe>`;
            } else {
                preview.innerHTML = `
                    <div class="no-preview">
                        <i class="fas fa-file-alt"></i>
                        <p>Preview not available for this file type.<br>Click "View Full Resume" to open.</p>
                    </div>
                `;
            }
        }
    } else {
        // Disable buttons
        if (downloadBtn) {
            downloadBtn.classList.add('disabled');
            downloadBtn.removeAttribute('href');
        }
        if (viewBtn) {
            viewBtn.classList.add('disabled');
            viewBtn.removeAttribute('href');
        }
        
        // Show no resume message
        if (preview) {
            preview.innerHTML = `
                <div class="no-preview">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No resume available for this application.</p>
                </div>
            `;
        }
    }
}

// Setup status buttons
function setupStatusButtons(application) {
    const buttons = document.querySelectorAll('.status-btn');
    buttons.forEach(btn => {
        const status = btn.getAttribute('data-status');
        
        // Set active state
        if (status === application.status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        // Add click handler
        btn.onclick = async () => {
            try {
                await updateApplicationStatus(application.id, status);
                
                // Update UI
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const statusBadge = document.getElementById('applicationStatus');
                if (statusBadge) {
                    statusBadge.textContent = status;
                    statusBadge.className = 'status-badge status-' + status.toLowerCase();
                }
                
                // Add to activity log
                addActivityLogEntry(status);
                
                showToast('Status updated successfully', 'success');
            } catch (error) {
                console.error('Error updating status:', error);
                showToast('Error updating status', 'error');
            }
        };
    });
}

// Setup activity log
function setupActivityLog(application) {
    const log = document.getElementById('activityLog');
    if (!log) return;
    
    // Clear existing entries
    log.innerHTML = '';
    
    // Add initial application entry
    addActivityLogEntry('Application received', application.appliedDate, 'System');
    
    // Add status history if available
    if (application.activities && application.activities.length > 0) {
        application.activities.forEach(activity => {
            addActivityLogEntry(
                activity.action,
                activity.date,
                activity.user
            );
        });
    }
}

// Add activity log entry
function addActivityLogEntry(action, date = new Date(), user = 'You') {
    const log = document.getElementById('activityLog');
    if (!log) return;
    
    const entry = document.createElement('li');
    entry.className = 'activity-item';
    entry.innerHTML = `
        <span class="activity-date">${formatDate(date)}</span>
        <span class="activity-action">${action}</span>
        <span class="activity-user">by ${user}</span>
    `;
    
    log.insertBefore(entry, log.firstChild);
}

// Update application status
async function updateApplicationStatus(applicationId, newStatus) {
    const result = await APPLICATIONS_CONNECTOR.updateApplicationStatus(applicationId, newStatus);
    if (!result.success) {
        throw new Error(result.error || 'Failed to update status');
    }
    return result;
}

// Save application notes
async function saveApplicationNotes(applicationId, notes) {
    const result = await APPLICATIONS_CONNECTOR.saveApplicationNotes(applicationId, notes);
    if (!result.success) {
        throw new Error(result.error || 'Failed to save notes');
    }
    return result;
}

// Setup event listeners
function setupEventListeners() {
    // Save notes button
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    const notesTextarea = document.getElementById('applicationNotes');
    
    if (saveNotesBtn && notesTextarea) {
        saveNotesBtn.onclick = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const applicationId = urlParams.get('id');
                
                await saveApplicationNotes(applicationId, notesTextarea.value);
                showToast('Notes saved successfully', 'success');
            } catch (error) {
                console.error('Error saving notes:', error);
                showToast('Error saving notes', 'error');
            }
        };
    }
    
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.onclick = () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId + 'Tab').classList.add('active');
        };
    });
}

// Helper functions
function setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

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

function showLoading() {
    document.body.classList.add('loading');
}

function hideLoading() {
    document.body.classList.remove('loading');
}

function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorAlert && errorMessage) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
} 