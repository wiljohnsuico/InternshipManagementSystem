/**
 * Employer Applications Connector
 * Handles loading and managing employer applications data
 * 
 * Now uses the shared API connector for consistent data access
 */

const APPLICATIONS_CONNECTOR = {
    // API Configuration
    API_URL: document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api',
    
    // Initialize the connector
    init: function() {
        console.log('Initializing Employer Applications Connector');
        this.setupEventListeners();
        
        // Try to sync any pending changes on initialization
        this.syncPendingChanges();
        
        // Set up periodic syncing for any changes made when offline
        setInterval(() => this.syncPendingChanges(), 60000); // Try every minute
        
        return this;
    },
    
    // Set up event listeners
    setupEventListeners: function() {
        document.addEventListener('applications-updated', () => {
            this.loadApplications();
        });
    },
    
    // Load all applications
    loadApplications: async function() {
        console.log('Loading applications...');
        
        try {
            // Use shared API connector if available
            if (window.SHARED_API_CONNECTOR) {
                console.log('Using shared API connector to load applications');
                const applications = await window.SHARED_API_CONNECTOR.getApplications({
                    filters: { role: 'employer' }
                });
                
                console.log('Applications loaded successfully via shared connector:', applications);
                return applications;
            }
            
            // Legacy code - will run if shared connector is not available
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return this.getMockApplications();
            }
            
            // Check API connectivity
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, using mock data');
                return this.getMockApplications();
            }
            
            // Try only the correct endpoint for employer applications
            const endpoints = [
                `${this.API_URL}/applications/employer`
            ];
            
            let applications = null;
            let error = null;
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    const response = await fetch(endpoint, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // The backend returns { success, count, applications: [...] }
                        if (data && data.success && Array.isArray(data.applications)) {
                            applications = this.normalizeApplicationsData(data.applications);
                        } else {
                            applications = [];
                        }
                        break;
                    }
                } catch (e) {
                    error = e;
                    console.warn(`Failed to fetch from ${endpoint}:`, e);
                    continue;
                }
            }
            
            if (applications) {
                // Apply any local status changes from localStorage
                applications = this.applyLocalStatusChanges(applications);
                console.log('Applications loaded successfully:', applications);
                return applications;
            }
            
            console.warn('All endpoints failed, using mock data with local changes');
            return this.applyLocalStatusChanges(this.getMockApplications());
            
        } catch (error) {
            console.error('Error loading applications:', error);
            return this.applyLocalStatusChanges(this.getMockApplications());
        }
    },
    
    // Check API connectivity
    checkApiConnectivity: async function() {
        // Use shared connector if available
        if (window.SHARED_API_CONNECTOR) {
            return await window.SHARED_API_CONNECTOR.checkApiConnectivity();
        }
        
        // Legacy implementation
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
    
    // Sync pending changes to server
    syncPendingChanges: async function() {
        // Use shared connector if available
        if (window.SHARED_API_CONNECTOR) {
            try {
                console.log('Using SHARED_API_CONNECTOR for syncing pending changes');
                return await window.SHARED_API_CONNECTOR.syncPendingChanges();
            } catch (error) {
                console.warn('Error using shared API connector for sync, falling back to direct implementation:', error);
                // Continue with our implementation as fallback
            }
        }
        
        try {
            // Check if we have any pending changes
            const statusChanges = JSON.parse(localStorage.getItem('applicationStatusChanges') || '{}');
            const pendingChanges = Object.entries(statusChanges).filter(([_, change]) => change.pendingSync);
            
            if (pendingChanges.length === 0) {
                // No pending changes to sync
                console.log('No pending changes to sync');
                return;
            }
            
            // Check if we're online
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.log('API not available, will try syncing changes later');
                return;
            }
            
            console.log(`Attempting to sync ${pendingChanges.length} pending status changes`);
            
            // Get authentication token
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found, cannot sync changes');
                return;
            }
            
            // Try to sync each pending change
            for (const [applicationId, change] of pendingChanges) {
                try {
                    console.log(`Syncing status for application ${applicationId} to ${change.status}`);
                    
                    // Define multiple endpoints to try
                    const endpoints = [
                        {
                            url: `${this.API_URL}/applications/update-status`,
                            method: 'POST',
                            body: {
                                applicationId: applicationId,
                                status: change.status
                            }
                        },
                        {
                            url: `${this.API_URL}/applications/${applicationId}/status`,
                            method: 'PATCH',
                            body: {
                                status: change.status
                            }
                        },
                        {
                            url: `${this.API_URL}/applications/${applicationId}`,
                            method: 'POST',
                            body: {
                                status: change.status
                            }
                        }
                    ];
                    
                    // Check for previously successful endpoints
                    try {
                        const successfulEndpoints = JSON.parse(localStorage.getItem('successfulSyncEndpoints') || '{}');
                        if (successfulEndpoints.statusUpdate) {
                            // Add the successful endpoint as the first one to try
                            endpoints.unshift({
                                url: successfulEndpoints.statusUpdate,
                                method: successfulEndpoints.statusUpdateMethod || 'POST',
                                body: successfulEndpoints.statusUpdateMethod === 'POST' 
                                    ? { applicationId: applicationId, status: change.status }
                                    : { status: change.status }
                            });
                        }
                    } catch (e) {
                        // Ignore localStorage errors
                    }
                    
                    let syncSuccess = false;
                    let lastError = null;
                    
                    // Try each endpoint until one succeeds
                    for (const endpoint of endpoints) {
                        if (syncSuccess) break;
                        
                        try {
                            // Add timeout to prevent hanging requests
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 5000);
                            
                            console.log(`Trying endpoint: ${endpoint.url} (${endpoint.method})`);
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
                            
                            // Get response body for better debugging
                            let responseText = 'No response body';
                            try {
                                responseText = await response.text();
                                // Add extra log for debugging 
                                console.log(`Response from ${endpoint.url}: ${responseText}`);
                            } catch (e) {
                                console.warn('Could not read response body:', e);
                            }
                            
                            if (response.ok) {
                                console.log(`Successfully synced status for application ${applicationId} using ${endpoint.url}`);
                                syncSuccess = true;
                                
                                // Mark as synced in localStorage
                                statusChanges[applicationId].pendingSync = false;
                                localStorage.setItem('applicationStatusChanges', JSON.stringify(statusChanges));
                                
                                // Store successful endpoint for future use
                                try {
                                    const successfulEndpoints = JSON.parse(localStorage.getItem('successfulSyncEndpoints') || '{}');
                                    successfulEndpoints.statusUpdate = endpoint.url;
                                    successfulEndpoints.statusUpdateMethod = endpoint.method;
                                    localStorage.setItem('successfulSyncEndpoints', JSON.stringify(successfulEndpoints));
                                } catch (e) {
                                    // Ignore storage errors
                                }
                                
                                break;
                            } else {
                                // Log the error response for debugging
                                console.warn(`Failed to sync status at ${endpoint.url}: ${response.status} ${response.statusText}`, responseText);
                                lastError = new Error(`Server returned ${response.status} for ${endpoint.url}: ${responseText}`);
                                
                                // If we hit rate limits or server errors, add a small delay before next attempt
                                if (response.status === 429 || response.status >= 500) {
                                    await new Promise(resolve => setTimeout(resolve, 1500));
                                } else if (response.status === 404) {
                                    // 404 errors might mean the endpoint format has changed
                                    console.log('Endpoint not found, trying next endpoint format');
                                } else {
                                    // Add a small delay for other errors too
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                }
                            }
                        } catch (endpointError) {
                            console.warn(`Error with endpoint ${endpoint.url}:`, endpointError);
                            lastError = endpointError;
                            
                            // Add a small delay before trying the next endpoint
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                    
                    if (!syncSuccess) {
                        console.warn(`Failed to sync status for application ${applicationId} after trying all endpoints`, lastError);
                        // Mark this application for retry with a backoff time
                        const currentTime = new Date().getTime();
                        statusChanges[applicationId].lastAttempt = currentTime;
                        statusChanges[applicationId].retryCount = (statusChanges[applicationId].retryCount || 0) + 1;
                        localStorage.setItem('applicationStatusChanges', JSON.stringify(statusChanges));
                    }
                } catch (error) {
                    console.warn(`Failed to sync status for application ${applicationId}:`, error);
                }
            }
            
            // Dispatch an event to notify that sync was attempted
            try {
                document.dispatchEvent(new CustomEvent('applications-sync-attempted', {
                    detail: {
                        pendingChanges: pendingChanges.length,
                        timestamp: new Date().toISOString()
                    }
                }));
            } catch (e) {
                // Ignore event dispatch errors
            }
        } catch (error) {
            console.warn('Error syncing pending changes:', error);
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
        if (!app) return null;
        
        // Extract ID - check all possible formats
        const id = app.id || app._id || app.applicationId || app.application_id || 
                  app.intern_application_id || app.internApplicationId || 
                  (app.application ? app.application.id : null) || '';
                  
        // If we still don't have an ID and there's a listing ID, use that as fallback
        const fallbackId = app.listing_id || app.listingId || app.job_id || app.jobId || '';
        
        // Construct student name from various possible formats
        const studentName = app.studentName || app.student_name || 
            (app.student ? `${app.student.firstName || app.student.first_name || ''} ${app.student.lastName || app.student.last_name || ''}`.trim() : '') ||
            (app.intern ? `${app.intern.firstName || app.intern.first_name || ''} ${app.intern.lastName || app.intern.last_name || ''}`.trim() : '');
        
        // Return normalized object with all possible fields
        return {
            id: id || fallbackId,
            applicationId: id || fallbackId, // Duplicate for consistent access
            studentName: studentName || 'Unknown Student',
            studentId: app.studentId || app.student_id || 
                      (app.student ? app.student.id || app.student._id || app.student.studentId || '' : '') ||
                      (app.intern ? app.intern.id || app.intern._id || app.intern.studentId || '' : ''),
            studentEmail: app.studentEmail || app.student_email || 
                         (app.student ? app.student.email || '' : '') ||
                         (app.intern ? app.intern.email || '' : ''),
            studentPhone: app.studentPhone || app.student_phone || 
                         (app.student ? app.student.phone || '' : '') ||
                         (app.intern ? app.intern.phone || '' : '') || 'Not provided',
            jobTitle: app.jobTitle || app.job_title || app.position || 
                     (app.job ? app.job.title || app.job.jobTitle || '' : '') ||
                     (app.listing ? app.listing.title || app.listing.jobTitle || '' : '') || 'Unknown Position',
            jobId: app.jobId || app.job_id || 
                  (app.job ? app.job.id || app.job._id || '' : '') ||
                  (app.listing ? app.listing.id || app.listing._id || '' : '') || '',
            appliedDate: app.appliedDate || app.applied_date || app.createdAt || app.created_at || 
                        app.date || app.application_date || new Date(),
            status: app.status || app.application_status || app.applicationStatus || 'Pending',
            coverLetter: app.coverLetter || app.cover_letter || '',
            resumeUrl: app.resumeUrl || app.resume_url || app.resume || '',
            notes: app.notes || app.application_notes || app.applicationNotes || '',
            activities: app.activities || app.activity_log || app.activityLog || [],
            // Include all original data to avoid losing anything
            originalData: app
        };
    },
    
    // Apply local status changes from localStorage to applications
    applyLocalStatusChanges: function(applications) {
        // Use shared connector if available
        if (window.SHARED_API_CONNECTOR) {
            return window.SHARED_API_CONNECTOR.applyLocalStatusChanges(applications);
        }
        
        try {
            // Get stored status changes from localStorage
            const statusChanges = JSON.parse(localStorage.getItem('applicationStatusChanges') || '{}');
            
            if (Object.keys(statusChanges).length === 0) {
                // No local changes, return original applications
                return applications;
            }
            
            console.log('Applying local status changes:', statusChanges);
            
            // Apply changes to each application
            return applications.map(app => {
                // Get application ID
                const appId = app.id || app._id || app.applicationId || app.application_id || '';
                
                // If we have a local status change for this application, apply it
                if (appId && statusChanges[appId]) {
                    console.log(`Applying local status change to application ${appId}: ${statusChanges[appId].status}`);
                    return {
                        ...app,
                        status: statusChanges[appId].status
                    };
                }
                
                // Otherwise return original application
                return app;
            });
        } catch (error) {
            console.warn('Error applying local status changes:', error);
            return applications;
        }
    },
    
    // Get mock applications data
    getMockApplications: function() {
        // Use shared connector if available
        if (window.SHARED_API_CONNECTOR) {
            return window.SHARED_API_CONNECTOR.getMockApplications('employer');
        }
        
        console.log('Returning mock applications data');
        
        // Generate random IDs if needed
        const generateId = () => Math.random().toString(36).substring(2, 15);
        
        // Create mock applications with proper structures
        const mockApplications = [
            {
                id: 'app-1',
                applicationId: 'app-1',
                studentName: 'John Doe',
                studentId: 'STU-1001',
                studentEmail: 'john.doe@example.com',
                studentPhone: '(555) 123-4567',
                jobTitle: 'Frontend Developer Intern',
                jobId: 'job-1',
                appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                status: 'Pending',
                coverLetter: 'I am excited to apply for this position as it aligns with my skills in web development. I have experience with React, Angular, and Vue.js frameworks and am eager to contribute to real-world projects.',
                resumeUrl: '',
                skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Angular'],
                studentCourse: 'BS Computer Science - 3rd Year',
                notes: '',
                activities: [
                    {
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        action: 'Application received',
                        user: 'System'
                    }
                ]
            },
            {
                id: 'app-2',
                applicationId: 'app-2',
                studentName: 'Jane Smith',
                studentId: 'STU-1002',
                studentEmail: 'jane.smith@example.com',
                studentPhone: '(555) 987-6543',
                jobTitle: 'Backend Developer Intern',
                jobId: 'job-2',
                appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                status: 'Reviewed',
                coverLetter: 'With my experience in backend development using Node.js and Express, I believe I am well-suited for this role. I have also worked with databases like MongoDB and MySQL, and I am eager to gain more professional experience.',
                resumeUrl: '',
                skills: ['Node.js', 'Express', 'MongoDB', 'MySQL', 'API Development'],
                studentCourse: 'BS Information Technology - 4th Year',
                notes: 'Strong candidate with good technical background',
                activities: [
                    {
                        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                        action: 'Application received',
                        user: 'System'
                    },
                    {
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                        action: 'Status changed to Reviewed',
                        user: 'Employer'
                    }
                ]
            },
            {
                id: 'app-3',
                applicationId: 'app-3',
                studentName: 'Alex Williams',
                studentId: 'STU-1003',
                studentEmail: 'alex.williams@example.com',
                studentPhone: '(555) 456-7890',
                jobTitle: 'Data Science Intern',
                jobId: 'job-3',
                appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                status: 'Accepted',
                coverLetter: 'I am excited about this data science internship as it aligns perfectly with my academic focus. I have experience with Python, data analysis, and machine learning models.',
                resumeUrl: '',
                skills: ['Python', 'R', 'Data Analysis', 'Machine Learning', 'SQL'],
                studentCourse: 'BS Computer Science - 4th Year',
                notes: 'Excellent data science background, perfect for the role',
                activities: [
                    {
                        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        action: 'Application received',
                        user: 'System'
                    },
                    {
                        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                        action: 'Status changed to Reviewed',
                        user: 'Employer'
                    },
                    {
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        action: 'Status changed to Accepted',
                        user: 'Employer'
                    }
                ]
            },
            {
                id: 'app-4',
                applicationId: 'app-4',
                studentName: 'Michael Johnson',
                studentId: 'STU-1004',
                studentEmail: 'michael.johnson@example.com',
                studentPhone: '(555) 222-3333',
                jobTitle: 'UI/UX Design Intern',
                jobId: 'job-4',
                appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                status: 'Rejected',
                coverLetter: 'I am passionate about creating intuitive and beautiful user interfaces. I have experience with Figma, Adobe XD, and implementing designs using HTML/CSS.',
                resumeUrl: '',
                skills: ['UI Design', 'UX Research', 'Figma', 'Adobe XD', 'Prototyping'],
                studentCourse: 'BS Information Systems - 3rd Year',
                notes: 'Not enough experience for current requirements',
                activities: [
                    {
                        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                        action: 'Application received',
                        user: 'System'
                    },
                    {
                        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                        action: 'Status changed to Rejected',
                        user: 'Employer'
                    }
                ]
            },
            {
                id: 'app-5',
                applicationId: 'app-5',
                studentName: 'Emily Chen',
                studentId: 'STU-1005',
                studentEmail: 'emily.chen@example.com',
                studentPhone: '(555) 777-8888',
                jobTitle: 'Mobile App Developer Intern',
                jobId: 'job-5',
                appliedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                status: 'Pending',
                coverLetter: 'I am applying for this internship to gain professional experience in mobile app development. I have created several Android apps using Kotlin and have familiarity with iOS development using Swift.',
                resumeUrl: '',
                skills: ['Android', 'Kotlin', 'iOS', 'Swift', 'Mobile UI Design'],
                studentCourse: 'BS Computer Engineering - 3rd Year',
                notes: '',
                activities: [
                    {
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                        action: 'Application received',
                        user: 'System'
                    }
                ]
            }
        ];
        
        // Store in localStorage for persistence across page reloads
        try {
            localStorage.setItem('mockApplications', JSON.stringify(mockApplications));
        } catch (e) {
            console.warn('Could not save mock applications to localStorage:', e);
        }
        
        return mockApplications;
    }
};

// Initialize the connector when the script loads
document.addEventListener('DOMContentLoaded', () => {
    APPLICATIONS_CONNECTOR.init();
    console.log('Applications connector initialized with API URL:', APPLICATIONS_CONNECTOR.API_URL);
    
    // Log when shared connector is detected
    if (window.SHARED_API_CONNECTOR) {
        console.log('Shared API connector detected. Enhanced functionality available.');
    }
}); 