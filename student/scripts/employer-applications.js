/**
 * Employer Applications UI Handler
 * This script handles the UI interactions for the applications page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    init().catch(error => {
        console.error('Initialization error:', error);
        showToast('Error initializing page: ' + error.message, 'error');
    });
});

// Global state
let applications = [];
let filteredApplications = [];
let currentPage = 1;
const itemsPerPage = 10;

// Initialize the page
async function init() {
    console.log('Initializing applications page');
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await loadAndDisplayApplications();
    
    // Setup auto-refresh
    setupAutoRefresh();
}

// Load and display applications
async function loadAndDisplayApplications(showLoading = true) {
    try {
        if (showLoading) {
            document.getElementById('applicationsTable').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Loading applications...</td>
                </tr>
            `;
        }
        
        // Load applications using the connector
        applications = await APPLICATIONS_CONNECTOR.loadApplications();
        console.log('Loaded applications:', applications);
        
        // Update job filter dropdown
        updateJobFilterDropdown();
        
        // Apply filters and display
        filterAndDisplayApplications();
        
    } catch (error) {
        console.error('Error loading applications:', error);
        document.getElementById('applicationsTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    Error loading applications. Please try again later.
                </td>
            </tr>
        `;
        showToast('Error loading applications: ' + error.message, 'error');
    }
}

// Update job filter dropdown
function updateJobFilterDropdown() {
    const jobFilter = document.getElementById('jobFilter');
    if (!jobFilter) return;
    
    // Get unique job titles
    const jobTitles = [...new Set(applications.map(app => app.jobTitle))];
    
    // Sort alphabetically
    jobTitles.sort();
    
    // Update dropdown options
    jobFilter.innerHTML = '<option value="all">All Job Postings</option>' +
        jobTitles.map(title => `<option value="${title}">${title}</option>`).join('');
}

// Filter and display applications
function filterAndDisplayApplications() {
    // Get filter values
    const jobFilter = document.getElementById('jobFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    const searchTerm = document.getElementById('searchApplications').value.toLowerCase();
    
    // Apply filters
    filteredApplications = applications.filter(app => {
        // Job filter
        if (jobFilter !== 'all' && app.jobTitle !== jobFilter) return false;
        
        // Status filter
        if (statusFilter !== 'all' && app.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
        
        // Date filter
        const appDate = new Date(app.appliedDate);
        const now = new Date();
        if (dateFilter === 'today') {
            if (appDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            if (appDate < weekAgo) return false;
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
            if (appDate < monthAgo) return false;
        }
        
        // Search term
        if (searchTerm) {
            const searchFields = [
                app.studentName,
                app.studentId,
                app.studentEmail,
                app.jobTitle
            ].map(field => (field || '').toLowerCase());
            
            return searchFields.some(field => field.includes(searchTerm));
        }
        
        return true;
    });
    
    // Sort by date (newest first)
    filteredApplications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    
    // Display applications
    displayApplications();
}

// Display applications with pagination
function displayApplications() {
    const tableBody = document.getElementById('applicationsTable');
    if (!tableBody) return;
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageApplications = filteredApplications.slice(start, end);
    
    // Display applications
    if (pageApplications.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No applications found</td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = pageApplications.map(app => `
            <tr>
                <td>${app.studentName || 'N/A'}</td>
                <td>${app.jobTitle || 'N/A'}</td>
                <td>${formatDate(app.appliedDate)}</td>
                <td><span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span></td>
                <td>
                    ${app.resumeUrl ? `
                        <a href="${app.resumeUrl}" target="_blank" class="btn btn-sm btn-secondary">
                            <i class="fas fa-file-alt"></i> View
                        </a>
                    ` : 'N/A'}
                </td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="openApplicationDetail('${app.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // Update pagination
    updatePagination(totalPages);
}

// Update pagination controls
function updatePagination(totalPages) {
    const pagination = document.getElementById('applicationsPagination');
    if (!pagination) return;
    
    let paginationHtml = '';
    
    // Previous button
    paginationHtml += `
        <button class="btn btn-sm btn-secondary ${currentPage === 1 ? 'disabled' : ''}"
                onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-secondary'}"
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHtml += `
        <button class="btn btn-sm btn-secondary ${currentPage === totalPages ? 'disabled' : ''}"
                onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
    
    pagination.innerHTML = paginationHtml;
}

// Change page
function changePage(page) {
    currentPage = page;
    displayApplications();
}

// Setup event listeners
function setupEventListeners() {
    // Filter change events
    ['jobFilter', 'statusFilter', 'dateFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                currentPage = 1;
                filterAndDisplayApplications();
            });
        }
    });
    
    // Search input
    const searchInput = document.getElementById('searchApplications');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            filterAndDisplayApplications();
        }, 300));
    }
    
    // Export button
    const exportBtn = document.getElementById('exportApplicationsBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportApplications);
    }
}

// Setup auto-refresh
function setupAutoRefresh() {
    // Refresh every 2 minutes if the page is visible
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadAndDisplayApplications(false);
        }
    }, 120000);
    
    // Refresh when the page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            loadAndDisplayApplications(false);
        }
    });
}

// Export applications
function exportApplications() {
    try {
        // Create CSV content
        const headers = ['Student Name', 'Student ID', 'Email', 'Job Title', 'Applied Date', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredApplications.map(app => [
                app.studentName,
                app.studentId,
                app.studentEmail,
                app.jobTitle,
                formatDate(app.appliedDate),
                app.status
            ].map(field => `"${field || ''}"`).join(','))
        ].join('\n');
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `applications_export_${formatDate(new Date())}.csv`;
        link.click();
        
        showToast('Applications exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting applications:', error);
        showToast('Error exporting applications', 'error');
    }
}

// Format date
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

// Debounce function
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), timeout);
    };
}

// Show toast notification
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

// Open application detail view
function openApplicationDetail(applicationId) {
    window.location.href = `application-detail.html?id=${applicationId}`;
}

window.changePage = changePage; 