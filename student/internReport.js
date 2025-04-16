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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    openDB();
    initializeDateTimeDisplay();
    
    timeInBtn.addEventListener('click', handleTimeIn);
    timeOutBtn.addEventListener('click', handleTimeOut);
    newEntryBtn.addEventListener('click', toggleEntryForm);
    cancelEntryBtn.addEventListener('click', toggleEntryForm);
    addEntryBtn.addEventListener('click', addAccomplishment);
});