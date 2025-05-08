/**
 * Shared API Connector
 * 
 * This script provides a unified API connector that works across all interfaces:
 * - Student/Intern interface
 * - Employer interface
 * - Admin interface
 * 
 * It standardizes API access, error handling, and data structures.
 */

const SHARED_API_CONNECTOR = {
    // API Configuration - automatically detect from meta tag or use default
    API_URL: document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api',
    
    /**
     * Initialize the connector
     */
    init: function() {
        console.log('Initializing Shared API Connector');
        this.setupEventListeners();
        
        // Try to sync any pending changes on initialization
        this.syncPendingChanges();
        
        // Set up periodic syncing for any changes made when offline
        setInterval(() => this.syncPendingChanges(), 60000); // Try every minute
        
        return this;
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        document.addEventListener('api-data-updated', (event) => {
            console.log('API data updated event received:', event.detail);
            // This event can be used to trigger refreshes across the application
        });
        
        // Listen for online/offline events to sync data
        window.addEventListener('online', () => {
            console.log('Connection restored. Syncing pending changes...');
            this.syncPendingChanges();
        });
    },
    
    // Network status management
    isOnline: false,
    connectionCheckInterval: null,
    pendingRequests: [],
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_BACKOFF_MS: 1000, // Start with 1 second, will increase
    
    /**
     * Check if the API is available
     * @returns {Promise<boolean>} Whether the API is available
     */
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
            this.isOnline = response.ok;
            return response.ok;
        } catch (error) {
            console.warn('API connectivity check failed:', error);
            this.isOnline = false;
            return false;
        }
    },
    
    /**
     * Get authentication token
     * @returns {string|null} The authentication token
     */
    getAuthToken: function() {
        return localStorage.getItem('token') || 
               localStorage.getItem('authToken') || 
               localStorage.getItem('adminToken') || 
               localStorage.getItem('employerToken') || 
               null;
    },
    
    /**
     * Make an authenticated API request
     * @param {string} endpoint - The API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} The response data
     */
    apiRequest: async function(endpoint, options = {}) {
        try {
            const token = this.getAuthToken();
            if (!token && options.requiresAuth !== false) {
                throw new Error('Authentication required');
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                throw new Error('API not available');
            }
            
            // Create a controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), options.timeout || 8000);
            
            // Prepare headers
            const headers = {
                ...options.headers,
                'Content-Type': options.contentType || 'application/json'
            };
            
            // Add authorization if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Prepare URL - if endpoint already has http, use it directly
            const url = endpoint.startsWith('http') 
                ? endpoint 
                : `${this.API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
            
            // Make the request
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal
            });
            
            // Clear the timeout
            clearTimeout(timeoutId);
            
            // Handle response
            if (response.ok) {
                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    return { success: true, message: 'Request successful but no JSON returned' };
                }
            } else {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error(`API request to ${endpoint} failed:`, error);
            throw error;
        }
    },
    
    /**
     * Get applications with proper role-based filtering
     * @param {Object} options - Options for filtering
     * @returns {Promise<Array>} The applications
     */
    getApplications: async function(options = {}) {
        try {
            const userRole = this.determineUserRole();
            
            // Select proper endpoint based on user role
            let endpoint = '/applications';
            
            if (userRole === 'employer') {
                endpoint = '/applications/employer';
            } else if (userRole === 'student') {
                endpoint = '/applications/student';
            } else if (userRole === 'admin') {
                endpoint = '/admin/applications';
            }
            
            // Add any query parameters
            if (options.filters) {
                const queryParams = new URLSearchParams();
                for (const [key, value] of Object.entries(options.filters)) {
                    queryParams.append(key, value);
                }
                endpoint += `?${queryParams.toString()}`;
            }
            
            const data = await this.apiRequest(endpoint);
            
            // Extract applications array based on response structure
            let applications = [];
            if (data.applications && Array.isArray(data.applications)) {
                applications = data.applications;
            } else if (data.data && Array.isArray(data.data)) {
                applications = data.data;
            } else if (Array.isArray(data)) {
                applications = data;
            }
            
            // Apply local status changes if needed
            if (options.applyLocalChanges !== false) {
                applications = this.applyLocalStatusChanges(applications);
            }
            
            return applications;
        } catch (error) {
            console.error('Error fetching applications:', error);
            
            // Fallback to mock data
            if (options.useMockData !== false) {
                return this.getMockApplications(userRole);
            }
            
            throw error;
        }
    },
    
    /**
     * Get a single application by ID
     * @param {string} applicationId - The application ID
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} The application
     */
    getApplicationById: async function(applicationId, options = {}) {
        if (!applicationId) {
            throw new Error('No application ID provided');
        }
        
        try {
            const userRole = this.determineUserRole();
            
            // Try several endpoints that might work for different roles
            const endpoints = [
                `/applications/${applicationId}`,
                `/applications/employer?id=${applicationId}`,
                `/applications/student/${applicationId}`,
                `/admin/applications/${applicationId}`
            ];
            
            let application = null;
            let lastError = null;
            
            for (const endpoint of endpoints) {
                try {
                    const data = await this.apiRequest(endpoint);
                    
                    // Handle different response formats
                    if (data.application) {
                        application = data.application;
                        break;
                    } else if (data.applications && Array.isArray(data.applications)) {
                        const foundApp = data.applications.find(app => 
                            app.id == applicationId || 
                            app._id == applicationId || 
                            app.applicationId == applicationId
                        );
                        
                        if (foundApp) {
                            application = foundApp;
                            break;
                        }
                    } else if (data.id == applicationId || data._id == applicationId) {
                        application = data;
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    continue;
                }
            }
            
            if (application) {
                // Apply any local status changes if needed
                if (options.applyLocalChanges !== false) {
                    const statusChanges = this.getLocalStatusChanges();
                    if (statusChanges[applicationId]) {
                        application.status = statusChanges[applicationId].status;
                    }
                }
                
                return application;
            }
            
            // If we couldn't find the application, try one final approach:
            // Get all applications and filter
            try {
                const applications = await this.getApplications();
                const foundApp = applications.find(app => 
                    app.id == applicationId || 
                    app._id == applicationId || 
                    app.applicationId == applicationId
                );
                
                if (foundApp) {
                    return foundApp;
                }
            } catch (error) {
                console.warn('Failed to find application in all applications list:', error);
            }
            
            throw lastError || new Error(`Application with ID ${applicationId} not found`);
        } catch (error) {
            console.error(`Error fetching application with ID ${applicationId}:`, error);
            
            // Fallback to mock data
            if (options.useMockData !== false) {
                return this.getMockApplicationById(applicationId);
            }
            
            throw error;
        }
    },
    
    /**
     * Update application status
     * @param {string} applicationId - The application ID
     * @param {string} newStatus - The new status
     * @returns {Promise<Object>} The result
     */
    updateApplicationStatus: async function(applicationId, newStatus) {
        if (!applicationId) {
            throw new Error('No application ID provided');
        }
        
        try {
            // Try to update status on server
            let apiSuccess = false;
            let lastError = null;
            
            const isApiAvailable = await this.checkApiConnectivity();
            
            if (isApiAvailable) {
                // Try multiple endpoint formats until one works
                const endpoints = [
                    {
                        url: `/applications/update-status`,
                        method: 'POST',
                        body: { applicationId, status: newStatus }
                    },
                    {
                        url: `/applications/${applicationId}/status`,
                        method: 'PUT',
                        body: { status: newStatus }
                    },
                    {
                        url: `/applications/${applicationId}`,
                        method: 'PATCH', 
                        body: { status: newStatus }
                    },
                    {
                        url: `/student/applications/${applicationId}/status`,
                        method: 'PUT',
                        body: { status: newStatus }
                    },
                    {
                        url: `/employer/applications/${applicationId}/status`,
                        method: 'PUT',
                        body: { status: newStatus }
                    }
                ];
                
                // Check for previously successful endpoints
                try {
                    const successfulEndpoints = JSON.parse(localStorage.getItem('successfulSyncEndpoints') || '{}');
                    if (successfulEndpoints.statusUpdate) {
                        // Extract just the endpoint path
                        const successfulPath = successfulEndpoints.statusUpdate.split('/api')[1];
                        if (successfulPath) {
                            // Add this as the first endpoint to try
                            endpoints.unshift({
                                url: successfulPath,
                                method: successfulEndpoints.statusUpdateMethod || 'POST',
                                body: { applicationId, status: newStatus }
                            });
                        }
                    }
                } catch (e) {
                    // Ignore localStorage errors
                }
                
                // Try each endpoint with retry logic
                for (const endpoint of endpoints) {
                    if (apiSuccess) break;
                    
                    // Try up to 2 times per endpoint
                    for (let attempt = 0; attempt < 2; attempt++) {
                        try {
                            console.log(`Attempt ${attempt+1} to update status via ${endpoint.url} (${endpoint.method})`);
                            
                            // Create a timeout to prevent hanging requests
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 5000);
                            
                            const response = await this.apiRequest(endpoint.url, {
                                method: endpoint.method,
                                body: endpoint.body,
                                signal: controller.signal,
                                timeout: 5000
                            });
                            
                            clearTimeout(timeoutId);
                            
                            apiSuccess = true;
                            console.log('Status updated via API:', response);
                            
                            // Remember successful endpoint for future use
                            try {
                                localStorage.setItem('successfulSyncEndpoints', JSON.stringify({
                                    statusUpdate: endpoint.url,
                                    statusUpdateMethod: endpoint.method
                                }));
                            } catch (e) {
                                // Ignore storage errors
                            }
                            
                            break;
                        } catch (error) {
                            console.warn(`Failed to update status via ${endpoint.url} (attempt ${attempt+1}):`, error);
                            lastError = error;
                            
                            // For server errors, wait a bit before retrying
                            if (error.message && (error.message.includes('500') || error.message.includes('503'))) {
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            } else if (attempt > 0) {
                                // If this is already a retry for a non-server error, move to next endpoint
                                break;
                            }
                        }
                    }
                }
                
                if (!apiSuccess) {
                    console.warn('All API endpoints failed for status update, using local storage only');
                }
            }
            
            // Always store the status change locally
            this.saveLocalStatusChange(applicationId, newStatus, !apiSuccess);
            
            // Dispatch event to notify UI of changes
            this.dispatchUpdateEvent('application-status-updated', {
                applicationId,
                newStatus,
                apiSuccess
            });
            
            return {
                success: true,
                apiSuccess,
                applicationId,
                status: newStatus
            };
        } catch (error) {
            console.error('Error updating application status:', error);
            
            // Try to save locally even if the main process failed
            try {
                this.saveLocalStatusChange(applicationId, newStatus, true);
            } catch (localSaveError) {
                console.warn('Failed to save status locally:', localSaveError);
            }
            
            throw error;
        }
    },
    
    /**
     * Get local status changes from localStorage
     * @returns {Object} The status changes
     */
    getLocalStatusChanges: function() {
        try {
            return JSON.parse(localStorage.getItem('applicationStatusChanges') || '{}');
        } catch (error) {
            console.warn('Error getting local status changes:', error);
            return {};
        }
    },
    
    /**
     * Save local status change
     * @param {string} applicationId - The application ID
     * @param {string} status - The status
     * @param {boolean} pendingSync - Whether the change is pending sync
     */
    saveLocalStatusChange: function(applicationId, status, pendingSync = true) {
        try {
            const statusChanges = this.getLocalStatusChanges();
            
            statusChanges[applicationId] = {
                status,
                updatedAt: new Date().toISOString(),
                pendingSync
            };
            
            localStorage.setItem('applicationStatusChanges', JSON.stringify(statusChanges));
            console.log(`Status for application ${applicationId} saved locally (pendingSync: ${pendingSync})`);
        } catch (error) {
            console.warn('Error saving local status change:', error);
        }
    },
    
    /**
     * Apply local status changes to applications
     * @param {Array} applications - The applications
     * @returns {Array} The updated applications
     */
    applyLocalStatusChanges: function(applications) {
        if (!Array.isArray(applications)) {
            return applications;
        }
        
        try {
            const statusChanges = this.getLocalStatusChanges();
            
            if (Object.keys(statusChanges).length === 0) {
                return applications;
            }
            
            return applications.map(app => {
                const appId = app.id || app._id || app.applicationId || '';
                
                if (appId && statusChanges[appId]) {
                    return {
                        ...app,
                        status: statusChanges[appId].status
                    };
                }
                
                return app;
            });
        } catch (error) {
            console.warn('Error applying local status changes:', error);
            return applications;
        }
    },
    
    /**
     * Sync pending changes to server
     */
    syncPendingChanges: async function() {
        try {
            const statusChanges = this.getLocalStatusChanges();
            const pendingChanges = Object.entries(statusChanges)
                .filter(([_, change]) => change.pendingSync);
            
            if (pendingChanges.length === 0) {
                return;
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.log('API not available, will try syncing changes later');
                return;
            }
            
            console.log(`Syncing ${pendingChanges.length} pending status changes`);
            
            for (const [applicationId, change] of pendingChanges) {
                try {
                    // Set up multiple endpoints to try
                    const endpoints = [
                        {
                            url: `/applications/update-status`,
                            method: 'POST',
                            body: { applicationId, status: change.status }
                        },
                        {
                            url: `/applications/${applicationId}/status`,
                            method: 'PUT',
                            body: { status: change.status }
                        },
                        {
                            url: `/applications/${applicationId}`,
                            method: 'PATCH',
                            body: { status: change.status }
                        },
                        {
                            url: `/student/applications/${applicationId}/status`,
                            method: 'PUT',
                            body: { status: change.status }
                        },
                        {
                            url: `/employer/applications/${applicationId}/status`,
                            method: 'PUT',
                            body: { status: change.status }
                        }
                    ];
                    
                    // Check for previously successful endpoints
                    try {
                        const successfulEndpoints = JSON.parse(localStorage.getItem('successfulSyncEndpoints') || '{}');
                        if (successfulEndpoints.statusUpdate) {
                            const successfulPath = successfulEndpoints.statusUpdate.split('/api')[1];
                            if (successfulPath) {
                                // Add this as the first endpoint to try
                                endpoints.unshift({
                                    url: successfulPath,
                                    method: successfulEndpoints.statusUpdateMethod || 'POST',
                                    body: { applicationId, status: change.status }
                                });
                            }
                        }
                    } catch (e) {
                        // Ignore localStorage errors
                    }
                    
                    let syncSuccess = false;
                    
                    // Try each endpoint
                    for (const endpoint of endpoints) {
                        if (syncSuccess) break;
                        
                        try {
                            console.log(`Trying to sync status for application ${applicationId} via ${endpoint.url}`);
                            
                            // Add timeout to prevent hanging
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 5000);
                            
                            const response = await this.apiRequest(endpoint.url, {
                                method: endpoint.method,
                                body: endpoint.body,
                                signal: controller.signal,
                                timeout: 5000
                            });
                            
                            clearTimeout(timeoutId);
                            
                            // Mark as synced
                            this.saveLocalStatusChange(applicationId, change.status, false);
                            console.log(`Successfully synced status for application ${applicationId} via ${endpoint.url}`);
                            syncSuccess = true;
                            
                            // Remember successful endpoint for future use
                            try {
                                localStorage.setItem('successfulSyncEndpoints', JSON.stringify({
                                    statusUpdate: endpoint.url,
                                    statusUpdateMethod: endpoint.method
                                }));
                            } catch (e) {
                                // Ignore storage errors
                            }
                            
                            break;
                        } catch (error) {
                            console.warn(`Failed to sync status via ${endpoint.url}:`, error);
                            
                            // For server errors, wait a bit before trying the next endpoint
                            if (error.message && (error.message.includes('500') || error.message.includes('503'))) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                            }
                        }
                    }
                    
                    if (!syncSuccess) {
                        console.warn(`Failed to sync status for application ${applicationId} after trying all endpoints`);
                    }
                } catch (error) {
                    console.warn(`Failed to sync status for application ${applicationId}:`, error);
                }
            }
            
            // Dispatch event to notify of sync
            this.dispatchUpdateEvent('sync-completed', {
                pendingChanges: pendingChanges.length,
                timestamp: new Date()
            });
        } catch (error) {
            console.warn('Error syncing pending changes:', error);
        }
    },
    
    /**
     * Determine user role based on current page and authentication
     * @returns {string} The user role ('student', 'employer', 'admin', or 'unknown')
     */
    determineUserRole: function() {
        // Check URL patterns
        const url = window.location.href.toLowerCase();
        
        if (url.includes('/admin/') || url.includes('admin-') || url.includes('admin.html')) {
            return 'admin';
        }
        
        if (url.includes('/employer/') || url.includes('employer-') || url.includes('employer.html')) {
            return 'employer';
        }
        
        if (url.includes('/student/') || url.includes('student-') || url.includes('student.html')) {
            return 'student';
        }
        
        // Check for role-specific tokens
        if (localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')) {
            return 'admin';
        }
        
        if (localStorage.getItem('employerToken') || sessionStorage.getItem('employerToken')) {
            return 'employer';
        }
        
        if (localStorage.getItem('studentToken') || sessionStorage.getItem('studentToken')) {
            return 'student';
        }
        
        // Default - check user data if available
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData.role) {
                return userData.role.toLowerCase();
            }
        } catch (error) {
            console.warn('Error parsing user data:', error);
        }
        
        return 'unknown';
    },
    
    /**
     * Dispatch data update event
     * @param {string} eventName - The event name
     * @param {Object} detail - The event detail
     */
    dispatchUpdateEvent: function(eventName, detail) {
        try {
            document.dispatchEvent(new CustomEvent(eventName, { detail }));
        } catch (error) {
            console.warn(`Error dispatching ${eventName} event:`, error);
        }
    },
    
    /**
     * Get mock applications based on user role
     * @param {string} role - The user role
     * @returns {Array} The mock applications
     */
    getMockApplications: function(role = 'unknown') {
        console.log(`Returning mock applications for ${role} role`);
        
        // Create mock applications with proper structures
        return [
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
                coverLetter: 'I am excited to apply for this position as it aligns with my skills in web development.',
                resumeUrl: '',
                skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Angular'],
                studentCourse: 'BS Computer Science - 3rd Year'
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
                coverLetter: 'With my experience in backend development using Node.js and Express, I believe I am well-suited for this role.',
                resumeUrl: '',
                skills: ['Node.js', 'Express', 'MongoDB', 'MySQL', 'API Development'],
                studentCourse: 'BS Information Technology - 4th Year'
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
                coverLetter: 'I am excited about this data science internship as it aligns perfectly with my academic focus.',
                resumeUrl: '',
                skills: ['Python', 'R', 'Data Analysis', 'Machine Learning', 'SQL'],
                studentCourse: 'BS Computer Science - 4th Year'
            }
        ];
    },
    
    /**
     * Get mock application by ID
     * @param {string} applicationId - The application ID
     * @returns {Object} The mock application
     */
    getMockApplicationById: function(applicationId) {
        const mockApplications = this.getMockApplications();
        const found = mockApplications.find(app => app.id === applicationId);
        
        if (found) {
            return found;
        }
        
        // Generic mock data with the requested ID
        return {
            id: applicationId,
            applicationId: applicationId,
            studentName: 'Mock Student',
            studentId: 'STU-MOCK',
            studentEmail: 'mock.student@example.com',
            studentPhone: '(555) 123-4567',
            jobTitle: 'Mock Internship Position',
            jobId: 'job-mock',
            appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'Pending',
            coverLetter: 'This is a mock cover letter for demonstration purposes.',
            resumeUrl: '',
            skills: ['Mock Skill 1', 'Mock Skill 2', 'Mock Skill 3'],
            studentCourse: 'BS Mock Course - 3rd Year'
        };
    },
    
    /**
     * Get dashboard statistics for the current user based on role
     * @param {Object} options - Options for fetching dashboard stats
     * @returns {Promise<Object>} Dashboard statistics
     */
    getDashboardStats: async function(options = {}) {
        try {
            const userRole = this.determineUserRole();
            
            // Select proper endpoint based on user role
            const endpoints = [];
            
            if (userRole === 'employer') {
                // Try all possible employer dashboard stat endpoints with different path formats
                endpoints.push(
                    '/dashboard/employers/dashboard/stats',
                    '/employer/dashboard/stats',
                    '/employers/dashboard/stats'
                );
            } else if (userRole === 'student') {
                endpoints.push('/dashboard/student/stats');
            } else if (userRole === 'admin') {
                endpoints.push('/admin/dashboard/stats');
            }
            
            // Try each endpoint with better error handling
            let lastError = null;
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying dashboard endpoint: ${endpoint}`);
                    const data = await this.apiRequest(endpoint);
                    console.log(`Dashboard stats successfully fetched from ${endpoint}`);
                    
                    // If response is successful but doesn't have expected stats, standardize the format
                    if (!data.active_jobs && !data.total_applications) {
                        return {
                            active_jobs: data.activeJobs || 0,
                            total_applications: data.totalApplications || 0,
                            hired_interns: data.hiredInterns || 0,
                            pending_applications: data.pendingApplications || 0
                        };
                    }
                    
                    return data;
                } catch (error) {
                    console.warn(`Error with dashboard endpoint ${endpoint}:`, error);
                    lastError = error;
                    // Continue to next endpoint
                }
            }
            
            // If we get here, all endpoints failed - try a direct fetch
            if (userRole === 'employer') {
                try {
                    console.log('Trying direct API fetch for employer dashboard');
                    const token = this.getAuthToken();
                    
                    if (!token) throw new Error('No auth token available');
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(`${this.API_URL}/dashboard/employers/dashboard/stats`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const data = await response.json();
                        return data;
                    }
                    
                    throw new Error(`Direct fetch failed with status ${response.status}`);
                } catch (directError) {
                    console.warn('Direct API fetch for dashboard failed:', directError);
                }
            }
            
            // If we get here, all endpoints and direct fetch failed
            throw lastError || new Error('Failed to fetch dashboard stats from any endpoint');
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            
            // Generate stats from API data
            if (options.generateStats !== false) {
                return this.generateDashboardStats();
            }
            
            throw error;
        }
    },
    
    /**
     * Generate dashboard stats from API data if direct endpoint fails
     * @returns {Promise<Object>} Generated dashboard statistics
     */
    generateDashboardStats: async function() {
        try {
            const userRole = this.determineUserRole();
            
            if (userRole === 'employer') {
                // Get applications
                const applications = await this.getApplications();
                
                // Get job listings
                let jobsResponse;
                try {
                    jobsResponse = await this.apiRequest('/jobs/employer');
                } catch (e) {
                    console.warn('Failed to get job listings:', e);
                    jobsResponse = { jobs: [] };
                }
                
                const jobs = jobsResponse.jobs || [];
                const activeJobs = jobs.filter(job => job.status === 'Active').length;
                
                // Count by status
                const pendingApplications = applications.filter(app => 
                    app.status === 'Pending'
                ).length;
                
                const hiredInterns = applications.filter(app => 
                    app.status === 'Accepted' || 
                    app.status === 'Hired' || 
                    app.status === 'Shortlisted'
                ).length;
                
                return {
                    active_jobs: activeJobs,
                    total_applications: applications.length,
                    hired_interns: hiredInterns,
                    pending_applications: pendingApplications
                };
            } else {
                // Default stats for other roles
                return {
                    active_jobs: 0,
                    total_applications: 0,
                    hired_interns: 0,
                    pending_applications: 0
                };
            }
        } catch (error) {
            console.error('Error generating dashboard stats:', error);
            return {
                active_jobs: 0,
                total_applications: 0,
                hired_interns: 0,
                pending_applications: 0
            };
        }
    }
};

// Initialize the connector
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the connector
    window.SHARED_API_CONNECTOR = SHARED_API_CONNECTOR.init();
    console.log('Shared API connector initialized with URL:', SHARED_API_CONNECTOR.API_URL);
}); 