// Faculty Attendance Tracking JavaScript

// Global variables
let API_URL = '/student/api/faculty';
let currentDate = new Date().toISOString().split('T')[0];
let currentView = 'daily';
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// DOM Elements
let attendanceTableBody, summaryTableBody, dateSelector, todayBtn,
    dailyViewBtn, summaryViewBtn, dailyView, summaryView,
    startDateInput, endDateInput, applyRangeBtn, thisWeekBtn, thisMonthBtn,
    searchInput, currentDateDisplay, presentCount, absentCount,
    avgHours, attendanceRate, refreshBtn;

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    loadDailyAttendance(currentDate);
});

// Initialize DOM elements
function initializeElements() {
    attendanceTableBody = document.getElementById('attendanceTableBody');
    summaryTableBody = document.getElementById('summaryTableBody');
    dateSelector = document.getElementById('date-selector');
    todayBtn = document.getElementById('today-btn');
    dailyViewBtn = document.getElementById('daily-view-btn');
    summaryViewBtn = document.getElementById('summary-view-btn');
    dailyView = document.getElementById('daily-view');
    summaryView = document.getElementById('summary-view');
    startDateInput = document.getElementById('start-date');
    endDateInput = document.getElementById('end-date');
    applyRangeBtn = document.getElementById('apply-range-btn');
    thisWeekBtn = document.getElementById('this-week-btn');
    thisMonthBtn = document.getElementById('this-month-btn');
    searchInput = document.getElementById('searchInput');
    currentDateDisplay = document.getElementById('current-date-display');
    presentCount = document.getElementById('present-count');
    absentCount = document.getElementById('absent-count');
    avgHours = document.getElementById('avg-hours');
    attendanceRate = document.getElementById('attendance-rate');

    // Add refresh button if it doesn't exist
    if (!document.getElementById('refresh-btn')) {
        // Create a container for the refresh button below the header
        let refreshContainer = document.getElementById('refresh-btn-container');
        if (!refreshContainer) {
            refreshContainer = document.createElement('div');
            refreshContainer.id = 'refresh-btn-container';
            refreshContainer.style.cssText = `
                display: flex;
                justify-content: flex-end;
                margin: 10px 0 20px 0;
            `;
            // Insert after header
            const header = document.querySelector('.header');
            header.parentNode.insertBefore(refreshContainer, header.nextSibling);
        }
        refreshBtn = document.createElement('button');
        refreshBtn.id = 'refresh-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.style.cssText = `
            padding: 8px 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        refreshContainer.appendChild(refreshBtn);
    } else {
        refreshBtn = document.getElementById('refresh-btn');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Date selector change
    if (dateSelector) {
        dateSelector.addEventListener('change', () => {
            currentDate = dateSelector.value;
            currentDateDisplay.textContent = formatDateForDisplay(currentDate);
            loadDailyAttendance(currentDate);
        });
    }

    // Today button
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            const today = new Date().toISOString().split('T')[0];
            dateSelector.value = today;
            currentDate = today;
            currentDateDisplay.textContent = formatDateForDisplay(today);
            loadDailyAttendance(today);
        });
    }

    // View toggle
    if (dailyViewBtn) {
        dailyViewBtn.addEventListener('click', () => {
            setActiveView('daily');
        });
    }

    if (summaryViewBtn) {
        summaryViewBtn.addEventListener('click', () => {
            setActiveView('summary');
            loadAttendanceSummary();
        });
    }

    // Date range filters
    if (applyRangeBtn) {
        applyRangeBtn.addEventListener('click', () => {
            loadAttendanceSummary(startDateInput.value, endDateInput.value);
        });
    }

    if (thisWeekBtn) {
        thisWeekBtn.addEventListener('click', () => {
            const { start, end } = getThisWeekDates();
            startDateInput.value = start;
            endDateInput.value = end;
            loadAttendanceSummary(start, end);
        });
    }

    if (thisMonthBtn) {
        thisMonthBtn.addEventListener('click', () => {
            const { start, end } = getThisMonthDates();
            startDateInput.value = start;
            endDateInput.value = end;
            loadAttendanceSummary(start, end);
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', searchTable);
    }

    // Add refresh button click handler
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('rotating');
        if (currentView === 'daily') {
            loadDailyAttendance(currentDate);
        } else {
            loadAttendanceSummary(startDateInput.value, endDateInput.value);
        }
    });
}

// Set active view (daily or summary)
function setActiveView(view) {
    currentView = view;
    if (view === 'daily') {
        dailyView.style.display = 'block';
        summaryView.style.display = 'none';
        dailyViewBtn.classList.add('active');
        summaryViewBtn.classList.remove('active');
    } else {
        dailyView.style.display = 'none';
        summaryView.style.display = 'block';
        dailyViewBtn.classList.remove('active');
        summaryViewBtn.classList.add('active');
    }
}

// Show loading state
function showLoading() {
    const loadingHtml = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div>
                <p>Loading attendance data...</p>
            </td>
        </tr>
    `;
    if (currentView === 'daily') {
        attendanceTableBody.innerHTML = loadingHtml;
    } else {
        summaryTableBody.innerHTML = loadingHtml;
    }
}

// Load daily attendance data with retry mechanism
async function loadDailyAttendance(date) {
    showLoading();
    try {
        const response = await fetchWithRetry(`${API_URL}/attendance/daily?date=${date}`);
        const data = await response.json();
        
        if (!data || !data.attendance) {
            throw new Error("Invalid data format received");
        }

        displayDailyAttendance(data.attendance, data.stats);
        retryCount = 0; // Reset retry count on success
    } catch (error) {
        console.error('Error loading daily attendance:', error);
        showError(getDetailedErrorMessage(error));
        displayEmptyState();
    } finally {
        refreshBtn.classList.remove('rotating');
    }
}

// Load attendance summary with retry mechanism
async function loadAttendanceSummary(startDate = null, endDate = null) {
    showLoading();
    try {
        const url = new URL(`${API_URL}/attendance/summary`);
        if (startDate) url.searchParams.append('startDate', startDate);
        if (endDate) url.searchParams.append('endDate', endDate);

        const response = await fetchWithRetry(url);
        const data = await response.json();
        
        if (!data || !Array.isArray(data)) {
            throw new Error("Invalid data format received");
        }

        displayAttendanceSummary(data);
        retryCount = 0; // Reset retry count on success
    } catch (error) {
        console.error('Error loading attendance summary:', error);
        showError(getDetailedErrorMessage(error));
        displayEmptyState();
    } finally {
        refreshBtn.classList.remove('rotating');
    }
}

// Fetch with retry mechanism
async function fetchWithRetry(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const fetchOptions = { ...defaultOptions, ...options };

    while (retryCount < MAX_RETRIES) {
        try {
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("Response was not JSON");
            }

            return response;
        } catch (error) {
            retryCount++;
            if (retryCount === MAX_RETRIES) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            showError(`Attempt ${retryCount} of ${MAX_RETRIES} failed. Retrying...`);
        }
    }
}

// Get detailed error message
function getDetailedErrorMessage(error) {
    if (error.message.includes('Failed to fetch')) {
        return 'Network error: Please check your internet connection and try again.';
    } else if (error.message.includes('404')) {
        return 'Server error: The requested resource was not found. Please try again later.';
    } else if (error.message.includes('500')) {
        return 'Server error: The server encountered an error. Please try again later.';
    } else if (error.message.includes('JSON')) {
        return 'Data error: Invalid response from server. Please try again later.';
    } else {
        return `Error: ${error.message}. Please try again later.`;
    }
}

// Display empty state
function displayEmptyState() {
    const emptyStateHtml = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 20px;">
                <p>No attendance data available for this date.</p>
                <button onclick="retryLoad()" style="margin-top: 10px; padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Retry
                </button>
            </td>
        </tr>
    `;
    if (currentView === 'daily') {
        attendanceTableBody.innerHTML = emptyStateHtml;
    } else {
        summaryTableBody.innerHTML = emptyStateHtml;
    }
}

// Retry loading data
function retryLoad() {
    retryCount = 0;
    if (currentView === 'daily') {
        loadDailyAttendance(currentDate);
    } else {
        loadAttendanceSummary(startDateInput.value, endDateInput.value);
    }
}

// Show error message
function showError(message) {
    let errorElement = document.getElementById('error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            background-color: #ff4444;
            color: white;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            max-width: 400px;
            word-wrap: break-word;
        `;
        document.body.appendChild(errorElement);
    }

    errorElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.style.display='none'" 
                    style="background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">
                ×
            </button>
        </div>
    `;
    errorElement.style.display = 'block';

    // Hide error message after 5 seconds if it's not a critical error
    if (!message.includes('Network error') && !message.includes('Server error')) {
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// Add CSS for loading spinner and rotating animation
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .rotating {
        animation: rotate 1s linear infinite;
    }
    @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Display daily attendance data
function displayDailyAttendance(attendanceData, stats) {
    if (!attendanceTableBody) return;

    attendanceTableBody.innerHTML = '';
    let rowNumber = 1;

    attendanceData.forEach(record => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${rowNumber++}</td>
            <td>${record.studentId}</td>
            <td>${record.name}</td>
            <td>${record.company}</td>
            <td>${record.status}</td>
            <td>${formatTime(record.timeIn)}</td>
            <td>${formatTime(record.timeOut)}</td>
            <td>${record.duration}</td>
            <td>
                <button onclick="viewInternDetails('${record.studentId}', '${record.name}')" class="view-btn">
                    View Details
                </button>
                <button onclick="monitorInternProgress('${record.studentId}')" class="view-btn" style="background:#4a90e2; margin-left:4px;">Monitor Progress</button>
            </td>
        `;

        attendanceTableBody.appendChild(row);
    });

    updateDashboardStats(stats);
}

// Display attendance summary
function displayAttendanceSummary(summaryData) {
    if (!summaryTableBody) return;

    summaryTableBody.innerHTML = '';
    let rowNumber = 1;

    summaryData.forEach(record => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${rowNumber++}</td>
            <td>${record.studentId}</td>
            <td>${record.name}</td>
            <td>${record.company}</td>
            <td>${record.daysPresent}</td>
            <td>${record.hoursLogged}</td>
            <td>${record.attendanceRate}%</td>
            <td>${formatDateForDisplay(record.firstDay)}</td>
            <td>${formatDateForDisplay(record.lastDay)}</td>
            <td>
                <button onclick="viewInternDetails('${record.studentId}', '${record.name}')" class="view-btn">
                    View Details
                </button>
                <button onclick="monitorInternProgress('${record.studentId}')" class="view-btn" style="background:#4a90e2;">Monitor Progress</button>
            </td>
        `;

        summaryTableBody.appendChild(row);
    });
}

// Update dashboard statistics
function updateDashboardStats(stats) {
    if (presentCount) presentCount.textContent = stats.presentCount;
    if (absentCount) absentCount.textContent = stats.absentCount;
    if (avgHours) avgHours.textContent = stats.avgHours;
    if (attendanceRate) attendanceRate.textContent = `${stats.attendanceRate}%`;
}

// Search table
function searchTable() {
    const searchTerm = searchInput.value.toLowerCase();
    const tableBody = currentView === 'daily' ? attendanceTableBody : summaryTableBody;
    const rows = tableBody.getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Helper functions
function formatTime(timeString) {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateForDisplay(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
}

function getThisWeekDates() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(today.setDate(diff));
    const end = new Date(today.setDate(start.getDate() + 6));
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}

function getThisMonthDates() {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}

function monitorInternProgress(studentId) {
    window.location.href = `internship-report-view.html?internId=${studentId}`;
} 