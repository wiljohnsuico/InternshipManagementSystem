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
        
        // Get application data - Try different connectors
        let application = null;
        let error = null;
        
        // Try using the shared connector first
        if (window.SHARED_API_CONNECTOR) {
            try {
                console.log('Using SHARED_API_CONNECTOR to fetch application data');
                application = await window.SHARED_API_CONNECTOR.getApplicationById(applicationId);
            } catch (err) {
                console.warn('Error using shared connector, will try fallback:', err);
                error = err;
            }
        }
        
        // If shared connector failed, try the applications connector
        if (!application && window.APPLICATIONS_CONNECTOR) {
            try {
                console.log('Using APPLICATIONS_CONNECTOR to fetch application data');
                application = await APPLICATIONS_CONNECTOR.getApplicationById(applicationId);
            } catch (err) {
                console.warn('Error using applications connector, will try fallback:', err);
                error = err;
            }
        }
        
        // If applications connector failed, try direct DB connector
        if (!application && window.DB_CONNECTOR) {
            try {
                console.log('Using DB_CONNECTOR to fetch application data');
                application = await DB_CONNECTOR.getApplicationById(applicationId);
            } catch (err) {
                console.warn('Error using DB connector:', err);
                error = err;
            }
        }
        
        if (!application) {
            showError(error ? error.message : 'Application not found');
            console.error('Failed to load application with all available connectors');
            return;
        }
        
        console.log('Successfully fetched application data:', application);
        
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
    
    // Resume display
    displayResumeDetails(application);
    
    // Status buttons
    setupStatusButtons(application);
    
    // Activity log
    setupActivityLog(application);
    
    // Notes section
    displayNotesAndStatus(application);
    
    // Setup action buttons in footer
    setupActionButtons(application);
}

// Display resume details
function displayResumeDetails(application) {
    const resumeUrl = application.resumeUrl || application.resume || null;
    
    // Basic resume setup (using existing function)
    setupResumeButtons(resumeUrl);
    
    // Additional resume information if available
    const resumeInfoSection = document.createElement('div');
    resumeInfoSection.className = 'resume-info-section mt-3';
    
    // Add skills section if available
    if (application.skills && application.skills.length > 0) {
        const skillsHtml = `
            <div class="skills-container mt-4">
                <h5>Skills</h5>
                <div class="skills-list">
                    ${application.skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
                </div>
            </div>
        `;
        resumeInfoSection.innerHTML += skillsHtml;
    }
    
    // Add education info if available
    if (application.studentCourse || application.education) {
        const educationInfo = application.studentCourse || 
                             (application.education ? application.education.join(', ') : '');
        
        if (educationInfo) {
            const educationHtml = `
                <div class="education-container mt-4">
                    <h5>Education</h5>
                    <p>${educationInfo}</p>
                </div>
            `;
            resumeInfoSection.innerHTML += educationHtml;
        }
    }
    
    // Add resume preview container to DOM
    const resumeTab = document.getElementById('resumeTab');
    if (resumeTab && resumeInfoSection.innerHTML) {
        resumeTab.appendChild(resumeInfoSection);
    }
}

// Display notes and status information
function displayNotesAndStatus(application) {
    // Set notes content
    const notesTextarea = document.getElementById('applicationNotes');
    if (notesTextarea) {
        notesTextarea.value = application.notes || '';
        
        // Add placeholder if no notes
        if (!application.notes) {
            notesTextarea.placeholder = 'Add private notes about this applicant. These notes are only visible to your team.';
        }
    }
    
    // Add additional status information if available
    if (application.statusHistory) {
        const statusHistorySection = document.createElement('div');
        statusHistorySection.className = 'status-history mt-4';
        statusHistorySection.innerHTML = `
            <h5>Status History</h5>
            <ul class="status-history-list">
                ${application.statusHistory.map(status => `
                    <li class="status-history-item">
                        <span class="status-badge status-${status.status.toLowerCase()}">${status.status}</span>
                        <span class="status-date">${formatDate(status.date)}</span>
                        ${status.updatedBy ? `<span class="status-user">by ${status.updatedBy}</span>` : ''}
                    </li>
                `).join('')}
            </ul>
        `;
        
        const notesTab = document.getElementById('notesTab');
        if (notesTab) {
            const statusColumn = notesTab.querySelector('.col-md-6:first-child');
            if (statusColumn) {
                statusColumn.appendChild(statusHistorySection);
            }
        }
    }
}

// Setup action buttons in the footer
function setupActionButtons(application) {
    // Reject button
    const rejectBtn = document.getElementById('rejectBtn');
    if (rejectBtn) {
        rejectBtn.onclick = async () => {
            if (confirm('Are you sure you want to reject this application?')) {
                try {
                    await updateApplicationStatus(application.id, 'Rejected');
                    
                    // Update UI
                    const statusBadge = document.getElementById('applicationStatus');
                    if (statusBadge) {
                        statusBadge.textContent = 'Rejected';
                        statusBadge.className = 'status-badge status-rejected';
                    }
                    
                    // Update status buttons
                    const buttons = document.querySelectorAll('.status-btn');
                    buttons.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.getAttribute('data-status') === 'Rejected') {
                            btn.classList.add('active');
                        }
                    });
                    
                    // Add to activity log
                    addActivityLogEntry('Application rejected', new Date(), 'You');
                    
                    showToast('Application rejected', 'success');
                } catch (error) {
                    console.error('Error rejecting application:', error);
                    showToast('Error rejecting application', 'error');
                }
            }
        };
    }
    
    // Schedule Interview button
    const scheduleInterviewBtn = document.getElementById('scheduleInterviewBtn');
    if (scheduleInterviewBtn) {
        scheduleInterviewBtn.onclick = () => {
            // Open schedule interview modal or prompt
            showInterviewScheduler(application);
        };
    }
    
    // Accept button
    const acceptBtn = document.getElementById('acceptBtn');
    if (acceptBtn) {
        acceptBtn.onclick = async () => {
            if (confirm('Are you sure you want to accept this application?')) {
                try {
                    await updateApplicationStatus(application.id, 'Accepted');
                    
                    // Update UI
                    const statusBadge = document.getElementById('applicationStatus');
                    if (statusBadge) {
                        statusBadge.textContent = 'Accepted';
                        statusBadge.className = 'status-badge status-accepted';
                    }
                    
                    // Update status buttons
                    const buttons = document.querySelectorAll('.status-btn');
                    buttons.forEach(btn => {
                        btn.classList.remove('active');
                        if (btn.getAttribute('data-status') === 'Accepted') {
                            btn.classList.add('active');
                        }
                    });
                    
                    // Add to activity log
                    addActivityLogEntry('Application accepted', new Date(), 'You');
                    
                    showToast('Application accepted', 'success');
                } catch (error) {
                    console.error('Error accepting application:', error);
                    showToast('Error accepting application', 'error');
                }
            }
        };
    }
}

// Show interview scheduler modal or prompt
function showInterviewScheduler(application) {
    // Create a simple prompt
    const date = prompt('Enter interview date (YYYY-MM-DD):', '');
    
    if (date) {
        // Validate date format
        const interviewDate = new Date(date);
        
        if (isNaN(interviewDate.getTime())) {
            showToast('Invalid date format', 'error');
            return;
        }
        
        // Update status to Accepted instead of Interviewed
        updateApplicationStatus(application.id, 'Accepted')
            .then(() => {
                // Add to activity log
                addActivityLogEntry(`Interview scheduled for ${formatDate(interviewDate)}`, new Date(), 'You');
                
                // Update UI
                const statusBadge = document.getElementById('applicationStatus');
                if (statusBadge) {
                    statusBadge.textContent = 'Accepted';
                    statusBadge.className = 'status-badge status-accepted';
                }
                
                // Update status buttons
                const buttons = document.querySelectorAll('.status-btn');
                buttons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-status') === 'Accepted') {
                        btn.classList.add('active');
                    }
                });
                
                showToast('Applicant accepted and interview scheduled', 'success');
            })
            .catch(error => {
                console.error('Error scheduling interview:', error);
                showToast('Error scheduling interview', 'error');
            });
    } else {
        showToast('Interview scheduling cancelled', 'info');
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
    // Try using the shared connector first
    if (window.SHARED_API_CONNECTOR) {
        try {
            console.log('Using SHARED_API_CONNECTOR to update status');
            return await window.SHARED_API_CONNECTOR.updateApplicationStatus(applicationId, newStatus);
        } catch (err) {
            console.warn('Error using shared connector for status update, will try fallback:', err);
        }
    }
    
    // Try applications connector
    if (window.APPLICATIONS_CONNECTOR && window.APPLICATIONS_CONNECTOR.updateApplicationStatus) {
        try {
            console.log('Using APPLICATIONS_CONNECTOR to update status');
            return await window.APPLICATIONS_CONNECTOR.updateApplicationStatus(applicationId, newStatus);
        } catch (err) {
            console.warn('Error using applications connector for status update, will try fallback:', err);
        }
    }
    
    // Try DB connector as last resort
    if (window.DB_CONNECTOR) {
        console.log('Using DB_CONNECTOR to update status');
        return await window.DB_CONNECTOR.updateApplicationStatus(applicationId, newStatus);
    }
    
    throw new Error('No connector available to update application status');
}

// Save application notes
async function saveApplicationNotes(applicationId, notes) {
    // Try using the shared connector first
    if (window.SHARED_API_CONNECTOR) {
        try {
            console.log('Using SHARED_API_CONNECTOR to save notes');
            const result = await window.SHARED_API_CONNECTOR.apiRequest(`/applications/${applicationId}/notes`, {
                method: 'PUT',
                body: { notes }
            });
            return { success: true, ...result };
        } catch (err) {
            console.warn('Error using shared connector for saving notes, will try fallback:', err);
        }
    }
    
    // Try applications connector
    if (window.APPLICATIONS_CONNECTOR && window.APPLICATIONS_CONNECTOR.saveApplicationNotes) {
        try {
            console.log('Using APPLICATIONS_CONNECTOR to save notes');
            return await window.APPLICATIONS_CONNECTOR.saveApplicationNotes(applicationId, notes);
        } catch (err) {
            console.warn('Error using applications connector for saving notes, will try fallback:', err);
        }
    }
    
    // Try DB connector as last resort
    if (window.DB_CONNECTOR && window.DB_CONNECTOR.saveApplicationNotes) {
        console.log('Using DB_CONNECTOR to save notes');
        return await window.DB_CONNECTOR.saveApplicationNotes(applicationId, notes);
    }
    
    // Direct API fallback
    try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        const API_URL = document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api';
        
        const response = await fetch(`${API_URL}/applications/${applicationId}/notes`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notes })
        });
        
        if (response.ok) {
            return { success: true };
        } else {
            throw new Error(`Server returned status ${response.status}`);
        }
    } catch (error) {
        console.error('Error in direct API call for saving notes:', error);
        return { success: false, error: error.message };
    }
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