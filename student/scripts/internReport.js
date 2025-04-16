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
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const downloadCsvBtn = document.getElementById('download-csv-btn');

// IndexedDB Setup
const dbName = "InternshipDB";
const logsStore = "DailyLogs";
const accomplishmentsStore = "Accomplishments";
let db;

// Open IndexedDB
function openDB() {
    const request = indexedDB.open(dbName, 2);

    request.onupgradeneeded = (event) => {
        db = event.target.result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(logsStore)) {
            const logStore = db.createObjectStore(logsStore, { keyPath: "date" });
            logStore.createIndex("dateIndex", "date", { unique: true });
        }

        if (!db.objectStoreNames.contains(accomplishmentsStore)) {
            const accomplishmentStore = db.createObjectStore(accomplishmentsStore, { keyPath: "id", autoIncrement: true });
            accomplishmentStore.createIndex("dateIndex", "date", { unique: false });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        renderAttendanceLogs();
        renderAccomplishments();
        checkTodayStatus();
    };

    request.onerror = (event) => {
        console.error("Failed to open IndexedDB:", event.target.error);
    };
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
function checkTodayStatus() {
    const today = formatDate();
    
    const transaction = db.transaction(logsStore, "readonly");
    const store = transaction.objectStore(logsStore);
    const request = store.get(today);
    
    request.onsuccess = (event) => {
        const log = event.target.result;
        
        if (log) {
            timeInBtn.disabled = !!log.timeIn;
            timeOutBtn.disabled = !log.timeIn || !!log.timeOut;
        } else {
            timeInBtn.disabled = false;
            timeOutBtn.disabled = true;
        }
    };
}

// Time In Function
function handleTimeIn() {
    const today = formatDate();
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
    });
    
    const transaction = db.transaction(logsStore, "readwrite");
    const store = transaction.objectStore(logsStore);
    
    // Check if entry exists
    const getRequest = store.get(today);
    
    getRequest.onsuccess = (event) => {
        const log = event.target.result || { date: today };
        log.timeIn = timeString;
        
        // Save the updated log
        store.put(log);
        
        // Update UI
        timeInBtn.disabled = true;
        timeOutBtn.disabled = false;
        
        // Refresh the log table
        transaction.oncomplete = () => {
            renderAttendanceLogs();
        };
    };
}

// Time Out Function
function handleTimeOut() {
    const today = formatDate();
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
    });
    
    const transaction = db.transaction(logsStore, "readwrite");
    const store = transaction.objectStore(logsStore);
    
    // Get today's log
    const getRequest = store.get(today);
    
    getRequest.onsuccess = (event) => {
        const log = event.target.result;
        
        if (log && log.timeIn) {
            log.timeOut = timeString;
            store.put(log);
            
            // Update UI
            timeOutBtn.disabled = true;
            
            // Refresh the log table
            transaction.oncomplete = () => {
                renderAttendanceLogs();
            };
        }
    };
}

// Render Attendance Logs
function renderAttendanceLogs() {
    const transaction = db.transaction(logsStore, "readonly");
    const store = transaction.objectStore(logsStore);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
        const logs = event.target.result;
        attendanceTableBody.innerHTML = '';
        
        logs.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
        
        logs.forEach((log, index) => {
            const row = document.createElement('tr');
            const details = log.timeIn ? 
                `Time In: ${log.timeIn}${log.timeOut ? ` | Time Out: ${log.timeOut}` : ''}` : 
                'No attendance data';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDateDisplay(log.date)}</td>
                <td>${details}</td>
                <td class="approval-status">Pending</td>
            `;
            attendanceTableBody.appendChild(row);
        });
    };
}

// Toggle New Entry Form
function toggleEntryForm() {
    entryForm.classList.toggle('hidden');
    accomplishmentInput.value = ''; // Clear any previous input
}

// Add New Accomplishment
function addAccomplishment() {
    const text = accomplishmentInput.value.trim();
    
    if (!text) {
        alert('Please enter your accomplishment details');
        return;
    }
    
    const today = formatDate();
    const accomplishment = {
        date: today,
        details: text,
        approved: false,
        createdAt: new Date().toISOString()
    };
    
    const transaction = db.transaction(accomplishmentsStore, "readwrite");
    const store = transaction.objectStore(accomplishmentsStore);
    
    store.add(accomplishment);
    
    transaction.oncomplete = () => {
        // Hide the form and render updated accomplishments
        toggleEntryForm();
        renderAccomplishments();
    };
}

// Render Accomplishments
function renderAccomplishments() {
    const transaction = db.transaction(accomplishmentsStore, "readonly");
    const store = transaction.objectStore(accomplishmentsStore);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
        const accomplishments = event.target.result;
        accomplishmentTableBody.innerHTML = '';
        
        accomplishments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by date, newest first
        
        accomplishments.forEach((item, index) => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDateDisplay(item.date)}</td>
                <td>${item.details}</td>
                <td class="approval-status">Pending</td>
            `;
            accomplishmentTableBody.appendChild(row);
        });
    };
}

// Function to fetch attendance data
function fetchAttendanceData() {
    return new Promise((resolve) => {
        const transaction = db.transaction(logsStore, "readonly");
        const store = transaction.objectStore(logsStore);
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const logs = event.target.result;
            logs.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(logs);
        };
    });
}

// Function to fetch accomplishments data
function fetchAccomplishmentsData() {
    return new Promise((resolve) => {
        const transaction = db.transaction(accomplishmentsStore, "readonly");
        const store = transaction.objectStore(accomplishmentsStore);
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const accomplishments = event.target.result;
            accomplishments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            resolve(accomplishments);
        };
    });
}

// Generate and download PDF report
function generatePdfReport() {
    // Create a new jsPDF instance
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Internship Report', 105, 15, { align: 'center' });
    
    // Add date range
    const today = new Date();
    doc.setFontSize(12);
    doc.text(`Generated on: ${today.toLocaleDateString()}`, 105, 25, { align: 'center' });
    
    // Add attendance section
    doc.setFontSize(16);
    doc.text('Attendance Log', 14, 35);
    
    // Async function to generate the PDF
    async function createPdf() {
        // Get data
        const attendanceLogs = await fetchAttendanceData();
        const accomplishments = await fetchAccomplishmentsData();
        
        // Add attendance table
        let yPos = 40;
        doc.setFontSize(10);
        doc.text('Date', 20, yPos);
        doc.text('Time In', 60, yPos);
        doc.text('Time Out', 100, yPos);
        doc.text('Status', 140, yPos);
        
        yPos += 5;
        doc.line(14, yPos, 196, yPos);
        yPos += 8;
        
        attendanceLogs.forEach(log => {
            doc.text(formatDateDisplay(log.date), 20, yPos);
            doc.text(log.timeIn || 'N/A', 60, yPos);
            doc.text(log.timeOut || 'N/A', 100, yPos);
            doc.text('Pending', 140, yPos);
            yPos += 8;
            
            // Add a new page if we're near the bottom
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
        });
        
        // Add accomplishments section
        yPos += 10;
        doc.setFontSize(16);
        doc.text('Accomplishments', 14, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.text('Date', 20, yPos);
        doc.text('Details', 60, yPos);
        doc.text('Status', 160, yPos);
        
        yPos += 5;
        doc.line(14, yPos, 196, yPos);
        yPos += 8;
        
        accomplishments.forEach(item => {
            // Check if we need a new page
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.text(formatDateDisplay(item.date), 20, yPos);
            
            // Handle long text with wrapping
            const splitDetails = doc.splitTextToSize(item.details, 90);
            doc.text(splitDetails, 60, yPos);
            
            doc.text('Pending', 160, yPos);
            
            // Move down based on number of lines in details
            yPos += Math.max(8, splitDetails.length * 6);
        });
        
        // Save the PDF
        doc.save('Internship_Report.pdf');
    }
    
    createPdf();
}

// Generate and download CSV report
function generateCsvReport() {
    // Function to convert array to CSV
    function arrayToCSV(data, headers) {
        // Create header row
        let csvContent = headers.join(',') + '\n';
        
        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header] || '';
                // Quote values that contain commas
                return value.toString().includes(',') ? `"${value}"` : value;
            });
            csvContent += values.join(',') + '\n';
        });
        
        return csvContent;
    }
    
    // Async function to create the CSV
    async function createCsv() {
        // Fetch data
        const attendanceLogs = await fetchAttendanceData();
        const accomplishments = await fetchAccomplishmentsData();
        
        // Format attendance data for CSV
        const attendanceFormattedData = attendanceLogs.map(log => ({
            date: formatDateDisplay(log.date),
            timeIn: log.timeIn || 'N/A',
            timeOut: log.timeOut || 'N/A',
            status: 'Pending'
        }));
        
        // Format accomplishments data for CSV
        const accomplishmentsFormattedData = accomplishments.map(item => ({
            date: formatDateDisplay(item.date),
            details: item.details,
            status: 'Pending'
        }));
        
        // Create attendance CSV
        const attendanceCsv = arrayToCSV(
            attendanceFormattedData, 
            ['date', 'timeIn', 'timeOut', 'status']
        );
        
        // Create accomplishments CSV
        const accomplishmentsCsv = arrayToCSV(
            accomplishmentsFormattedData,
            ['date', 'details', 'status']
        );
        
        // Combine into a single CSV with sections
        const combinedCsv = 
            'ATTENDANCE LOG\n' + attendanceCsv + 
            '\nACCOMPLISHMENTS\n' + accomplishmentsCsv;
        
        // Create blob and download
        const blob = new Blob([combinedCsv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, 'Internship_Report.csv');
    }
    
    createCsv();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    openDB();
    initializeDateTimeDisplay();
    
    timeInBtn.addEventListener('click', handleTimeIn);
    timeOutBtn.addEventListener('click', handleTimeOut);
    newEntryBtn.addEventListener('click', toggleEntryForm);
    cancelEntryBtn.addEventListener('click', toggleEntryForm);
    addEntryBtn.addEventListener('click', addAccomplishment);
    downloadPdfBtn?.addEventListener('click', generatePdfReport);
    downloadCsvBtn?.addEventListener('click', generateCsvReport);
});
