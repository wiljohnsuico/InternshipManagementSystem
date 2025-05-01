// Employer Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
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
            
            // Load dashboard data
            loadDashboardData();
            
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
                window.location.href = 'http://localhost:3000/student/employers/applications.html';
            });
        }
        
        // View all jobs button
        if (viewAllJobsBtn) {
            viewAllJobsBtn.addEventListener('click', () => {
                window.location.href = 'http://localhost:3000/student/employers/job-postings.html';
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
                
                window.location.href = 'http://localhost:3000/student/employers/job-postings.html';
                return false;
            });
        }
        
        // Fix Post New Internship button if it exists
        const postInternshipBtn2 = document.querySelector('.btn-primary[href="/student/employers/job-postings.html"]');
        if (postInternshipBtn2) {
            postInternshipBtn2.href = 'http://localhost:3000/student/employers/job-postings.html';
        }
        
        // Add View Applications button handler
        const viewApplicationsBtn = document.querySelector('.btn-secondary');
        if (viewApplicationsBtn) {
            viewApplicationsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('View Applications button clicked');
                window.location.href = 'http://localhost:3000/student/employers/applications.html';
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

    // Load dashboard data
    async function loadDashboardData() {
        try {
            // First check if API is available
            isApiAvailable = await checkApiConnectivity();
            
            if (!isApiAvailable) {
                console.log('API not available, using mock data');
                displayMockData();
                return;
            }
            
            const token = localStorage.getItem('token');
            
            // Update stats using the dashboard stats endpoint
            try {
                const statsEndpoint = 'http://localhost:5004/api/employers/dashboard/stats';
                console.log(`Loading dashboard statistics from: ${statsEndpoint}`);
                
                const response = await fetch(statsEndpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    displayDashboardStats(data);
                    console.log('Dashboard stats loaded successfully:', data);
                } else {
                    console.error('Error loading dashboard statistics:', response.status);
                    // Fall back to job stats if dashboard stats fail
                    await loadJobStats(token);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                // Fall back to job stats if dashboard stats fail
                await loadJobStats(token);
            }
            
            // Load recent applications
            await loadRecentApplications(token);
            
            // Load active job postings
            await loadActiveJobs(token);
            
        } catch (error) {
            console.error('Error in loadDashboardData:', error);
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
    
    // Load recent applications
    async function loadRecentApplications(token) {
        try {
            const applicationsEndpoint = 'http://localhost:5004/api/applications/employer/recent';
            console.log(`Loading recent applications from: ${applicationsEndpoint}`);
            
            const appResponse = await fetch(applicationsEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (appResponse.ok) {
                const appData = await appResponse.json();
                // Get only the first 5 recent applications if there are more
                const recentApps = Array.isArray(appData) ? appData.slice(0, 5) 
                    : (appData.applications ? appData.applications.slice(0, 5) 
                    : (appData.data ? appData.data.slice(0, 5) : []));
                    
                displayRecentApplications(recentApps);
            } else {
                console.error('Error loading recent applications:', appResponse.status);
                // Fall back to all applications and just take the most recent
                await loadAllApplications(token);
            }
        } catch (error) {
            console.error('Error loading recent applications:', error);
            document.getElementById('recentApplications').innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No recent applications available</td>
                </tr>
            `;
        }
    }
    
    // Load all applications as fallback
    async function loadAllApplications(token) {
        try {
            const applicationsEndpoint = 'http://localhost:5004/api/applications/employer';
            
            const appResponse = await fetch(applicationsEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (appResponse.ok) {
                const appData = await appResponse.json();
                // Extract applications array and sort by date
                let applications = [];
                if (Array.isArray(appData)) {
                    applications = appData;
                } else if (appData.applications && Array.isArray(appData.applications)) {
                    applications = appData.applications;
                } else if (appData.data && Array.isArray(appData.data)) {
                    applications = appData.data;
                }
                
                // Sort by date (newest first) and take first 5
                applications.sort((a, b) => {
                    const dateA = new Date(a.applied_date || a.created_at || a.updatedAt || 0);
                    const dateB = new Date(b.applied_date || b.created_at || b.updatedAt || 0);
                    return dateB - dateA;
                });
                
                const recentApps = applications.slice(0, 5);
                displayRecentApplications(recentApps);
            } else {
                throw new Error(`Failed to load applications: ${appResponse.status}`);
            }
        } catch (error) {
            console.error('Error in loadAllApplications:', error);
            document.getElementById('recentApplications').innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No recent applications available</td>
                </tr>
            `;
        }
    }
    
    // Load active job postings
    async function loadActiveJobs(token) {
        try {
            const jobsEndpoint = 'http://localhost:5004/api/jobs/employer';
            console.log(`Loading employer job postings from: ${jobsEndpoint}`);
            
            const jobsResponse = await fetch(jobsEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (jobsResponse.ok) {
                const jobsData = await jobsResponse.json();
                
                // Extract jobs array
                let jobs = [];
                if (Array.isArray(jobsData)) {
                    jobs = jobsData;
                } else if (jobsData.jobs && Array.isArray(jobsData.jobs)) {
                    jobs = jobsData.jobs;
                } else if (jobsData.listings && Array.isArray(jobsData.listings)) {
                    jobs = jobsData.listings;
                } else if (jobsData.data && Array.isArray(jobsData.data)) {
                    jobs = jobsData.data;
                }
                
                // Filter to only active jobs
                const activeJobs = jobs.filter(job => 
                    job.status === 'Active' || job.status === 'ACTIVE' || job.status === 'active'
                ).slice(0, 5);
                
                displayActiveJobs(activeJobs);
            } else {
                console.error('Error loading active job postings:', jobsResponse.status);
                document.getElementById('activeJobPostings').innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">No active job postings</td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('Error loading active job postings:', error);
            document.getElementById('activeJobPostings').innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No active job postings</td>
                </tr>
            `;
        }
    }
    
    // Display active jobs
    function displayActiveJobs(jobs) {
        const container = document.getElementById('activeJobPostings');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!jobs || jobs.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No active job postings found</td>
                </tr>
            `;
            return;
        }
        
        jobs.forEach(job => {
            const row = document.createElement('tr');
            const postedDate = formatDate(job.created_at || job.createdAt || job.posted_date || new Date());
            const applicationCount = job.application_count || job.applicationCount || job.applications_count || 0;
            const jobTitle = job.title || job.job_title || 'Untitled Position';
            const jobStatus = job.status || 'Active';
            const jobId = job.id || job._id || job.job_id || '';
            
            row.innerHTML = `
                <td>${jobTitle}</td>
                <td>${postedDate}</td>
                <td>${applicationCount}</td>
                <td><span class="status-badge status-${jobStatus.toLowerCase()}">${jobStatus}</span></td>
                <td>
                    <a href="job-details.html?id=${jobId}" class="btn-icon view-btn">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
            
            container.appendChild(row);
        });
    }
    
    // Display mock data when API is unavailable
    function displayMockData() {
        console.log('Displaying mock data for dashboard');
        
        // Mock statistics
        displayDashboardStats({
            active_jobs: 3,
            total_applications: 12,
            hired_interns: 2,
            pending_applications: 5
        });
        
        // Mock recent applications
        const mockApplications = [
            {
                applicant_name: 'John Doe',
                job_title: 'Frontend Developer Intern',
                applied_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                status: 'Pending'
            },
            {
                applicant_name: 'Jane Smith',
                job_title: 'Backend Developer Intern',
                applied_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                status: 'Reviewed'
            },
            {
                applicant_name: 'Mike Johnson',
                job_title: 'UX Design Intern',
                applied_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                status: 'Interviewed'
            }
        ];
        
        displayRecentApplications(mockApplications);
        
        // Mock active job postings
        const mockJobs = [
            {
                title: 'Frontend Developer Intern',
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                application_count: 5,
                status: 'Active',
                id: 'job-1'
            },
            {
                title: 'Backend Developer Intern',
                created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                application_count: 3,
                status: 'Active',
                id: 'job-2'
            },
            {
                title: 'UX Design Intern',
                created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                application_count: 4,
                status: 'Active',
                id: 'job-3'
            }
        ];
        
        displayActiveJobs(mockJobs);
    }
    
    // Format date function
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
            return 'Unknown date';
        }
    }
    
    // Display dashboard stats with empty stats as default
    function displayDashboardStats(stats = {}) {
        // Update stat counters directly with real data or zeros
        const activeJobsEl = document.getElementById('activeJobs');
        const totalApplicationsEl = document.getElementById('totalApplications');
        const hiredInternsEl = document.getElementById('hiredInterns');
        const pendingApplicationsEl = document.getElementById('pendingApplications');
        
        if (activeJobsEl) activeJobsEl.textContent = stats.active_jobs || 0;
        if (totalApplicationsEl) totalApplicationsEl.textContent = stats.total_applications || 0;
        if (hiredInternsEl) hiredInternsEl.textContent = stats.hired_interns || 0;
        if (pendingApplicationsEl) pendingApplicationsEl.textContent = stats.pending_applications || 0;
    }
    
    // Display recent applications
    function displayRecentApplications(applications) {
        const recentApplicationsTable = document.getElementById('recentApplications');
        if (!recentApplicationsTable) return;
        
        // Clear existing rows
        recentApplicationsTable.innerHTML = '';
        
        // If no applications, show empty state
        if (!applications || applications.length === 0) {
            recentApplicationsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No recent applications</td>
                </tr>
            `;
            return;
        }
        
        // Process each application
        applications.forEach(app => {
            // Handle different API response formats
            const id = app.id || app._id || app.application_id || '';
            
            // Get applicant name from various possible properties
            let applicantName = app.applicant_name || '';
            if (!applicantName && app.student) {
                // Try to extract from student object
                const firstName = app.student.first_name || app.student.firstName || '';
                const lastName = app.student.last_name || app.student.lastName || '';
                applicantName = firstName + (lastName ? ' ' + lastName : '');
            }
            
            // Get job title
            const jobTitle = app.job_title || app.jobTitle || app.position || 'Unknown Position';
            
            // Get date and format it
            const appliedDate = formatDate(app.applied_date || app.appliedDate || app.created_at || app.createdAt || new Date());
            
            // Get status with default
            const status = app.status || 'Pending';
            
            // Create status class based on status
            let statusClass;
            switch (status.toLowerCase()) {
                case 'accepted':
                case 'hired':
                    statusClass = 'success';
                    break;
                case 'rejected':
                    statusClass = 'danger';
                    break;
                case 'interviewed':
                case 'shortlisted':
                    statusClass = 'info';
                    break;
                case 'reviewed':
                    statusClass = 'secondary';
                    break;
                case 'pending':
                default:
                    statusClass = 'warning';
                    break;
            }
            
            // Create row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${applicantName}</td>
                <td>${jobTitle}</td>
                <td>${appliedDate}</td>
                <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
                <td>
                    <a href="applications.html?id=${id}" class="btn-icon view-btn">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
            
            recentApplicationsTable.appendChild(row);
        });
    }
    
    // Check if user is authenticated and has employer role
    async function checkAuthentication() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                throw new Error('Not authenticated');
            }
            
            // Get the user from localStorage
            const userString = localStorage.getItem('user');
            if (!userString) {
                console.error('No user data found in localStorage');
                throw new Error('User data missing');
            }
            
            const user = JSON.parse(userString);
            console.log('User from localStorage:', user);
            
            // The role might be 'Employer' (capitalized) but we should check case-insensitively
            const userRole = (user.role || '').toLowerCase();
            
            if (userRole !== 'employer') {
                console.error('User is not an employer. Role:', user.role);
                throw new Error('Not authorized as employer');
            }
            
            // Verify token with the backend
            try {
                const verifyResponse = await fetch('http://localhost:5004/api/auth/verify', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!verifyResponse.ok) {
                    console.error('Token verification failed with status:', verifyResponse.status);
                    throw new Error('Token validation failed');
                }
                
                console.log('Authentication successful');
                return user;
            } catch (verifyError) {
                console.error('Token verification error:', verifyError);
                // Only redirect on actual auth errors, not network errors
                if (verifyError.message.includes('validation')) {
                    redirectToLogin();
                }
                throw verifyError;
            }
        } catch (error) {
            console.error('Authentication check error:', error);
            throw error;
        }
    }
    
    // Handle logout
    function handleLogout() {
        // Ask for confirmation before logging out
        if (confirm('Are you sure you want to log out?')) {
            console.log('User confirmed logout');
            
            // Show toast notification
            showToast('Logging out...', 'info');
            
            // Clear all authentication related data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('mockJobPostings'); // Clear mock data too
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '../mpl-login.html';
            }, 1000);
        } else {
            console.log('Logout cancelled by user');
        }
    }
    
    // Redirect to login page
    function redirectToLogin() {
        window.location.href = 'job-postings.html';
    }
    
    // Helper: Show toast notification
    function showToast(message, type = 'info') {
        console.log(`Toast: ${type} - ${message}`);
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Show toast
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