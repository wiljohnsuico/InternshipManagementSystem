// Fallback Job Listing Script - Minimal Version

// API URL from meta tag
function getApiUrl() {
    const metaTag = document.querySelector('meta[name="api-url"]');
    if (metaTag && metaTag.content) {
        return metaTag.content;
    }
    return 'http://localhost:5004/api'; // Fallback
}

// Global state
let currentPage = 1;
let totalPages = 1;
const pageSize = 9;

// Basic setup for search fields
function setupSearchFields() {
    console.log("Setting up search fields");
    const searchInput = document.getElementById("search-input");
    const locationInput = document.getElementById("location-input");
    const searchButton = document.getElementById("search-button");
    
    if (searchButton) {
        searchButton.addEventListener("click", function() {
            const search = searchInput ? searchInput.value : "";
            const location = locationInput ? locationInput.value : "";
            let isPaid = null;
            
            const paidRadio = document.getElementById("paid");
            const unpaidRadio = document.getElementById("unpaid");
            
            if (paidRadio && paidRadio.checked) {
                isPaid = true;
            } else if (unpaidRadio && unpaidRadio.checked) {
                isPaid = false;
            }
            
            fetchJobListings(search, location, isPaid);
        });
    }
}

// Fetch job listings
async function fetchJobListings(search = "", location = "", isPaid = null, page = currentPage) {
    const jobListingsContainer = document.getElementById("job-listings");
    if (!jobListingsContainer) {
        console.error("Job listings container not found");
        return;
    }
    
    try {
        // Display loading state
        jobListingsContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading job listings...</p>
            </div>
        `;
        
        // Get auth token
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("You must be logged in to view job listings");
        }

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (search) queryParams.append("search", search);
        if (location) queryParams.append("location", location);
        if (isPaid !== null) queryParams.append("isPaid", isPaid);
        queryParams.append("page", page);
        queryParams.append("limit", pageSize);
        
        // Get the API URL
        const apiUrl = getApiUrl();
        
        // Build the full URL
        const url = `${apiUrl}/jobs?${queryParams.toString()}`;
        console.log("Fetching job listings from:", url);
        
        // Make the API request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch job listings: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.listings && data.listings.length > 0) {
            // Update pagination variables
            currentPage = data.page || 1;
            totalPages = data.totalPages || 1;
            
            // Update results count
            const resultCount = document.getElementById("results-count");
            if (resultCount) {
                resultCount.textContent = data.totalCount || data.listings.length;
            }
            
            // Display listings
            displayJobListings(data.listings);
        } else {
            // No results found
            jobListingsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No job listings found matching your search criteria</p>
                </div>
            `;
            
            const resultCount = document.getElementById("results-count");
            if (resultCount) {
                resultCount.textContent = "0";
            }
        }
    } catch (error) {
        console.error("Error fetching job listings:", error);
        
        jobListingsContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${error.message || "Failed to load job listings"}</p>
                <button class="btn btn-primary" onclick="fetchJobListings()">Retry</button>
            </div>
        `;
    }
}

// Function to display job listings
function displayJobListings(listings) {
    const jobListingsContainer = document.getElementById("job-listings");
    if (!jobListingsContainer) return;
    
    jobListingsContainer.innerHTML = "";
    
    listings.forEach(listing => {
        const isPaid = listing.is_paid === true || listing.is_paid === "true" || listing.is_paid === 1;
        const jobId = listing.id || listing.listing_id;
        const jobTitle = listing.job_title || listing.title || "Job Position";
        
        const card = document.createElement("div");
        card.className = "job-card";
        card.setAttribute("data-job-id", jobId);
        
        card.innerHTML = `
            <h3 class="job-title">${jobTitle}</h3>
            <div class="company-name">${listing.company_name || "Company"}</div>
            <div class="job-details">
                <span><i class="fas fa-map-marker-alt"></i> ${listing.location || "Location not specified"}</span>
                <span><i class="fas fa-clock"></i> ${listing.duration || "Duration not specified"}</span>
            </div>
            <div class="compensation-badge ${isPaid ? 'paid' : 'unpaid'}">
                <i class="${isPaid ? 'fas fa-money-bill-wave' : 'fas fa-hand-holding-heart'}"></i>
                ${isPaid ? 'Paid' : 'Unpaid'} Internship
            </div>
            <div class="job-description">
                ${listing.description?.substring(0, 150)}${listing.description?.length > 150 ? '...' : ''}
            </div>
            <div class="card-actions">
                <button class="btn btn-primary apply-btn" data-job-id="${jobId}" 
                    onclick="openApplicationModal('${jobId}', '${jobTitle.replace(/'/g, "\\'")}')">
                    Apply
                </button>
                <button class="btn btn-outline" onclick="window.location.href='job-details.html?id=${jobId}'">
                    View Details
                </button>
            </div>
        `;
        
        jobListingsContainer.appendChild(card);
    });
}

// Function to open the application modal
function openApplicationModal(jobId, jobTitle) {
    // Get API URL
    const apiUrl = getApiUrl();
    const token = localStorage.getItem("token");
    
    if (!token) {
        alert("You must be logged in to apply for jobs");
        window.location.href = "login.html";
        return;
    }
    
    // First check if the user can apply
    fetch(`${apiUrl}/applications/${jobId}/can-apply`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.canApply === false) {
            // Handle different reasons why user can't apply
            if (data.reason === 'rejected') {
                // Show a specific message for rejected interns
                alert('Your account verification has been rejected. You cannot apply for internships. Please contact an administrator for assistance.');
                return;
            } else if (data.reason === 'not_approved') {
                // Show a specific message for not approved interns
                const status = data.status || 'Pending';
                let statusMessage = '';
                
                if (status === 'Pending') {
                    statusMessage = 'Your account is currently pending approval.';
                } else if (status === 'Rejected') {
                    statusMessage = 'Your account verification was rejected.';
                }
                
                alert(`You cannot apply for jobs yet. ${statusMessage} Please contact an administrator for assistance.`);
                return;
            } else if (data.reason === 'already_applied') {
                alert("You have already applied for this position.");
                return;
            } else if (data.reason === 'job_not_found') {
                alert("This job listing is no longer active.");
                return;
            } else {
                // Generic message for other reasons
                alert(data.message || "You cannot apply for this position at this time.");
                return;
            }
        }
        
        // Continue with showing the modal for approved interns
        const modal = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');
        
        if (!modal || !modalContainer) {
            console.error("Modal elements not found");
            return;
        }
        
        // Set job title in modal
        const jobTitleInModal = document.getElementById('jobTitleInModal');
        if (jobTitleInModal) {
            jobTitleInModal.textContent = jobTitle;
        }
        
        // Set the listing ID in the hidden field
        const listingIdField = document.getElementById('listingId');
        if (listingIdField) {
            listingIdField.value = jobId;
        }
        
        // Reset form
        const form = document.getElementById('applicationForm');
        if (form) form.reset();
        
        // Show the modal
        modal.style.display = 'block';
        modalContainer.style.display = 'block';
        
        // Add close button functionality
        const closeBtn = document.getElementById('modalClose');
        if (closeBtn) {
            closeBtn.onclick = function() {
                modal.style.display = 'none';
                modalContainer.style.display = 'none';
            };
        }
        
        // Setup form submission
        if (form) {
            form.onsubmit = async function(e) {
                e.preventDefault();
                
                try {
                    const formData = new FormData(form);
                    
                    if (!token) {
                        throw new Error("You must be logged in to apply");
                    }
                    
                    const response = await fetch(`${apiUrl}/applications/${jobId}`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        },
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert("Application submitted successfully!");
                        modal.style.display = 'none';
                        modalContainer.style.display = 'none';
                        
                        // Refresh the page to update UI
                        window.location.reload();
                    } else {
                        alert(data.message || "Failed to submit application");
                    }
                } catch (error) {
                    console.error("Error submitting application:", error);
                    alert("Failed to submit application: " + error.message);
                }
            };
        }
    })
    .catch(error => {
        console.error("Error checking application eligibility:", error);
        alert("Error: Could not verify your eligibility to apply. Please try again later.");
    });
}

// Check verification status of the current intern
async function checkVerificationStatus() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No authentication token found, cannot check verification status');
            return;
        }
        
        const apiUrl = getApiUrl();
        
        // Make a request to get intern's verification status
        // Using a generic job ID (1) just to utilize the existing endpoint
        const response = await fetch(`${apiUrl}/applications/1/can-apply`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('Verification status check response:', data);
        
        // Add banner based on verification status
        if (data.reason === 'not_approved') {
            // Intern account is not approved
            const status = data.status || 'Pending';
            addStatusBanner(status);
        } else if (data.reason === 'intern_not_found') {
            // No intern profile
            addStatusBanner('profile_missing');
        }
    } catch (error) {
        console.error('Error checking verification status:', error);
    }
}

// Add a status banner to the page
function addStatusBanner(status) {
    // First check if banner already exists
    if (document.getElementById('verification-status-banner')) {
        return;
    }
    
    // Create banner element
    const banner = document.createElement('div');
    banner.id = 'verification-status-banner';
    banner.style.width = '100%';
    banner.style.padding = '15px 20px';
    banner.style.boxSizing = 'border-box';
    banner.style.textAlign = 'center';
    banner.style.fontSize = '16px';
    banner.style.fontWeight = 'bold';
    banner.style.display = 'flex';
    banner.style.justifyContent = 'space-between';
    banner.style.alignItems = 'center';
    banner.style.position = 'relative';
    banner.style.zIndex = '1000';
    
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.style.flex = '1';
    
    let message = '';
    let icon = '';
    
    // Set banner style and message based on status
    if (status === 'Pending') {
        banner.style.backgroundColor = '#fff8e1';
        banner.style.color = '#856404';
        banner.style.borderBottom = '1px solid #ffeeba';
        message = 'Your account is pending approval. You cannot apply for jobs until an administrator approves your account.';
        icon = '<i class="fas fa-clock" style="margin-right: 10px;"></i>';
    } else if (status === 'Rejected') {
        banner.style.backgroundColor = '#f8d7da';
        banner.style.color = '#721c24';
        banner.style.borderBottom = '1px solid #f5c6cb';
        message = 'Your account verification was rejected. Please contact an administrator for assistance.';
        icon = '<i class="fas fa-exclamation-circle" style="margin-right: 10px;"></i>';
    } else if (status === 'profile_missing') {
        banner.style.backgroundColor = '#d1ecf1';
        banner.style.color = '#0c5460';
        banner.style.borderBottom = '1px solid #bee5eb';
        message = 'You need to complete your profile before you can apply for internships.';
        icon = '<i class="fas fa-user-edit" style="margin-right: 10px;"></i>';
    }
    
    // Set the message
    messageContainer.innerHTML = icon + message;
    banner.appendChild(messageContainer);
    
    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '20px';
    closeButton.style.marginLeft = '15px';
    closeButton.style.color = 'inherit';
    closeButton.style.padding = '0 5px';
    
    closeButton.addEventListener('click', function() {
        banner.style.display = 'none';
    });
    
    banner.appendChild(closeButton);
    
    // Add the banner to the page (after the header)
    const header = document.querySelector('.main-header');
    if (header) {
        header.insertAdjacentElement('afterend', banner);
    } else {
        // If no header found, insert at the beginning of the body
        document.body.insertAdjacentElement('afterbegin', banner);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Get API URL
    initApiUrl();
    
    // Check verification status and show appropriate notification
    await checkVerificationStatus();
    
    // Load job listings
    loadJobListings();
    
    // Set up search functionality
    setupSearch();
}); 