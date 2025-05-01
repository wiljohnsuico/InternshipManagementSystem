// Employer Profile JavaScript

// Global variables
let employerData = null;
let contactPersons = [];
let jobListings = [];
const API_URL = document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api';
const DEFAULT_LOGO = "../../student/assets/default-company-logo.png";
const USE_MOCK_DATA = true; // Enable mock data when API fails
let employerId; 
let isOfflineMode = false;
let isLoading = false;
const APP_VERSION = "1.0.2";

// Debug mode
const DEBUG = true;

// Cache keys
const CACHE_KEYS = {
    EMPLOYER_PROFILE: 'employerProfile',
    CONTACT_PERSONS: 'contactPersons',
    JOB_LISTINGS: 'jobListings'
};

// Mock data for offline development and testing
const MOCK_EMPLOYER = {
    id: 1,
    name: "Tech Innovations Inc.",
    industry: "Technology",
    size: "101-500 employees",
    location: "San Francisco, CA",
    website: "techinnovations.example.com",
    logo_url: "../../student/assets/default-company-logo.png",
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

// DOM Elements
const loadingIndicator = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const profileContent = document.getElementById('profileContent');
const retryButton = document.getElementById('retryButton');
const refreshButton = document.getElementById('refreshButton');
const backButton = document.getElementById('backButton');
const editProfileBtn = document.getElementById('editProfileBtn');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - Initializing Employer Profile");
    
    // Initialize UI elements with references
    initializeUI();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load profile data
    loadEmployerProfile();
    
    // Initialize debug info
    setTimeout(updateDebugInfo, 1000);
    
    // Show debug info if URL param is present
    if (new URLSearchParams(window.location.search).get('debug') === 'true') {
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) debugInfo.style.display = 'block';
    }
});

// Initialize UI elements
function initializeUI() {
    console.log("Initializing UI elements");
    
    // Make sure we have references to DOM elements
    if (!loadingIndicator) {
        console.error("Loading indicator element not found!");
    }
    
    if (!profileContent) {
        console.error("Profile content element not found!");
    }
    
    // Ensure profile content exists before trying to hide it
    if (profileContent) {
        console.log("Setting profile content to hidden initially");
        profileContent.style.display = 'none';
    } else {
        console.warn("Profile content element missing from DOM");
    }
    
    // Show loading indicator if it exists
    if (loadingIndicator) {
        console.log("Showing loading indicator");
        loadingIndicator.style.display = 'flex';
    } else {
        console.warn("Loading indicator element missing from DOM");
    }
}

// Set up event listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Debug button click issues
    debugButtons();
    
    // Add event listeners with try/catch for debugging
    try {
        document.getElementById('editProfileBtn').addEventListener('click', function() {
            console.log("Edit Profile button clicked");
            openEditProfileModal();
        });
    } catch (error) {
        console.error("Error setting up Edit Profile button:", error);
    }
    
    try {
        document.getElementById('refreshButton').addEventListener('click', function() {
            console.log("Refresh button clicked");
            loadEmployerProfile();
        });
    } catch (error) {
        console.error("Error setting up Refresh button:", error);
    }
    
    try {
        document.getElementById('backButton').addEventListener('click', function() {
            console.log("Back button clicked");
            window.history.back();
        });
    } catch (error) {
        console.error("Error setting up Back button:", error);
    }
    
    try {
        document.getElementById('addContactBtn').addEventListener('click', function() {
            console.log("Add Contact button clicked");
            openAddContactModal();
        });
    } catch (error) {
        console.error("Error setting up Add Contact button:", error);
    }
    
    try {
        document.getElementById('saveProfileBtn').addEventListener('click', function() {
            console.log("Save Profile button clicked");
            saveProfileChanges();
        });
    } catch (error) {
        console.error("Error setting up Save Profile button:", error);
    }
    
    try {
        document.getElementById('cancelEditBtn').addEventListener('click', function() {
            console.log("Cancel Edit button clicked");
            closeEditProfileModal();
        });
    } catch (error) {
        console.error("Error setting up Cancel Edit button:", error);
    }
    
    try {
        document.getElementById('saveContactBtn').addEventListener('click', function() {
            console.log("Save Contact button clicked");
            saveContactPerson();
        });
    } catch (error) {
        console.error("Error setting up Save Contact button:", error);
    }
    
    try {
        document.getElementById('cancelContactBtn').addEventListener('click', function() {
            console.log("Cancel Contact button clicked");
            closeContactFormModal();
        });
    } catch (error) {
        console.error("Error setting up Cancel Contact button:", error);
    }
    
    // Setup modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// Helper function to log with prefix for easier troubleshooting
function debug(message, data) {
  console.log(`[Employer Profile] ${message}`, data || '');
}

// Check API connectivity
async function checkApiConnectivity() {
    try {
        debug(`Checking API connectivity at ${API_URL}/health`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
        
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        debug(`API connectivity check result: ${response.ok}`);
        return response.ok;
    } catch (error) {
        console.warn('API connectivity check failed:', error);
        return false;
    }
}

// Load employer profile data
async function loadEmployerProfile(forceRefresh = false) {
    showLoading();
    debug('Loading employer profile, forceRefresh:', forceRefresh);
    
    try {
        // Check for authentication token
        const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
        let endpoint;
        
        // Get employer ID from local storage or URL parameter
        const employerId = getEmployerId();
        debug('Employer ID:', employerId);
        
        if (!employerId && !authToken) {
            showError('No employer ID found. Please go back to the dashboard and try again.');
            return;
        }
        
        // Check API connectivity
        const isApiAvailable = await checkApiConnectivity();
        debug('API available:', isApiAvailable);
        
        if (!isApiAvailable && USE_MOCK_DATA) {
            debug('Using mock data due to API connectivity issues');
            employerData = MOCK_EMPLOYER;
            contactPersons = MOCK_CONTACTS;
            jobListings = MOCK_JOBS;
            
            // Update the UI with mock data
            updateProfileUI();
            showContent();
            
            // Show notification about using mock data
            showNotification('Using offline data. Some features may be limited.');
            return;
        }
        
        // Try to fetch data from the API
        try {
            // Determine which endpoint to use based on auth state
            if (authToken && (userRole === 'Employer' || userRole === 'employer')) {
                // If logged in as employer, use the /me endpoint
                endpoint = `${API_URL}/employers/me`;
                debug(`Using authenticated employer endpoint: ${endpoint}`);
            } else {
                // Otherwise use the ID-based endpoint
                endpoint = `${API_URL}/employers/${employerId}`;
                debug(`Using public employer endpoint: ${endpoint}`);
            }
            
            // Set up headers if authenticated
            const headers = authToken ? {
                'Authorization': `Bearer ${authToken}`
            } : {};
            
            // Fetch employer data
            debug(`Fetching employer data from ${endpoint}`);
            const response = await fetch(endpoint, { headers });
            
            if (!response.ok) {
                debug(`Error response from API: ${response.status} ${response.statusText}`);
                throw new Error(`Failed to fetch employer data: ${response.status} ${response.statusText}`);
            }
            
            employerData = await response.json();
            debug('Received employer data:', employerData);
            
            // Store the employer ID for future use if not already set
            if (employerData.id && !localStorage.getItem('currentEmployerId')) {
                localStorage.setItem('currentEmployerId', employerData.id);
                debug('Stored employer ID in localStorage:', employerData.id);
            }
            
            // Fetch contact persons - use same auth pattern
            const contactsEndpoint = authToken && (userRole === 'Employer' || userRole === 'employer') ? 
                `${API_URL}/employers/me/contacts` : 
                `${API_URL}/employers/${employerId}/contacts`;
                
            debug(`Fetching contacts from ${contactsEndpoint}`);
            const contactsResponse = await fetch(contactsEndpoint, { headers });
            if (contactsResponse.ok) {
                contactPersons = await contactsResponse.json();
                debug('Received contacts data:', contactPersons);
            } else {
                debug(`Error fetching contacts: ${contactsResponse.status}`);
            }
            
            // Fetch job listings - use same auth pattern
            const jobsEndpoint = authToken && (userRole === 'Employer' || userRole === 'employer') ? 
                `${API_URL}/employers/me/jobs` : 
                `${API_URL}/employers/${employerId}/jobs`;
                
            debug(`Fetching jobs from ${jobsEndpoint}`);
            const jobsResponse = await fetch(jobsEndpoint, { headers });
            if (jobsResponse.ok) {
                jobListings = await jobsResponse.json();
                debug('Received jobs data:', jobListings);
            } else {
                debug(`Error fetching jobs: ${jobsResponse.status}`);
            }
            
            // Update the UI
            updateProfileUI();
            showContent();
            
            // Update visibility of edit button based on authentication
            const editProfileBtn = document.getElementById('editProfileBtn');
            if (editProfileBtn) {
                if (authToken && (userRole === 'Employer' || userRole === 'employer')) {
                    // Show edit button only if viewing own profile
                    editProfileBtn.style.display = 'inline-block';
                } else {
                    // Hide edit button for non-owners
                    editProfileBtn.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error loading employer profile from API:', error);
            
            // Check if we have data in localStorage as a fallback
            const cachedData = localStorage.getItem('employerProfileCache');
            if (cachedData && !forceRefresh) {
                try {
                    debug('Attempting to use cached data');
                    const cache = JSON.parse(cachedData);
                    employerData = cache.employerData;
                    contactPersons = cache.contactPersons;
                    jobListings = cache.jobListings;
                    
                    // Update the UI with cached data
                    updateProfileUI();
                    showContent();
                    
                    // Show notification about using cached data
                    showNotification('Using cached data. Refresh to try loading the latest data.');
                    return;
                } catch (cacheError) {
                    console.error('Error parsing cached data:', cacheError);
                }
            }
            
            // If no cached data or refresh was forced, use mock data as last resort
            if (USE_MOCK_DATA) {
                debug('Using mock data as fallback');
                employerData = MOCK_EMPLOYER;
                contactPersons = MOCK_CONTACTS;
                jobListings = MOCK_JOBS;
                
                // Update the UI with mock data
                updateProfileUI();
                showContent();
                
                // Show notification about using mock data
                showNotification('Using demo data. Connect to the API for real data.');
                return;
            }
            
            // If all options fail, show the error
            showError('Failed to load employer profile. Please check your connection and try again.');
        }
    } catch (error) {
        console.error('Global error in loadEmployerProfile:', error);
        showError('An unexpected error occurred. Please try again later.');
    }
}

// Update the UI with employer data
function updateProfileUI() {
    if (!employerData) return;
    
    // Cache the data for offline use
    try {
        localStorage.setItem('employerProfileCache', JSON.stringify({
            employerData,
            contactPersons,
            jobListings,
            timestamp: new Date().toISOString()
        }));
    } catch (error) {
        console.warn('Failed to cache employer profile data:', error);
    }
    
    // Basic company info
    document.getElementById('companyName').textContent = employerData.name || 'Unknown Company';
    document.getElementById('companyIndustry').textContent = employerData.industry || 'Unknown Industry';
    document.getElementById('companyLocation').textContent = employerData.location || 'Unknown Location';
    document.getElementById('companyLogo').src = employerData.logo_url || DEFAULT_LOGO;
    
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
    
    // Contact persons
    updateContactPersonsUI();
    
    // Job listings
    updateJobListingsUI();
    
    // Update debug info after loading data
    updateDebugInfo();
}

// Update contacts section UI
function updateContactPersonsUI() {
    const container = document.getElementById('contactPersonsContainer');
    
    if (!contactPersons || contactPersons.length === 0) {
        container.innerHTML = `
            <div class="contact-card placeholder">
                <p>No contact persons available</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    contactPersons.forEach(contact => {
        const contactCard = document.createElement('div');
        contactCard.className = 'contact-card';
        contactCard.innerHTML = `
            <h3>${contact.name || 'Unknown'}</h3>
            <p class="contact-position">${contact.position || 'Position not specified'}</p>
            <div class="contact-info">
                <p><i class="fas fa-envelope"></i> ${contact.email || 'No email'}</p>
                <p><i class="fas fa-phone"></i> ${contact.phone || 'No phone'}</p>
            </div>
            <div class="contact-actions">
                <button class="btn btn-sm btn-primary view-contact" data-id="${contact.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-secondary edit-contact" data-id="${contact.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        `;
        
        container.appendChild(contactCard);
        
        // Add event listeners
        contactCard.querySelector('.view-contact').addEventListener('click', () => {
            openContactDetailsModal(contact);
        });
        
        contactCard.querySelector('.edit-contact').addEventListener('click', () => {
            openContactFormModal(contact);
        });
    });
}

// Update job listings section UI
function updateJobListingsUI() {
    const container = document.getElementById('jobListingsContainer');
    
    if (!jobListings || jobListings.length === 0) {
        container.innerHTML = `
            <div class="job-card placeholder">
                <p>No current job openings</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    jobListings.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.innerHTML = `
            <h3>${job.title || 'Untitled Position'}</h3>
            <div class="job-details">
                <p><i class="fas fa-map-marker-alt"></i> ${job.location || 'Location not specified'}</p>
                <p><i class="fas fa-clock"></i> ${job.job_type || 'Full-time'}</p>
                <p><i class="fas fa-calendar-alt"></i> Posted: ${formatDate(job.posted_date) || 'Unknown date'}</p>
            </div>
            <p class="job-description">${job.short_description || 'No description available'}</p>
            <a href="../jobs/details.html?id=${job.id}" class="btn btn-sm btn-primary">View Details</a>
        `;
        
        container.appendChild(jobCard);
    });
    
    // Explicitly hide loader and show content after UI update
    showContent();
}

// Open edit profile modal
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (!modal) return;
    
    // Populate form with existing data
    document.getElementById('editCompanyName').value = employerData.name || '';
    document.getElementById('editIndustry').value = employerData.industry || '';
    document.getElementById('editCompanySize').value = employerData.size || '';
    document.getElementById('editLocation').value = employerData.location || '';
    document.getElementById('editWebsite').value = employerData.website || '';
    document.getElementById('editFounded').value = employerData.founded_year || '';
    document.getElementById('editDescription').value = employerData.description || '';
    
    openModal(modal);
}

// Save profile changes
async function saveProfileChanges() {
    try {
        // Get form data
        const name = document.getElementById('editCompanyName').value.trim();
        const industry = document.getElementById('editIndustry').value.trim();
        const location = document.getElementById('editLocation').value.trim();
        const founded = document.getElementById('editFounded').value.trim();
        const size = document.getElementById('editCompanySize').value.trim();
        const website = document.getElementById('editWebsite').value.trim();
        const description = document.getElementById('editDescription').value.trim();
        
        // Validate required fields
        if (!name) {
            alert('Company name is required');
            return;
        }
        
        // Check API connectivity
        const isApiAvailable = await checkApiConnectivity();
        
        if (isApiAvailable) {
            // Get authentication token
            const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
            
            if (!authToken) {
                showError('You must be logged in to save changes');
                return;
            }
            
            // Prepare data for the API
            const profileData = {
                name,
                industry,
                location,
                founded_year: founded,
                size,
                website,
                description
            };
            
            // Send data to the API
            const response = await fetch(`${API_URL}/employers/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save profile: ${response.status} ${response.statusText}`);
            }
            
            // Get updated profile data from the API
            const updatedData = await response.json();
            
            // Update local data
            employerData = { ...employerData, ...updatedData };
        } else {
            // If API is not available, update local data directly
            employerData = {
                ...employerData,
                name,
                industry,
                location,
                founded_year: founded,
                size,
                website,
                description
            };
        }
        
        // Save to user object in localStorage for job listings to access
        try {
            // Get current user data
            const userDataStr = localStorage.getItem('userData') || localStorage.getItem('user');
            let userData = userDataStr ? JSON.parse(userDataStr) : {};
            
            // Update with employer profile data
            userData = {
                ...userData,
                company_name: name,
                industry,
                location,
                companyName: name // Add both formats for compatibility
            };
            
            // Save back to localStorage
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Also save in employer profile format
            const employerProfileData = {
                name,
                industry,
                location,
                founded_year: founded,
                size,
                website,
                description
            };
            
            localStorage.setItem('employerProfile', JSON.stringify(employerProfileData));
            
            console.log('Profile data saved to localStorage for job listings to access:', userData);
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
        
        // Update the UI
        updateProfileUI();
        
        // Close the modal
        closeEditProfileModal();
        
        // Show success message
        showNotification('Profile updated successfully', 3000, 'success');
        
        // Reload employer profile
        loadEmployerProfile(true);
    } catch (error) {
        console.error('Error saving profile changes:', error);
        showError('Failed to save profile changes. Please try again.');
    }
}

// Open contact form modal
function openContactFormModal(contact = null) {
    const modal = document.getElementById('contactFormModal');
    if (!modal) return;
    
    const modalTitle = document.getElementById('contactFormTitle');
    
    // Reset form
    document.getElementById('contactForm').reset();
    
    if (contact) {
        // Edit existing contact
        modalTitle.textContent = 'Edit Contact Person';
        document.getElementById('contactId').value = contact.id;
        document.getElementById('contactName').value = contact.name || '';
        document.getElementById('contactPosition').value = contact.position || '';
        document.getElementById('contactEmail').value = contact.email || '';
        document.getElementById('contactPhone').value = contact.phone || '';
    } else {
        // Add new contact
        modalTitle.textContent = 'Add Contact Person';
        document.getElementById('contactId').value = '';
    }
    
    openModal(modal);
}

// Save contact person
async function saveContactPerson() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    // Basic validation
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('invalid');
            isValid = false;
        } else {
            field.classList.remove('invalid');
        }
    });
    
    if (!isValid) {
        alert('Please fill in all required fields');
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
            // In a real application, send this data to the API
            console.log('Saving contact person to API:', contactData);
        } else {
            console.log('API not available, saving contact person locally:', contactData);
            showNotification('Changes saved locally. Will sync when online.');
        }
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
        
        // Update UI and cache
        updateContactPersonsUI();
        updateProfileUI();
        
        // Close modal
        closeModal(document.getElementById('contactFormModal'));
        
        // Show success message
        showNotification(contactData.id ? 'Contact updated successfully' : 'Contact added successfully');
    } catch (error) {
        console.error('Error saving contact person:', error);
        alert('Failed to save contact person. Please try again.');
    }
}

// Open contact details modal
function openContactDetailsModal(contact) {
    const modal = document.getElementById('contactModal');
    if (!modal || !contact) return;
    
    document.getElementById('modalContactName').textContent = contact.name || 'Unknown';
    document.getElementById('modalContactTitle').textContent = contact.position || 'Position not specified';
    document.getElementById('modalContactEmail').textContent = contact.email || 'No email provided';
    document.getElementById('modalContactPhone').textContent = contact.phone || 'No phone provided';
    
    openModal(modal);
}

// Add missing function to fix "Add Contact" button
function openAddContactModal() {
    // Simply call the existing contact form modal with no contact (to create new)
    openContactFormModal(null);
}

// Add missing modal close functions
function closeEditProfileModal() {
    closeModal(document.getElementById('editProfileModal'));
}

function closeContactFormModal() {
    closeModal(document.getElementById('contactFormModal'));
}

// Helper functions
function getEmployerId() {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    
    if (idFromUrl) {
        debug('Got employer ID from URL:', idFromUrl);
        return idFromUrl;
    }
    
    // Then check localStorage for explicitly set employer ID
    const storedId = localStorage.getItem('currentEmployerId');
    if (storedId) {
        debug('Got employer ID from localStorage:', storedId);
        return storedId;
    }
    
    // Last fallback to a default ID (for demo/testing)
    debug('Using default employer ID: 1');
    return '1';
}

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

function showLoading() {
    loadingIndicator.style.display = 'flex';
    errorMessage.style.display = 'none';
    profileContent.style.display = 'none';
}

function showError(message) {
    loadingIndicator.style.display = 'none';
    errorMessage.style.display = 'flex';
    profileContent.style.display = 'none';
    errorText.textContent = message;
}

function showContent() {
    console.log("Showing content, hiding loading and error states");
    
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
        console.log("Loading indicator hidden");
    }
    
    if (errorMessage) {
        errorMessage.style.display = 'none';
        console.log("Error message hidden");
    }
    
    if (profileContent) {
        profileContent.style.display = 'block';
        console.log("Profile content made visible");
    } else {
        console.error("Cannot show profile content - element not found in DOM");
    }
    
    // Log that content is now visible
    debug('Profile content is now visible');
}

function openModal(modal) {
    if (modal) modal.style.display = 'block';
}

function closeModal(modal) {
    if (modal) modal.style.display = 'none';
}

function showNotification(message, duration = 3000, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Set the appropriate color based on notification type
    if (type === 'error') {
        notification.style.backgroundColor = '#ef4444';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#f59e0b';
    } else if (type === 'success') {
        notification.style.backgroundColor = '#10b981';
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after specified duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Update debug info display
function updateDebugInfo() {
    // If debug section doesn't exist, exit
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo) return;
    
    // Update debug values
    const debugApiUrl = document.getElementById('debugApiUrl');
    const debugEmployerId = document.getElementById('debugEmployerId');
    const debugConnectionStatus = document.getElementById('debugConnectionStatus');
    const debugDataSource = document.getElementById('debugDataSource');
    
    if (debugApiUrl) debugApiUrl.textContent = API_URL;
    if (debugEmployerId) debugEmployerId.textContent = getEmployerId();
    
    // Set connection status
    checkApiConnectivity().then(isConnected => {
        if (debugConnectionStatus) {
            debugConnectionStatus.textContent = isConnected ? 'Connected' : 'Disconnected';
            debugConnectionStatus.style.color = isConnected ? 'green' : 'red';
        }
    });
    
    // Set data source
    if (debugDataSource) {
        if (!employerData) {
            debugDataSource.textContent = 'No data loaded';
        } else if (employerData === MOCK_EMPLOYER) {
            debugDataSource.textContent = 'Mock Data';
            debugDataSource.style.color = 'orange';
        } else if (localStorage.getItem('employerProfileCache')) {
            debugDataSource.textContent = 'API Data';
            debugDataSource.style.color = 'green';
        }
    }
}

// Add debugging messages and logging for button interaction issues
function debugButtons() {
    console.log("Debug: Setting up button event listeners");
    
    // Debug all buttons in the document
    const allButtons = document.querySelectorAll('button, .btn');
    console.log(`Debug: Found ${allButtons.length} buttons on page`);
    
    allButtons.forEach((btn, index) => {
        console.log(`Button ${index}: id="${btn.id}", class="${btn.className}", text="${btn.textContent.trim()}"`);
        
        // Add a test click handler to verify buttons are receiving events
        btn.addEventListener('click', function(e) {
            console.log(`Button clicked: ${btn.id || 'unnamed button'}`);
        });
    });
} 