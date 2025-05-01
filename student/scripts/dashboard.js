// Placeholder dashboard.js - add your dashboard logic here

function initDashboard() {
    // Example: Add a placeholder message to the page
    let main = document.querySelector('main');
    if (main && !document.querySelector('.dashboard-placeholder')) {
        const div = document.createElement('div');
        div.className = 'dashboard-placeholder';
        div.textContent = '';
        main.prepend(div);
    }
} 