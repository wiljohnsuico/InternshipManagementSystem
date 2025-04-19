// DOM Elements
const currentTimeElement = document.getElementById('current-time');
const currentDateElement = document.getElementById('current-date');
const timeInBtn = document.getElementById('time-in-btn');
const timeOutBtn = document.getElementById('time-out-btn');
const attendanceTableBody = document.querySelector('#attendance-table tbody');
const accomplishmentTableBody = document.querySelector('#accomplishment-table tbody');
const newEntryBtn = document.getElementById('new-entry-btn');
const entryForm = document.getElementById('entry-form');
const addEntryBtn = document.getElementById('add-entry-btn');
const cancelEntryBtn = document.getElementById('cancel-entry-btn');
const accomplishmentInput = document.getElementById('accomplishment-input');
const downloadReportBtn = document.getElementById('download-report-btn');

// API endpoints
const API_BASE_URL = 'http://localhost:5004/api';
const ATTENDANCE_ENDPOINT = `${API_BASE_URL}/accomplishments/attendance`;
const ACCOMPLISHMENT_ENDPOINT = `${API_BASE_URL}/accomplishments/daily`;
const GET_ATTENDANCE_ENDPOINT = `${API_BASE_URL}/accomplishments/attendance/intern`;
const GET_ACCOMPLISHMENT_ENDPOINT = `${API_BASE_URL}/accomplishments/intern`;
const INTERNSHIPS_ENDPOINT = `${API_BASE_URL}/internships`;
const ACTIVE_INTERNSHIP_ENDPOINT = `${API_BASE_URL}/internships/active`;

// Internship status
let hasActiveInternship = false;

// User authentication and token
function getAuthToken() {
    return localStorage.getItem('token');
}

function getUserId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.user_id : null;
}

// API helper function
async function fetchAPI(url, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Check if user has an active internship
async function checkActiveInternship() {
    try {
        // Make a proper API call to check for active internships
        const today = formatDate();
        const result = await fetchAPI(`${ACTIVE_INTERNSHIP_ENDPOINT}?date=${today}`);
        
        hasActiveInternship = result && 
                           result.success && 
                           result.data && 
                           result.data.length > 0;
        
        if (!hasActiveInternship) {
            console.log('No active internship found for today');
            showInternshipWarning();
            disableTimeTracking();
        } else {
            console.log('Active internship found:', result.data);
        }
        
        return hasActiveInternship;
    } catch (error) {
        console.error('Failed to check internship status:', error);
        showInternshipWarning();
        disableTimeTracking();
        return false;
    }
}

// Show warning about no active internship
function showInternshipWarning() {
    // Add a warning banner at the top of the container
    const container = document.querySelector('.container');
    const warningBanner = document.createElement('div');
    warningBanner.className = 'warning-banner';
    warningBanner.innerHTML = `
        <p><strong>No active internship found!</strong> You need an approved internship placement before you can record attendance or accomplishments.</p>
        <p>Please contact your faculty advisor or check your internship application status.</p>
        <button id="show-guide-btn" class="btn-light">How to get an approved internship</button>
    `;
    
    // Add the warning banner at the beginning of the container
    container.insertBefore(warningBanner, container.firstChild);
    
    // Add event listener to the guide button
    document.getElementById('show-guide-btn').addEventListener('click', showInternshipGuide);
    
    // Also show a notification
    showNotification('You need an active internship to use this feature', 'warning');
    
    // Add CSS for warning banner
    if (!document.getElementById('warning-banner-style')) {
        const style = document.createElement('style');
        style.id = 'warning-banner-style';
        style.textContent = `
            .warning-banner {
                background-color: #fff3cd;
                color: #856404;
                padding: 12px 20px;
                border-radius: 4px;
                margin-bottom: 20px;
                border-left: 4px solid #ffc107;
            }
            .warning-banner p {
                margin: 5px 0;
            }
        `;
        document.head.appendChild(style);
    }
}

// Show guide about getting an approved internship
function showInternshipGuide() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    // Create modal content
    modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h3>How to Get an Approved Internship</h3>
            <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <ol>
                <li><strong>Browse Available Internships:</strong> Go to the "Internships" section to see available opportunities.</li>
                <li><strong>Submit an Application:</strong> Apply for internships that match your skills and interests.</li>
                <li><strong>Wait for Approval:</strong> Your application will be reviewed by the employer and faculty advisor.</li>
                <li><strong>Start Internship:</strong> Once approved, you can begin recording attendance and accomplishments during your internship period.</li>
            </ol>
            <p>For more assistance, please contact your faculty advisor or the internship coordinator.</p>
            <div class="text-center">
                <a href="mplhome.html" class="btn-primary">Go to Home Page</a>
            </div>
        </div>
    </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Add CSS for modal
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background-color: white;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            .modal-header {
                padding: 15px 20px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-header h3 {
                margin: 0;
                color: var(--primary-color);
            }
            .modal-body {
                padding: 20px;
            }
            .close-modal {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #888;
            }
            .close-modal:hover {
                color: #333;
            }
            .text-center {
                text-align: center;
                margin-top: 20px;
            }
            .modal-body ol {
                padding-left: 20px;
            }
            .modal-body li {
                margin-bottom: 10px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Handle close button
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    // Close when clicking outside the modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Disable time tracking functions
function disableTimeTracking() {
    timeInBtn.disabled = true;
    timeOutBtn.disabled = true;
    newEntryBtn.disabled = true;
    
    // Add title to explain why buttons are disabled
    timeInBtn.title = 'No active internship found';
    timeOutBtn.title = 'No active internship found';
    newEntryBtn.title = 'No active internship found';
}

// Initialize date and time display
function initializeDateTimeDisplay() {
    // Set current date in format: Month Day, Year | Day of Week
    updateDateDisplay();
    
    // Initialize time display with immediate update
    updateTimeDisplay();
    
    // Update time every second
    setInterval(updateTimeDisplay, 1000);
    
    // Update date at midnight
    setInterval(updateDateDisplay, 60000); // Check every minute if date needs updating
}

// Update date display
function updateDateDisplay() {
    const now = new Date();
    const options = { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric', 
        weekday: 'long' 
    };
    const dateString = now.toLocaleDateString('en-US', options);
    currentDateElement.textContent = dateString;
}

// Update time display
function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
    });
    currentTimeElement.textContent = timeString;
}

// Format date for storage
function formatDate(date = new Date()) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Format date for display
function formatDateDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

// Check today's attendance status
async function checkTodayStatus() {
    if (!hasActiveInternship) {
        timeInBtn.disabled = true;
        timeOutBtn.disabled = true;
        return;
    }
    
    try {
        // Fetch attendance records
        const result = await fetchAPI(GET_ATTENDANCE_ENDPOINT);
        const attendanceRecords = result.data || [];
        
        // Find today's record
        const today = formatDate();
        const todayRecord = attendanceRecords.find(record => record.date.includes(today));
        
        if (todayRecord) {
            timeInBtn.disabled = !!todayRecord.time_in;
            timeOutBtn.disabled = !todayRecord.time_in || !!todayRecord.time_out;
        } else {
            timeInBtn.disabled = false;
            timeOutBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error checking today\'s status:', error);
        // If API call fails, don't disable buttons so user can try again
        showNotification('Could not check attendance status', 'error');
    }
}

// Show loading state on buttons
function setButtonLoading(button, isLoading, originalText) {
    if (isLoading) {
        button.disabled = true;
        const loadingSpinner = document.createElement('span');
        loadingSpinner.className = 'loading-spinner';
        button.prepend(loadingSpinner);
        button.setAttribute('data-original-text', button.textContent);
        button.textContent = ' Loading...';
        button.prepend(loadingSpinner);
    } else {
        button.disabled = false;
        button.textContent = originalText || button.getAttribute('data-original-text');
    }
}

// Time In Function
async function handleTimeIn() {
    if (!hasActiveInternship) {
        showNotification('You need an active internship to record attendance', 'warning');
        return;
    }
    
    // Show loading state
    setButtonLoading(timeInBtn, true);
    
    const today = formatDate();
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US');
    
    try {
        // Submit time in to API
        await fetchAPI(ATTENDANCE_ENDPOINT, 'POST', {
            date: today,
            time_in: now.toISOString(),
            remarks: 'Submitted via webapp'
        });
        
        // Update UI
        timeInBtn.disabled = true;
        timeOutBtn.disabled = false;
        
        // Reset button text
        setButtonLoading(timeInBtn, false, 'Time In');
        
        // Refresh attendance table
        await renderAttendanceLogs();
        
        showNotification('Time in recorded successfully!', 'success');
    } catch (error) {
        // Reset button state
        setButtonLoading(timeInBtn, false, 'Time In');
        handleApiError(error, 'time in');
    }
}

// Time Out Function
async function handleTimeOut() {
    if (!hasActiveInternship) {
        showNotification('You need an active internship to record attendance', 'warning');
        return;
    }
    
    // Show loading state
    setButtonLoading(timeOutBtn, true);
    
    const today = formatDate();
    const now = new Date();
    
    try {
        // Get today's attendance record first
        const result = await fetchAPI(GET_ATTENDANCE_ENDPOINT);
        const attendanceRecords = result.data || [];
        const todayRecord = attendanceRecords.find(record => record.date.includes(today));
        
        if (!todayRecord) {
            throw new Error('No time-in record found for today');
        }
        
        // Submit time out update to API
        await fetchAPI(ATTENDANCE_ENDPOINT, 'POST', {
            date: today,
            time_in: todayRecord.time_in, // Send existing time_in
            time_out: now.toISOString(),
            remarks: todayRecord.remarks || 'Submitted via webapp'
        });
        
        // Update UI
        timeOutBtn.disabled = true;
        
        // Reset button text
        setButtonLoading(timeOutBtn, false, 'Time Out');
        
        // Refresh attendance table
        await renderAttendanceLogs();
        
        showNotification('Time out recorded successfully!', 'success');
    } catch (error) {
        // Reset button state
        setButtonLoading(timeOutBtn, false, 'Time Out');
        handleApiError(error, 'time out');
    }
}

// Handle API errors
function handleApiError(error, action) {
    console.error(`Error recording ${action}:`, error);
    
    // Check for specific error messages
    if (error.message && error.message.includes('No active internship found')) {
        showNotification(`No active internship found for today. Please check your internship status.`, 'warning');
        
        // Update the global flag and UI
        hasActiveInternship = false;
        disableTimeTracking();
        
        // If we haven't already shown the warning banner, show it now
        if (!document.querySelector('.warning-banner')) {
            showInternshipWarning();
        }
    } else {
        showNotification(`Failed to record ${action}. ${error.message || 'Please try again.'}`, 'error');
    }
}

// Render Attendance Logs
async function renderAttendanceLogs() {
    try {
        // Fetch attendance records from API
        const result = await fetchAPI(GET_ATTENDANCE_ENDPOINT);
        const logs = result.data || [];
        
        attendanceTableBody.innerHTML = '';
        
        if (logs.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="text-center">No attendance records found</td>';
            attendanceTableBody.appendChild(row);
            return;
        }
        
        logs.forEach((log, index) => {
            const row = document.createElement('tr');
            const details = log.time_in ? 
                `Time In: ${formatTime(new Date(log.time_in))}${log.time_out ? ` | Time Out: ${formatTime(new Date(log.time_out))}` : ''}` : 
                'No attendance data';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDateDisplay(log.date)}</td>
                <td>${details}</td>
                <td class="approval-status">${log.approved ? 'Approved' : 'Pending'}</td>
            `;
            attendanceTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching attendance logs:', error);
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Error loading attendance records. Please try again.</td>
            </tr>
        `;
    }
}

// Format time for display
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
}

// Toggle New Entry Form
function toggleEntryForm() {
    if (!hasActiveInternship) {
        showNotification('You need an active internship to add accomplishments', 'warning');
        return;
    }
    
    entryForm.classList.toggle('hidden');
    accomplishmentInput.value = ''; // Clear any previous input
}

// Add New Accomplishment
async function addAccomplishment() {
    if (!hasActiveInternship) {
        showNotification('You need an active internship to add accomplishments', 'warning');
        return;
    }
    
    const text = accomplishmentInput.value.trim();
    
    if (!text) {
        showNotification('Please enter your accomplishment details', 'error');
        return;
    }
    
    // Show loading state
    setButtonLoading(addEntryBtn, true);
    
    const today = formatDate();
    
    try {
        // Submit accomplishment to API
        await fetchAPI(ACCOMPLISHMENT_ENDPOINT, 'POST', {
            date: today,
            task_completed: text,
            challenges_faced: 'None specified',
            skills_applied: 'None specified'
        });
        
        // Reset button
        setButtonLoading(addEntryBtn, false, 'Save');
        
        // Hide form and refresh list
        toggleEntryForm();
        await renderAccomplishments();
        
        showNotification('Accomplishment added successfully!', 'success');
    } catch (error) {
        // Reset button
        setButtonLoading(addEntryBtn, false, 'Save');
        handleApiError(error, 'accomplishment');
    }
}

// Render Accomplishments
async function renderAccomplishments() {
    try {
        // Fetch accomplishments from API
        const result = await fetchAPI(GET_ACCOMPLISHMENT_ENDPOINT);
        const accomplishments = result.data || [];
        
        accomplishmentTableBody.innerHTML = '';
        
        if (accomplishments.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="text-center">No accomplishment records found</td>';
            accomplishmentTableBody.appendChild(row);
            return;
        }
        
        accomplishments.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDateDisplay(item.date)}</td>
                <td>${item.task_completed}</td>
                <td class="approval-status">${item.approved ? 'Approved' : 'Pending'}</td>
            `;
            accomplishmentTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching accomplishments:', error);
        accomplishmentTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">Error loading accomplishment records. Please try again.</td>
            </tr>
        `;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Check if notification container exists
    let container = document.querySelector('.notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        
        // Add CSS for notifications if not already present
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .notification {
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    color: white;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                    opacity: 0;
                    transform: translateY(-10px);
                }
                .notification.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                .notification.info {
                    background-color: #2196F3;
                }
                .notification.success {
                    background-color: #4CAF50;
                }
                .notification.error {
                    background-color: #F44336;
                }
                .notification.warning {
                    background-color: #FF9800;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    container.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Generate PDF report
async function generatePDFReport() {
    try {
        // Show loading state
        setButtonLoading(downloadReportBtn, true);
        
        // Fetch data for the report
        const attendanceData = await fetchAPI(GET_ATTENDANCE_ENDPOINT);
        const accomplishmentData = await fetchAPI(GET_ACCOMPLISHMENT_ENDPOINT);
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');

        // Create report content
        const reportContent = {
            attendance: attendanceData.data || [],
            accomplishments: accomplishmentData.data || [],
            user: {
                name: `${userData.first_name || ''} ${userData.last_name || ''}`,
                email: userData.email || '',
                course: userData.course || ''
            },
            generatedDate: new Date().toISOString()
        };

        // Send to backend to generate PDF
        const response = await fetchAPI(`${API_BASE_URL}/accomplishments/report`, 'POST', reportContent);
        
        // Reset button state
        setButtonLoading(downloadReportBtn, false, 'Download Report');
        
        if (response.success && response.pdfUrl) {
            // Create hidden link to download the file
            const link = document.createElement('a');
            link.href = response.pdfUrl;
            link.download = `internship_report_${formatDate()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Report downloaded successfully!', 'success');
        } else {
            // If the backend returns a blob directly
            showNotification('Report generated! Check your downloads folder.', 'success');
        }
    } catch (error) {
        setButtonLoading(downloadReportBtn, false, 'Download Report');
        console.error('Error generating report:', error);
        showNotification('Failed to generate report. Please try again.', 'error');
    }
}

// Client-side PDF generation as fallback
function generateClientSidePDF() {
    try {
        setButtonLoading(downloadReportBtn, true);
        
        // Create the report HTML structure from scratch for better formatting
        const reportDiv = document.createElement('div');
        reportDiv.className = 'pdf-report';
        
        // Get user data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const userName = userData.first_name && userData.last_name ? 
            `${userData.first_name} ${userData.last_name}` : 'User';
        
        // Add header
        reportDiv.innerHTML = `
            <div class="pdf-header">
                <h1>Internship Progress Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
                <p>Intern: ${userName}</p>
                <hr>
            </div>
        `;
        
        // Add attendance section
        const attendanceSection = document.createElement('div');
        attendanceSection.className = 'pdf-section';
        attendanceSection.innerHTML = `
            <h2>Attendance Records</h2>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Date</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        `;
        
        // Get attendance data
        const attendanceRows = [];
        document.querySelectorAll('#attendance-table tbody tr').forEach((row, index) => {
            if (!row.textContent.includes('No attendance records found') &&
                !row.textContent.includes('Error loading')) {
                
                const columns = row.querySelectorAll('td');
                
                // Extract time in/out from details column
                let timeIn = '';
                let timeOut = '';
                let details = columns[2] ? columns[2].textContent : '';
                
                if (details.includes('Time In:')) {
                    timeIn = details.split('Time In:')[1].split('|')[0].trim();
                    if (details.includes('Time Out:')) {
                        timeOut = details.split('Time Out:')[1].trim();
                    }
                }
                
                // Calculate duration if both times exist
                let duration = '-';
                if (timeIn && timeOut) {
                    // Simple duration calculation for display
                    const timeInParts = timeIn.split(':');
                    const timeOutParts = timeOut.split(':');
                    
                    if (timeInParts.length >= 2 && timeOutParts.length >= 2) {
                        const inHour = parseInt(timeInParts[0]);
                        const inMin = parseInt(timeInParts[1]);
                        const outHour = parseInt(timeOutParts[0]);
                        const outMin = parseInt(timeOutParts[1]);
                        
                        // Very basic calculation, doesn't handle AM/PM or days
                        const durationHours = outHour - inHour;
                        const durationMins = outMin - inMin;
                        duration = `${durationHours}h ${durationMins}m`;
                    }
                }
                
                attendanceRows.push(`
                    <tr>
                        <td>${index + 1}</td>
                        <td>${columns[1] ? columns[1].textContent : ''}</td>
                        <td>${timeIn}</td>
                        <td>${timeOut}</td>
                        <td>${duration}</td>
                    </tr>
                `);
            }
        });
        
        if (attendanceRows.length === 0) {
            attendanceRows.push(`
                <tr>
                    <td colspan="5" style="text-align: center;">No attendance records found</td>
                </tr>
            `);
        }
        
        attendanceSection.querySelector('tbody').innerHTML = attendanceRows.join('');
        reportDiv.appendChild(attendanceSection);
        
        // Add accomplishments section
        const accomplishmentSection = document.createElement('div');
        accomplishmentSection.className = 'pdf-section';
        accomplishmentSection.innerHTML = `
            <h2>Accomplishment Records</h2>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Date</th>
                        <th>Accomplishment</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        `;
        
        // Get accomplishment data
        const accomplishmentRows = [];
        document.querySelectorAll('#accomplishment-table tbody tr').forEach((row, index) => {
            if (!row.textContent.includes('No accomplishment records found') &&
                !row.textContent.includes('Error loading')) {
                
                const columns = row.querySelectorAll('td');
                accomplishmentRows.push(`
                    <tr>
                        <td>${index + 1}</td>
                        <td>${columns[1] ? columns[1].textContent : ''}</td>
                        <td>${columns[2] ? columns[2].textContent : ''}</td>
                    </tr>
                `);
            }
        });
        
        if (accomplishmentRows.length === 0) {
            accomplishmentRows.push(`
                <tr>
                    <td colspan="3" style="text-align: center;">No accomplishment records found</td>
                </tr>
            `);
        }
        
        accomplishmentSection.querySelector('tbody').innerHTML = accomplishmentRows.join('');
        reportDiv.appendChild(accomplishmentSection);
        
        // Add footer
        reportDiv.innerHTML += `
            <div class="pdf-footer">
                <p>This is an automatically generated report.</p>
                <p>© ${new Date().getFullYear()} Internship Management System</p>
            </div>
        `;
        
        // Add CSS for PDF report
        const style = document.createElement('style');
        style.textContent = `
            .pdf-report {
                font-family: Arial, sans-serif;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .pdf-header {
                text-align: center;
                margin-bottom: 30px;
            }
            .pdf-header h1 {
                color: #1a73e8;
                margin-bottom: 10px;
            }
            .pdf-header p {
                margin: 5px 0;
                color: #666;
            }
            .pdf-section {
                margin-bottom: 30px;
            }
            .pdf-section h2 {
                color: #1a73e8;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
                margin-bottom: 15px;
            }
            .pdf-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .pdf-table th, .pdf-table td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
            .pdf-table th {
                background-color: #f5f5f5;
                font-weight: bold;
            }
            .pdf-footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 10px;
            }
        `;
        reportDiv.appendChild(style);
        
        // Configure PDF options
        const options = {
            margin: 10,
            filename: `internship_report_${formatDate()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Generate PDF
        html2pdf().from(reportDiv).set(options).save().then(() => {
            setButtonLoading(downloadReportBtn, false, 'Download Report');
            showNotification('Report downloaded successfully!', 'success');
        }).catch(err => {
            console.error('Error generating PDF:', err);
            setButtonLoading(downloadReportBtn, false, 'Download Report');
            showNotification('Failed to generate PDF. Please try again.', 'error');
        });
    } catch (error) {
        console.error('Error generating client-side PDF:', error);
        setButtonLoading(downloadReportBtn, false, 'Download Report');
        showNotification('Failed to generate report. Please try again.', 'error');
    }
}

// Initialize protections
document.addEventListener('DOMContentLoaded', async () => {
    // Protect page - redirect if not logged in
    if (!getAuthToken() || !getUserId()) {
        window.location.href = '/student/mpl-login.html';
        return;
    }
    
    // Initialize the date and time display
    initializeDateTimeDisplay();
    
    // Check for active internship first
    await checkActiveInternship();
    
    // Load attendance and accomplishment data
    await renderAttendanceLogs();
    await renderAccomplishments();
    
    // Update button states based on today's attendance
    if (hasActiveInternship) {
        await checkTodayStatus();
    } else {
        disableTimeTracking();
    }
    
    // Event listeners
    timeInBtn.addEventListener('click', handleTimeIn);
    timeOutBtn.addEventListener('click', handleTimeOut);
    newEntryBtn.addEventListener('click', toggleEntryForm);
    addEntryBtn.addEventListener('click', addAccomplishment);
    cancelEntryBtn.addEventListener('click', toggleEntryForm);
    
    // Add download button if not present in the HTML
    if (!downloadReportBtn) {
        const container = document.querySelector('.container');
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'download-report-btn';
        downloadBtn.className = 'btn-primary';
        downloadBtn.style.marginLeft = '10px';
        downloadBtn.textContent = 'Download Report';
        
        // Find the new entry button and add download button next to it
        const newEntryBtnParent = newEntryBtn.parentNode;
        newEntryBtnParent.appendChild(downloadBtn);
        
        // Set the global reference
        window.downloadReportBtn = downloadBtn;
    }
    
    // Add event listener for download button
    (downloadReportBtn || window.downloadReportBtn).addEventListener('click', generateClientSidePDF);
});
