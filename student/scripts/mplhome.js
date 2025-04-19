// Constants
const API_BASE_URL = 'http://localhost:5004/api';

// DOM Elements
const welcomeSection = document.querySelector('.welcome-section');
const profileDropdown = document.querySelector('.dropdown-profile');
const profileContent = document.querySelector('.profile-content');
const userName = document.querySelector('.user-name');
const loginButton = document.getElementById('openLogin');

// State Management
let userData = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    initializeAuth();
    initializeUI();
    setupEventListeners();
});

// Authentication Functions
function initializeAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        userData = JSON.parse(localStorage.getItem('userData') || '{}');
        updateUIForLoggedInUser();
    } else {
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser() {
    if (loginButton) loginButton.style.display = 'none';
    if (profileDropdown) profileDropdown.style.display = 'block';
    if (userName && userData.firstName) {
        userName.textContent = userData.firstName;
    }
}

function updateUIForLoggedOutUser() {
    if (loginButton) loginButton.style.display = 'block';
    if (profileDropdown) profileDropdown.style.display = 'none';
}

// UI Functions
function initializeUI() {
    // Initialize accordion
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', toggleAccordion);
    });

    // Initialize profile dropdown
    if (profileDropdown) {
        profileDropdown.addEventListener('click', toggleProfileDropdown);
    }
}

function toggleAccordion(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    const icon = header.querySelector('i');

    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');

    if (content.style.maxHeight) {
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

function toggleProfileDropdown() {
    profileContent.classList.toggle('show');
}

// Event Listeners
function setupEventListeners() {
    // Close profile dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.matches('.dropdown-profile') && !event.target.closest('.profile-content')) {
            profileContent.classList.remove('show');
        }
    });

    // Logout functionality
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', handleLogout);
    }
}

function handleLogout(event) {
    event.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

// Utility Functions
function showErrorMessage(message) {
    // You can implement your preferred error notification method here
    console.error(message);
    // Example: Create a temporary error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
} 