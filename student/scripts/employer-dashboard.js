// Employer Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing employer dashboard.js');
    
    // Initialize elements
    const logoutBtn = document.getElementById('logoutBtn');
    const employerNameEl = document.getElementById('employerName');
    const employerEmailEl = document.getElementById('employerEmail');
    const dashboardStatsContainer = document.getElementById('dashboardStats');
    const recentApplicationsTable = document.getElementById('recentApplications');
    const viewAllApplicationsBtn = document.getElementById('viewAllApplicationsBtn');
    const viewAllJobsBtn = document.getElementById('viewAllJobsBtn');
    
    // Check authentication
    checkAuthentication()
        .then(user => {
            // Display user info
            displayUserInfo(user);
            
            // Ensure we wait for DB_CONNECTOR to be ready
            setTimeout(() => {
                // Load dashboard data - use the dashboard connector if available
                if (window.EMPLOYER_DASHBOARD_CONNECTOR) {
                    console.log('Using dashboard connector to load data');
                    // Data will be loaded by the dashboard connector
                } else {
                    console.log('No dashboard connector found, loading data manually');
                    loadDashboardData();
                }
            }, 200);
            
            // Setup event listeners
            setupEventListeners();
        })
        .catch(error => {
            console.error('Authentication error:', error);
            redirectToLogin();
        });
    
    // Setup event listeners
    function setupEventListeners() {
        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // View all applications button
        if (viewAllApplicationsBtn) {
            viewAllApplicationsBtn.addEventListener('click', () => {
                window.location.href = '/student/employers/applications.html';
            });
        }
        
        // View all jobs button
        if (viewAllJobsBtn) {
            viewAllJobsBtn.addEventListener('click', () => {
                window.location.href = '/student/employers/job-postings.html';
            });
        }
        
        // Post New Internship button
        const postInternshipBtn = document.querySelector('.btn-primary');
        if (postInternshipBtn) {
            postInternshipBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Post New Internship button clicked');
                
                // Store a flag in localStorage to indicate we're in mock mode
                if (!isApiAvailable) {
                    localStorage.setItem('usingMockData', 'true');
                }
                
                window.location.href = '/student/employers/job-postings.html';
                return false;
            });
        }
        
        // Fix Post New Internship button if it exists
        const postInternshipBtn2 = document.querySelector('.btn-primary[href="/student/employers/job-postings.html"]');
        if (postInternshipBtn2) {
            postInternshipBtn2.href = '/student/employers/job-postings.html';
        }
        
        // Add View Applications button handler
        const viewApplicationsBtn = document.querySelector('.btn-secondary');
        if (viewApplicationsBtn) {
            viewApplicationsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('View Applications button clicked');
                window.location.href = '/student/employers/applications.html';
                return false;
            });
        }
    }
    
    // Display user info
    function displayUserInfo(user) {
        const companyNameEl = document.getElementById('companyName');
        if (companyNameEl) {
            // Handle different property names for company name
            const companyName = user.company_name || user.companyName || user.name || user.displayName || 'Company Name';
            companyNameEl.textContent = companyName;
        }
        
        // Display other user info if needed
        if (employerNameEl) {
            employerNameEl.textContent = user.name || user.displayName || 'Employer';
        }
        if (employerEmailEl) {
            employerEmailEl.textContent = user.email || '';
        }
        
        // Set it in document title too for better UX
        document.title = `Dashboard - ${user.company_name || user.companyName || user.name || 'Employer Portal'}`;
    }
    
    // Track API availability globally
    let isApiAvailable = false;

    // Load dashboard data with improved error handling
    async function loadDashboardData() {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                displayMockData();
                return;
            }
            
            console.log('Loading dashboard data...');
            
            // Check if shared API connector is available with dashboard stats method
            if (window.SHARED_API_CONNECTOR && window.SHARED_API_CONNECTOR.getDashboardStats) {
                try {
                    console.log('Using shared API connector for dashboard stats');
                    const dashboardStats = await window.SHARED_API_CONNECTOR.getDashboardStats();
                    console.log('Dashboard stats loaded successfully:', dashboardStats);
                    displayDashboardStats(dashboardStats);
                    
                    // Load applications and jobs
                    loadApplicationsAndJobs();
                    return;
                } catch (connectorError) {
                    console.warn('Error using shared API connector for dashboard stats:', connectorError);
                    // Continue with fallback methods
                }
            }
            
            // Try the DB_CONNECTOR if available
            if (window.DB_CONNECTOR && window.DB_CONNECTOR.getDashboardStats) {
                try {
                    console.log('Using DB_CONNECTOR for dashboard stats');
                    const dashboardStats = await window.DB_CONNECTOR.getDashboardStats();
                    console.log('Dashboard stats loaded successfully from DB_CONNECTOR:', dashboardStats);
                    displayDashboardStats(dashboardStats);
                    
                    // Load applications and jobs
                    loadApplicationsAndJobs();
                    return;
                } catch (dbConnectorError) {
                    console.warn('Error using DB_CONNECTOR for dashboard stats:', dbConnectorError);
                    // Continue with direct API call
                }
            }
            
            // Direct API call as fallback
            console.log('Using direct API call for dashboard stats');
            
            // Try both possible endpoint formats with retry
            const endpoints = [
                `${API_URL}/dashboard/employers/dashboard/stats`,
                `${API_URL}/employer/dashboard/stats`,
                `${API_URL}/employers/dashboard/stats`
            ];
            
            let dashboardStats = null;
            let lastError = null;
            
            for (const endpoint of endpoints) {
                if (dashboardStats) break;
                
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    const response = await fetch(endpoint, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        dashboardStats = await response.json();
                        console.log('Dashboard stats loaded successfully from direct API call:', dashboardStats);
                        break;
                    } else {
                        console.warn(`Endpoint ${endpoint} returned status ${response.status}`);
                    }
                } catch (error) {
                    console.error(`Error fetching from ${endpoint}:`, error);
                    lastError = error;
                }
            }
            
            if (dashboardStats) {
                displayDashboardStats(dashboardStats);
            } else {
                console.warn('All dashboard stat endpoints failed, falling back to job stats');
                // Fall back to job stats
                await loadJobStats(token);
            }
            
            // Load applications and jobs
            loadApplicationsAndJobs();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            displayMockData();
        }
    }
    
    // Check API connectivity
    async function checkApiConnectivity() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`http://localhost:5004/api/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.warn('API connectivity check failed:', error);
            return false;
        }
    }
    
    // Fall back to job stats if dashboard stats fail
    async function loadJobStats(token) {
        try {
            const statsEndpoint = 'http://localhost:5004/api/jobs/stats';
            console.log(`Loading job statistics from: ${statsEndpoint}`);
            
            const response = await fetch(statsEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                displayDashboardStats(data || {});
            } else {
                console.error('Error loading job statistics:', response.status);
                displayDashboardStats({});
            }
        } catch (error) {
            console.error('Error loading job stats:', error);
            displayDashboardStats({});
        }
    }
    
    // Load applications and jobs separately
    async function loadApplicationsAndJobs() {
        try {
            // Get recent applications from shared connector if available
            if (window.SHARED_API_CONNECTOR) {
                try {
                    console.log('Using shared API connector for applications');
                    const applications = await window.SHARED_API_CONNECTOR.getApplications({
                        filters: { limit: 5 }
                    });
                    console.log('Recent applications loaded successfully:', applications);
                    displayRecentApplications(applications);
                } catch (error) {
                    console.warn('Error loading applications from shared connector:', error);
                    displayRecentApplications([]);
                }
                
                // Get active jobs
                try {
                    console.log('Using shared API connector for jobs');
                    const response = await window.SHARED_API_CONNECTOR.apiRequest('/jobs/employer?status=active&limit=5');
                    console.log('Active jobs loaded successfully:', response);
                    const jobs = response.jobs || [];
                    displayActiveJobs(jobs);
                } catch (error) {
                    console.warn('Error loading jobs from shared connector:', error);
                    displayActiveJobs([]);
                }
                
                return;
            }
            
            // Fallback to DB_CONNECTOR if available
            if (window.DB_CONNECTOR) {
                try {
                    console.log('Using DB_CONNECTOR for applications');
                    const recentApplications = await window.DB_CONNECTOR.getRecentApplications(5);
                    displayRecentApplications(recentApplications);
                } catch (error) {
                    console.error('Error getting recent applications:', error);
                    displayRecentApplications([]);
                }
                
                // Get active jobs
                try {
                    console.log('Using DB_CONNECTOR for jobs');
                    const activeJobs = await window.DB_CONNECTOR.getActiveJobPostings(5);
                    displayActiveJobs(activeJobs);
                } catch (error) {
                    console.error('Error getting active jobs:', error);
                    displayActiveJobs([]);
                }
                
                return;
            }
            
            // Direct API calls as final fallback
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No token for direct API calls');
                displayRecentApplications([]);
                displayActiveJobs([]);
                return;
            }
            
            // Get applications
            try {
                const response = await fetch(`${API_URL}/applications/employer?limit=5`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    displayRecentApplications(data.applications || []);
                } else {
                    console.warn('Applications API returned status:', response.status);
                    displayRecentApplications([]);
                }
            } catch (error) {
                console.error('Error fetching applications directly:', error);
                displayRecentApplications([]);
            }
            
            // Get jobs
            try {
                const response = await fetch(`${API_URL}/jobs/employer?status=active&limit=5`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    displayActiveJobs(data.jobs || []);
                } else {
                    console.warn('Jobs API returned status:', response.status);
                    displayActiveJobs([]);
                }
            } catch (error) {
                console.error('Error fetching jobs directly:', error);
                displayActiveJobs([]);
            }
        } catch (error) {
            console.error('Error in loadApplicationsAndJobs:', error);
            displayRecentApplications([]);
            displayActiveJobs([]);
        }
    }
    
    // Display mock data
    function displayMockData() {
        // Dashboard stats
        displayDashboardStats({
            active_jobs: 3,
            total_applications: 12,
            hired_interns: 5,
            pending_applications: 7
        });
        
        // Recent applications
        displayRecentApplications([
            {
                id: 'app-1',
                studentName: 'John Doe',
                jobTitle: 'Frontend Developer Intern',
                appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                status: 'Pending'
            },
            {
                id: 'app-2',
                studentName: 'Jane Smith',
                jobTitle: 'Backend Developer Intern',
                appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                status: 'Accepted'
            },
            {
                id: 'app-3',
                studentName: 'Alex Williams',
                jobTitle: 'Data Science Intern',
                appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                status: 'Rejected'
            }
        ]);
        
        // Active job postings
        displayActiveJobs([
            {
                id: 'job-1',
                title: 'Frontend Developer Intern',
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                applicationCount: 5,
                status: 'Active'
            },
            {
                id: 'job-2',
                title: 'Backend Developer Intern',
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                applicationCount: 3,
                status: 'Active'
            },
            {
                id: 'job-3',
                title: 'Data Science Intern',
                createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                applicationCount: 4,
                status: 'Active'
            }
        ]);
    }
    
    // Format date
    function formatDate(dateString) {
        try {
            if (!dateString) return 'Unknown date';
            
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    }
    
    // Display dashboard stats
    function displayDashboardStats(stats = {}) {
        const statsElements = {
            activeJobs: document.getElementById('activeJobs') || document.getElementById('activeJobsCount'),
            totalApplications: document.getElementById('totalApplications') || document.getElementById('totalApplicationsCount'),
            hiredInterns: document.getElementById('hiredInterns') || document.getElementById('acceptedStudentsCount'),
            pendingApplications: document.getElementById('pendingApplications') || document.getElementById('pendingReviewsCount')
        };
        
        console.log('Displaying dashboard stats:', stats);
        
        // Support multiple possible property names from different API formats
        if (statsElements.activeJobs) {
            statsElements.activeJobs.textContent = stats.active_jobs || stats.activeJobs || 0;
        }
        
        if (statsElements.totalApplications) {
            statsElements.totalApplications.textContent = stats.total_applications || stats.totalApplications || 0;
        }
        
        if (statsElements.hiredInterns) {
            statsElements.hiredInterns.textContent = stats.hired_interns || stats.hiredInterns || 0;
        }
        
        if (statsElements.pendingApplications) {
            statsElements.pendingApplications.textContent = stats.pending_applications || stats.pendingApplications || 0;
        }
    }
    
    // Display recent applications
    function displayRecentApplications(applications) {
        const tableBody = document.getElementById('recentApplications');
        
        if (!tableBody) {
            console.warn('Recent applications table body not found');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (!applications || applications.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No recent applications</td>
                </tr>
            `;
            return;
        }
        
        for (const app of applications) {
            const appliedDate = formatDate(app.appliedDate || app.applied_date || app.createdAt || app.created_at);
            
            // Standardize status (only use Pending, Accepted, Rejected)
            let status = (app.status || 'Pending').trim();
            
            // Map any legacy statuses to our simplified set
            switch(status.toLowerCase()) {
                case 'hired':
                case 'interviewed':
                case 'shortlisted':
                case 'reviewed':
                    status = 'Accepted';
                    break;
                case 'rejected':
                    status = 'Rejected';
                    break;
                case 'pending':
                default:
                    status = 'Pending';
                    break;
            }
            
            // Determine status class
            const statusClass = `status-${status.toLowerCase()}`;
            
            // Get application ID
            const applicationId = app.id || app._id || app.applicationId || app.application_id || '';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${app.studentName || app.student_name || app.applicantName || 'Unknown Student'}</td>
                <td>${app.jobTitle || app.job_title || app.position || 'Unknown Position'}</td>
                <td>${appliedDate}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <a href="application-detail.html?id=${applicationId}" class="btn-icon view-btn">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
            
            tableBody.appendChild(row);
        }
    }
    
    // Display active jobs
    function displayActiveJobs(jobs) {
        const tableBody = document.getElementById('activeJobPostings');
        
        if (!tableBody) {
            console.warn('Active jobs table body not found');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (!jobs || jobs.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No active job postings</td>
                </tr>
            `;
            return;
        }
        
        for (const job of jobs) {
            const postedDate = formatDate(job.createdAt || job.created_at || job.postedDate || job.posted_date || job.dateCreated);
            const jobId = job.id || job._id || job.jobId || job.job_id || '';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${job.title || job.jobTitle || job.job_title || 'Unnamed Position'}</td>
                <td>${postedDate}</td>
                <td>${job.applicationCount || job.applications_count || job.applicationsCount || 0}</td>
                <td><span class="status-badge status-active">${job.status || 'Active'}</span></td>
                <td>
                    <a href="job-detail.html?id=${jobId}" class="btn-icon view-btn">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
            
            tableBody.appendChild(row);
        }
    }
    
    // Check authentication
    async function checkAuthentication() {
        return new Promise((resolve, reject) => {
            // First check if we already have user data in localStorage
            const userString = localStorage.getItem('userData') || localStorage.getItem('user');
            const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('employerToken');
            
            if (userString && token) {
                try {
                    const user = JSON.parse(userString);
                    if (user) {
                        console.log('User already authenticated:', user.name || user.email);
                        return resolve(user);
                    }
                } catch (error) {
                    console.warn('Error parsing user data from localStorage:', error);
                    // Continue to API check
                }
            }
            
            // If we don't have user data or there was an error, try verifying the token with the API
            if (token) {
                // Try to use SHARED_API_CONNECTOR if available
                if (window.SHARED_API_CONNECTOR) {
                    window.SHARED_API_CONNECTOR.apiRequest('/auth/verify', {
                        requiresAuth: true
                    }).then(data => {
                        // Store the user data in localStorage
                        if (data.user) {
                            localStorage.setItem('userData', JSON.stringify(data.user));
                            resolve(data.user);
                        } else {
                            reject(new Error('No user data in API response'));
                        }
                    }).catch(error => {
                        console.error('Error verifying authentication with API:', error);
                        reject(error);
                    });
                } else {
                    // Fall back to direct API call
                    fetch('http://localhost:5004/api/auth/verify', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }).then(response => {
                        if (response.ok) {
                            return response.json();
                        } else {
                            throw new Error(`API returned ${response.status}`);
                        }
                    }).then(data => {
                        // Store the user data in localStorage
                        if (data.user) {
                            localStorage.setItem('userData', JSON.stringify(data.user));
                            resolve(data.user);
                        } else {
                            reject(new Error('No user data in API response'));
                        }
                    }).catch(error => {
                        console.error('Error verifying authentication with API:', error);
                        reject(error);
                    });
                }
            } else {
                reject(new Error('No authentication token found'));
            }
        });
    }
    
    // Handle logout
    function handleLogout() {
        // Clear all auth data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('employerToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');
        localStorage.removeItem('applicationStatusChanges');
        
        // Show toast notification
        showToast('Logged out successfully', 'info');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
    
    // Redirect to login page
    function redirectToLogin() {
        window.location.href = '/';
    }
    
    // Helper function to show toast notifications
    function showToast(message, type = 'info') {
        console.log(`Toast: ${message} (${type})`);
        
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
});