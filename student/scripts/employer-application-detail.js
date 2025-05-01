/**
 * Application Detail Handler
 * This script handles fetching and displaying specific application details
 * when accessing applications.html with an ID parameter
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing Application Detail Handler');
    
    // Check if there's an application ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const applicationId = urlParams.get('id');
    
    if (applicationId) {
        console.log(`Application ID found in URL: ${applicationId}`);
        // Attempt to load the specific application
        loadApplicationDetail(applicationId);
    }
});

/**
 * Load application details from the API
 * @param {string} applicationId - The ID of the application to load
 */
async function loadApplicationDetail(applicationId) {
    console.log(`Loading application detail for ID: ${applicationId}`);
    
    // UI Elements
    const applicationDetailModal = document.getElementById('applicationModal');
    const applicantNameElement = document.getElementById('applicantName');
    const applicationDateElement = document.getElementById('applicationDate');
    const studentIdElement = document.getElementById('studentId');
    const applicantEmailElement = document.getElementById('applicantEmail');
    const applicantPhoneElement = document.getElementById('applicantPhone');
    const positionAppliedElement = document.getElementById('positionApplied');
    const applicationStatusElement = document.getElementById('applicationStatus');
    const coverLetterTextElement = document.getElementById('coverLetterText');
    const downloadResumeBtn = document.getElementById('downloadResumeBtn');
    const viewFullResumeBtn = document.getElementById('viewFullResumeBtn');
    const resumePreview = document.getElementById('resumePreview');
    
    // Check if we have the necessary elements
    if (!applicationDetailModal || !applicantNameElement) {
        console.error('Required UI elements not found');
        showToast('Error: UI elements not initialized correctly', 'error');
        return;
    }
    
    try {
        // Show loading state
        document.body.classList.add('loading');
        
        // Use the database connector to get application data
        if (!window.DB_CONNECTOR) {
            console.error('Database connector not found');
            showToast('Error: Database connection not available', 'error');
            return useMockData(applicationId);
        }
        
        const application = await window.DB_CONNECTOR.getApplicationById(applicationId);
        
        if (!application) {
            console.error(`Application with ID ${applicationId} not found`);
            showToast('Application not found', 'error');
            return useMockData(applicationId);
        }
        
        // Display the application data
        displayApplicationDetail(application);
        
    } catch (error) {
        console.error('Error loading application detail:', error);
        showToast(`Error: ${error.message}`, 'error');
        
        // Fall back to mock data if real data can't be loaded
        useMockData(applicationId);
    } finally {
        document.body.classList.remove('loading');
    }
}

/**
 * Normalize application data to handle different API response structures
 * @param {Object} app - The application data from the API
 * @returns {Object} Normalized application data
 */
function normalizeApplicationData(app) {
    // Create a standardized object
    return {
        id: app.id || app._id || app.applicationId || '',
        studentName: app.studentName || app.student_name || 
            (app.student ? `${app.student.firstName || app.student.first_name || ''} ${app.student.lastName || app.student.last_name || ''}`.trim() : ''),
        studentId: app.studentId || app.student_id || (app.student ? app.student.id || app.student._id || '' : ''),
        studentEmail: app.studentEmail || app.student_email || (app.student ? app.student.email || '' : ''),
        studentPhone: app.studentPhone || app.student_phone || (app.student ? app.student.phone || '' : 'Not provided'),
        jobTitle: app.jobTitle || app.job_title || app.position || '',
        jobId: app.jobId || app.job_id || '',
        appliedDate: app.appliedDate || app.applied_date || app.createdAt || app.created_at || new Date(),
        status: app.status || 'Pending',
        coverLetter: app.coverLetter || app.cover_letter || '',
        resumeUrl: app.resumeUrl || app.resume_url || '',
        notes: app.notes || '',
        activities: app.activities || app.activity_log || [],
        // Include all original data to avoid losing anything
        originalData: app
    };
}

/**
 * Display application detail in the UI
 * @param {Object} application - The normalized application data
 */
function displayApplicationDetail(application) {
    console.log('Displaying application detail:', application);
    
    // Get UI elements
    const applicantNameElement = document.getElementById('applicantName');
    const applicationDateElement = document.getElementById('applicationDate');
    const studentIdElement = document.getElementById('studentId');
    const applicantEmailElement = document.getElementById('applicantEmail');
    const applicantPhoneElement = document.getElementById('applicantPhone');
    const positionAppliedElement = document.getElementById('positionApplied');
    const applicationStatusElement = document.getElementById('applicationStatus');
    const coverLetterTextElement = document.getElementById('coverLetterText');
    const downloadResumeBtn = document.getElementById('downloadResumeBtn');
    const viewFullResumeBtn = document.getElementById('viewFullResumeBtn');
    
    // Populate UI elements
    if (applicantNameElement) applicantNameElement.textContent = application.studentName || 'Unknown';
    if (applicationDateElement) applicationDateElement.textContent = `Applied on: ${formatDate(application.appliedDate)}`;
    if (studentIdElement) studentIdElement.textContent = application.studentId || 'Not provided';
    if (applicantEmailElement) applicantEmailElement.textContent = application.studentEmail || 'Not provided';
    if (applicantPhoneElement) applicantPhoneElement.textContent = application.studentPhone || 'Not provided';
    if (positionAppliedElement) positionAppliedElement.textContent = application.jobTitle || 'Unknown Position';
    
    // Set status badge
    if (applicationStatusElement) {
        applicationStatusElement.textContent = application.status || 'Pending';
        applicationStatusElement.className = 'status-badge';
        
        // Add appropriate status class
        const status = (application.status || 'Pending').toLowerCase();
        if (status === 'accepted' || status === 'hired') {
            applicationStatusElement.classList.add('status-accepted');
        } else if (status === 'rejected') {
            applicationStatusElement.classList.add('status-rejected');
        } else if (status === 'interviewed') {
            applicationStatusElement.classList.add('status-interviewed');
        } else if (status === 'reviewed' || status === 'shortlisted') {
            applicationStatusElement.classList.add('status-reviewed');
        } else {
            applicationStatusElement.classList.add('status-pending');
        }
    }
    
    // Set cover letter
    if (coverLetterTextElement) {
        coverLetterTextElement.textContent = application.coverLetter || 'No cover letter provided.';
    }
    
    // Set up resume buttons
    if (downloadResumeBtn && viewFullResumeBtn) {
        if (application.resumeUrl) {
            downloadResumeBtn.href = application.resumeUrl;
            viewFullResumeBtn.href = application.resumeUrl;
            downloadResumeBtn.classList.remove('disabled');
            viewFullResumeBtn.classList.remove('disabled');
        } else {
            downloadResumeBtn.href = '#';
            viewFullResumeBtn.href = '#';
            downloadResumeBtn.classList.add('disabled');
            viewFullResumeBtn.classList.add('disabled');
            
            // Show no resume message in the preview
            const resumePreview = document.getElementById('resumePreview');
            if (resumePreview) {
                resumePreview.innerHTML = `
                    <div class="no-resume">
                        <i class="fas fa-file-alt"></i>
                        <p>No resume available</p>
                    </div>
                `;
            }
        }
    }
    
    // Set up activity log if available
    const activityLog = document.getElementById('activityLog');
    if (activityLog && application.activities && application.activities.length > 0) {
        activityLog.innerHTML = '';
        
        application.activities.forEach(activity => {
            const li = document.createElement('li');
            li.className = 'activity-item';
            li.innerHTML = `
                <span class="activity-date">${formatDate(activity.date || activity.timestamp)}</span>
                <span class="activity-action">${activity.action || activity.description}</span>
                <span class="activity-user">by ${activity.user || 'System'}</span>
            `;
            activityLog.appendChild(li);
        });
    } else if (activityLog) {
        // Add just the application submission as activity
        activityLog.innerHTML = `
            <li class="activity-item">
                <span class="activity-date">${formatDate(application.appliedDate)}</span>
                <span class="activity-action">Application received</span>
                <span class="activity-user">System</span>
            </li>
        `;
    }
    
    // Set up status buttons
    const statusButtons = document.querySelectorAll('.status-btn');
    if (statusButtons) {
        statusButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-status') === application.status) {
                btn.classList.add('active');
            }
            
            // Add click handler
            btn.addEventListener('click', function() {
                const newStatus = this.getAttribute('data-status');
                updateApplicationStatus(application.id, newStatus);
            });
        });
    }
    
    // Set application notes if available
    const applicationNotes = document.getElementById('applicationNotes');
    if (applicationNotes) {
        applicationNotes.value = application.notes || '';
    }
    
    // Save notes button handler
    const saveNotesBtn = document.getElementById('saveNotesBtn');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', function() {
            const notes = applicationNotes.value;
            saveApplicationNotes(application.id, notes);
        });
    }
    
    // Show the application modal automatically
    const applicationModal = document.getElementById('applicationModal');
    if (applicationModal) {
        applicationModal.classList.add('show');
    }
    
    // Set up tab navigation
    setupTabNavigation();
}

/**
 * Set up tab navigation in the application modal
 */
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to current button
            this.classList.add('active');
            
            // Show the corresponding tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

/**
 * Update the application status
 * @param {string} applicationId - The ID of the application
 * @param {string} newStatus - The new status to set
 */
async function updateApplicationStatus(applicationId, newStatus) {
    if (!applicationId) return;
    
    try {
        // Update the status badge immediately for better UX
        const statusBadgeEl = document.getElementById('applicationStatus');
        if (statusBadgeEl) {
            statusBadgeEl.className = 'status-badge';
            statusBadgeEl.textContent = newStatus;
            
            // Add the appropriate class
            switch (newStatus.toLowerCase()) {
                case 'accepted':
                case 'hired':
                    statusBadgeEl.classList.add('status-accepted');
                    break;
                case 'rejected':
                    statusBadgeEl.classList.add('status-rejected');
                    break;
                case 'interviewed':
                    statusBadgeEl.classList.add('status-interviewed');
                    break;
                case 'reviewed':
                case 'shortlisted':
                    statusBadgeEl.classList.add('status-reviewed');
                    break;
                default:
                    statusBadgeEl.classList.add('status-pending');
                    break;
            }
        }
        
        // Update status buttons
        const statusButtons = document.querySelectorAll('.status-btn');
        if (statusButtons) {
            statusButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-status') === newStatus) {
                    btn.classList.add('active');
                }
            });
        }
        
        // Use the database connector to update status
        if (window.DB_CONNECTOR) {
            const result = await window.DB_CONNECTOR.updateApplicationStatus(applicationId, newStatus);
            
            if (result.success) {
                // Add to activity log
                const activityLog = document.getElementById('activityLog');
                if (activityLog) {
                    const li = document.createElement('li');
                    li.className = 'activity-item';
                    li.innerHTML = `
                        <span class="activity-date">${formatDate(new Date())}</span>
                        <span class="activity-action">Status changed to ${newStatus}</span>
                        <span class="activity-user">by You</span>
                    `;
                    activityLog.prepend(li);
                }
                
                showToast(`Status updated to ${newStatus}`, 'success');
            } else {
                showToast(`Error: ${result.error || 'Failed to update status'}`, 'error');
            }
        } else {
            showToast('Status updated locally. Changes will sync when connection is restored.', 'warning');
        }
    } catch (error) {
        console.error('Error updating application status:', error);
        showToast('Error updating status', 'error');
    }
}

/**
 * Save application notes
 * @param {string} applicationId - The ID of the application
 * @param {string} notes - The notes to save
 */
async function saveApplicationNotes(applicationId, notes) {
    if (!applicationId) return;
    
    try {
        // Use the database connector to save notes
        if (window.DB_CONNECTOR) {
            const result = await window.DB_CONNECTOR.saveApplicationNotes(applicationId, notes);
            
            if (result.success) {
                // Add to activity log
                const activityLog = document.getElementById('activityLog');
                if (activityLog) {
                    const li = document.createElement('li');
                    li.className = 'activity-item';
                    li.innerHTML = `
                        <span class="activity-date">${formatDate(new Date())}</span>
                        <span class="activity-action">Notes updated</span>
                        <span class="activity-user">by You</span>
                    `;
                    activityLog.prepend(li);
                }
                
                showToast('Notes saved successfully', 'success');
            } else {
                showToast(`Error: ${result.error || 'Failed to save notes'}`, 'error');
            }
        } else {
            showToast('Notes saved locally. Changes will sync when connection is restored.', 'warning');
        }
    } catch (error) {
        console.error('Error saving application notes:', error);
        showToast('Error saving notes', 'error');
    }
}

/**
 * Use mock data when the API is unavailable
 * @param {string} applicationId - The ID of the application to mock
 */
function useMockData(applicationId) {
    console.log(`Using mock data for application ID: ${applicationId}`);
    
    // Create mock application data based on the ID
    const mockApplication = {
        id: applicationId,
        studentName: 'John Doe',
        studentId: 'STU-1001',
        studentEmail: 'john.doe@example.com',
        studentPhone: '(555) 123-4567',
        jobTitle: 'Frontend Developer Intern',
        jobId: 'job-1',
        appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'Pending',
        coverLetter: 'I am excited to apply for this position as it aligns with my skills in web development. I have experience with JavaScript, React, and CSS, which I believe would make me a strong candidate for this role. I am eager to contribute to your team and learn from experienced professionals in the industry.',
        resumeUrl: '',
        notes: '',
        activities: [
            {
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                action: 'Application received',
                user: 'System'
            }
        ]
    };
    
    // Display the mock data
    displayApplicationDetail(mockApplication);
    
    // Show notification
    showToast('Using offline data. Some features may be limited.', 'warning');
}

/**
 * Format a date for display
 * @param {string|Date} dateString - The date to format
 * @returns {string} The formatted date
 */
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
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

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('info', 'success', 'warning', 'error')
 */
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast with a small delay
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
} 