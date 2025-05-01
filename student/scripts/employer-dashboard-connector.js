/**
 * Employer Dashboard Connector
 * This script integrates the employer dashboard with the database
 * by utilizing the DB_CONNECTOR
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
    
    // Load dashboard data initially
    loadDashboardData();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    // Load dashboard data
    async function loadDashboardData() {
        try {
            // Get employer info from localStorage
            const userString = localStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                if (companyNameEl) {
                    companyNameEl.textContent = user.company_name || user.companyName || user.name || 'Company Name';
                }
            }
            
            // Check API connectivity
            const isApiAvailable = await DB_CONNECTOR.checkApiConnectivity();
            if (!isApiAvailable) {
                console.error('API is not available');
                showToast('Could not connect to the server. Please try again later.', 'error');
                clearDashboardData();
                return;
            }
            
            // Get dashboard stats
            const stats = await DB_CONNECTOR.getDashboardStats();
            
            // Update stats on the page
            if (activeJobsEl) activeJobsEl.textContent = stats.active_jobs || 0;
            if (totalApplicationsEl) totalApplicationsEl.textContent = stats.total_applications || 0;
            if (hiredInternsEl) hiredInternsEl.textContent = stats.hired_interns || 0;
            if (pendingApplicationsEl) pendingApplicationsEl.textContent = stats.pending_applications || 0;
            
            // Get and display recent applications
            const recentApplications = await DB_CONNECTOR.getRecentApplications(5);
            displayRecentApplications(recentApplications);
            
            // Get and display active job postings
            const activeJobs = await DB_CONNECTOR.getActiveJobPostings(5);
            displayActiveJobs(activeJobs);
            
            console.log('Dashboard data loaded successfully');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showToast('Error loading dashboard data', 'error');
            clearDashboardData();
        }
    }
    
    // Clear dashboard data when API is unavailable
    function clearDashboardData() {
        if (activeJobsEl) activeJobsEl.textContent = '0';
        if (totalApplicationsEl) totalApplicationsEl.textContent = '0';
        if (hiredInternsEl) hiredInternsEl.textContent = '0';
        if (pendingApplicationsEl) pendingApplicationsEl.textContent = '0';
        
        if (recentApplicationsTable) {
            recentApplicationsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">Unable to load applications</td>
                </tr>
            `;
        }
        
        if (activeJobPostingsTable) {
            activeJobPostingsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">Unable to load job postings</td>
                </tr>
            `;
        }
    }
    
    // Display recent applications
    function displayRecentApplications(applications) {
        if (!recentApplicationsTable) return;
        
        recentApplicationsTable.innerHTML = '';
        
        if (!applications || applications.length === 0) {
            recentApplicationsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No recent applications</td>
                </tr>
            `;
            return;
        }
        
        applications.forEach(app => {
            const row = document.createElement('tr');
            
            // Format the date
            const appliedDate = DB_CONNECTOR.formatDate(app.appliedDate);
            
            // Determine status class
            let statusClass;
            switch ((app.status || '').toLowerCase()) {
                case 'accepted':
                case 'hired':
                    statusClass = 'status-accepted';
                    break;
                case 'rejected':
                    statusClass = 'status-rejected';
                    break;
                case 'interviewed':
                    statusClass = 'status-interviewed';
                    break;
                case 'reviewed':
                    statusClass = 'status-reviewed';
                    break;
                case 'pending':
                default:
                    statusClass = 'status-pending';
                    break;
            }
            
            row.innerHTML = `
                <td>${app.studentName}</td>
                <td>${app.jobTitle}</td>
                <td>${appliedDate}</td>
                <td><span class="status-badge ${statusClass}">${app.status}</span></td>
                <td>
                    <a href="applications.html?id=${app.id}" class="btn-icon view-btn">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
            
            recentApplicationsTable.appendChild(row);
        });
    }
    
    // Display active jobs
    function displayActiveJobs(jobs) {
        if (!activeJobPostingsTable) return;
        
        activeJobPostingsTable.innerHTML = '';
        
        if (!jobs || jobs.length === 0) {
            activeJobPostingsTable.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No active job postings</td>
                </tr>
            `;
            return;
        }
        
        jobs.forEach(job => {
            const row = document.createElement('tr');
            const postedDate = DB_CONNECTOR.formatDate(job.createdAt);
            
            row.innerHTML = `
                <td>${job.title}</td>
                <td>${postedDate}</td>
                <td>${job.applicationCount}</td>
                <td><span class="status-badge status-active">${job.status}</span></td>
                <td>
                    <a href="job-details.html?id=${job.id}" class="btn-icon view-btn">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            `;
            
            activeJobPostingsTable.appendChild(row);
        });
    }
    
    // Setup auto-refresh
    function setupAutoRefresh() {
        // Refresh data every minute if the page is visible
        const refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                console.log('Auto-refreshing dashboard data');
                loadDashboardData();
            }
        }, 60000); // Every 60 seconds
        
        // Also refresh when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('Tab became visible, refreshing dashboard data');
                loadDashboardData();
            }
        });
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            clearInterval(refreshInterval);
        });
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