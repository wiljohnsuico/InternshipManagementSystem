// Initialize page protection
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and has faculty role
    if (!isLoggedIn() || !hasRole('faculty')) {
        window.location.href = '../login.html';
        return;
    }

    // Initialize page functionality
    initializeTabs();
    loadInternInfo();
    loadReports();
});

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Load intern information
async function loadInternInfo() {
    try {
        const internId = getUrlParameter('internId');
        if (!internId) {
            showError('No intern ID provided');
            return;
        }

        const response = await fetch(`/api/interns/${internId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load intern information');
        }

        const internData = await response.json();
        displayInternInfo(internData);
    } catch (error) {
        showError(error.message);
    }
}

// Display intern information
function displayInternInfo(data) {
    document.getElementById('intern-name').textContent = data.name;
    document.getElementById('intern-id').textContent = data.studentId;
    document.getElementById('intern-company').textContent = data.company;
    document.getElementById('intern-start-date').textContent = formatDate(data.startDate);
    document.getElementById('intern-end-date').textContent = formatDate(data.endDate);
    document.getElementById('intern-status').textContent = data.status;
}

// Load reports based on current tab
async function loadReports() {
    const internId = getUrlParameter('internId');
    if (!internId) return;

    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    
    try {
        let response;
        switch (activeTab) {
            case 'daily':
                response = await fetch(`/api/interns/${internId}/reports/daily`, {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    populateDailyReports(data);
                }
                break;
            case 'weekly':
                response = await fetch(`/api/interns/${internId}/reports/weekly`, {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    populateWeeklyReports(data);
                }
                break;
            case 'monthly':
                response = await fetch(`/api/interns/${internId}/reports/monthly`, {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    populateMonthlyReports(data);
                }
                break;
        }
    } catch (error) {
        showError('Failed to load reports');
    }
}

// Populate daily reports tables
function populateDailyReports(data) {
    const attendanceTable = document.querySelector('#attendance-table tbody');
    const accomplishmentTable = document.querySelector('#accomplishment-table tbody');

    // Clear existing rows
    attendanceTable.innerHTML = '';
    accomplishmentTable.innerHTML = '';

    // Populate attendance table
    data.attendance.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(record.date)}</td>
            <td>${record.timeIn || '-'}</td>
            <td>${record.timeOut || '-'}</td>
            <td>${record.status}</td>
        `;
        attendanceTable.appendChild(row);
    });

    // Populate accomplishment table
    data.accomplishments.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(record.date)}</td>
            <td>${record.details}</td>
            <td>${record.status}</td>
        `;
        row.addEventListener('click', () => showReportDetails(record));
        accomplishmentTable.appendChild(row);
    });
}

// Populate weekly reports table
function populateWeeklyReports(data) {
    const table = document.querySelector('#weekly-report-table tbody');
    table.innerHTML = '';

    data.forEach((report, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(report.startDate)} - ${formatDate(report.endDate)}</td>
            <td>${report.summary}</td>
            <td>${report.status}</td>
        `;
        row.addEventListener('click', () => showReportDetails(report));
        table.appendChild(row);
    });
}

// Populate monthly reports table
function populateMonthlyReports(data) {
    const table = document.querySelector('#monthly-report-table tbody');
    table.innerHTML = '';

    data.forEach((report, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(report.month)}</td>
            <td>${report.summary}</td>
            <td>${report.status}</td>
        `;
        row.addEventListener('click', () => showReportDetails(report));
        table.appendChild(row);
    });
}

// Show report details in modal
function showReportDetails(report) {
    const modal = document.getElementById('view-report-modal');
    const modalTitle = document.getElementById('modal-title');
    const content = document.getElementById('report-details-content');
    const supervisorFeedback = document.getElementById('supervisor-feedback');
    const facultyFeedback = document.getElementById('faculty-feedback');

    modalTitle.textContent = `Report Details - ${formatDate(report.date)}`;
    content.innerHTML = `
        <div class="report-details">
            <h3>Details</h3>
            <p>${report.details || report.summary}</p>
            <h3>Status</h3>
            <p>${report.status}</p>
        </div>
    `;

    supervisorFeedback.innerHTML = `
        <h4>Supervisor Feedback</h4>
        <p>${report.supervisorFeedback || 'No feedback provided'}</p>
    `;

    facultyFeedback.innerHTML = `
        <h4>Faculty Feedback</h4>
        <p>${report.facultyFeedback || 'No feedback provided'}</p>
    `;

    modal.style.display = 'block';
}

// Close modal when clicking the close button
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('view-report-modal').style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('view-report-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Utility functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function showError(message) {
    // Implement error display logic
    console.error(message);
} 