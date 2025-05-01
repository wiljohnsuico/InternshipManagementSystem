// Simple Employer Profile JavaScript
// This streamlined version focuses on basic functionality with minimal dependencies

// API Configuration
const API_URL = document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api';
const USE_MOCK_DATA = true; // Enable mock data when API fails

// DOM Elements
const profileContent = document.getElementById('profileContent');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');

// Mock Data for offline development and testing
const MOCK_EMPLOYER = {
    id: 1,
    name: "Tech Innovations Inc.",
    industry: "Technology",
    size: "101-500 employees",
    location: "San Francisco, CA",
    website: "techinnovations.example.com",
    logo_url: "https://via.placeholder.com/100",
    founded_year: "2010",
    description: "Tech Innovations Inc. is a leading technology company specializing in innovative solutions for businesses of all sizes. We focus on developing cutting-edge software applications, cloud services, and digital transformation solutions that help organizations streamline their operations and enhance productivity.",
    stats: {
        jobs_posted: 12,
        internships_offered: 8,
        students_hired: 15
    }
};

const MOCK_CONTACTS = [
    {
        id: "contact-1",
        name: "Jane Smith",
        position: "HR Manager",
        email: "jane.smith@techinnovations.example",
        phone: "(555) 123-4567"
    },
    {
        id: "contact-2",
        name: "John Martinez",
        position: "Internship Coordinator",
        email: "john.martinez@techinnovations.example",
        phone: "(555) 987-6543"
    }
];

const MOCK_JOBS = [
    {
        id: "job-1",
        title: "Frontend Developer Intern",
        location: "San Francisco, CA",
        job_type: "Internship",
        posted_date: "2025-04-01",
        short_description: "Join our frontend team and work on exciting web applications using modern JavaScript frameworks."
    },
    {
        id: "job-2",
        title: "Backend Developer Intern",
        location: "Remote",
        job_type: "Internship",
        posted_date: "2025-04-05",
        short_description: "Develop and maintain server-side applications and APIs using Node.js and Express."
    },
    {
        id: "job-3",
        title: "Data Science Intern",
        location: "San Francisco, CA",
        job_type: "Internship",
        posted_date: "2025-03-28",
        short_description: "Apply machine learning techniques to solve real-world business problems."
    }
];

// Global state
let employerData = null;
let contactPersons = [];
let jobListings = [];
let isEditingContact = false;
let currentContactId = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Simple Employer Profile page');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load employer profile data
    loadEmployerProfile();
});

// Set up event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('backBtn').addEventListener('click', () => {
        window.history.back();
    });
    
    // Profile edit
    document.getElementById('editProfileBtn').addEventListener('click', openEditProfileModal);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfileChanges);
    
    // Contact management
    document.getElementById('addContactBtn').addEventListener('click', () => openContactFormModal());
    document.getElementById('saveContactBtn').addEventListener('click', saveContactPerson);
    
    // Error retry
    document.getElementById('retryBtn').addEventListener('click', () => {
        loadEmployerProfile(true);
    });
}

// Check API connectivity
async function checkApiConnectivity() {
    try {
        console.log(`Checking API connectivity at ${API_URL}/health`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        console.warn('API connectivity check failed:', error);
        return false;
    }
}

// Load employer profile data
async function loadEmployerProfile(forceRefresh = false) {
    showLoading();
    
    try {
        // Get employer ID from URL parameter or default to 1
        const urlParams = new URLSearchParams(window.location.search);
        const employerId = urlParams.get('id') || localStorage.getItem('currentEmployerId') || '1';
        
        // Check API connectivity
        const isApiAvailable = await checkApiConnectivity();
        
        if (!isApiAvailable) {
            console.log('API not available, using mock data');
            employerData = MOCK_EMPLOYER;
            contactPersons = MOCK_CONTACTS;
            jobListings = MOCK_JOBS;
            
            // Update UI with mock data
            updateUI();
            showContent();
            
            // Show notification about using mock data
            showToast('Using offline data. Some features may be limited.', 'info');
            return;
        }
        
        // Try to fetch data from the API
        try {
            // Get authentication token if available
            const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
            const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
            
            // Determine endpoint
            const endpoint = `${API_URL}/employers/${employerId}`;
            
            // Fetch employer data
            console.log(`Fetching employer data from ${endpoint}`);
            const response = await fetch(endpoint, { headers });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch employer data: ${response.status}`);
            }
            
            employerData = await response.json();
            
            // Fetch contact persons
            const contactsResponse = await fetch(`${API_URL}/employers/${employerId}/contacts`, { headers });
            if (contactsResponse.ok) {
                contactPersons = await contactsResponse.json();
            }
            
            // Fetch job listings
            const jobsResponse = await fetch(`${API_URL}/employers/${employerId}/jobs`, { headers });
            if (jobsResponse.ok) {
                jobListings = await jobsResponse.json();
            }
            
            // Update UI
            updateUI();
            showContent();
            
        } catch (error) {
            console.error('Error loading data from API:', error);
            
            if (USE_MOCK_DATA) {
                // Use mock data as fallback
                employerData = MOCK_EMPLOYER;
                contactPersons = MOCK_CONTACTS;
                jobListings = MOCK_JOBS;
                
                // Update UI with mock data
                updateUI();
                showContent();
                
                showToast('Using demo data. Connect to the API for real data.', 'warning');
            } else {
                // Show error
                showError('Failed to load profile data. Please check your connection and try again.');
            }
        }
    } catch (error) {
        console.error('Error in loadEmployerProfile:', error);
        showError('An unexpected error occurred. Please try again later.');
    }
}

// Update the UI with current data
function updateUI() {
    if (!employerData) return;
    
    // Basic company info
    document.getElementById('companyName').textContent = employerData.name || 'Unknown Company';
    document.getElementById('companyIndustry').textContent = employerData.industry || 'Unknown Industry';
    document.getElementById('companyLocation').textContent = employerData.location || 'Unknown Location';
    document.getElementById('companyLogo').src = employerData.logo_url || 'https://via.placeholder.com/100';
    
    // Company details
    document.getElementById('companyFounded').textContent = employerData.founded_year || 'N/A';
    document.getElementById('companySize').textContent = employerData.size || 'N/A';
    
    const websiteElem = document.getElementById('companyWebsite');
    if (employerData.website) {
        websiteElem.textContent = employerData.website;
        websiteElem.href = employerData.website.startsWith('http') ? employerData.website : `https://${employerData.website}`;
    } else {
        websiteElem.textContent = 'N/A';
        websiteElem.removeAttribute('href');
    }
    
    document.getElementById('companyDescription').textContent = employerData.description || 'No company description available.';
    
    // Statistics
    document.getElementById('jobsPosted').textContent = employerData.stats?.jobs_posted || 0;
    document.getElementById('internshipsOffered').textContent = employerData.stats?.internships_offered || 0;
    document.getElementById('studentsHired').textContent = employerData.stats?.students_hired || 0;
    
    // Update contact persons section
    updateContactPersonsUI();
    
    // Update job listings section
    updateJobListingsUI();
}

// Update contacts section UI
function updateContactPersonsUI() {
    const container = document.getElementById('contactPersonsContainer');
    const noContactsMessage = document.getElementById('noContactsMessage');
    
    if (!contactPersons || contactPersons.length === 0) {
        noContactsMessage.style.display = 'block';
        // Clear any existing contact cards
        const existingCards = container.querySelectorAll('.contact-card');
        existingCards.forEach(card => card.remove());
        return;
    }
    
    // Hide "no contacts" message
    noContactsMessage.style.display = 'none';
    
    // Clear existing contact cards
    container.innerHTML = '';
    
    // Add contact cards
    contactPersons.forEach(contact => {
        const contactCol = document.createElement('div');
        contactCol.className = 'col-md-4 mb-3';
        contactCol.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${contact.name || 'Unknown'}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${contact.position || 'Position not specified'}</h6>
                    <p class="card-text small mb-1">
                        <i class="fas fa-envelope mr-2"></i> ${contact.email || 'No email'}
                    </p>
                    <p class="card-text small">
                        <i class="fas fa-phone mr-2"></i> ${contact.phone || 'No phone'}
                    </p>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <button class="btn btn-sm btn-outline-primary mr-2 view-contact" data-id="${contact.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-secondary edit-contact" data-id="${contact.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(contactCol);
        
        // Add event listeners
        contactCol.querySelector('.view-contact').addEventListener('click', () => {
            openContactDetailsModal(contact);
        });
        
        contactCol.querySelector('.edit-contact').addEventListener('click', () => {
            openContactFormModal(contact);
        });
    });
}

// Update job listings section UI
function updateJobListingsUI() {
    const container = document.getElementById('jobListingsContainer');
    const noJobsMessage = document.getElementById('noJobsMessage');
    
    if (!jobListings || jobListings.length === 0) {
        noJobsMessage.style.display = 'block';
        // Clear any existing job cards
        const existingCards = container.querySelectorAll('.job-card');
        existingCards.forEach(card => card.remove());
        return;
    }
    
    // Hide "no jobs" message
    noJobsMessage.style.display = 'none';
    
    // Clear existing job cards
    container.innerHTML = '';
    
    // Add job cards
    jobListings.forEach(job => {
        const jobCol = document.createElement('div');
        jobCol.className = 'col-md-4 mb-3';
        jobCol.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${job.title || 'Untitled Position'}</h5>
                    <p class="card-text small mb-1">
                        <i class="fas fa-map-marker-alt mr-2"></i> ${job.location || 'Location not specified'}
                    </p>
                    <p class="card-text small mb-1">
                        <i class="fas fa-clock mr-2"></i> ${job.job_type || 'Full-time'}
                    </p>
                    <p class="card-text small mb-3">
                        <i class="fas fa-calendar-alt mr-2"></i> Posted: ${formatDate(job.posted_date) || 'Unknown date'}
                    </p>
                    <p class="card-text">${job.short_description || 'No description available'}</p>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <a href="../jobs/details.html?id=${job.id}" class="btn btn-sm btn-primary">View Details</a>
                </div>
            </div>
        `;
        
        container.appendChild(jobCol);
    });
}

// Open edit profile modal
function openEditProfileModal() {
    // Populate form with existing data
    document.getElementById('editCompanyName').value = employerData.name || '';
    document.getElementById('editIndustry').value = employerData.industry || '';
    document.getElementById('editCompanySize').value = employerData.size || '';
    document.getElementById('editLocation').value = employerData.location || '';
    document.getElementById('editWebsite').value = employerData.website || '';
    document.getElementById('editFounded').value = employerData.founded_year || '';
    document.getElementById('editDescription').value = employerData.description || '';
    
    // Show modal
    $('#editProfileModal').modal('show');
}

// Save profile changes
async function saveProfileChanges() {
    const form = document.getElementById('editProfileForm');
    
    // Basic validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const updatedData = {
        name: document.getElementById('editCompanyName').value.trim(),
        industry: document.getElementById('editIndustry').value,
        size: document.getElementById('editCompanySize').value,
        location: document.getElementById('editLocation').value.trim(),
        website: document.getElementById('editWebsite').value.trim(),
        founded_year: document.getElementById('editFounded').value.trim(),
        description: document.getElementById('editDescription').value.trim()
    };
    
    try {
        // Check API connectivity
        const isApiAvailable = await checkApiConnectivity();
        const employerId = new URLSearchParams(window.location.search).get('id') || localStorage.getItem('currentEmployerId') || '1';
        
        if (isApiAvailable) {
            console.log('Saving profile changes to API', updatedData);
            
            // Get auth token if available
            const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
            const headers = authToken ? { 
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            } : {
                'Content-Type': 'application/json'
            };
            
            try {
                const response = await fetch(`${API_URL}/employers/${employerId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(updatedData)
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to update profile: ${response.status}`);
                }
                
                // Update local data
                employerData = { ...employerData, ...updatedData };
                
                // Close modal
                $('#editProfileModal').modal('hide');
                
                // Show success message
                showToast('Profile updated successfully', 'success');
                
                // Update UI
                updateUI();
            } catch (error) {
                console.error('Error updating profile:', error);
                
                // Fallback to local update if API fails
                employerData = { ...employerData, ...updatedData };
                
                // Close modal
                $('#editProfileModal').modal('hide');
                
                // Show notification
                showToast('Changes saved locally. Will sync when online.', 'warning');
                
                // Update UI
                updateUI();
            }
        } else {
            // If API is not available, just update local data
            console.log('API not available, saving profile changes locally', updatedData);
            employerData = { ...employerData, ...updatedData };
            
            // Close modal
            $('#editProfileModal').modal('hide');
            
            // Show notification
            showToast('Changes saved locally. Will sync when online.', 'warning');
            
            // Update UI
            updateUI();
        }
    } catch (error) {
        console.error('Error saving profile changes:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Open contact form modal
function openContactFormModal(contact = null) {
    // Reset form
    document.getElementById('contactForm').reset();
    
    if (contact) {
        // Edit existing contact
        isEditingContact = true;
        currentContactId = contact.id;
        
        // Update modal title
        $('#contactFormModal .modal-title').text('Edit Contact Person');
        
        // Fill form with contact data
        document.getElementById('contactId').value = contact.id;
        document.getElementById('contactName').value = contact.name || '';
        document.getElementById('contactPosition').value = contact.position || '';
        document.getElementById('contactEmail').value = contact.email || '';
        document.getElementById('contactPhone').value = contact.phone || '';
    } else {
        // Add new contact
        isEditingContact = false;
        currentContactId = null;
        
        // Update modal title
        $('#contactFormModal .modal-title').text('Add Contact Person');
        document.getElementById('contactId').value = '';
    }
    
    // Show modal
    $('#contactFormModal').modal('show');
}

// Save contact person
async function saveContactPerson() {
    const form = document.getElementById('contactForm');
    
    // Basic validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const contactData = {
        id: document.getElementById('contactId').value,
        name: document.getElementById('contactName').value.trim(),
        position: document.getElementById('contactPosition').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        phone: document.getElementById('contactPhone').value.trim()
    };
    
    try {
        // Check API connectivity
        const isApiAvailable = await checkApiConnectivity();
        
        if (isApiAvailable) {
            console.log('Saving contact person to API:', contactData);
            
            // In a real application, we would make an API call here
            // For now, we'll simulate a successful save
            
            if (contactData.id) {
                // Update existing contact
                contactPersons = contactPersons.map(c => 
                    c.id === contactData.id ? { ...c, ...contactData } : c
                );
            } else {
                // Add new contact with a temporary ID
                contactData.id = `temp-${Date.now()}`;
                contactPersons.push(contactData);
            }
        } else {
            console.log('API not available, saving contact person locally:', contactData);
            
            if (contactData.id) {
                // Update existing contact
                contactPersons = contactPersons.map(c => 
                    c.id === contactData.id ? { ...c, ...contactData } : c
                );
            } else {
                // Add new contact with a temporary ID
                contactData.id = `temp-${Date.now()}`;
                contactPersons.push(contactData);
            }
        }
        
        // Close modal
        $('#contactFormModal').modal('hide');
        
        // Update UI
        updateContactPersonsUI();
        
        // Show success message
        showToast(isEditingContact ? 'Contact updated successfully' : 'Contact added successfully', 'success');
    } catch (error) {
        console.error('Error saving contact person:', error);
        showToast('Failed to save contact. Please try again.', 'error');
    }
}

// Open contact details modal
function openContactDetailsModal(contact) {
    if (!contact) return;
    
    // Fill modal with contact data
    document.getElementById('modalContactName').textContent = contact.name || 'Unknown';
    document.getElementById('modalContactTitle').textContent = contact.position || 'Position not specified';
    document.getElementById('modalContactEmail').textContent = contact.email || 'No email provided';
    document.getElementById('modalContactPhone').textContent = contact.phone || 'No phone provided';
    
    // Show modal
    $('#contactDetailsModal').modal('show');
}

// UI State Management
function showLoading() {
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
    if (errorAlert) errorAlert.style.display = 'none';
    if (profileContent) profileContent.style.display = 'none';
}

function showError(message) {
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (errorAlert) {
        errorAlert.style.display = 'block';
        if (errorMessage) errorMessage.textContent = message;
    }
    if (profileContent) profileContent.style.display = 'none';
}

function showContent() {
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (errorAlert) errorAlert.style.display = 'none';
    if (profileContent) profileContent.style.display = 'block';
}

// Helper Functions
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 right-0 p-3';
        toastContainer.style.zIndex = '1050';
        toastContainer.style.right = '0';
        toastContainer.style.bottom = '0';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${type}`;
    toastEl.id = toastId;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.setAttribute('data-delay', '3000');
    
    // Toast header based on type
    let iconClass, bgClass;
    switch (type) {
        case 'success':
            iconClass = 'fa-check-circle text-success';
            bgClass = 'bg-success text-white';
            break;
        case 'error':
            iconClass = 'fa-exclamation-circle text-danger';
            bgClass = 'bg-danger text-white';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle text-warning';
            bgClass = 'bg-warning';
            break;
        default:
            iconClass = 'fa-info-circle text-info';
            bgClass = 'bg-info text-white';
    }
    
    // Set toast content
    toastEl.innerHTML = `
        <div class="toast-header ${bgClass}">
            <i class="fas ${iconClass} mr-2"></i>
            <strong class="mr-auto">Notification</strong>
            <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toastEl);
    
    // Initialize and show toast
    $(document).ready(function() {
        $(`#${toastId}`).toast('show');
        
        // Remove toast element after it's hidden
        $(`#${toastId}`).on('hidden.bs.toast', function() {
            this.remove();
        });
    });
} 