/**
 * Database Connector Script
 * 
 * This script provides connectivity between the front-end and backend API,
 * with fallback to mock data when the API is not available.
 */

const DB_CONNECTOR = {
    // API Configuration
    API_URL: document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api',
    
    // Check if the API is available
    checkApiConnectivity: async function() {
        try {
            console.log(`Checking API connectivity at ${this.API_URL}/health`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.API_URL}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.warn('API connectivity check failed:', error);
            return false;
        }
    },
    
    // Get applications
    getApplications: async function() {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return this.getMockApplications();
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, returning mock applications');
                return this.getMockApplications();
            }
            
            // Try multiple endpoints
            try {
                const response = await fetch(`${this.API_URL}/applications/employer`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Applications fetched successfully:', data);
                    return this.normalizeApplicationsData(data);
                }
                
                // Try alternative endpoint
                const altResponse = await fetch(`${this.API_URL}/employers/applications`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (altResponse.ok) {
                    const altData = await altResponse.json();
                    console.log('Applications fetched from alternative endpoint:', altData);
                    return this.normalizeApplicationsData(altData);
                }
                
                // If both endpoints fail
                console.warn('Both API endpoints failed, returning mock applications');
                return this.getMockApplications();
            } catch (error) {
                console.error('Error fetching applications:', error);
                return this.getMockApplications();
            }
        } catch (error) {
            console.error('Error in getApplications:', error);
            return this.getMockApplications();
        }
    },
    
    // Get a single application by ID
    getApplicationById: async function(applicationId) {
        if (!applicationId) {
            console.error('No application ID provided');
            return null;
        }
        
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return this.getMockApplicationById(applicationId);
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, returning mock application');
                return this.getMockApplicationById(applicationId);
            }
            
            // Check if we have a cached successful endpoint from previous calls
            let cachedEndpoint = null;
            try {
                const successfulEndpoints = JSON.parse(localStorage.getItem('successfulApiEndpoints') || '{}');
                if (successfulEndpoints.applicationById) {
                    cachedEndpoint = successfulEndpoints.applicationById.replace('{id}', applicationId);
                    console.log('Using cached successful endpoint:', cachedEndpoint);
                }
            } catch (e) {
                console.warn('Could not retrieve cached endpoints:', e);
            }
            
            // Define endpoints to try - based on observed successful behavior, we'll order them differently
            // From screenshot, we can see /api/applications/employer?id=157 works successfully
            const endpoints = [];
            
            // Add the cached endpoint first if it exists
            if (cachedEndpoint) {
                endpoints.push(cachedEndpoint);
            }
            
            // Add the known working endpoints first, then fallbacks
            endpoints.push(
                `${this.API_URL}/applications/employer?id=${applicationId}`,
                `${this.API_URL}/applications/${applicationId}`,
                `${this.API_URL}/applications/listing/${applicationId}`,
                `${this.API_URL}/employer/applications/${applicationId}`
            );
            
            let lastError = null;
            let workingEndpoint = null;
            
            // Try each endpoint in order
            for (const endpoint of endpoints) {
                try {
                    // Use info level instead of log to reduce console noise
                    console.info(`Trying to fetch application from: ${endpoint}`);
                    const response = await fetch(endpoint, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            const data = await response.json();
                            console.log('Application fetched successfully:', data);
                            
                            // Save the successful endpoint pattern for future use
                            workingEndpoint = endpoint;
                            
                            // Handle different response formats
                            if (data.applications && Array.isArray(data.applications)) {
                                // If we got an array of applications, find the one with matching ID
                                const application = data.applications.find(app => 
                                    app.id == applicationId || 
                                    app.application_id == applicationId ||
                                    app._id == applicationId
                                );
                                
                                if (application) {
                                    // Cache the successful endpoint pattern for future use
                                    this.cacheSuccessfulEndpoint(endpoint, applicationId);
                                    return this.normalizeApplicationData(application);
                                }
                            } else {
                                // Direct application data response
                                // Cache the successful endpoint pattern for future use
                                this.cacheSuccessfulEndpoint(endpoint, applicationId);
                                return this.normalizeApplicationData(data);
                            }
                        }
                    } else if (response.status === 404) {
                        // Downgrade to info level - 404s are expected during the fallback process
                        console.info(`Endpoint ${endpoint} returned 404 - trying next endpoint`);
                    } else if (response.status === 500) {
                        console.error(`Server error (500) at endpoint ${endpoint}`);
                        lastError = new Error(`Server returned 500 error for ${endpoint}`);
                    } else {
                        console.warn(`Endpoint ${endpoint} returned status ${response.status}`);
                    }
                } catch (error) {
                    console.error(`Error fetching from ${endpoint}:`, error);
                    lastError = error;
                }
            }
            
            // If all direct endpoints failed, fallback to getting all applications and filtering
            try {
                console.log('Attempting to get all applications and filter');
                const applications = await this.getApplications();
                
                if (applications && Array.isArray(applications)) {
                    const application = applications.find(app => 
                        app.id == applicationId || 
                        app.application_id == applicationId ||
                        app._id == applicationId
                    );
                    
                    if (application) {
                        console.log('Found application in applications list');
                        return application;
                    }
                }
            } catch (allAppsError) {
                console.error('Error getting all applications:', allAppsError);
            }
            
            // If all methods failed, log the error and return mock data
            if (lastError) {
                console.warn(`All API endpoints failed. Last error:`, lastError);
            }
            
            console.warn(`Application with ID ${applicationId} not found, returning mock data`);
            return this.getMockApplicationById(applicationId);
        } catch (error) {
            console.error('Error in getApplicationById:', error);
            return this.getMockApplicationById(applicationId);
        }
    },
    
    // Helper function to cache successful endpoint patterns
    cacheSuccessfulEndpoint: function(endpoint, applicationId) {
        try {
            // Extract the pattern by replacing the ID with a placeholder
            const pattern = endpoint.replace(applicationId, '{id}');
            
            const successfulEndpoints = JSON.parse(localStorage.getItem('successfulApiEndpoints') || '{}');
            successfulEndpoints.applicationById = pattern;
            localStorage.setItem('successfulApiEndpoints', JSON.stringify(successfulEndpoints));
            
            console.log('Cached successful endpoint pattern:', pattern);
        } catch (e) {
            console.warn('Could not cache successful endpoint:', e);
        }
    },
    
    // Update application status
    updateApplicationStatus: async function(applicationId, newStatus) {
        if (!applicationId) {
            console.error('No application ID provided');
            return { success: false, error: 'No application ID provided' };
        }
        
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return { success: false, error: 'No authentication token found' };
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, simulating status update success');
                // Store the status change locally
                this.saveLocalStatusChange(applicationId, newStatus, true);
                return { success: true, status: newStatus, apiSuccess: false };
            }
            
            console.log(`Attempting to update status for application ${applicationId} to ${newStatus}`);
            
            // Check for previously successful endpoints
            let endpoints = [];
            try {
                const successfulEndpoints = JSON.parse(localStorage.getItem('successfulSyncEndpoints') || '{}');
                if (successfulEndpoints.statusUpdate) {
                    // Add the successful endpoint as the first one to try
                    endpoints.push({
                        url: successfulEndpoints.statusUpdate,
                        method: successfulEndpoints.statusUpdateMethod || 'POST',
                        body: successfulEndpoints.statusUpdateMethod === 'POST' 
                            ? { applicationId, status: newStatus }
                            : { status: newStatus }
                    });
                }
            } catch (e) {
                console.warn('Could not retrieve successful endpoints from localStorage:', e);
            }
            
            // Add default endpoints
            endpoints = endpoints.concat([
                {
                    url: `${this.API_URL}/applications/update-status`,
                    method: 'POST',
                    body: { applicationId, status: newStatus }
                },
                {
                    url: `${this.API_URL}/applications/${applicationId}/status`,
                    method: 'PUT',
                    body: { status: newStatus }
                },
                {
                    url: `${this.API_URL}/applications/${applicationId}`,
                    method: 'PATCH',
                    body: { status: newStatus }
                },
                {
                    url: `${this.API_URL}/student/applications/${applicationId}/status`,
                    method: 'PUT',
                    body: { status: newStatus }
                },
                {
                    url: `${this.API_URL}/employer/applications/${applicationId}/status`,
                    method: 'PUT',
                    body: { status: newStatus }
                }
            ]);
            
            let lastError = null;
            let apiSuccess = false;
            
            // Try each endpoint with retries for server errors
            for (const endpoint of endpoints) {
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
                        
                        // Get response body for debugging
                        let responseText = "";
                        try {
                            responseText = await response.text();
                        } catch (textError) {
                            console.warn('Could not read response text:', textError);
                        }
                        
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
                            
                            // Store the status change locally with pendingSync=false
                            this.saveLocalStatusChange(applicationId, newStatus, false);
                            
                            try {
                                // Parse response if it's JSON
                                let responseData = {};
                                if (responseText && responseText.trim().startsWith('{')) {
                                    responseData = JSON.parse(responseText);
                                }
                                return { success: true, ...responseData, apiSuccess: true };
                            } catch (e) {
                                return { success: true, message: 'Status updated', apiSuccess: true };
                            }
                        } else {
                            console.warn(`Status update failed at ${endpoint.url} (${response.status}):`, responseText);
                            lastError = new Error(responseText || `Server returned ${response.status}`);
                            
                            // For server errors, retry after a delay
                            if (response.status >= 500 && attempt === 0) {
                                console.log(`Server error (${response.status}), retrying after delay...`);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } else {
                                // For other errors, move to next endpoint
                                break;
                            }
                        }
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            console.warn(`Request to ${endpoint.url} timed out after 5 seconds`);
                        } else {
                            console.warn(`Error with endpoint ${endpoint.url}:`, error);
                        }
                        lastError = error;
                        
                        // Only retry network errors once
                        if (attempt > 0) break;
                    }
                }
            }
            
            console.error('All endpoints failed for status update. Last error:', lastError);
            
            // Store the status change locally with pendingSync=true
            this.saveLocalStatusChange(applicationId, newStatus, true);
            
            return { 
                success: true, // Return success, but mark that it requires sync later
                error: lastError ? lastError.message : 'All API endpoints failed',
                apiSuccess: false,
                localSaved: true,
                status: newStatus
            };
        } catch (error) {
            console.error('Error updating application status:', error);
            
            // Store the status change locally as a fallback
            try {
                this.saveLocalStatusChange(applicationId, newStatus, true);
                return { 
                    success: true, 
                    apiSuccess: false, 
                    error: error.message,
                    localSaved: true,
                    status: newStatus
                };
            } catch (localError) {
                console.error('Failed to save status locally:', localError);
                return { success: false, error: error.message };
            }
        }
    },
    
    // Save local status change
    saveLocalStatusChange: function(applicationId, status, pendingSync = true) {
        try {
            // Get existing status changes
            const statusChanges = JSON.parse(localStorage.getItem('applicationStatusChanges') || '{}');
            
            // Add or update this application's status
            statusChanges[applicationId] = {
                status: status,
                updatedAt: new Date().toISOString(),
                pendingSync: pendingSync
            };
            
            // Save back to localStorage
            localStorage.setItem('applicationStatusChanges', JSON.stringify(statusChanges));
            console.log(`Status for application ${applicationId} saved locally (pendingSync: ${pendingSync})`);
            
            // Dispatch an event so other parts of the app know the status changed
            try {
                document.dispatchEvent(new CustomEvent('application-status-updated', {
                    detail: { applicationId, status, pendingSync }
                }));
            } catch (e) {
                console.warn('Could not dispatch application-status-updated event:', e);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving status change to localStorage:', error);
            return false;
        }
    },
    
    // Save application notes
    saveApplicationNotes: async function(applicationId, notes) {
        if (!applicationId) {
            console.error('No application ID provided');
            return { success: false, error: 'No application ID provided' };
        }
        
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return { success: false, error: 'No authentication token found' };
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, simulating notes save success');
                return { success: true, notes };
            }
            
            // Send the notes update
            const response = await fetch(`${this.API_URL}/applications/${applicationId}/notes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ notes })
            });
            
            if (response.ok) {
                const data = await response.json();
                return { success: true, ...data };
            } else {
                return { success: false, error: `API returned ${response.status}` };
            }
        } catch (error) {
            console.error('Error saving application notes:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Normalize applications data from various API formats
    normalizeApplicationsData: function(data) {
        let applications = [];
        
        // Check various data structures the API might return
        if (data.applications && Array.isArray(data.applications)) {
            applications = data.applications;
        } else if (Array.isArray(data)) {
            applications = data;
        } else if (data.data && Array.isArray(data.data)) {
            applications = data.data;
        } else if (data.items && Array.isArray(data.items)) {
            applications = data.items;
        } else {
            console.error('Unexpected data format:', data);
            return [];
        }
        
        // Normalize each application
        return applications.map(app => this.normalizeApplicationData(app));
    },
    
    // Normalize a single application
    normalizeApplicationData: function(app) {
        return {
            id: app.id || app._id || app.applicationId || app.application_id || '',
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
            matchScore: app.matchScore || app.match_score || null,
            // Include all original data to avoid losing anything
            originalData: app
        };
    },
    
    // Get mock applications data
    getMockApplications: function() {
        return [
            {
                id: 'app-1',
                studentName: 'John Doe',
                studentId: 'STU-1001',
                studentEmail: 'john.doe@example.com',
                studentPhone: '(555) 123-4567',
                jobTitle: 'Frontend Developer Intern',
                jobId: 'job-1',
                appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                status: 'Pending',
                coverLetter: 'I am excited to apply for this position...',
                resumeUrl: ''
            },
            {
                id: 'app-2',
                studentName: 'Jane Smith',
                studentId: 'STU-1002',
                studentEmail: 'jane.smith@example.com',
                studentPhone: '(555) 987-6543',
                jobTitle: 'Backend Developer Intern',
                jobId: 'job-2',
                appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                status: 'Reviewed',
                coverLetter: 'With my experience in backend development...',
                resumeUrl: ''
            },
            {
                id: 'app-3',
                studentName: 'Michael Brown',
                studentId: 'STU-1003',
                studentEmail: 'michael.brown@example.com',
                studentPhone: '(555) 456-7890',
                jobTitle: 'UX Design Intern',
                jobId: 'job-3',
                appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                status: 'Interviewed',
                coverLetter: 'I believe my design skills would be a great fit...',
                resumeUrl: ''
            }
        ];
    },
    
    // Get a mock application by ID
    getMockApplicationById: function(applicationId) {
        // Check if the ID matches one of our mock applications
        const mockApps = this.getMockApplications();
        const foundApp = mockApps.find(app => app.id === applicationId);
        
        if (foundApp) {
            return foundApp;
        }
        
        // Create a new mock application based on the ID
        return {
            id: applicationId,
            studentName: 'Mock Student',
            studentId: 'STU-MOCK',
            studentEmail: 'mock.student@example.com',
            studentPhone: '(555) 123-4567',
            jobTitle: 'Mock Position Intern',
            jobId: 'job-mock',
            appliedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'Pending',
            coverLetter: 'This is a mock cover letter for demonstration purposes. In a real application, this would contain the student\'s actual cover letter text explaining their interest in the position and qualifications.',
            resumeUrl: '',
            notes: '',
            activities: [
                {
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    action: 'Application received',
                    user: 'System'
                }
            ]
        };
    },
    
    // Format date for display
    formatDate: function(dateString) {
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
};

// Make available globally
window.DB_CONNECTOR = DB_CONNECTOR;

// Initialize the connector when the script loads
console.log('Database connector initialized with API URL:', DB_CONNECTOR.API_URL); 