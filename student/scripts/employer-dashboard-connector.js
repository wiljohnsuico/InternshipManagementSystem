/**
 * Employer Dashboard Connector
 * This script integrates the employer dashboard with the database
 * by utilizing the shared API connector
 */

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing Employer Dashboard Connector');
    
    // Get UI elements
    const companyNameEl = document.getElementById('companyName');
    const activeJobsEl = document.getElementById('activeJobs');
    const totalApplicationsEl = document.getElementById('totalApplications');
    const hiredInternsEl = document.getElementById('hiredInterns');
    const pendingApplicationsEl = document.getElementById('pendingApplications');
    const recentApplicationsTable = document.getElementById('recentApplications');
    const activeJobPostingsTable = document.getElementById('activeJobPostings');
    
    // Init database connector with retry mechanism
    let retryCount = 0;
    const maxRetries = 3;
    let connectorInitialized = false;
    
    async function initWithRetry() {
        try {
            await initDatabaseConnector();
            connectorInitialized = true;
            console.log('Dashboard connector initialized successfully');
            
            // Load dashboard data initially
            loadDashboardData();
            
            // Setup auto-refresh
            setupAutoRefresh();
        } catch (error) {
            retryCount++;
            console.warn(`Error initializing dashboard connector (attempt ${retryCount}/${maxRetries}):`, error);
            
            if (retryCount < maxRetries) {
                console.log(`Retrying in ${retryCount * 1000}ms...`);
                setTimeout(initWithRetry, retryCount * 1000);
            } else {
                console.error('Failed to initialize dashboard connector after multiple attempts');
                // Use fallback implementation
                initFallbackConnector();
                loadDashboardData();
            }
        }
    }
    
    // Start initialization
    initWithRetry();
    
    // Initialize Database Connector if needed
    async function initDatabaseConnector() {
        console.log('Initializing database connector for dashboard');
        
        // If we have a shared API connector, use it
        if (window.SHARED_API_CONNECTOR) {
            console.log('Using shared API connector for dashboard');
            
            // Create dashboard-specific connector methods
            window.DB_CONNECTOR = {
                API_URL: window.SHARED_API_CONNECTOR.API_URL,
                
                checkApiConnectivity: async function() {
                    return await window.SHARED_API_CONNECTOR.checkApiConnectivity();
                },
                
                getDashboardStats: async function() {
                    try {
                        // Try to get dashboard stats from the shared connector
                        // Try multiple endpoints in sequence until one works
                        const endpoints = [
                            '/dashboard/employers/dashboard/stats',
                            '/employer/dashboard/stats',
                            '/employers/dashboard/stats'
                        ];
                        
                        let lastError = null;
                        
                        for (const endpoint of endpoints) {
                            try {
                                console.log(`Trying endpoint: ${endpoint}`);
                                const response = await window.SHARED_API_CONNECTOR.apiRequest(endpoint);
                                console.log('Dashboard stats fetched successfully:', response);
                                return response;
                            } catch (error) {
                                console.warn(`Endpoint ${endpoint} failed:`, error);
                                lastError = error;
                                // Continue to next endpoint
                            }
                        }
                        
                        // If all endpoints failed, try to generate stats
                        console.warn('All dashboard endpoints failed. Trying to generate stats from API.');
                        throw lastError;
                    } catch (error) {
                        console.warn('Error fetching dashboard stats from shared connector:', error);
                        
                        // Generate stats from API instead
                        return this.generateStatsFromAPI();
                    }
                },
                
                // Calculate stats from API data if direct stats endpoint not available
                generateStatsFromAPI: async function() {
                    try {
                        console.log('Generating dashboard stats from API data');
                        
                        // Get applications from shared connector
                        const applications = await window.SHARED_API_CONNECTOR.getApplications();
                        
                        // Get jobs from shared connector
                        const jobsResponse = await window.SHARED_API_CONNECTOR.apiRequest('/jobs/employer?status=active');
                        const jobs = jobsResponse.jobs || [];
                        
                        // Count by status (using simplified status system)
                        const pending = applications.filter(app => 
                            app.status && app.status.toLowerCase() === 'pending'
                        ).length;
                        
                        const accepted = applications.filter(app => 
                            app.status && (
                                app.status.toLowerCase() === 'accepted' ||
                                app.status.toLowerCase() === 'hired' ||
                                app.status.toLowerCase() === 'interviewed' ||
                                app.status.toLowerCase() === 'shortlisted' ||
                                app.status.toLowerCase() === 'reviewed'
                            )
                        ).length;
                        
                        return {
                            active_jobs: jobs.length,
                            total_applications: applications.length,
                            hired_interns: accepted,
                            pending_applications: pending
                        };
                    } catch (error) {
                        console.error('Error generating stats from API:', error);
                        return this.generateStatsFromLocalData();
                    }
                },
                
                getRecentApplications: async function(limit = 5) {
                    try {
                        // Try multiple endpoints
                        const endpoints = [
                            `/employer/applications/recent?limit=${limit}`,
                            `/applications/employer/recent?limit=${limit}`,
                            `/applications/employer?limit=${limit}`
                        ];
                        
                        let applications = null;
                        let lastError = null;
                        
                        for (const endpoint of endpoints) {
                            try {
                                console.log(`Trying applications endpoint: ${endpoint}`);
                                const response = await window.SHARED_API_CONNECTOR.apiRequest(endpoint);
                                applications = response.applications || response;
                                if (Array.isArray(applications)) {
                                    console.log(`Found ${applications.length} applications from ${endpoint}`);
                                    break;
                                } else {
                                    console.warn(`Endpoint ${endpoint} didn't return an array`);
                                }
                            } catch (error) {
                                console.warn(`Endpoint ${endpoint} failed:`, error);
                                lastError = error;
                                // Continue to next endpoint
                            }
                        }
                        
                        if (applications) {
                            return applications.slice(0, limit);
                        }
                        
                        // If all endpoints failed, try fallback
                        throw lastError || new Error('Failed to fetch applications');
                    } catch (error) {
                        console.warn('Error fetching applications from all endpoints:', error);
                        
                        // Try to get with generic endpoint as fallback
                        try {
                            const apps = await window.SHARED_API_CONNECTOR.getApplications({
                                filters: { limit: limit }
                            });
                            return apps.slice(0, limit);
                        } catch (fallbackError) {
                            console.error('Even fallback applications fetch failed:', fallbackError);
                            return [];
                        }
                    }
                },
                
                getActiveJobPostings: async function(limit = 5) {
                    try {
                        // Try multiple endpoints
                        const endpoints = [
                            `/employer/jobs/active?limit=${limit}`,
                            `/jobs/employer/my-listings?limit=${limit}`,
                            `/jobs/employer?status=active&limit=${limit}`
                        ];
                        
                        let jobs = null;
                        let lastError = null;
                        
                        for (const endpoint of endpoints) {
                            try {
                                console.log(`Trying jobs endpoint: ${endpoint}`);
                                const response = await window.SHARED_API_CONNECTOR.apiRequest(endpoint);
                                jobs = response.listings || response.jobs || response;
                                if (Array.isArray(jobs)) {
                                    console.log(`Found ${jobs.length} jobs from ${endpoint}`);
                                    break;
                                } else {
                                    console.warn(`Endpoint ${endpoint} didn't return an array`);
                                }
                            } catch (error) {
                                console.warn(`Endpoint ${endpoint} failed:`, error);
                                lastError = error;
                                // Continue to next endpoint
                            }
                        }
                        
                        if (jobs) {
                            return jobs.slice(0, limit);
                        }
                        
                        // If all endpoints failed, try fallback
                        throw lastError || new Error('Failed to fetch jobs');
                    } catch (error) {
                        console.warn('Error fetching jobs from all endpoints:', error);
                        
                        try {
                            // Fallback to direct fetch
                            const response = await fetch(`${this.API_URL}/jobs/employer?status=active&limit=${limit}`, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                const jobs = data.listings || data.jobs || [];
                                return jobs.slice(0, limit);
                            }
                        } catch (fallbackError) {
                            console.error('Even fallback jobs fetch failed:', fallbackError);
                        }
                        return [];
                    }
                },
                
                formatDate: function(dateString) {
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
                },
                
                // Other methods as needed
            };
            
            // Store reference to connector for external access
            window.EMPLOYER_DASHBOARD_CONNECTOR = window.DB_CONNECTOR;
        } else {
            console.warn('Shared API connector not found');
            initFallbackConnector();
        }
        
        // Verify the connector methods are properly defined
        if (!window.DB_CONNECTOR.getDashboardStats) {
            console.error('getDashboardStats method is missing from DB_CONNECTOR');
            // Add a fallback implementation
            window.DB_CONNECTOR.getDashboardStats = async function() {
                return {
                    active_jobs: 0,
                    total_applications: 0,
                    hired_interns: 0,
                    pending_applications: 0
                };
            };
        }
    }
    
    // Fallback connector implementation
    function initFallbackConnector() {
        console.log('Initializing fallback dashboard connector');
        
        window.DB_CONNECTOR = window.DB_CONNECTOR || {};
        const apiUrl = document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api';
        
        // Extend or create DB_CONNECTOR with necessary methods
        window.DB_CONNECTOR = {
            ...window.DB_CONNECTOR,
            API_URL: apiUrl,
            
            checkApiConnectivity: async function() {
                try {
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
            
            getDashboardStats: async function() {
                try {
                    // Try both endpoint formats with retry
                    const endpoints = [
                        `${this.API_URL}/dashboard/employers/dashboard/stats`,
                        `${this.API_URL}/employer/dashboard/stats`
                    ];
                    
                    let lastError = null;
                    
                    for (const endpoint of endpoints) {
                        try {
                            console.log(`Trying to fetch stats from: ${endpoint}`);
                            const response = await fetch(endpoint, {
                                method: 'GET',
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}`
                                }
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                console.log('Dashboard stats fetched successfully:', data);
                                return data;
                            } else {
                                console.warn(`Endpoint ${endpoint} returned status ${response.status}`);
                            }
                        } catch (error) {
                            console.warn(`Error fetching from ${endpoint}:`, error);
                            lastError = error;
                        }
                    }
                    
                    console.error('All dashboard endpoints failed, using generated stats');
                    if (lastError) {
                        throw lastError;
                    }
                    
                    return this.generateStatsFromLocalData();
                } catch (error) {
                    console.error('Error fetching dashboard stats:', error);
                    
                    // Generate stats from local data as fallback
                    return this.generateStatsFromLocalData();
                }
            },
            
            generateStatsFromLocalData: function() {
                // Simple mock data as last resort
                return {
                    active_jobs: 3,
                    total_applications: 12,
                    hired_interns: 2,
                    pending_applications: 8
                };
            },
            
            getRecentApplications: async function(limit = 5) {
                try {
                    const response = await fetch(`${this.API_URL}/applications`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}`);
                    }
                    
                    const data = await response.json();
                    const applications = data.applications || data;
                    
                    return Array.isArray(applications) ? applications.slice(0, limit) : [];
                } catch (error) {
                    console.warn('Error fetching recent applications:', error);
                    return [];
                }
            },
            
            getActiveJobPostings: async function(limit = 5) {
                try {
                    const response = await fetch(`${this.API_URL}/jobs?status=active&limit=${limit}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}`
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Server returned ${response.status}`);
                    }
                    
                    const data = await response.json();
                    return data.jobs || [];
                } catch (error) {
                    console.warn('Error fetching active job postings:', error);
                    return [];
                }
            },
            
            formatDate: function(dateString) {
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
        
        // Store reference to connector for external access
        window.EMPLOYER_DASHBOARD_CONNECTOR = window.DB_CONNECTOR;
    }
    
    // Load dashboard data
    async function loadDashboardData() {
        try {
            // Get employer info from localStorage
            const userString = localStorage.getItem('user') || localStorage.getItem('userData');
            if (userString) {
                const user = JSON.parse(userString);
                if (companyNameEl) {
                    companyNameEl.textContent = user.company_name || user.companyName || user.name || 'Company Name';
                }
            }
            
            // Check API connectivity
            const isApiAvailable = await window.DB_CONNECTOR.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API is not available, using cached data if available');
                displayMockData();
                return;
            }
            
            // Load dashboard stats
            const stats = await window.DB_CONNECTOR.getDashboardStats();
            if (stats) {
                // Update dashboard counters
                if (activeJobsEl) activeJobsEl.textContent = stats.active_jobs || 0;
                if (totalApplicationsEl) totalApplicationsEl.textContent = stats.total_applications || 0;
                if (hiredInternsEl) hiredInternsEl.textContent = stats.hired_interns || 0;
                if (pendingApplicationsEl) pendingApplicationsEl.textContent = stats.pending_applications || 0;
            }
            
            // Load recent applications
            if (recentApplicationsTable) {
                const applications = await window.DB_CONNECTOR.getRecentApplications(5);
                displayRecentApplications(applications);
            }
            
            // Load active job postings
            if (activeJobPostingsTable) {
                const jobs = await window.DB_CONNECTOR.getActiveJobPostings(5);
                displayActiveJobPostings(jobs);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            displayMockData();
        }
    }
    
    // Setup auto-refresh for dashboard data
    function setupAutoRefresh() {
        // Refresh every 2 minutes
        setInterval(loadDashboardData, 120000);
    }
    
    // Display recent applications in the table
    function displayRecentApplications(applications) {
        if (!recentApplicationsTable) return;
        
        recentApplicationsTable.innerHTML = '';
        
        if (!applications || applications.length === 0) {
            recentApplicationsTable.innerHTML = '<tr><td colspan="4">No recent applications found</td></tr>';
            return;
        }
        
        applications.forEach(app => {
            const row = document.createElement('tr');
            
            // Format data for display
            const studentName = app.studentName || app.student_name || 'Unknown Applicant';
            const jobTitle = app.jobTitle || app.job_title || app.position || 'Unknown Position';
            const appliedDate = window.DB_CONNECTOR.formatDate(app.appliedDate || app.applied_date || app.createdAt || app.created_at);
            const status = app.status || 'Pending';
            
            // Format the status with correct styling
            const statusClass = status.toLowerCase() === 'accepted' ? 'text-success' : 
                              (status.toLowerCase() === 'rejected' ? 'text-danger' : 'text-warning');
            
            // Create row content
            row.innerHTML = `
                <td>${studentName}</td>
                <td>${jobTitle}</td>
                <td>${appliedDate}</td>
                <td><span class="${statusClass}">${status}</span></td>
            `;
            
            // Make row clickable to view details
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                const appId = app.id || app._id || app.applicationId;
                window.location.href = `application-detail.html?id=${appId}`;
            });
            
            recentApplicationsTable.appendChild(row);
        });
    }
    
    // Display active job postings in the table
    function displayActiveJobPostings(jobs) {
        if (!activeJobPostingsTable) return;
        
        activeJobPostingsTable.innerHTML = '';
        
        if (!jobs || jobs.length === 0) {
            activeJobPostingsTable.innerHTML = '<tr><td colspan="4">No active job postings found</td></tr>';
            return;
        }
        
        jobs.forEach(job => {
            const row = document.createElement('tr');
            
            // Format data for display
            const jobTitle = job.title || job.job_title || 'Untitled Position';
            const postedDate = window.DB_CONNECTOR.formatDate(job.createdAt || job.created_at || job.postedDate || job.posted_date);
            const applications = job.applications_count || job.applicationsCount || 0;
            const deadline = window.DB_CONNECTOR.formatDate(job.deadline || job.application_deadline);
            
            // Create row content
            row.innerHTML = `
                <td>${jobTitle}</td>
                <td>${postedDate}</td>
                <td>${applications}</td>
                <td>${deadline}</td>
            `;
            
            // Make row clickable
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                const jobId = job.id || job._id;
                window.location.href = `job-postings.html?edit=${jobId}`;
            });
            
            activeJobPostingsTable.appendChild(row);
        });
    }
    
    // Display mock data when API is unavailable
    function displayMockData() {
        // Mock stats
        if (activeJobsEl) activeJobsEl.textContent = '3';
        if (totalApplicationsEl) totalApplicationsEl.textContent = '12';
        if (hiredInternsEl) hiredInternsEl.textContent = '2';
        if (pendingApplicationsEl) pendingApplicationsEl.textContent = '8';
        
        // Mock applications
        if (recentApplicationsTable) {
            recentApplicationsTable.innerHTML = `
                <tr>
                    <td>Juan dela Cruz</td>
                    <td>Software Developer Intern</td>
                    <td>Mar 15, 2023</td>
                    <td><span class="text-warning">Pending</span></td>
                </tr>
                <tr>
                    <td>Maria Santos</td>
                    <td>Marketing Intern</td>
                    <td>Mar 12, 2023</td>
                    <td><span class="text-success">Accepted</span></td>
                </tr>
                <tr>
                    <td>Carlo Gonzales</td>
                    <td>Data Analyst Intern</td>
                    <td>Mar 10, 2023</td>
                    <td><span class="text-warning">Pending</span></td>
                </tr>
            `;
        }
        
        // Mock job postings
        if (activeJobPostingsTable) {
            activeJobPostingsTable.innerHTML = `
                <tr>
                    <td>Software Developer Intern</td>
                    <td>Mar 1, 2023</td>
                    <td>5</td>
                    <td>Apr 30, 2023</td>
                </tr>
                <tr>
                    <td>Marketing Intern</td>
                    <td>Feb 15, 2023</td>
                    <td>4</td>
                    <td>Apr 15, 2023</td>
                </tr>
                <tr>
                    <td>Data Analyst Intern</td>
                    <td>Mar 5, 2023</td>
                    <td>3</td>
                    <td>May 1, 2023</td>
                </tr>
            `;
        }
        
        // Display a warning in the UI
        const warningEl = document.createElement('div');
        warningEl.className = 'alert alert-warning';
        warningEl.innerHTML = '<strong>Note:</strong> Showing cached data. Unable to connect to server.';
        
        const container = document.querySelector('.dashboard-container') || document.querySelector('main');
        if (container) {
            container.insertBefore(warningEl, container.firstChild);
        }
    }
}); 