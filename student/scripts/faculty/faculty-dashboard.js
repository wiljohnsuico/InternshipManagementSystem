// Faculty Dashboard JavaScript

const API_URL = '/api/admin/interns';

let allInterns = [];
let filteredInterns = [];
let selectedDepartment = 'All';
let selectedSection = 'All';

// Fetch all interns from the backend
async function fetchInterns() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.success) {
            allInterns = data.interns;
            filteredInterns = [...allInterns];
            populateDepartmentFilter();
            populateSectionFilter();
            updateDashboardStats();
            populateStudentsTable();
            initializeChart();
        } else {
            throw new Error('Failed to fetch interns');
        }
    } catch (error) {
        console.error('Error fetching interns:', error);
    }
}

// Populate department filter dropdown
function populateDepartmentFilter() {
    const departments = Array.from(new Set(allInterns.map(i => i.department || i.college_department))).filter(Boolean);
    const departmentSelect = document.getElementById('department-filter');
    departmentSelect.innerHTML = '<option value="All">All Departments</option>' +
        departments.map(dep => `<option value="${dep}">${dep}</option>`).join('');
}

// Populate section filter dropdown
function populateSectionFilter() {
    const sections = Array.from(new Set(filteredInterns.map(i => i.section))).filter(Boolean);
    const sectionSelect = document.getElementById('section-filter');
    sectionSelect.innerHTML = '<option value="All">All Sections</option>' +
        sections.map(sec => `<option value="${sec}">${sec}</option>`).join('');
}

// Update dashboard stats
function updateDashboardStats() {
    // Example logic, adjust as needed for your schema
    const attendanceRatio = Math.round((filteredInterns.filter(i => i.attendance_rate >= 0).reduce((sum, i) => sum + (i.attendance_rate || 0), 0) / (filteredInterns.length || 1)) || 0);
    const remainingHours = filteredInterns.reduce((sum, i) => sum + (i.remaining_hours || 0), 0);
    const studentsApplied = filteredInterns.length;
    const studentsAccepted = filteredInterns.filter(i => i.verification_status === 'Accepted' || i.verification_status === 'Approved').length;

    document.querySelector('.stat-value:nth-of-type(1)').textContent = `${attendanceRatio}%`;
    document.querySelector('.stat-value:nth-of-type(2)').textContent = remainingHours;
    document.querySelector('.stat-value:nth-of-type(3)').textContent = studentsApplied;
    document.querySelector('.stat-value:nth-of-type(4)').textContent = studentsAccepted;
}

// Initialize the attendance chart
function initializeChart() {
    const ctx = document.getElementById('attendance-chart').getContext('2d');
    const attendanceRatio = parseInt(document.querySelector('.stat-value:nth-of-type(1)').textContent) || 0;
    if (window.attendanceChart) window.attendanceChart.destroy();
    window.attendanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [attendanceRatio, 100 - attendanceRatio],
                backgroundColor: ['#0088FE', '#FFFFFF'],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

// Populate the students table
function populateStudentsTable() {
    const tableBody = document.getElementById('students-table-body');
    tableBody.innerHTML = '';
    filteredInterns.forEach(intern => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${intern.first_name} ${intern.last_name}</td>
            <td>${intern.student_id || intern.id}</td>
            <td>${intern.section || ''}</td>
            <td>${intern.company_applied || ''}</td>
        `;
        tableBody.appendChild(row);
    });
    // Add empty rows for design
    for (let i = 0; i < 5; i++) {
        const emptyRow = document.createElement('tr');
        for (let j = 0; j < 4; j++) {
            const emptyCell = document.createElement('td');
            emptyCell.innerHTML = '&nbsp;';
            emptyRow.appendChild(emptyCell);
        }
        tableBody.appendChild(emptyRow);
    }
}

// Handle department/section filter changes
function setupFilters() {
    document.getElementById('department-filter').addEventListener('change', function() {
        selectedDepartment = this.value;
        filterInterns();
        populateSectionFilter();
        updateDashboardStats();
        populateStudentsTable();
        initializeChart();
    });
    document.getElementById('section-filter').addEventListener('change', function() {
        selectedSection = this.value;
        filterInterns();
        updateDashboardStats();
        populateStudentsTable();
        initializeChart();
    });
}

function filterInterns() {
    filteredInterns = allInterns.filter(i =>
        (selectedDepartment === 'All' || (i.department || i.college_department) === selectedDepartment) &&
        (selectedSection === 'All' || i.section === selectedSection)
    );
}

// Handle logout functionality
function setupLogout() {
    const logoutLink = document.querySelector('.profile-content a');
    logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = '/student/mpl-login.html';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupLogout();
    setupFilters();
    fetchInterns();
}); 