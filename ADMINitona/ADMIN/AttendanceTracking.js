// Global variables
let API_URL = null; // Initialize as null, will be set by server discovery
let isInitialized = false;

// DOM Elements - declare variables first
let attendanceTableBody, summaryTableBody, attendanceDetailsBody, dateSelector,
    todayBtn, dailyViewBtn, summaryViewBtn, dailyView, summaryView,
    startDateInput, endDateInput, applyRangeBtn, thisWeekBtn, thisMonthBtn,
    searchInput, currentDateDisplay, detailsModal, internNameDisplay,
    studentIdDisplay, companyDisplay, internshipPeriodDisplay,
    daysPresentDisplay, totalHoursDisplay, avgHoursDisplay,
    detailsStartDate, detailsEndDate, applyDetailsFilter, exportAttendanceBtn,
    presentCount, absentCount, avgHours, attendanceRate, errorContainer;

// Current state
let currentDate = new Date().toISOString().split('T')[0];
let currentInternId = null;
let currentInternName = '';
let currentView = 'daily'; // 'daily' or 'summary'
let apiRetryCount = 0;
const MAX_RETRIES = 3;

// Test ports for server discovery
const TEST_PORTS = [50040, 5004, 5041, 5043, 50041, 50042, 50043, 3000];

// Check if server is available at given port
async function checkServerAvailability(port) {
    try {
        console.log(`Testing server availability on port ${port}...`);
        const testUrl = `http://localhost:${port}/api/status`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        
        const response = await fetch(testUrl, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        // Don't log abort errors as they are expected during discovery
        if (error.name !== 'AbortError') {
            console.log(`Port ${port} test failed:`, error.message);
        }
        return false;
    }
}

// Find available API server
async function getApiUrl() {
    const metaTag = document.querySelector('meta[name="api-url"]');
    if (metaTag && metaTag.content) {
        console.log('Using API URL from meta tag:', metaTag.content);
        return metaTag.content;
    }
    
    console.log('Meta tag URL not available, discovering server...');
    
    // Try each port in sequence
    for (const port of TEST_PORTS) {
        const isAvailable = await checkServerAvailability(port);
        if (isAvailable) {
            console.log(`Server found on port ${port}`);
            return `http://localhost:${port}/api/admin`;
        }
    }
    
    // Default fallback
    console.log('No server found, using default port 50040');
    return 'http://localhost:5004/api/admin';
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing attendance tracking page...');
    
    // Initialize DOM elements
    initializeElements();
    
    // Discover API URL
    try {
        API_URL = await getApiUrl();
        console.log('Using API URL:', API_URL);
        
        // Set current date in date selector
        if (dateSelector) {
            dateSelector.value = currentDate;
        }
        
        if (currentDateDisplay) {
            currentDateDisplay.textContent = formatDateForDisplay(currentDate);
        }
        
        // Initialize date range inputs to current month
        initializeDateRange();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial data
        loadDailyAttendance(currentDate);
        
        isInitialized = true;
    } catch (error) {
        console.error('Failed to initialize page:', error);
        showError('Failed to connect to the server. Please refresh and try again.');
    }
});

// Initialize DOM elements
function initializeElements() {
    attendanceTableBody = document.getElementById('attendanceTableBody');
    summaryTableBody = document.getElementById('summaryTableBody');
    attendanceDetailsBody = document.getElementById('attendanceDetailsBody');
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
    detailsModal = document.getElementById('detailsModal');
    internNameDisplay = document.getElementById('intern-name-display');
    studentIdDisplay = document.getElementById('student-id-display');
    companyDisplay = document.getElementById('company-display');
    internshipPeriodDisplay = document.getElementById('internship-period-display');
    daysPresentDisplay = document.getElementById('days-present-display');
    totalHoursDisplay = document.getElementById('total-hours-display');
    avgHoursDisplay = document.getElementById('avg-hours-display');
    detailsStartDate = document.getElementById('details-start-date');
    detailsEndDate = document.getElementById('details-end-date');
    applyDetailsFilter = document.getElementById('apply-details-filter');
    exportAttendanceBtn = document.getElementById('export-attendance-btn');
    presentCount = document.getElementById('present-count');
    absentCount = document.getElementById('absent-count');
    avgHours = document.getElementById('avg-hours');
    attendanceRate = document.getElementById('attendance-rate');
    
    // Log to help with debugging
    console.log('DOM elements initialized:', {
        attendanceTableBody: !!attendanceTableBody,
        dateSelector: !!dateSelector,
        todayBtn: !!todayBtn
    });
}

// Initialize date range inputs
function initializeDateRange() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (startDateInput) {
        startDateInput.value = firstDayOfMonth.toISOString().split('T')[0];
    }
    
    if (endDateInput) {
        endDateInput.value = today.toISOString().split('T')[0];
    }
    
    if (detailsStartDate) {
        detailsStartDate.value = firstDayOfMonth.toISOString().split('T')[0];
    }
    
    if (detailsEndDate) {
        detailsEndDate.value = today.toISOString().split('T')[0];
    }
}

// Setup all event listeners
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
        searchInput.addEventListener('input', () => {
            searchTable();
        });
    }
    
    // Details modal filter
    if (applyDetailsFilter) {
        applyDetailsFilter.addEventListener('click', () => {
            if (currentInternId) {
                loadInternAttendanceDetails(
                    currentInternId, 
                    detailsStartDate.value, 
                    detailsEndDate.value
                );
            }
        });
    }
    
    // Export button
    if (exportAttendanceBtn) {
        exportAttendanceBtn.addEventListener('click', () => {
            if (currentInternId) {
                exportAttendanceToCSV(currentInternId, currentInternName);
            }
        });
    }
}

// Set active view (daily or summary)
function setActiveView(view) {
    currentView = view;
    
    if (view === 'daily') {
        dailyViewBtn.classList.add('active');
        summaryViewBtn.classList.remove('active');
        dailyView.style.display = 'block';
        summaryView.style.display = 'none';
    } else {
        dailyViewBtn.classList.remove('active');
        summaryViewBtn.classList.add('active');
        dailyView.style.display = 'none';
        summaryView.style.display = 'block';
    }
}

// Get auth header for API requests
function getAuthHeader() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// API request helper with retry mechanism
async function fetchAPI(endpoint, method = 'GET', data = null) {
    // Check if API_URL is set
    if (!API_URL) {
        try {
            API_URL = await getApiUrl();
            console.log("Re-established API URL:", API_URL);
        } catch (error) {
            console.error("Failed to get API URL:", error);
            showError("Cannot connect to server. Please check your network connection.");
            return { success: false, error: "Cannot connect to server" };
        }
    }
    
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
        try {
            const fullUrl = `${API_URL}${endpoint}`;
            console.log(`Making ${method} request to: ${fullUrl} (attempt ${retries + 1})`);
            
            const options = {
                method,
                headers: getAuthHeader()
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            // Set timeout to avoid hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            options.signal = controller.signal;
            
            const response = await fetch(fullUrl, options);
            clearTimeout(timeoutId);
            
            console.log(`Response status:`, response.status);
            
            if (!response.ok) {
                // Try to get error details from response
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || `API request failed with status ${response.status}`;
                } catch (e) {
                    errorMessage = `API request failed with status ${response.status}`;
                }
                throw new Error(errorMessage);
            }
            
            // Try to parse JSON response
            try {
                const responseText = await response.text();
                console.log("Response text:", responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));
                
                const jsonData = responseText ? JSON.parse(responseText) : {};
                return jsonData;
            } catch (e) {
                console.error('Error parsing JSON response:', e);
                throw new Error('Invalid JSON response from server');
            }
        } catch (error) {
            console.error(`API Error (attempt ${retries + 1}):`, error);
            retries++;
            
            // If this is not the last retry, wait before trying again
            if (retries < MAX_RETRIES) {
                console.log(`Retrying in ${retries * 1000}ms...`);
                await new Promise(resolve => setTimeout(resolve, retries * 1000));
            } else {
                // Last retry failed, check if it's a network error
                if (error.name === 'AbortError') {
                    showError('Request timed out. Please check your network connection.');
                } else if (!navigator.onLine) {
                    showError('You appear to be offline. Please check your internet connection.');
                } else {
                    showError(`Error: ${error.message}`);
                }
                return { success: false, error: error.message };
            }
        }
    }
    
    // All retries failed
    return { success: false, error: "Maximum retry attempts exceeded" };
}

// Load daily attendance
async function loadDailyAttendance(date) {
    showLoading(attendanceTableBody);
    
    try {
        const response = await fetchAPI(`/attendance/date/${date}`);
        
        if (response.success) {
            displayDailyAttendance(response.data, response.stats);
            updateDashboardStats(response.stats);
        } else {
            // Show placeholders with error message
            showError('Failed to load attendance data');
            displayDailyAttendance([], {
                totalInterns: 0,
                presentCount: 0,
                absentCount: 0,
                attendanceRate: '0%'
            });
        }
    } catch (error) {
        console.error('Error loading daily attendance:', error);
        showError('Error loading attendance data');
        displayDailyAttendance([], {
            totalInterns: 0,
            presentCount: 0,
            absentCount: 0,
            attendanceRate: '0%'
        });
    }
}

// Display daily attendance
function displayDailyAttendance(attendanceData, stats) {
    if (!attendanceTableBody) return;
    
    attendanceTableBody.innerHTML = '';
    
    if (!attendanceData || attendanceData.length === 0) {
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center;">No attendance records found for this date</td>
            </tr>
        `;
        return;
    }
    
    attendanceData.forEach((record, index) => {
        const row = document.createElement('tr');
        
        const statusBadgeClass = record.attendance_status === 'Present' 
            ? 'status-present' 
            : 'status-absent';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${record.student_id || 'N/A'}</td>
            <td>${record.first_name} ${record.last_name}</td>
            <td>${record.company_name}</td>
            <td><span class="status-badge ${statusBadgeClass}">${record.attendance_status}</span></td>
            <td>${record.time_in ? formatTime(record.time_in) : 'N/A'}</td>
            <td>${record.time_out ? formatTime(record.time_out) : 'N/A'}</td>
            <td>${record.duration ? `${record.duration} hrs` : 'N/A'}</td>
            <td class="actions">
                <button onclick="viewInternDetails(${record.intern_id}, '${record.first_name} ${record.last_name}')">
                    View Details
                </button>
            </td>
        `;
        
        attendanceTableBody.appendChild(row);
    });
}

// Load attendance summary
async function loadAttendanceSummary(startDate = null, endDate = null) {
    showLoading(summaryTableBody);
    
    try {
        let endpoint = '/attendance/summary';
        if (startDate && endDate) {
            endpoint += `?startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await fetchAPI(endpoint);
        
        if (response.success) {
            displayAttendanceSummary(response.data);
        } else {
            showError('Failed to load attendance summary');
        }
    } catch (error) {
        console.error('Error loading attendance summary:', error);
        showError('Error loading attendance summary');
    }
}

// Display attendance summary
function displayAttendanceSummary(summaryData) {
    if (!summaryTableBody) return;
    
    summaryTableBody.innerHTML = '';
    
    if (!summaryData || summaryData.length === 0) {
        summaryTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center;">No attendance records found for this period</td>
            </tr>
        `;
        return;
    }
    
    summaryData.forEach((record, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${record.student_id || 'N/A'}</td>
            <td>${record.first_name} ${record.last_name}</td>
            <td>${record.company_name}</td>
            <td>${record.days_present}</td>
            <td>${record.total_hours ? record.total_hours : 0} hrs</td>
            <td>${record.attendance_rate || '0%'}</td>
            <td>${record.first_attendance ? formatDateForDisplay(record.first_attendance) : 'N/A'}</td>
            <td>${record.last_attendance ? formatDateForDisplay(record.last_attendance) : 'N/A'}</td>
            <td class="actions">
                <button onclick="viewInternDetails(${record.intern_id}, '${record.first_name} ${record.last_name}')">
                    View Details
                </button>
            </td>
        `;
        
        summaryTableBody.appendChild(row);
    });
}

// View intern attendance details
window.viewInternDetails = function(internId, internName) {
    currentInternId = internId;
    currentInternName = internName;
    
    // Set intern name in modal
    if (internNameDisplay) {
        internNameDisplay.textContent = internName;
    }
    
    // Load intern attendance details
    loadInternAttendanceDetails(internId);
    
    // Show modal
    if (detailsModal) {
        detailsModal.style.display = 'flex';
    }
};

// Load intern attendance details
async function loadInternAttendanceDetails(internId, startDate = null, endDate = null) {
    showLoading(attendanceDetailsBody);
    
    try {
        let endpoint = `/attendance/intern/${internId}`;
        if (startDate && endDate) {
            endpoint += `?startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await fetchAPI(endpoint);
        
        if (response.success) {
            displayInternDetails(response.data);
        } else {
            showError('Failed to load intern details');
        }
    } catch (error) {
        console.error('Error loading intern details:', error);
        showError('Error loading intern details');
    }
}

// Display intern details
function displayInternDetails(data) {
    if (!data || !data.attendance) return;
    
    const attendance = data.attendance;
    const stats = data.stats;
    
    // Update stats in modal
    daysPresentDisplay.textContent = stats.daysPresent || 0;
    totalHoursDisplay.textContent = stats.totalHours || 0;
    avgHoursDisplay.textContent = stats.averageHoursPerDay || 0;
    
    // Get the first record to set student info
    if (attendance.length > 0) {
        const firstRecord = attendance[0];
        studentIdDisplay.textContent = firstRecord.student_id || 'N/A';
        companyDisplay.textContent = firstRecord.company_name || 'N/A';
        
        if (firstRecord.internship_start && firstRecord.internship_end) {
            internshipPeriodDisplay.textContent = `${formatDateForDisplay(firstRecord.internship_start)} - ${formatDateForDisplay(firstRecord.internship_end)}`;
        } else {
            internshipPeriodDisplay.textContent = 'N/A';
        }
    }
    
    // Display attendance records
    attendanceDetailsBody.innerHTML = '';
    
    if (attendance.length === 0) {
        attendanceDetailsBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">No attendance records found for this intern</td>
            </tr>
        `;
        return;
    }
    
    attendance.forEach(record => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDateForDisplay(record.date)}</td>
            <td>${record.time_in ? formatTime(record.time_in) : 'N/A'}</td>
            <td>${record.time_out ? formatTime(record.time_out) : 'N/A'}</td>
            <td>${record.duration ? `${record.duration} hrs` : 'N/A'}</td>
            <td>${record.remarks || 'N/A'}</td>
        `;
        
        attendanceDetailsBody.appendChild(row);
    });
}

// Close details modal
window.closeDetailsModal = function() {
    if (detailsModal) {
        detailsModal.style.display = 'none';
    }
};

// Export attendance data to CSV
function exportAttendanceToCSV(internId, internName) {
    const startDate = detailsStartDate.value;
    const endDate = detailsEndDate.value;
    
    // Get attendance records from the table
    const rows = [...attendanceDetailsBody.querySelectorAll('tr')];
    
    if (rows.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Create CSV header
    let csv = 'Date,Time In,Time Out,Duration (hrs),Remarks\n';
    
    // Add rows
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
            const rowData = [
                cells[0].textContent,
                cells[1].textContent,
                cells[2].textContent,
                cells[3].textContent,
                cells[4].textContent
            ].map(text => `"${text.replace(/"/g, '""')}"`);
            
            csv += rowData.join(',') + '\n';
        }
    });
    
    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${internName.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Update dashboard stats
function updateDashboardStats(stats) {
    if (!stats) return;
    
    presentCount.textContent = stats.presentCount || 0;
    absentCount.textContent = stats.absentCount || 0;
    avgHours.textContent = stats.averageHoursPerDay || 0;
    attendanceRate.textContent = stats.attendanceRate || '0%';
}

// Search function
function searchTable() {
    const searchTerm = searchInput.value.toLowerCase();
    const tableBody = currentView === 'daily' ? attendanceTableBody : summaryTableBody;
    const rows = tableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Format time (from ISO string or time string)
function formatTime(timeString) {
    try {
        // If it's a full ISO date-time string
        if (timeString.includes('T')) {
            const date = new Date(timeString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // If it's just a time string (HH:MM:SS)
        const timeParts = timeString.split(':');
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        
        return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
        console.error('Error formatting time:', e);
        return timeString; // Return the original string if parsing fails
    }
}

// Format date for display (YYYY-MM-DD to readable format)
function formatDateForDisplay(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString;
    }
}

// Get this week's date range
function getThisWeekDates() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    
    const endDate = new Date(now);
    if (dayOfWeek === 0) {
        // If today is Sunday, end date is today
        endDate.setDate(now.getDate());
    } else {
        // Otherwise, end date is next Friday
        endDate.setDate(startDate.getDate() + 4);
    }
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

// Get this month's date range
function getThisMonthDates() {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

// Show loading state
function showLoading(element) {
    if (!element) return;
    
    element.innerHTML = `
        <tr>
            <td colspan="10" style="text-align: center; padding: 20px;">
                <div class="loading">
                    <i class="fas fa-circle-notch fa-spin" style="font-size: 24px; color: #140B5D;"></i>
                    <span style="margin-left: 10px;">Loading data...</span>
                </div>
            </td>
        </tr>
    `;
}

// Handle errors gracefully
function showError(message) {
    console.error("Error:", message);
    
    // Create error notification if it doesn't exist
    if (!document.querySelector('.error-notification')) {
        const errorNotification = document.createElement('div');
        errorNotification.className = 'error-notification';
        errorNotification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span class="error-message">${message}</span>
            <button class="close-error" onclick="this.parentElement.remove()">&times;</button>
        `;
        document.body.appendChild(errorNotification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorNotification.parentElement) {
                errorNotification.remove();
            }
        }, 5000);
    } else {
        // Update existing error
        document.querySelector('.error-notification .error-message').textContent = message;
    }
}

// Toggle dropdown menu
window.toggleDropdown = function() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    if (dropdownMenu) {
        dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
    }
}; 