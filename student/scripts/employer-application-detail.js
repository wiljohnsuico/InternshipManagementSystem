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
        
        // Set a global timeout to prevent infinite loading
        const globalTimeout = setTimeout(() => {
            console.error('Global timeout reached - forcing error display');
            document.body.classList.remove('loading');
            
            const errorAlert = document.getElementById('errorAlert');
            const errorMessage = document.getElementById('errorMessage');
            if (errorAlert && errorMessage) {
                errorMessage.innerHTML = `<strong>Request Timeout</strong><br>
                    The application is taking too long to load. Server might be experiencing issues.
                    Please try again later.`;
                errorAlert.classList.remove('d-none');
                
                // Set loading text to error state
                const loadingElements = document.querySelectorAll('.loading');
                loadingElements.forEach(el => {
                    el.textContent = 'Error loading data';
                });
            }
        }, 30000); // 30 second absolute maximum timeout
        
        // First check if API server is reachable
        const apiStatus = await checkApiServerStatus();
        if (apiStatus.online) {
            console.log(`API server is online at ${apiStatus.url}`);
        // Attempt to load the specific application
            try {
                await loadApplicationDetail(applicationId);
            } catch (error) {
                console.error('Failed to load application:', error);
            } finally {
                // Clear the global timeout as we've finished (success or failure)
                clearTimeout(globalTimeout);
            }
        } else {
            // Clear the global timeout as we've detected server is offline
            clearTimeout(globalTimeout);
            
            console.error(`API server appears to be offline. Status: ${apiStatus.status}`);
            document.body.classList.remove('loading');
            
            // Show error alert
            const errorAlert = document.getElementById('errorAlert');
            const errorMessage = document.getElementById('errorMessage');
            if (errorAlert && errorMessage) {
                errorMessage.innerHTML = `<strong>API Server Unavailable</strong><br>
                    The application server at ${apiStatus.url} is not responding. 
                    Please ensure the server is running and your network connection is active.`;
                errorAlert.classList.remove('d-none');
                
                // Add a reconnect button to the error alert
                const reconnectBtn = document.createElement('button');
                reconnectBtn.className = 'btn btn-primary mt-2';
                reconnectBtn.textContent = 'Check Connection';
                reconnectBtn.onclick = async function() {
                    errorMessage.innerHTML += '<br>Checking server status...';
                    const newStatus = await checkApiServerStatus();
                    if (newStatus.online) {
                        window.location.reload();
                    } else {
                        errorMessage.innerHTML = `<strong>API Server Still Unavailable</strong><br>
                            The server at ${newStatus.url} is still not responding. Please try again later.`;
                    }
                };
                errorAlert.appendChild(reconnectBtn);
            }
        }
    } else {
        // This is an expected condition, not an error - log as info instead
        console.info('No application ID specified in URL - showing selection message');
        document.body.classList.remove('loading');
        
        // Show error alert
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        if (errorAlert && errorMessage) {
            errorMessage.textContent = 'Error: No application ID specified. Please select an application from the applications list.';
            errorAlert.classList.remove('d-none');
        }
        
        // Update page title
        document.title = 'No Application Selected - Employer Portal';
        
        // Change loading text
        const loadingElements = document.querySelectorAll('.loading, #applicantName, #applicationDate');
        loadingElements.forEach(el => {
            el.textContent = 'No application selected';
        });
        
        // Disable all interactive elements when no application is selected
        const actionButtons = document.querySelectorAll('#rejectBtn, #scheduleInterviewBtn, #acceptBtn, #saveNotesBtn, .status-btn');
        actionButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('disabled');
        });
        
        // Disable text areas and other inputs
        const inputElements = document.querySelectorAll('#applicationNotes, textarea, input');
        inputElements.forEach(input => {
            input.disabled = true;
            if (input.tagName === 'TEXTAREA') {
                input.placeholder = 'No application selected';
            }
        });
        
        // Clear any sensitive data fields to ensure privacy
        const dataElements = document.querySelectorAll('#studentId, #applicantEmail, #applicantPhone, #positionApplied, #coverLetterText');
        dataElements.forEach(el => {
            el.textContent = 'N/A';
        });
        
        // Set empty state for activity log
        const activityLog = document.getElementById('activityLog');
        if (activityLog) {
            activityLog.innerHTML = `
                <li class="activity-item">
                    <span class="activity-date">${formatDate(new Date())}</span>
                    <span class="activity-action">No application selected</span>
                    <span class="activity-user">System</span>
                </li>
            `;
        }
        
        // Set empty state for resume preview
        const resumePreview = document.getElementById('resumePreview');
        if (resumePreview) {
            resumePreview.innerHTML = `
                <div class="no-resume">
                    <i class="fas fa-file-alt"></i>
                    <p>No application selected</p>
                </div>
            `;
        }
    }
});

/**
 * Check if the API server is reachable
 * @returns {Promise<Object>} Object containing status information
 */
async function checkApiServerStatus() {
    // Default API URL and fallbacks to check - prioritize port 3000 first since that's where the browser is running
    const apiUrls = [
        "http://localhost:3000/api",  // Try port 3000 first (same as browser)
        window.location.origin + "/api", // Also try directly from current origin
        "http://localhost:5004/api",
        "http://localhost:5000/api",
        "http://localhost:3001/api"
    ];
    
    // Check if we have the API_URL from the meta tag
    const metaTag = document.querySelector('meta[name="api-url"]');
    if (metaTag && metaTag.content) {
        // Prioritize the meta tag URL
        apiUrls.unshift(metaTag.content);
    }
    
    // Check localStorage for previously successful endpoints
    try {
        const workingEndpoints = JSON.parse(localStorage.getItem('workingApiEndpoints') || '{}');
        if (workingEndpoints.lastSuccessful) {
            // Extract the base URL from the last successful endpoint
            const urlParts = workingEndpoints.lastSuccessful.split('/api');
            if (urlParts.length > 0) {
                const baseApiUrl = urlParts[0] + '/api';
                // Prioritize this working URL
                if (!apiUrls.includes(baseApiUrl)) {
                    apiUrls.unshift(baseApiUrl);
                }
            }
        }
    } catch (e) {
        console.warn('Could not retrieve working API endpoints from localStorage', e);
    }
    
    console.log('Checking API server status using these URLs:', apiUrls);
    
    // Try all API URLs
    for (const apiUrl of apiUrls) {
        try {
            // Try a health check endpoint or a simple endpoint
            const endpoints = [
                `${apiUrl}/health`,
                `${apiUrl}/status`,
                `${apiUrl}/ping`,
                apiUrl
            ];
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`Checking server status at: ${endpoint}`);
                    
                    // Make a HEAD request to check if server is responding
                    const response = await fetch(endpoint, {
                        method: 'HEAD',
                        // Set a short timeout to avoid long waits
                        signal: AbortSignal.timeout(3000)
                    });
                    
                    if (response.ok || response.status === 404) {
                        // If we get any response (even 404), the server is running
                        console.log(`Server at ${apiUrl} is online (status: ${response.status})`);
                        return {
                            online: true,
                            url: apiUrl,
                            status: response.status,
                            statusText: response.statusText
                        };
                    }
                } catch (e) {
                    // Continue to next endpoint
                }
            }
        } catch (error) {
            console.warn(`API server at ${apiUrl} appears to be offline:`, error);
            // Continue to next URL
        }
    }
    
    // If we get here, no server was reachable
    return {
        online: false,
        url: apiUrls[0],
        status: 'unreachable',
        statusText: 'Could not connect to any API server'
    };
}

/**
 * Load application details from the API
 * @param {string} applicationId - The ID of the application to load
 */
async function loadApplicationDetail(applicationId) {
    console.log(`Loading application detail for ID: ${applicationId}`);
    
    // UI Elements
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
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    // Show loading state
    document.body.classList.add('loading');
    
    // Hide any previous error messages
    if (errorAlert) {
        errorAlert.classList.add('d-none');
    }
    
    // Set maximum attempts to prevent infinite loops
    const MAX_TOTAL_ATTEMPTS = 3;
    let totalAttempts = 0;
    let responseData = null;
    let lastStatus = null;
    let lastError = null;
    let mockDataUsed = false;
    
    try {
        // Get token for authentication
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required. Please log in.');
        }
        
        // Get API base URL - default to localhost:5004 as seen in the HTML files
        const apiBaseUrl = "http://localhost:5004/api";
        
        // Based on the codebase analysis and error screenshots, we need to modify our approach:
        // 1. First try using DB_CONNECTOR which has logic to handle application fetching
        // 2. Then try employer-specific application routes shown in application.routes.js
        // 3. Finally, use mock data as fallback
        
        // First, check if we can use the DB_CONNECTOR
        if (window.DB_CONNECTOR && typeof window.DB_CONNECTOR.getApplicationById === 'function') {
            console.log("Using DB_CONNECTOR to fetch application data");
            try {
                const applicationData = await window.DB_CONNECTOR.getApplicationById(applicationId);
                if (applicationData) {
                    console.log("Successfully fetched application data using DB_CONNECTOR");
                    displayApplicationDetail(applicationData);
                    document.body.classList.remove('loading');
                    return;
                }
            } catch (connectorError) {
                console.warn("Error using DB_CONNECTOR:", connectorError);
                // Continue to direct API calls if connector fails
            }
        }
        
        // Try direct API patterns that match our search results
        // From the network tab, we can see failures with both endpoints: 
        // - 500 from /api/applications/157
        // - 404 from /api/employer/applications/157
        
        // Based on application.routes.js, the correct endpoints might be:
        const primaryEndpoints = [
            `${apiBaseUrl}/applications/listing/${applicationId}`, // From app routes line ~517
            `${apiBaseUrl}/applications/employer`, // From app routes line ~193
            `${apiBaseUrl}/applications/employer?id=${applicationId}`, // Try with query param
            `${apiBaseUrl}/applications`, // Try loading all and filtering client-side
            'LOCAL_MOCK_DATA'
        ];
        
        console.log("Will attempt to connect to these endpoints:", primaryEndpoints);

        // Try each endpoint
        for (const endpoint of primaryEndpoints) {
            if (responseData) break; // Skip if we already got data
            if (totalAttempts >= MAX_TOTAL_ATTEMPTS) {
                console.warn(`Reached maximum total attempts (${MAX_TOTAL_ATTEMPTS}). Stopping retry loop.`);
                break;
            }
            
            totalAttempts++;
            
            // Special handling for mock data endpoint
            if (endpoint === 'LOCAL_MOCK_DATA') {
                console.log('Using local mock data as fallback endpoint');
                responseData = {
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
                mockDataUsed = true;
                break;
            }
            
            try {
                console.log(`Attempt ${totalAttempts}/${MAX_TOTAL_ATTEMPTS}: Fetching data from: ${endpoint}`);
                
                // Set up a timeout for this specific fetch request
                const fetchTimeout = 8000; // 8 seconds per request
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);
                
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });
                
                // Clear the timeout since the request completed
                clearTimeout(timeoutId);
                
                lastStatus = response.status;
                
                // Only continue if we received a successful response
                if (response.ok) {
                    // Try to parse the response as JSON
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const responseText = await response.text();
                        
                        // Check for HTML content that might be returned with a 200 status
                        if (responseText.includes('<!DOCTYPE') || 
                            responseText.includes('<html') || 
                            responseText.includes('LANDING PAGE')) {
                            console.warn(`Endpoint ${endpoint} returned HTML instead of JSON. Skipping...`);
                            continue;
                        }
                        
                        try {
                            const data = JSON.parse(responseText);
                            if (data) {
                                console.log(`Successfully fetched data from ${endpoint}`);
                                
                                // If we fetched /applications/employer, we need to find the specific application
                                if (endpoint.includes('/applications/employer') && Array.isArray(data.applications)) {
                                    // Find the application with matching ID
                                    const foundApp = data.applications.find(app => app.id == applicationId || app.application_id == applicationId);
                                    if (foundApp) {
                                        responseData = foundApp;
                                    } else {
                                        console.warn(`Application ID ${applicationId} not found in response data`);
                                        continue;
                                    }
                                } else {
                                    responseData = data;
                                }
                                
                                // Store the working endpoint for future use
                                try {
                                    localStorage.setItem('lastSuccessfulEndpoint', endpoint);
                                } catch (e) {
                                    // Ignore storage errors
                                }
                                
                                break;
                            }
                        } catch (jsonError) {
                            console.warn(`Error parsing JSON from ${endpoint}:`, jsonError);
                            continue;
                        }
                    } else {
                        console.warn(`Endpoint ${endpoint} did not return JSON. Content-Type: ${contentType}`);
                        continue;
                    }
                } else {
                    console.warn(`Endpoint ${endpoint} returned status ${response.status}`);
                    continue;
                }
            } catch (endpointError) {
                // Check if this is an abort error from our timeout
                if (endpointError.name === 'AbortError') {
                    console.warn(`Request to ${endpoint} timed out after ${fetchTimeout}ms`);
                }
                
                console.warn(`Network error trying endpoint ${endpoint}:`, endpointError);
                lastError = endpointError;
            }
        }
        
        // If we got data from any endpoint, process it
        if (responseData) {
            // Application data might be nested in different properties depending on API structure
            // Based on normalizeApplicationData in database-connector.js
            const applicationData = responseData.application || 
                                  responseData.data || 
                                  responseData;
            
            console.log('Application data received:', applicationData);
            
            // Normalize and display the application data
            const normalizedData = normalizeApplicationData(applicationData);
            displayApplicationDetail(normalizedData);
            
            // Remove loading state
            document.body.classList.remove('loading');
            
            return;
        }
        
        // No endpoint worked - use mock data as fallback
        console.log("All API endpoints failed. Using mock data as fallback...");
        useMockData(applicationId);
        
        // Show a small notification indicating we're using mock data
        const mockIndicator = document.createElement('div');
        mockIndicator.style.position = 'fixed';
        mockIndicator.style.bottom = '10px';
        mockIndicator.style.right = '10px';
        mockIndicator.style.backgroundColor = '#ff9800';
        mockIndicator.style.color = 'white';
        mockIndicator.style.padding = '8px 16px';
        mockIndicator.style.borderRadius = '4px';
        mockIndicator.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        mockIndicator.style.zIndex = '9999';
        mockIndicator.innerHTML = 'Showing mock data - server unavailable';
        document.body.appendChild(mockIndicator);
        
    } catch (error) {
        console.error('Error loading application detail:', error);
        
        // Use mock data as fallback
        console.log("Error occurred. Using mock data as fallback...");
        useMockData(applicationId);
        
    } finally {
        // Always ensure we exit loading state
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
    
    // Set page title
    document.title = `Application ${application.id} - Employer Portal`;
    
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
    
    // Set up action buttons in the footer
    const rejectBtn = document.getElementById('rejectBtn');
    if (rejectBtn) {
        // Remove any existing event listeners
        const newRejectBtn = rejectBtn.cloneNode(true);
        rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
        
        // Add new event listener
        newRejectBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to reject this application?')) {
                updateApplicationStatus(application.id, 'Rejected');
            }
        });
        
        // Disable if already rejected
        if (application.status.toLowerCase() === 'rejected') {
            newRejectBtn.disabled = true;
            newRejectBtn.classList.add('disabled');
        } else {
            newRejectBtn.disabled = false;
            newRejectBtn.classList.remove('disabled');
        }
    }
    
    const scheduleInterviewBtn = document.getElementById('scheduleInterviewBtn');
    if (scheduleInterviewBtn) {
        // Remove any existing event listeners
        const newScheduleBtn = scheduleInterviewBtn.cloneNode(true);
        scheduleInterviewBtn.parentNode.replaceChild(newScheduleBtn, scheduleInterviewBtn);
        
        // Add new event listener
        newScheduleBtn.addEventListener('click', function() {
            const interviewDate = prompt('Enter interview date (YYYY-MM-DD):');
            if (interviewDate) {
                // First update status
                updateApplicationStatus(application.id, 'Interviewed');
                
                // Then add a note about the interview
                const currentNotes = applicationNotes.value || '';
                const newNotes = `${currentNotes}\n\nInterview scheduled for: ${interviewDate}`;
                applicationNotes.value = newNotes.trim();
                
                // Save the notes
                saveApplicationNotes(application.id, newNotes.trim());
                
                showToast(`Interview scheduled for ${interviewDate}`, 'success');
            }
        });
    }
    
    const acceptBtn = document.getElementById('acceptBtn');
    if (acceptBtn) {
        // Remove any existing event listeners
        const newAcceptBtn = acceptBtn.cloneNode(true);
        acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
        
        // Add new event listener
        newAcceptBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to accept this applicant?')) {
                updateApplicationStatus(application.id, 'Accepted');
            }
        });
        
        // Disable if already accepted
        if (application.status.toLowerCase() === 'accepted') {
            newAcceptBtn.disabled = true;
            newAcceptBtn.classList.add('disabled');
        } else {
            newAcceptBtn.disabled = false;
            newAcceptBtn.classList.remove('disabled');
        }
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
        
        // Get token for authentication
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required. Please log in.');
        }
        
        // Show loading toast during API call
        const toastId = showToast('Updating application status...', 'info', 0); // 0 means don't auto-hide
        
        // Try using connectors first - preferred approach
        let apiSuccess = false;
        let error = null;
        
        // First, try using SHARED_API_CONNECTOR
        if (window.SHARED_API_CONNECTOR) {
            try {
                console.log("Using SHARED_API_CONNECTOR to update status");
                const result = await window.SHARED_API_CONNECTOR.updateApplicationStatus(applicationId, newStatus);
                if (result && result.success) {
                    console.log("Status successfully updated via SHARED_API_CONNECTOR");
                    apiSuccess = true;
                    hideToast(toastId);
                    showToast(`Status updated to ${newStatus}`, 'success');
                    
                    // Add to activity log
                    addToActivityLog({
                        date: new Date(),
                        action: `Status changed to ${newStatus}`,
                        user: 'You'
                    });
                    
                    return { success: true, apiSuccess: true };
                }
            } catch (connectorError) {
                console.warn("Error using SHARED_API_CONNECTOR:", connectorError);
                error = connectorError;
                // Continue to next approach
            }
        }
        
        // If that failed, try using DB_CONNECTOR
        if (!apiSuccess && window.DB_CONNECTOR && typeof window.DB_CONNECTOR.updateApplicationStatus === 'function') {
            try {
                console.log("Using DB_CONNECTOR to update status");
                const result = await window.DB_CONNECTOR.updateApplicationStatus(applicationId, newStatus);
                if (result && result.success) {
                    console.log("Status successfully updated via DB_CONNECTOR");
                    apiSuccess = true;
                    hideToast(toastId);
                    showToast(`Status updated to ${newStatus}`, 'success');
                    
                    // Add to activity log
                    addToActivityLog({
                        date: new Date(),
                        action: `Status changed to ${newStatus}`,
                        user: 'You'
                    });
                    
                    return { success: true, apiSuccess: true };
                }
            } catch (connectorError) {
                console.warn("Error using DB_CONNECTOR:", connectorError);
                error = connectorError;
                // Continue to next approach
            }
        }
        
        // If connectors failed or aren't available, try direct API calls
        if (!apiSuccess) {
            // Get API server status
            const apiStatus = await checkApiServerStatus();
            if (!apiStatus.online) {
                console.log('API server appears to be offline, using client-side storage only');
                saveLocalStatusChange(applicationId, newStatus, true);
                
                hideToast(toastId);
                showToast(`Status saved offline (will sync when API available)`, 'warning');
                
                // Add to activity log
                addToActivityLog({
                    date: new Date(),
                    action: `Status changed to ${newStatus} (offline)`,
                    user: 'You'
                });
                
                return { success: true, apiSuccess: false, offline: true };
            }
            
            const apiBaseUrl = apiStatus.url;
            
            // Try multiple endpoint formats with proper error handling
            const endpointFormats = [
                {
                    url: `${apiBaseUrl}/applications/${applicationId}/status`,
                    method: 'PUT',
                    body: { status: newStatus }
                },
                {
                    url: `${apiBaseUrl}/applications/update-status`,
                    method: 'POST',
                    body: { applicationId, status: newStatus }
                },
                {
                    url: `${apiBaseUrl}/applications/${applicationId}`,
                    method: 'PATCH',
                    body: { status: newStatus }
                },
                {
                    url: `${apiBaseUrl}/student/applications/${applicationId}/status`,
                    method: 'PUT',
                    body: { status: newStatus }
                },
                {
                    url: `${apiBaseUrl}/employer/applications/${applicationId}/status`,
                    method: 'PUT',
                    body: { status: newStatus }
                }
            ];
            
            // Check for previously successful endpoints
            try {
                const successfulEndpoints = JSON.parse(localStorage.getItem('successfulSyncEndpoints') || '{}');
                if (successfulEndpoints.statusUpdate) {
                    // Add the successful endpoint as the first one to try
                    endpointFormats.unshift({
                        url: successfulEndpoints.statusUpdate,
                        method: successfulEndpoints.statusUpdateMethod || 'POST',
                        body: successfulEndpoints.statusUpdateMethod === 'POST' 
                            ? { applicationId, status: newStatus }
                            : { status: newStatus }
                    });
                }
            } catch (e) {
                // Ignore localStorage errors
            }
            
            // Try each endpoint with retries for server errors
            for (const endpoint of endpointFormats) {
                if (apiSuccess) break;
                
                // Try up to 2 times per endpoint
                for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                        // Create a controller for timeout
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                        
                        console.log(`Attempt ${attempt+1} to update status via ${endpoint.url} (${endpoint.method})`);
                        
                        const response = await fetch(endpoint.url, {
                            method: endpoint.method,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(endpoint.body),
                            signal: controller.signal
                        });
                        
                        clearTimeout(timeoutId);
                        
                        // Check if response was successful
                        if (response.ok) {
                            console.log(`Status successfully updated via ${endpoint.url}`);
                            apiSuccess = true;
                            
                            // Store successful endpoint for future use
                            try {
                                localStorage.setItem('successfulSyncEndpoints', JSON.stringify({
                                    statusUpdate: endpoint.url,
                                    statusUpdateMethod: endpoint.method
                                }));
                            } catch (e) {
                                // Ignore storage errors
                            }
                            
                            break;
                        } else {
                            // Capture response details for better error handling
                            const errorText = await response.text().catch(() => `Status ${response.status}`);
                            console.warn(`Failed to update status at ${endpoint.url}: ${response.status}`, errorText);
                            
                            // For server errors, retry after a delay
                            if (response.status >= 500 && attempt === 0) {
                                console.log(`Server error (${response.status}), retrying after delay...`);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } else {
                                // For other errors, or after retry, move to next endpoint
                                break;
                            }
                        }
                    } catch (err) {
                        if (err.name === 'AbortError') {
                            console.warn(`Request to ${endpoint.url} timed out after 5 seconds`);
                        } else {
                            console.warn(`Error with endpoint ${endpoint.url}:`, err);
                        }
                        
                        // Only retry network errors once
                        if (attempt > 0) break;
                    }
                }
            }
        }
        
        // Always store the status change in localStorage for persistence
        saveLocalStatusChange(applicationId, newStatus, !apiSuccess);
        
        // Add to activity log
        addToActivityLog({
            date: new Date(),
            action: `Status changed to ${newStatus}${apiSuccess ? '' : ' (offline)'}`,
            user: 'You'
        });
        
        // Trigger refresh of the application list if on applications page
        try {
            document.dispatchEvent(new CustomEvent('applications-updated'));
        } catch (e) {
            console.warn('Could not dispatch applications-updated event:', e);
        }
        
        // Clear the loading toast and show success or warning
        hideToast(toastId);
        if (apiSuccess) {
            showToast(`Status updated to ${newStatus}`, 'success');
        } else {
            showToast(`Status saved offline (will sync when API available)`, 'warning');
            
            // Show indicator for offline mode
            showOfflineIndicator();
        }
        
        return { success: true, apiSuccess };
        
    } catch (error) {
        console.error('Error updating application status:', error);
        showToast(`Error: ${error.message || 'Failed to update status'}`, 'error');
        return { success: false, error: error.message };
    }
}

/**
 * Add an entry to the activity log
 * @param {Object} activity - The activity to add
 */
function addToActivityLog(activity) {
    const activityLog = document.getElementById('activityLog');
    if (activityLog) {
        const li = document.createElement('li');
        li.className = 'activity-item';
        li.innerHTML = `
            <span class="activity-date">${formatDate(activity.date)}</span>
            <span class="activity-action">${activity.action}</span>
            <span class="activity-user">by ${activity.user}</span>
        `;
        activityLog.prepend(li);
    }
}

/**
 * Save local status change
 * @param {string} applicationId - The application ID
 * @param {string} status - The status
 * @param {boolean} pendingSync - Whether the change is pending sync
 */
function saveLocalStatusChange(applicationId, status, pendingSync = true) {
    try {
        // Get existing application status changes
        const appStatusChanges = JSON.parse(localStorage.getItem('applicationStatusChanges') || '{}');
        
        // Update for this application
        appStatusChanges[applicationId] = {
            status: status,
            updatedAt: new Date().toISOString(),
            pendingSync: pendingSync
        };
        
        // Save back to localStorage
        localStorage.setItem('applicationStatusChanges', JSON.stringify(appStatusChanges));
        console.log(`Status for application ${applicationId} saved to localStorage (pendingSync: ${pendingSync})`);
    } catch (storageError) {
        console.warn('Error saving to localStorage:', storageError);
    }
}

/**
 * Show offline indicator
 */
function showOfflineIndicator() {
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

/**
 * Hide a toast notification by ID
 * @param {string} id - The ID of the toast to hide
 */
function hideToast(id) {
    if (!id) return;
    
    const toast = document.getElementById(id);
    if (toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('info', 'success', 'warning', 'error')
 * @param {number} duration - How long to show the toast (ms), 0 means don't auto-hide
 * @returns {string} The toast element ID
 */
function showToast(message, type = 'info', duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    const toastId = 'toast-' + Math.random().toString(36).substr(2, 9);
    toast.id = toastId;
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast with a small delay
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after duration (if specified)
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
    
    return toastId;
}

/**
 * Save application notes
 * @param {string} applicationId - The ID of the application
 * @param {string} notes - The notes to save
 */
async function saveApplicationNotes(applicationId, notes) {
    if (!applicationId) return { success: false, error: 'No application ID provided' };
    
    try {
        // Get token for authentication
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required. Please log in.');
        }
        
        // Show loading toast during API call
        const toastId = showToast('Saving notes...', 'info', 0); // 0 means don't auto-hide
        
        // Get preferred API URL from our server status check
        const apiStatus = await checkApiServerStatus();
        if (!apiStatus.online) {
            throw new Error('Cannot save notes: API server is not reachable');
        }
        
        // Generate endpoint patterns to try
        const apiUrl = apiStatus.url;
        const endpointPatterns = [
            `${apiUrl}/applications/${applicationId}/notes`,
            `${apiUrl}/applications/${applicationId}`,
            `${apiUrl}/employers/applications/${applicationId}/notes`,
            `${apiUrl}/student/applications/${applicationId}/notes`
        ];
        
        // Check localStorage for previously successful notes update endpoints
        try {
            const workingEndpoints = JSON.parse(localStorage.getItem('workingApiEndpoints') || '{}');
            if (workingEndpoints[`notes_${applicationId}`]) {
                // Prioritize this known working endpoint
                endpointPatterns.unshift(workingEndpoints[`notes_${applicationId}`]);
            }
        } catch (e) {
            console.warn('Could not retrieve working endpoints from localStorage', e);
        }
        
        console.log('Will try these endpoints for saving notes:', endpointPatterns);
        
        let success = false;
        let error;
        let workingEndpoint = null;
        
        // Try each endpoint with retries for server errors
        for (const endpoint of endpointPatterns) {
            if (success) break;
            
            // We'll try up to 3 times per endpoint
            for (let attempt = 1; attempt <= 3; attempt++) {
                if (success) break;
                
                try {
                    console.log(`Attempt ${attempt}: Saving notes using endpoint: ${endpoint}`);
                    
                    // Add a small delay for retries
                    if (attempt > 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                    
                    const response = await fetch(endpoint, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            notes: notes,
                            application_notes: notes,
                            applicationNotes: notes
                        })
                    });
                    
                    if (response.ok) {
                        console.log('Notes saved successfully using endpoint:', endpoint);
                        success = true;
                        workingEndpoint = endpoint;
                        
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
                
                        // Clear the loading toast and show success
                        hideToast(toastId);
                showToast('Notes saved successfully', 'success');
                        break;
            } else {
                        console.warn(`Notes update failed with status ${response.status} at ${endpoint} (Attempt ${attempt})`);
                        
                        // Only retry 500 errors multiple times
                        if (response.status !== 500 && attempt >= 2) {
                            break;
                        }
                        
                        error = new Error(`Server returned status ${response.status} when using endpoint ${endpoint}`);
                    }
                } catch (err) {
                    console.warn(`Network error with endpoint ${endpoint} (Attempt ${attempt}):`, err);
                    error = err;
                    
                    // For network errors, we might retry
                    if (attempt >= 3) {
                        break; // Move to next endpoint after 3 attempts
                    }
                }
            }
        }
        
        // Save the working endpoint for future use
        if (success && workingEndpoint && localStorage) {
            try {
                const workingEndpoints = JSON.parse(localStorage.getItem('workingApiEndpoints') || '{}');
                workingEndpoints[`notes_${applicationId}`] = workingEndpoint;
                localStorage.setItem('workingApiEndpoints', JSON.stringify(workingEndpoints));
            } catch (e) {
                console.warn('Could not save working endpoint to localStorage', e);
            }
        }
        
        // Clear any loading toast that might still be showing
        hideToast(toastId);
        
        // If all endpoints failed
        if (!success) {
            throw error || new Error('All notes saving methods failed');
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('Error saving application notes:', error);
        showToast(`Error: ${error.message || 'Failed to save notes'}`, 'error');
        return { success: false, error: error.message };
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
    
    // Show notification that we're using mock data in the console
    console.log('Using mock data as fallback. All API endpoints failed...');
    
    // Add a visible indicator for mock data usage
    const mockDataElement = document.createElement('div');
    mockDataElement.style.position = 'fixed';
    mockDataElement.style.bottom = '10px';
    mockDataElement.style.right = '10px';
    mockDataElement.style.backgroundColor = '#ff9800';
    mockDataElement.style.color = 'white';
    mockDataElement.style.padding = '8px 16px';
    mockDataElement.style.borderRadius = '4px';
    mockDataElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    mockDataElement.style.zIndex = '9999';
    mockDataElement.innerHTML = 'Showing mock data - server unavailable';
    document.body.appendChild(mockDataElement);
    
    return mockApplication;
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
 * Helper function to check if a response is valid JSON
 * @param {Response} response - The fetch response to check
 * @returns {Promise<boolean>} Whether the response contains valid JSON
 */
async function isValidJsonResponse(response) {
    if (!response.ok) return false;
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        // If content type is explicitly set to something other than JSON, it's not valid JSON
        if (contentType && (contentType.includes('text/html') || contentType.includes('text/plain'))) {
            console.warn(`Response has non-JSON content type: ${contentType}`);
            return false;
        }
    }
    
    // Even if content type looks okay, we need to verify it's actually JSON
    try {
        // Clone the response so we don't consume it
        const cloneResponse = response.clone();
        const text = await cloneResponse.text();
        
        // Check if the text is empty
        if (!text || !text.trim()) {
            console.warn('Response is empty');
            return false;
        }
        
        // Quick check for landing page or other HTML content
        if (text.includes('LANDING PAGE') || text.includes('<!DOCTYPE html>')) {
            console.warn('Response contains HTML landing page content');
            return false;
        }
        
        // Check for other HTML indicators - be extremely thorough
        const htmlIndicators = [
            '<!DOCTYPE', '<html', '<body', '<head', '<div', '<script', '<table',
            '<form', '<iframe', '<title>', '<!--', '<a href', '<link rel=',
            '<meta', '<style', '<button', '<nav', '<header', '<footer', 
            '<section', '<article', '<aside', '<main', '<h1', '<h2', '<h3',
            '<img', '<p>', '</p>', '<br', '<hr', '<ul', '<ol', '<li',
            '<span', '<strong', '<em', '<b>', '<i>', '<pre', '<code'
        ];
        
        for (const indicator of htmlIndicators) {
            if (text.includes(indicator)) {
                console.warn(`Response contains HTML content (found ${indicator})`);
                return false;
            }
        }
        
        // Check for non-JSON syntax at the start
        const firstNonWhitespaceChar = text.trim()[0];
        if (firstNonWhitespaceChar !== '{' && firstNonWhitespaceChar !== '[') {
            console.warn(`Response doesn't start with JSON object/array markers: ${firstNonWhitespaceChar}`);
            return false;
        }
        
        // Try parsing as JSON
        JSON.parse(text);
        return true;
    } catch (e) {
        console.warn('Failed to parse response as JSON:', e);
        return false;
    }
} 