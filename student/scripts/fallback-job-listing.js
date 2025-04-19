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
    const modal = document.getElementById('modalOverlay');
    const modalContainer = document.getElementById('modalContainer');
    const jobTitleInModal = document.getElementById('jobTitleInModal');
    const listingIdField = document.getElementById('listingId');
    
    if (!modal || !modalContainer) {
        console.error("Modal elements not found");
        return;
    }
    
    // Set the job title in the modal
    if (jobTitleInModal) {
        jobTitleInModal.textContent = jobTitle;
    }
    
    // Set the listing ID in the hidden field
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
                const token = localStorage.getItem("token");
                
                if (!token) {
                    throw new Error("You must be logged in to apply");
                }
                
                const apiUrl = getApiUrl();
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
} 