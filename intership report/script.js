// 🌟 Display Real-time Clock
const clockElement = document.getElementById('current-time');

function updateClock() {
    const now = new Date();
    clockElement.textContent = `Current Time: ${now.toLocaleTimeString()}`;
}
setInterval(updateClock, 1000);
updateClock();

// 🌟 DOM Elements
const timeInBtn = document.getElementById('time-in-btn');
const timeOutBtn = document.getElementById('time-out-btn');
const timeLogMessage = document.getElementById('time-log-message');
const progressLog = document.querySelector('#progress-log tbody');
const addEntryBtn = document.getElementById('add-entry-btn');
const accomplishmentInput = document.getElementById('accomplishment-input');
const accomplishmentMessage = document.getElementById('accomplishment-message');
const accomplishmentsContainer = document.getElementById('accomplishments-container');

// 🌟 IndexedDB Setup
const dbName = "InternshipDB";
const storeName = "DailyLogs";
let db;

// 🌟 Open IndexedDB
function openDB() {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;

        if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "date" });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        renderLog();
        renderAccomplishments();
    };

    request.onerror = () => {
        console.error("Failed to open IndexedDB");
    };
}

openDB();

// 🌟 Get Current Date
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];  // YYYY-MM-DD
}

// 🌟 Save Daily Log to IndexedDB
function saveLog(date, log) {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.put({ date, ...log });
}

// 🌟 Fetch Daily Log
function getLog(date, callback) {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(date);

    request.onsuccess = () => {
        callback(request.result);
    };
}

// 🌟 Render Logs
function renderLog() {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const logs = request.result;
        progressLog.innerHTML = '';

        logs.forEach(log => {
            const row = `
                <tr>
                    <td>${log.date}</td>
                    <td>${log.timeIn || '-'}</td>
                    <td>${log.timeOut || '-'}</td>
                    <td>${log.accomplishment || '-'}</td>
                </tr>
            `;
            progressLog.innerHTML += row;

            // Disable buttons for today's log
            if (log.date === getCurrentDate()) {
                timeInBtn.disabled = !!log.timeIn;
                timeOutBtn.disabled = !log.timeIn || !!log.timeOut;
                addEntryBtn.disabled = !!log.accomplishment;
            }
        });
    };
}

// 🌟 Render Accomplishments
function renderAccomplishments() {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const logs = request.result;
        accomplishmentsContainer.innerHTML = '';

        logs.forEach(log => {
            if (log.accomplishment) {
                const entry = `
                    <div>
                        <strong>${log.date}:</strong> ${log.accomplishment}
                    </div>
                `;
                accomplishmentsContainer.innerHTML += entry;
            }
        });
    };
}

// 🌟 Time In Function (One per Day)
function logTimeIn() {
    const date = getCurrentDate();

    getLog(date, (log) => {
        if (log) {
            if (log.timeIn) {
                timeLogMessage.textContent = "You have already timed in today.";
                return;
            }
        }

        const now = new Date().toLocaleTimeString();
        const newLog = {
            timeIn: now,
            timeOut: '',
            accomplishment: log?.accomplishment || ''
        };

        saveLog(date, newLog);
        renderLog();
        timeOutBtn.disabled = false;
        timeLogMessage.textContent = "Time In logged!";
    });
}

// 🌟 Time Out Function (One per Day)
function logTimeOut() {
    const date = getCurrentDate();

    getLog(date, (log) => {
        if (!log || !log.timeIn || log.timeOut) {
            timeLogMessage.textContent = "You haven't timed in or have already timed out.";
            return;
        }

        const now = new Date().toLocaleTimeString();
        log.timeOut = now;

        saveLog(date, log);
        renderLog();
        timeOutBtn.disabled = true;
        timeLogMessage.textContent = "Time Out logged!";
    });
}

// 🌟 Save Accomplishment (One per Day)
function saveAccomplishment() {
    const date = getCurrentDate();
    const text = accomplishmentInput.value.trim();

    if (!text) {
        accomplishmentMessage.textContent = "Please enter an accomplishment.";
        return;
    }

    getLog(date, (log) => {
        if (log && log.accomplishment) {
            accomplishmentMessage.textContent = "You have already saved today's accomplishment.";
            return;
        }

        const newLog = {
            timeIn: log?.timeIn || '',
            timeOut: log?.timeOut || '',
            accomplishment: text
        };

        saveLog(date, newLog);
        renderLog();
        renderAccomplishments();
        accomplishmentMessage.textContent = "Accomplishment saved!";
        accomplishmentInput.value = '';
    });
}

// 🌟 Event Listeners
timeInBtn.addEventListener('click', logTimeIn);
timeOutBtn.addEventListener('click', logTimeOut);
addEntryBtn.addEventListener('click', saveAccomplishment);
