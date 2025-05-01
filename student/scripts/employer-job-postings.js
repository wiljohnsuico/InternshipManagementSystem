// Employer Job Postings JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const API_URL = 'http://localhost:5004/api';
    
    // Initialize elements
    const createJobBtn = document.getElementById('createJobBtn');
    const jobPostingsTable = document.getElementById('jobListingsTable');
    const jobModal = document.getElementById('jobModal');
    const closeJobModalBtn = document.getElementById('closeJobModal');
    const saveJobBtn = document.getElementById('saveJobBtn');
    const jobForm = document.getElementById('jobForm');
    const previewModal = document.getElementById('previewModal');
    const closePreviewBtn = document.getElementById('closePreviewModal');
    const previewJobBtn = document.getElementById('previewJobBtn');
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const jobSearchInput = document.getElementById('jobSearch');
    const statusFilterSelect = document.getElementById('statusFilter');
    const sortSelect = document.getElementById('sortSelect');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Job ID for editing
    let currentJobId = null;
    let jobsData = [];
    
    // Initialize the page
    init()
        .then(() => {
            // Setup event listeners
            setupEventListeners();
        })
        .catch(error => {
            console.error('Initialization error:', error.message);
            // Redirect to login page with error message
            redirectToLogin('You must be logged in as an employer to access this page');
        });
    
    // Setup event listeners
    function setupEventListeners() {
        // Create job button
        if (createJobBtn) {
            createJobBtn.addEventListener('click', () => {
                openJobModal();
            });
        }
        
        // Refresh jobs button
        const refreshJobsBtn = document.getElementById('refreshJobsBtn');
        if (refreshJobsBtn) {
            refreshJobsBtn.addEventListener('click', async () => {
                console.log('Manual refresh triggered');
                showToast('Refreshing job listings...', 'info');
                await loadJobPostings(true); // true = show loading indicator
            });
        }
        
        // Close job modal
        if (closeJobModalBtn) {
            closeJobModalBtn.addEventListener('click', () => {
                closeJobModal();
            });
        }
        
        // Save job button
        if (saveJobBtn) {
            saveJobBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default button behavior
                console.log('Save button clicked');
                saveJob();
                return false; // Prevent form submission
            });
        }
        
        // Attach submit handler to the form itself
        if (jobForm) {
            jobForm.addEventListener('submit', (e) => {
                e.preventDefault(); // Prevent form submission
                console.log('Form submit prevented');
                saveJob();
                return false;
            });
        }
        
        // Preview job button
        if (previewJobBtn) {
            previewJobBtn.addEventListener('click', (e) => {
                e.preventDefault();
                previewJob();
            });
        }
        
        // Close preview button
        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', () => {
                closePreviewModal();
            });
        }
        
        // Save from preview button
        const saveFromPreviewBtn = document.getElementById('saveFromPreviewBtn');
        if (saveFromPreviewBtn) {
            saveFromPreviewBtn.addEventListener('click', () => {
                closePreviewModal();
                saveJob();
            });
        }
        
        // Edit from preview button
        const editFromPreviewBtn = document.getElementById('editFromPreviewBtn');
        if (editFromPreviewBtn) {
            editFromPreviewBtn.addEventListener('click', () => {
                closePreviewModal();
            });
        }
        
        // Cancel delete button
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                closeDeleteModal();
            });
        }
        
        // Confirm delete button
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                deleteJob();
            });
        }
        
        // Search input
        if (jobSearchInput) {
            jobSearchInput.addEventListener('input', debounce(() => {
                filterJobs();
            }, 300));
        }
        
        // Status filter
        if (statusFilterSelect) {
            statusFilterSelect.addEventListener('change', () => {
                filterJobs();
            });
        }
        
        // Sort select
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                filterJobs();
            });
        }
        
        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Navbar links
        setupNavbarLinks();

        // Event delegation for modal clicks to prevent closing when clicking inside
        document.addEventListener('click', function(event) {
            if (event.target.matches('.modal')) {
                // Close the specific modal that was clicked
                if (event.target === jobModal) closeJobModal();
                if (event.target === previewModal) closePreviewModal();
                if (event.target === deleteModal) closeDeleteModal();
            }
        });
        
        // Check for job ID in URL for editing
        const urlParams = new URLSearchParams(window.location.search);
        const jobId = urlParams.get('id');
        if (jobId) {
            loadJobDetails(jobId);
        }
    }
    
    // Setup navbar links
    function setupNavbarLinks() {
        // Get all navbar links
        const navLinks = document.querySelectorAll('.nav-links a');
        
        // Add active class to current page
        const currentPath = window.location.pathname;
        navLinks.forEach(link => {
            // Remove any existing active classes
            link.classList.remove('active');
            
            // Check if this link is for the current page
            if (link.getAttribute('href') === currentPath || 
                link.getAttribute('href') === window.location.href) {
                link.classList.add('active');
            }
            
            // Add click event for tracking
            link.addEventListener('click', function(e) {
                console.log(`Navigating to: ${this.getAttribute('href')}`);
            });
        });
    }
    
    // Load job postings
    async function loadJobPostings(showLoading = true) {
        if (!jobPostingsTable) {
            console.error("jobPostingsTable element not found in the DOM");
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            console.log("Token available:", !!token);
            
            // Show loading state if requested
            if (showLoading) {
                jobPostingsTable.innerHTML = `
                    <tr>
                        <td colspan="6" class="loading-row">Loading job postings...</td>
                    </tr>
                `;
            }
            
            let jobsData = [];
            let usesMockData = false;
            
            // Try to use real API first if token exists
            if (token) {
                try {
                    console.log("Attempting to fetch job listings from API...");
                    // Use the correct endpoint for employer job listings
                    const apiUrl = `${API_URL}/jobs/employer/my-listings`;
                    console.log("Fetching from endpoint:", apiUrl);
                    
                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    console.log("API response status:", response.status);
                    
                    if (response.ok) {
                        const responseText = await response.text();
                        console.log("Raw API response:", responseText);
                        
                        let data;
                        try {
                            data = JSON.parse(responseText);
                            console.log("Parsed job listings response:", data);
                        } catch (e) {
                            console.error("Failed to parse API response:", e);
                            showToast("Error parsing API response", "error");
                            data = { success: false };
                        }
                        
                        if (data.success && data.listings && data.listings.length > 0) {
                            console.log(`Found ${data.listings.length} job listings from API`);
                            jobsData = data.listings;
                        } else if (data.listings && data.listings.length > 0) {
                            // Alternative format
                            console.log(`Found ${data.listings.length} job listings from API (alternative format)`);
                            jobsData = data.listings;
                        } else {
                            // No jobs from API but response was successful
                            console.log("No job listings found from API:", data);
                            if (showLoading) {
                                showToast('No job listings found. Create your first job posting!', 'info');
                            }
                            // Use empty array
                            jobsData = [];
                        }
                    } else {
                        console.error("Failed to load job postings, status:", response.status);
                        try {
                            const errorText = await response.text();
                            console.error("Error response:", errorText);
                        } catch (e) {}
                        usesMockData = true;
                    }
                } catch (error) {
                    console.error('API error, using mock data:', error);
                    usesMockData = true;
                }
            } else {
                // No token, use mock data
                console.log("No authentication token found, using mock data");
                usesMockData = true;
            }
            
            // If API failed or no token, use mock data
            if (usesMockData) {
                console.log("Using mock job data");
                
                // Get mock data from localStorage or create new mock data
                let storedMockJobs = localStorage.getItem('mockJobPostings');
                if (storedMockJobs) {
                    console.log("Loading mock data from localStorage");
                    try {
                        jobsData = JSON.parse(storedMockJobs);
                    } catch (e) {
                        console.error("Failed to parse mock jobs from localStorage:", e);
                        jobsData = [];
                    }
                } else {
                    console.log("Creating new mock data");
                    // Create some mock job listings with application counts
                    jobsData = [
                        {
                            listing_id: 'mock_1',
                            job_title: 'Software Developer Intern',
                            location: 'San Francisco, CA',
                            created_at: new Date().toISOString(),
                            application_count: 5,
                            status: 'Active',
                            job_description: 'Example job description for a software developer intern position.',
                            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            positions: 1,
                            compensationType: 'Paid',
                            compensationAmount: '$50,000',
                            compensationDetails: 'Yearly salary'
                        },
                        {
                            listing_id: 'mock_2',
                            job_title: 'Marketing Intern',
                            location: 'New York, NY',
                            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                            application_count: 3,
                            status: 'Active',
                            job_description: 'Example job description for a marketing intern position.',
                            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                            positions: 1,
                            compensationType: 'Unpaid',
                            compensationAmount: '',
                            compensationDetails: 'Volunteer position'
                        },
                        {
                            listing_id: 'mock_3',
                            job_title: 'Graphic Design Intern',
                            location: 'Remote',
                            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                            application_count: 8,
                            status: 'Active',
                            job_description: 'We are looking for a creative graphic design intern to join our marketing team.',
                            deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
                            positions: 1,
                            compensationType: 'Paid',
                            compensationAmount: '$30,000',
                            compensationDetails: 'Yearly salary'
                        }
                    ];
                    
                    localStorage.setItem('mockJobPostings', JSON.stringify(jobsData));
                }
                
                if (showLoading) {
                    showToast('Using mock data - changes won\'t be saved to server', 'info');
                }
            }
            
            console.log("Final jobs data before filtering deleted jobs:", jobsData.length);
            
            // Make sure jobsData is an array
            if (!Array.isArray(jobsData)) {
                console.error("Jobs data is not an array:", jobsData);
                jobsData = [];
            }
            
            // Filter out deleted jobs
            const beforeFilterCount = jobsData.length;
            jobsData = jobsData.filter(job => {
                // Check for is_deleted flag
                if (job.is_deleted === true) {
                    console.log(`Filtering out deleted job: ${job.job_title || job.jobTitle}`);
                    return false;
                }
                
                // Check status (case insensitive)
                const status = (job.status || '').toLowerCase();
                if (status === 'deleted') {
                    console.log(`Filtering out job with deleted status: ${job.job_title || job.jobTitle}`);
                    return false;
                }
                
                // Also check deleted_at property
                if (job.deleted_at) {
                    console.log(`Filtering out job with deleted_at timestamp: ${job.job_title || job.jobTitle}`);
                    return false;
                }
                
                // Also check local deleted jobs tracking
                const deletedJobs = getDeletedJobIds();
                if (deletedJobs.includes(job.listing_id) || deletedJobs.includes(job.id)) {
                    console.log(`Filtering out locally tracked deleted job: ${job.job_title || job.jobTitle}`);
                    return false;
                }
                
                return true;
            });
            
            if (beforeFilterCount > jobsData.length) {
                console.log(`Filtered out ${beforeFilterCount - jobsData.length} deleted jobs`);
            }
            
            // Store the data for filtering
            window.allJobsData = jobsData;
            
            // Always clear the table first
            jobPostingsTable.innerHTML = '';
            
            // Render the job postings
            renderJobPostings(jobsData);
        } catch (error) {
            console.error('Error loading job postings:', error);
            jobPostingsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="error-row">Error loading job postings. Please try again later.</td>
                </tr>
            `;
        }
    }
    
    // Render job postings to the table
    function renderJobPostings(jobs) {
        if (!jobPostingsTable) return;
        
        // Clear table
        jobPostingsTable.innerHTML = '';
        
        // Check if we have jobs to display
        if (!jobs || jobs.length === 0) {
            showEmptyState('No job postings found');
            return;
        }
        
        // Sort by created date (newest first by default)
        jobs.sort((a, b) => {
            const dateA = new Date(a.created_at || a.createdAt || 0);
            const dateB = new Date(b.created_at || b.createdAt || 0);
            return dateB - dateA;
        });
        
        // Create a row for each job
        jobs.forEach(job => {
            const row = document.createElement('tr');
            
            // Handle different possible data structures
            const jobId = job.listing_id || job.id || '';
            const jobTitle = job.job_title || job.jobTitle || '';
            const location = job.location || '';
            const createdAt = job.created_at || job.createdAt || new Date();
            const formattedDate = new Date(createdAt).toLocaleDateString();
            const applicationCount = job.application_count || job.applications || 0;
            const status = job.status || 'Active';
            
            const statusClass = 
                status === 'Active' ? 'badge-success' : 
                status === 'Closed' ? 'badge-danger' : 
                status === 'Filled' ? 'badge-info' : 'badge-secondary';
            
            // Format the deadline date
            const deadlineDate = job.deadline ? new Date(job.deadline) : null;
            const formattedDeadline = deadlineDate 
                ? deadlineDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) 
                : 'No deadline specified';
            
            row.innerHTML = `
                <td>${truncateText(jobTitle, 50)}</td>
                <td>${truncateText(location, 30)}</td>
                <td>${formattedDate}</td>
                <td>${applicationCount}</td>
                <td><span class="badge ${statusClass}">${status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary view-btn" data-id="${jobId}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning edit-btn" data-id="${jobId}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${jobId}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            // Add row to the table first
            jobPostingsTable.appendChild(row);
            
            // Then add event listeners for action buttons
            const viewBtn = row.querySelector('.view-btn');
            const editBtn = row.querySelector('.edit-btn');
            const deleteBtn = row.querySelector('.delete-btn');
            
            if (viewBtn) {
                viewBtn.addEventListener('click', function() {
                    console.log('View button clicked for job ID:', jobId);
                    loadJobPreview(jobId);
                });
            }
            
            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    console.log('Edit button clicked for job ID:', jobId);
                    openJobModal(jobId);
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    console.log('Delete button clicked for job ID:', jobId);
                    openDeleteModal(jobId);
                });
            }
        });
    }
    
    // Show empty state
    function showEmptyState(message) {
        if (jobPostingsTable) {
            jobPostingsTable.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">${message}</td>
                </tr>
            `;
        }
    }
    
    // Show or hide error banner
    function showErrorBanner(message, show = true) {
        const errorBanner = document.getElementById('errorBanner');
        const errorMessage = document.getElementById('errorMessage');
        
        if (!errorBanner || !errorMessage) return;
        
        if (show) {
            errorMessage.textContent = message;
            errorBanner.classList.add('show');
        } else {
            errorBanner.classList.remove('show');
        }
    }
    
    // Open job modal for creating/editing
    function openJobModal(jobId = null) {
        if (!jobModal) {
            console.error('Job modal not found');
            return;
        }
        
        console.log('Opening job modal', jobId ? 'for editing' : 'for creation');
        
        // Reset form
        if (jobForm) {
            jobForm.reset();
        }
        
        // Hide any previous error messages
        showErrorBanner('', false);
        
        // Set job ID
        currentJobId = jobId;
        
        // Update modal title
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = jobId ? 'Edit Job Posting' : 'Create New Job Posting';
        }
        
        // Default status to "Active" for new jobs
        if (!jobId && document.getElementById('status')) {
            document.getElementById('status').value = 'Active';
        }
        
        // Default positions to 1
        if (!jobId && document.getElementById('positions')) {
            document.getElementById('positions').value = '1';
        }
        
        // Show modal
        jobModal.style.display = 'block';
        jobModal.classList.add('show');
        
        // Focus on job title field
        if (document.getElementById('jobTitle')) {
            setTimeout(() => document.getElementById('jobTitle').focus(), 100);
        }
    }
    
    // Close job modal
    function closeJobModal() {
        if (jobModal) {
            jobModal.classList.remove('show');
            setTimeout(() => {
                jobModal.style.display = 'none';
            }, 300);
            currentJobId = null;
            
            // Reset form
            if (jobForm) {
                jobForm.reset();
            }
        }
    }
    
    // Load job details for editing
    async function loadJobDetails(jobId) {
        try {
            // Open the job modal (will be populated once data is loaded)
            openJobModal();
            currentJobId = jobId;
            
            // Update modal title
            const modalTitle = document.getElementById('modalTitle');
            if (modalTitle) {
                modalTitle.textContent = 'Edit Job Posting';
            }
            
            // Show loading state within the form
            const formContainer = document.querySelector('.modal-body');
            const loadingHTML = '<div class="loading-spinner">Loading job details...</div>';
            let originalContent = null;
            
            if (formContainer) {
                originalContent = formContainer.innerHTML;
                // Add loading indicator before the form
                formContainer.insertAdjacentHTML('afterbegin', 
                    '<div id="loading-indicator" class="loading-overlay">' + loadingHTML + '</div>');
            }
            
            // Check if this is a mock job from localStorage
            if (jobId.toString().startsWith('mock_')) {
                // Get from localStorage
                const mockJobs = JSON.parse(localStorage.getItem('mockJobPostings') || '[]');
                const job = mockJobs.find(j => j.listing_id === jobId);
                
                if (job) {
                    // Remove loading indicator
                    document.getElementById('loading-indicator')?.remove();
                    populateJobForm(job);
                } else {
                    showToast('Job details not found', 'error');
                    closeJobModal();
                }
                return;
            }
            
            // Get from API
            const token = localStorage.getItem('token');
            
            if (!token) {
                showToast('Authentication token not found', 'error');
                closeJobModal();
                return;
            }
            
            const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Remove loading indicator regardless of result
            document.getElementById('loading-indicator')?.remove();
            
            if (!response.ok) {
                showToast('Failed to load job details', 'error');
                closeJobModal();
                return;
            }
            
            const data = await response.json();
            console.log('Job details:', data);
            
            if (data.success && data.listing) {
                // Populate the form with the job data
                populateJobForm(data.listing);
            } else {
                showToast('Job details not found', 'error');
                closeJobModal();
            }
        } catch (error) {
            console.error('Error loading job details:', error);
            showToast('Error loading job details', 'error');
            closeJobModal();
        }
    }
    
    // Populate job form with data
    function populateJobForm(job) {
        try {
            console.log('Populating job form with data:', job);
            
            // Reset the form if it exists
            if ($('#jobForm').length) {
                $('#jobForm')[0].reset();
            }
            
            // Set modal title
            if ($('#modalTitle').length) {
                $('#modalTitle').text('Edit Job Posting');
            }
            
            // Populate form fields with job data
            $('#jobTitle').val(job.job_title || '');
            $('#location').val(job.location || '');
            $('#jobDescription').val(job.description || ''); // Changed from job_description to description
            $('#requirements').val(job.requirements || '');
            
            // Handle skills array or string
            if (job.skills) {
                if (typeof job.skills === 'string') {
                    try {
                        // Try to parse if it's a JSON string
                        const skillsArray = JSON.parse(job.skills);
                        $('#skills').val(Array.isArray(skillsArray) ? skillsArray.join(', ') : job.skills);
                    } catch (e) {
                        // If not parsable, just use as is
                        $('#skills').val(job.skills);
                    }
                } else if (Array.isArray(job.skills)) {
                    $('#skills').val(job.skills.join(', '));
                }
            }
            
            // Format and set deadline if available
            if (job.deadline) {
                const deadlineDate = new Date(job.deadline);
                if (!isNaN(deadlineDate.getTime())) {
                    const formattedDate = deadlineDate.toISOString().split('T')[0];
                    $('#deadline').val(formattedDate);
                }
            }
            
            // Set positions
            $('#positions').val(job.positions || 1);
            
            // Set paid status
            if ($('#isPaid').length) {
                $('#isPaid').val(job.is_paid ? '1' : '0');
            }
            
            // Set salary if available
            if (job.salary && $('#salary').length) {
                $('#salary').val(job.salary);
            }
            
            // Set status if available
            if (job.status && $('#status').length) {
                $('#status').val(job.status);
            }
            
            // Store job ID
            currentJobId = job.listing_id || job.id || '';
            
            // Update the save button text
            $('#saveJobBtn').text('Update Job');
        } catch (error) {
            console.error('Error populating job form:', error);
            showToast('Error loading job details', 'error');
        }
    }
    
    // Save job - reworked to properly use the API
    async function saveJob() {
        try {
            console.log('Save job function called');
            
            // If we have a job ID, we're updating an existing job
            if (currentJobId) {
                return await updateJob(currentJobId);
            }
            
            // Clear previous error banners
            if ($('#error-banner').length) {
                $('#error-banner').remove();
            }
            
            // Get form values
            const jobTitle = $('#jobTitle').val() ? $('#jobTitle').val().trim() : '';
            const location = $('#location').val() ? $('#location').val().trim() : '';
            const jobDescription = $('#jobDescription').val() ? $('#jobDescription').val().trim() : '';
            const requirements = $('#requirements').val() ? $('#requirements').val().trim() : '';
            const skills = $('#skills').val() ? $('#skills').val().trim() : '';
            const deadline = $('#deadline').val() ? $('#deadline').val().trim() : '';
            const positions = $('#positions').val() ? $('#positions').val().trim() : '';
            const isPaid = $('#isPaid').val() || '1';
            const salary = $('#salary').val() || '';
            const status = $('#status').val() || 'Active';
            
            // Validate form fields
            if (!jobTitle) {
                showErrorBanner('Job title is required');
                return;
            }
            
            if (!location) {
                showErrorBanner('Location is required');
                return;
            }
            
            if (!jobDescription) {
                showErrorBanner('Job description is required');
                return;
            }

            if (!deadline) {
                showErrorBanner('Application deadline is required');
                return;
            }
            
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            
            // Get employer ID from local storage
            const employerId = localStorage.getItem('userId');
            
            // Show loading state
            $('#saveJobBtn').text('Saving...').prop('disabled', true);
            
            // Get company name from user data
            let companyName = "Company";
            try {
                // First try to get from employerProfile
                const employerProfileStr = localStorage.getItem('employerProfile');
                if (employerProfileStr) {
                    const employerProfile = JSON.parse(employerProfileStr);
                    if (employerProfile && employerProfile.name) {
                        companyName = employerProfile.name;
                    }
                }
                
                // If not found, try userData
                if (companyName === "Company") {
                    const userDataStr = localStorage.getItem('userData') || localStorage.getItem('user');
                    if (userDataStr) {
                        const userData = JSON.parse(userDataStr);
                        companyName = userData.company_name || userData.companyName || "Company";
                    }
                }
                
                console.log(`Using company name: ${companyName}`);
            } catch (error) {
                console.error('Error getting company name:', error);
            }
            
            // Prepare data for API - match the exact format expected by the backend
            const jobData = {
                job_title: jobTitle,
                location: location,
                description: jobDescription,
                requirements: requirements || 'No specific requirements',
                skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
                deadline: deadline,
                positions: parseInt(positions) || 1,
                is_paid: isPaid === '1',
                salary: isPaid === '1' ? (parseInt(salary) || 0) : 0,
                status: status || 'Active',
                company_name: companyName // Add company name to job data
            };
            
            let success = false;
            
            // 5. Check if token is available (if not, save to mock data)
            if (!token) {
                // Save to mock data in localStorage
                const mockJobData = {
                    listing_id: 'mock_' + Date.now(),
                    job_title: jobData.job_title,
                    description: jobData.description,
                    location: jobData.location,
                    created_at: new Date().toISOString(),
                    application_count: 0,
                    skills: jobData.skills,
                    salary: jobData.salary,
                    is_paid: jobData.is_paid,
                    positions: jobData.positions,
                    status: jobData.status,
                    requirements: jobData.requirements,
                    company_name: companyName // Add company name to mock data
                };
                
                // Get existing mock jobs
                const existingMockJobs = JSON.parse(localStorage.getItem('mockJobPostings') || '[]');
                existingMockJobs.push(mockJobData);
                
                // Save back to localStorage
                localStorage.setItem('mockJobPostings', JSON.stringify(existingMockJobs));
                
                console.log('Saved job to mock data:', mockJobData);
                success = true;
                showToast('Job posting saved to mock data', 'success');
            } else {
                // 6. Send to the API
                showToast('Creating job posting...', 'info');
                
                try {
                    console.log('Sending job data to API:', JSON.stringify(jobData, null, 2));
                    
                    // Use the correct API endpoint
                    const apiEndpoint = `${API_URL}/jobs`;
                    
                    console.log(`Sending data to API endpoint: ${apiEndpoint}`);
                    
                    const response = await fetch(apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(jobData)
                    });
                    
                    console.log(`API response status:`, response.status);
                    
                    // Get response text first for debugging
                    const responseText = await response.text();
                    console.log('API raw response:', responseText);
                    
                    let responseData;
                    try {
                        // Try to parse as JSON
                        responseData = JSON.parse(responseText);
                        console.log('API parsed response:', responseData);
                    } catch (parseError) {
                        console.error('Failed to parse API response as JSON:', parseError);
                        responseData = { success: false, message: responseText };
                    }
                    
                    if (response.ok && responseData.success) {
                        // Success!
                        success = true;
                        showToast('Job posting created successfully!', 'success');
                        
                        // Update job listings immediately
                        setTimeout(() => {
                            loadJobPostings(true); // refresh the listing
                        }, 500);
                    } else if (responseData.message && responseData.message.includes('No company associated')) {
                        // Special handling for missing company association
                        showErrorBanner('You need to create a company profile first');
                        $('#saveJobBtn').text('Save Job Posting').prop('disabled', false);
                        return false;
                    } else if (responseData.message && responseData.message.includes('title, description, and location')) {
                        // Special error handling for the common validation error
                        showErrorBanner('Please provide title, description, and location');
                        $('#saveJobBtn').text('Save Job Posting').prop('disabled', false);
                        return false;
                    } else {
                        // Show error message
                        const errorMessage = responseData.message || 'Failed to create job posting';
                        console.error('API error:', errorMessage);
                        showToast(`Error: ${errorMessage}`, 'error');
                        $('#saveJobBtn').text('Save Job Posting').prop('disabled', false);
                        return false;
                    }
                } catch (apiError) {
                    console.error('API call failed:', apiError);
                    showToast('API error: ' + apiError.message, 'error');
                    $('#saveJobBtn').text('Save Job Posting').prop('disabled', false);
                    return false;
                }
            }
            
            // 7. Close modal and refresh if successful
            if (success) {
                // Close the modal
                closeJobModal();
                
                // Reset the form
                if (document.getElementById('jobForm')) {
                    document.getElementById('jobForm').reset();
                }
                
                // Reload job listings after a short delay
                setTimeout(() => {
                    loadJobPostings();
                }, 1000);
                
                return true;
            } else {
                // Reset button
                $('#saveJobBtn').text('Save Job Posting').prop('disabled', false);
            }
            
            return false;
        } catch (error) {
            console.error('Error in saveJob function:', error);
            showToast('Error: ' + (error.message || 'Unknown error'), 'error');
            // Reset button
            $('#saveJobBtn').text('Save Job Posting').prop('disabled', false);
            return false;
        }
    }
    
    // Preview job
    function previewJob() {
        try {
            console.log('Generating job preview...');
            
            // Collect form data for preview
            const jobTitle = $('#jobTitle').val() ? $('#jobTitle').val().trim() : '';
            const location = $('#location').val() ? $('#location').val().trim() : '';
            const jobDescription = $('#jobDescription').val() ? $('#jobDescription').val().trim() : '';
            const requirements = $('#requirements').val() ? $('#requirements').val().trim() : '';
            const skills = $('#skills').val() ? $('#skills').val().trim() : '';
            const deadline = $('#deadline').val() ? $('#deadline').val().trim() : '';
            const positions = $('#positions').val() ? $('#positions').val().trim() : '';
            const isPaid = $('#isPaid').val() || '1';
            const salary = $('#salary').val() || '';
            
            // Create preview data object
            const job = {
                job_title: jobTitle,
                location: location,
                description: jobDescription,
                requirements: requirements,
                skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
                deadline: deadline,
                positions: parseInt(positions) || 1,
                is_paid: isPaid === '1',
                salary: isPaid === '1' ? (parseInt(salary) || 0) : 0,
                created_at: new Date().toISOString()
            };
            
            // Check if required fields are filled
            if (!jobTitle || !location || !jobDescription) {
                showErrorBanner('Please fill in all required fields to preview');
                return;
            }
            
            // Get company name from localStorage with fallbacks
            const companyProfile = JSON.parse(localStorage.getItem('companyProfile') || '{}');
            const companyName = localStorage.getItem('companyName') || 
                                companyProfile.companyName || 
                                JSON.parse(localStorage.getItem('user') || '{}').company_name || 
                                'Your Company';
            
            // Open the preview modal
            openPreviewModal();
            
            // Update preview elements
            $('#previewTitle').text(job.job_title);
            $('#previewLocation').text(job.location);
            $('#previewCompany').text(companyName);
            
            // Format compensation information
            const compensationText = job.is_paid 
                ? `Paid - ${job.salary ? '$' + job.salary : 'Negotiable'}`
                : 'Unpaid';
            $('#previewCompensation').text(compensationText);
            
            // Set positions and deadline
            $('#previewPositions').text(`${job.positions} position${job.positions !== 1 ? 's' : ''}`);
            $('#previewDate').text(formatDate(job.created_at));
            
            // Set description and requirements
            $('#previewDescription').html(job.description.replace(/\n/g, '<br>'));
            $('#previewRequirements').html(job.requirements.replace(/\n/g, '<br>') || 'No specific requirements');
            
            // Set skills
            const skillsHtml = job.skills.length > 0
                ? job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
                : '<span class="skill-tag">No specific skills listed</span>';
            $('#previewSkills').html(skillsHtml);
        } catch (error) {
            console.error('Error generating preview:', error);
            showToast('Error generating preview', 'error');
        }
    }
    
    // Helper function for formatting dates
    function formatDate(dateString) {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    // Close preview modal
    function closePreviewModal() {
        if (previewModal) {
            previewModal.classList.remove('show');
            setTimeout(() => {
                previewModal.style.display = 'none';
            }, 300);
        }
    }
    
    // Open delete confirmation modal
    function openDeleteModal(jobId) {
        if (!deleteModal) {
            console.error('Delete modal not found');
            return;
        }
        
        console.log('Opening delete modal for job ID:', jobId);
        
        // Set current job ID
        currentJobId = jobId;
        
        // Show modal
        deleteModal.style.display = 'block';
        deleteModal.classList.add('show');
    }
    
    // Close delete modal
    function closeDeleteModal() {
        if (deleteModal) {
            deleteModal.classList.remove('show');
            setTimeout(() => {
                deleteModal.style.display = 'none';
            }, 300);
            currentJobId = null;
        }
    }
    
    // Delete job
    async function deleteJob() {
        if (!currentJobId) {
            console.error('No job ID to delete');
            showToast('Error: No job ID specified', 'error');
            return;
        }
        
        try {
            console.log('Deleting job with ID:', currentJobId);
            showToast('Deleting job...', 'info');
            
            // Track this job ID as deleted in localStorage for persistent filtering
            trackDeletedJob(currentJobId);
            
            // Store a reference to the job row before any API calls
            let jobRow = null;
            let jobTitle = '';
            let jobLocation = '';
            
            try {
                // Find the row directly through DOM before proceeding
                const buttons = document.querySelectorAll(`button[data-id="${currentJobId}"]`);
                buttons.forEach(button => {
                    const row = button.closest('tr');
                    if (row) {
                        jobRow = row;
                        // Store job details for alternative removal methods
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 2) {
                            jobTitle = cells[0].textContent.trim();
                            jobLocation = cells[1].textContent.trim();
                        }
                        console.log(`Found job row for "${jobTitle}" at ${jobLocation}`);
                    }
                });
            } catch (e) {
                console.warn('Error finding job row:', e);
            }
            
            // Get token
            const token = localStorage.getItem('token');
            
            let success = false;
            
            // If this is a mock job
            if (currentJobId.toString().startsWith('mock_')) {
                console.log('Deleting mock job from localStorage');
                
                // Get mock jobs from local storage
                const mockJobs = JSON.parse(localStorage.getItem('mockJobPostings') || '[]');
                
                // Find index of job to delete
                const jobIndex = mockJobs.findIndex(job => (job.listing_id || job.id) === currentJobId);
                
                if (jobIndex !== -1) {
                    // Remove job from array
                    mockJobs.splice(jobIndex, 1);
                    
                    // Save back to localStorage
                    localStorage.setItem('mockJobPostings', JSON.stringify(mockJobs));
                    success = true;
                }
            } else if (token) {
                // First try DELETE method
                try {
                    console.log(`Trying DELETE method first: ${API_URL}/jobs/${currentJobId}`);
                    
                    const deleteResponse = await fetch(`${API_URL}/jobs/${currentJobId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    console.log('DELETE response status:', deleteResponse.status);
                    const deleteText = await deleteResponse.text();
                    console.log('DELETE response:', deleteText);
                    
                    if (deleteResponse.ok) {
                        success = true;
                        console.log('DELETE operation successful');
                    }
                } catch (deleteError) {
                    console.error('DELETE request failed:', deleteError);
                }
                
                // If DELETE didn't work, try PUT with status=deleted
                if (!success) {
                    try {
                        console.log(`Trying PUT method as fallback: ${API_URL}/jobs/${currentJobId}`);
                        
                        const putResponse = await fetch(`${API_URL}/jobs/${currentJobId}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                status: 'Deleted',  // Set status to deleted
                                is_deleted: true,   // Add extra field for deletion
                                deleted_at: new Date().toISOString()
                            })
                        });
                        
                        console.log('PUT response status:', putResponse.status);
                        const putText = await putResponse.text();
                        console.log('PUT response:', putText);
                        
                        if (putResponse.ok) {
                            success = true;
                            console.log('PUT operation successful as fallback');
                        }
                    } catch (putError) {
                        console.error('PUT request failed:', putError);
                    }
                }
            }
            
            // Always force UI update regardless of API success
            console.log('Forcing UI update to remove deleted job from table');
            showToast('Job deleted successfully', 'success');
            
            // First close the modal
            closeDeleteModal();
            
            // Remove from UI immediately if we found the row
            if (jobRow) {
                jobRow.remove();
                console.log('Removed job row from UI');
            } else {
                // Fallback: Try finding the row again by different means
                console.log('Job row not found initially, trying alternative methods');
                
                // Method 1: By direct button query
                const deleteBtn = document.querySelector(`button.delete-btn[data-id="${currentJobId}"]`);
                if (deleteBtn) {
                    const row = deleteBtn.closest('tr');
                    if (row) {
                        row.remove();
                        console.log('Removed job row using delete button selector');
                    }
                } else {
                    // Method 2: Try any button with this data-id
                    const anyBtn = document.querySelector(`button[data-id="${currentJobId}"]`);
                    if (anyBtn) {
                        const row = anyBtn.closest('tr');
                        if (row) {
                            row.remove();
                            console.log('Removed job row using any button selector');
                        }
                    } else if (jobTitle && jobLocation) {
                        // Method 3: Try matching by title and location
                        console.log('Trying to find job by title/location:', jobTitle, jobLocation);
                        const rows = document.querySelectorAll('tr');
                        rows.forEach(row => {
                            const cells = row.querySelectorAll('td');
                            if (cells.length >= 2) {
                                const rowTitle = cells[0].textContent.trim();
                                const rowLocation = cells[1].textContent.trim();
                                
                                if (rowTitle === jobTitle && rowLocation === jobLocation) {
                                    row.remove();
                                    console.log('Removed job row by title/location match');
                                }
                            }
                        });
                    } else {
                        // Method 4: Most aggressive - reload everything
                        console.warn('Could not find row in DOM, forcing full table reload');
                        loadJobPostings(true);
                    }
                }
            }
            
            // Update the allJobsData array
            if (window.allJobsData) {
                const beforeCount = window.allJobsData.length;
                window.allJobsData = window.allJobsData.filter(
                    job => {
                        const jobId = job.listing_id || job.id || '';
                        return jobId !== currentJobId;
                    }
                );
                console.log(`Updated allJobsData: removed ${beforeCount - window.allJobsData.length} jobs, remaining: ${window.allJobsData.length}`);
                
                // If no rows were removed, try again with string comparison
                if (beforeCount === window.allJobsData.length) {
                    console.warn('No jobs removed from allJobsData, trying string comparison');
                    window.allJobsData = window.allJobsData.filter(
                        job => {
                            const jobId = String(job.listing_id || job.id || '');
                            return jobId !== String(currentJobId);
                        }
                    );
                    console.log(`Updated allJobsData (second attempt): remaining: ${window.allJobsData.length}`);
                }
            }
            
            // Schedule a quiet reload to ensure data consistency
            setTimeout(() => {
                loadJobPostings(false);
            }, 1000);
        } catch (error) {
            console.error('Error in deleteJob function:', error);
            showToast(`Error deleting job: ${error.message}`, 'error');
        } finally {
            // Always close the modal
            closeDeleteModal();
            currentJobId = null;
        }
    }
    
    // Load job preview
    async function loadJobPreview(jobId) {
        try {
            console.log('Loading job preview for job ID:', jobId);
            
            // Open the preview modal first
            openPreviewModal();
            
            // Update preview elements with loading state
            $('#previewTitle').text('Loading...');
            $('#previewDescription').html('<div class="loading-spinner">Loading job details...</div>');
            
            // Check if this is a mock job from localStorage
            if (jobId.toString().startsWith('mock_')) {
                console.log('Loading mock job preview from localStorage');
                
                // Get from localStorage
                const mockJobs = JSON.parse(localStorage.getItem('mockJobPostings') || '[]');
                const job = mockJobs.find(j => (j.listing_id || j.id) === jobId);
                
                if (job) {
                    console.log('Found mock job, populating preview:', job);
                    populateJobPreview(job);
                } else {
                    console.error('Mock job not found with ID:', jobId);
                    showToast('Job preview not found', 'error');
                    closePreviewModal();
                }
                return;
            }
            
            // Get from API
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No authentication token found');
                showToast('Authentication required', 'error');
                closePreviewModal();
                return;
            }
            
            console.log(`Fetching job details from API: ${API_URL}/jobs/${jobId}`);
            const response = await fetch(`${API_URL}/jobs/${jobId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('API response status:', response.status);
            
            if (!response.ok) {
                console.error('Failed to load job preview, status:', response.status);
                showToast('Failed to load job preview', 'error');
                closePreviewModal();
                return;
            }
            
            const responseText = await response.text();
            console.log('Job preview response:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed job data:', data);
            } catch (e) {
                console.error('Failed to parse job data:', e);
                showToast('Error parsing job data', 'error');
                closePreviewModal();
                return;
            }
            
            if (data.success && data.listing) {
                console.log('Success, populating job preview with:', data.listing);
                populateJobPreview(data.listing);
            } else {
                console.error('Job preview data not found or invalid');
                showToast('Job preview not found', 'error');
                closePreviewModal();
            }
        } catch (error) {
            console.error('Error in loadJobPreview:', error);
            showToast('Error loading job preview: ' + error.message, 'error');
            closePreviewModal();
        }
    }
    
    // Populate job preview with data
    function populateJobPreview(job) {
        try {
            console.log('Populating preview with job data:', job);
            
            // Get company name from localStorage with fallbacks
            const companyProfile = JSON.parse(localStorage.getItem('companyProfile') || '{}');
            const companyName = localStorage.getItem('companyName') || 
                                companyProfile.companyName || 
                                JSON.parse(localStorage.getItem('user') || '{}').company_name || 
                                job.company_name || 
                                'Your Company';
            
            // Set job title
            $('#previewTitle').text(job.job_title || job.jobTitle || 'Untitled Job');
            
            // Set company and location
            $('#previewCompany').text(companyName);
            $('#previewLocation').text(job.location || 'Location not specified');
            
            // Set compensation
            const isPaid = job.is_paid !== undefined ? job.is_paid : true;
            const salary = job.salary || '';
            const compensationText = isPaid 
                ? `Paid - ${salary ? '$' + salary : 'Negotiable'}`
                : 'Unpaid';
            $('#previewCompensation').text(compensationText);
            
            // Set posted date
            const createdDate = job.created_at || job.createdAt || new Date().toISOString();
            $('#previewDate').text(formatDate(createdDate));
            
            // Set positions
            const positions = job.positions || 1;
            $('#previewPositions').text(`${positions} position${positions !== 1 ? 's' : ''}`);
            
            // Set description (with formatting)
            const description = job.description || job.job_description || 'No description provided';
            $('#previewDescription').html(description.replace(/\n/g, '<br>'));
            
            // Set requirements (with formatting)
            const requirements = job.requirements || 'No specific requirements';
            $('#previewRequirements').html(requirements.replace(/\n/g, '<br>'));
            
            // Set skills
            let skills = [];
            if (job.skills) {
                if (typeof job.skills === 'string') {
                    try {
                        // Try to parse if it's a JSON string
                        skills = JSON.parse(job.skills);
                    } catch (e) {
                        // If not parsable, split by commas
                        skills = job.skills.split(',').map(s => s.trim());
                    }
                } else if (Array.isArray(job.skills)) {
                    skills = job.skills;
                }
            }
            
            const skillsHtml = skills.length > 0
                ? skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
                : '<span class="skill-tag">No specific skills listed</span>';
            $('#previewSkills').html(skillsHtml);
            
            console.log('Preview populated successfully');
        } catch (error) {
            console.error('Error populating job preview:', error);
            showToast('Error displaying job preview', 'error');
        }
    }
    
    // Filter jobs based on search, status, and sort options
    function filterJobs() {
        // Get filter values
        const searchValue = (document.getElementById('jobSearch')?.value || '').toLowerCase();
        const statusValue = document.getElementById('statusFilter')?.value || 'all';
        const sortValue = document.getElementById('sortSelect')?.value || 'newest';
        
        // Make sure we have the jobs data
        if (!window.allJobsData) {
            console.error('No jobs data available for filtering');
            return;
        }
        
        console.log("Filtering jobs with:", { searchValue, statusValue, sortValue });
        console.log("Total jobs before filtering:", window.allJobsData.length);
        
        // Clone the jobs data to avoid modifying the original
        const jobs = [...window.allJobsData];
        
        // Filter jobs
        const filteredJobs = jobs.filter(job => {
            // Get values from job, handling different data structures
            const jobTitle = (job.job_title || job.jobTitle || '').toLowerCase();
            const location = (job.location || '').toLowerCase();
            const status = (job.status || 'Active').toLowerCase();
            const description = (job.description || job.job_description || '').toLowerCase();
            
            // Check if job matches search
            const matchesSearch = 
                searchValue === '' || 
                jobTitle.includes(searchValue) || 
                location.includes(searchValue) || 
                description.includes(searchValue);
            
            // Check if job matches status filter
            const matchesStatus = statusValue === 'all' || status.toLowerCase() === statusValue.toLowerCase();
            
            return matchesSearch && matchesStatus;
        });
        
        console.log("Filtered jobs count:", filteredJobs.length);
        
        // Sort jobs
        filteredJobs.sort((a, b) => {
            // Get values from jobs, handling different data structures
            const titleA = (a.job_title || a.jobTitle || '').toLowerCase();
            const titleB = (b.job_title || b.jobTitle || '').toLowerCase();
            const dateA = new Date(a.created_at || a.createdAt || 0);
            const dateB = new Date(b.created_at || b.createdAt || 0);
            const applicationsA = a.application_count || a.applications || 0;
            const applicationsB = b.application_count || b.applications || 0;
            
            switch (sortValue) {
                case 'newest':
                    return dateB - dateA;
                case 'oldest':
                    return dateA - dateB;
                case 'title':
                    return titleA.localeCompare(titleB);
                case 'applications':
                    return applicationsB - applicationsA;
                default:
                    return dateB - dateA;
            }
        });
        
        // Render filtered jobs
        renderJobPostings(filteredJobs);
    }
    
    // Check if user is authenticated and has employer role
    async function checkAuthentication() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No authentication token found');
            // Don't throw an error, just return false
            return false;
        }
        
        try {
            // Get user data from localStorage
            const userString = localStorage.getItem('user');
            if (!userString) {
                console.error('No user data found in localStorage');
                return false;
            }
            
            const user = JSON.parse(userString);
            console.log('User data:', user);
            
            // Check role case-insensitively
            const userRole = (user.role || '').toLowerCase();
            if (userRole !== 'employer') {
                console.error(`User role ${user.role} is not authorized for this page`);
                return false;
            }
            
            // Don't verify with server for now to prevent refresh loop
            return true;
        } catch (error) {
            console.error('Authentication check error:', error);
            return false;
        }
    }
    
    // Handle logout
    function handleLogout() {
        // Ask for confirmation before logging out
        if (confirm('Are you sure you want to log out?')) {
            console.log('User confirmed logout');
            
            // Show logout message
            showToast('Logging out...', 'info');
            
            // Clear all authentication related data
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            localStorage.removeItem('user');
            localStorage.removeItem('mockJobPostings'); // Clear mock data too
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = '../mpl-login.html';
            }, 1000);
        } else {
            console.log('Logout cancelled by user');
        }
    }
    
    // Redirect to login page
    function redirectToLogin(message) {
        if (message) {
            // Store the error message to display on the login page
            localStorage.setItem('loginMessage', message);
        }
        window.location.href = '../employers/job-postings.html';
    }
    
    // Helper: Truncate text
    function truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    // Helper: Show toast notification
    function showToast(message, type = 'info') {
        console.log(`Toast: ${type} - ${message}`);
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // For success messages about job creation, add an icon and make it more visible
        if (type === 'success' && (message.includes('created') || message.includes('updated'))) {
            toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
            toast.style.fontSize = '1.1em';
            toast.style.padding = '15px 20px';
            
            // Also trigger a confetti effect if the browser supports it
            if (typeof confetti === 'function') {
                try {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                } catch (e) {
                    console.warn('Confetti effect failed', e);
                }
            }
        } else {
            toast.textContent = message;
        }
        
        // Add to document
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Remove after 3 seconds (success messages) or 5 seconds (others)
        const duration = type === 'success' ? 3000 : 5000;
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }
    
    // Helper: Debounce function
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    // Add a direct form submission option
    // This will create a hidden form and submit it directly to bypass fetch API issues
    function directSubmitJobData(jobData) {
        // Create a form element
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'http://localhost:5004/api/jobs';
        form.style.display = 'none';
        
        // Create input elements for each field
        Object.keys(jobData).forEach(key => {
            if (jobData[key] !== undefined && jobData[key] !== null) {
                let input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                
                // Handle arrays (like skills)
                if (Array.isArray(jobData[key])) {
                    input.value = JSON.stringify(jobData[key]);
                } else {
                    input.value = jobData[key];
                }
                
                form.appendChild(input);
            }
        });
        
        // Add the form to the body and submit it
        document.body.appendChild(form);
        console.log("Submitting form directly", form);
        
        // Add a temporary auth token if needed
        const token = localStorage.getItem('token');
        if (token) {
            const tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'token';
            tokenInput.value = token;
            form.appendChild(tokenInput);
        }
        
        try {
            form.submit();
            return true;
        } catch (e) {
            console.error("Form submission error", e);
            return false;
        }
    }

    // Helper: Collect form data
    function collectFormData() {
        const jobTitle = document.getElementById('jobTitle')?.value?.trim() || '';
        const location = document.getElementById('location')?.value?.trim() || '';
        const description = document.getElementById('description')?.value?.trim() || '';
        const requirements = document.getElementById('requirements')?.value?.trim() || '';
        const skills = document.getElementById('skills')?.value?.trim() || '';
        const isPaid = document.getElementById('isPaid')?.value || '1';
        const status = document.getElementById('status')?.value || 'Active';
        const positions = document.getElementById('positions')?.value || '1';
        const salary = document.getElementById('salary')?.value || '';
        
        if (!jobTitle || !location || !description) {
            return null;
        }
        
        const jobData = {
            job_title: jobTitle,
            job_description: description,
            location: location,
            is_paid: isPaid === '1',
            requirements: requirements || "Basic qualifications needed for this position.",
            skills: skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : ["Communication"],
            positions: parseInt(positions) || 1,
            status: status || "Active",
            created_at: new Date().toISOString(),
            listing_id: 'mock_' + Date.now(),
            application_count: 0
        };
        
        if (isPaid === '1' && salary) {
            jobData.salary = parseInt(salary) || 0;
        }
        
        return jobData;
    }

    // Helper: Save job to local storage
    function saveJobToLocalStorage(jobData) {
        // Get existing jobs
        const existingJobs = JSON.parse(localStorage.getItem('mockJobPostings') || '[]');
        
        // Add new job
        existingJobs.push(jobData);
        
        // Save back to local storage
        localStorage.setItem('mockJobPostings', JSON.stringify(existingJobs));
        console.log('Job saved to local storage:', jobData);
    }

    // Initialize the page
    async function init() {
        try {
            // Check authentication before proceeding
            const isAuthenticated = await checkAuthentication();
            
            if (!isAuthenticated) {
                console.log('Not authenticated or using mock mode');
                // Instead of redirecting, just show a message that we're using mock data
                showToast('Using mock data mode - login for full functionality', 'info');
                
                // Create mock user data if not available
                if (!localStorage.getItem('mockUserData')) {
                    const mockUser = {
                        id: 'mock_1',
                        name: 'Mock Employer',
                        company_name: 'Mock Company Inc.',
                        email: 'mock@example.com',
                        role: 'employer'
                    };
                    localStorage.setItem('mockUserData', JSON.stringify(mockUser));
                }
            }
            
            // Attach event listeners regardless of auth status
            setupEventListeners();
            
            // Load existing job postings (this will use mock data if not authenticated)
            await loadJobPostings();
            
            // Add real-time updates for job applications if authenticated
            if (isAuthenticated) {
                // Check for new applications every 30 seconds
                setInterval(async () => {
                    console.log('Checking for application updates...');
                    await loadJobPostings(false); // false = don't show loading indicator
                }, 30000);
            }
            
            return true;
        } catch (error) {
            console.error('Initialization error:', error.message);
            showToast('Error initializing page: ' + error.message, 'error');
            return false;
        }
    }

    // Update existing job posting
    async function updateJob(jobId) {
        try {
            console.log('Update job function called for job ID:', jobId);
            
            if (!jobId) {
                showErrorBanner('No job ID provided for update');
                return false;
            }
            
            // Clear previous error banners
            if ($('#error-banner').length) {
                $('#error-banner').remove();
            }
            
            // Get form values
            const jobTitle = $('#jobTitle').val() ? $('#jobTitle').val().trim() : '';
            const location = $('#location').val() ? $('#location').val().trim() : '';
            const jobDescription = $('#jobDescription').val() ? $('#jobDescription').val().trim() : '';
            const requirements = $('#requirements').val() ? $('#requirements').val().trim() : '';
            const skills = $('#skills').val() ? $('#skills').val().trim() : '';
            const deadline = $('#deadline').val() ? $('#deadline').val().trim() : '';
            const positions = $('#positions').val() ? $('#positions').val().trim() : '';
            const isPaid = $('#isPaid').val() || '1';
            const salary = $('#salary').val() || '';
            const status = $('#status').val() || 'Active';
            
            // Validate form fields
            if (!jobTitle) {
                showErrorBanner('Job title is required');
                return false;
            }
            
            if (!location) {
                showErrorBanner('Location is required');
                return false;
            }
            
            if (!jobDescription) {
                showErrorBanner('Job description is required');
                return false;
            }
            
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('Authentication required', 'error');
                return false;
            }
            
            // Show loading state
            $('#saveJobBtn').text('Updating...').prop('disabled', true);
            
            // Get company name from user data
            let companyName = "Company";
            try {
                // First try to get from employerProfile
                const employerProfileStr = localStorage.getItem('employerProfile');
                if (employerProfileStr) {
                    const employerProfile = JSON.parse(employerProfileStr);
                    if (employerProfile && employerProfile.name) {
                        companyName = employerProfile.name;
                    }
                }
                
                // If not found, try userData
                if (companyName === "Company") {
                    const userDataStr = localStorage.getItem('userData') || localStorage.getItem('user');
                    if (userDataStr) {
                        const userData = JSON.parse(userDataStr);
                        companyName = userData.company_name || userData.companyName || "Company";
                    }
                }
                
                console.log(`Using company name: ${companyName}`);
            } catch (error) {
                console.error('Error getting company name:', error);
            }
            
            // Prepare data for API - match the exact format expected by the backend
            const jobData = {
                job_title: jobTitle,
                location: location,
                description: jobDescription,
                requirements: requirements || 'No specific requirements',
                skills: skills ? skills.split(',').map(skill => skill.trim()) : [],
                deadline: deadline,
                positions: parseInt(positions) || 1,
                is_paid: isPaid === '1',
                salary: isPaid === '1' ? (parseInt(salary) || 0) : 0,
                status: status || 'Active',
                company_name: companyName // Add company name to job data
            };
            
            console.log('Sending update data to API:', JSON.stringify(jobData, null, 2));
            
            // Use the correct API endpoint for updating
            const apiEndpoint = `${API_URL}/jobs/${jobId}`;
            
            console.log(`Sending update to API endpoint: ${apiEndpoint}`);
            
            const response = await fetch(apiEndpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(jobData)
            });
            
            console.log(`API response status:`, response.status);
            
            // Get response text first for debugging
            const responseText = await response.text();
            console.log('API raw response:', responseText);
            
            let responseData;
            try {
                // Try to parse as JSON
                responseData = JSON.parse(responseText);
                console.log('API parsed response:', responseData);
            } catch (parseError) {
                console.error('Failed to parse API response as JSON:', parseError);
                responseData = { success: false, message: responseText };
            }
            
            if (response.ok && responseData.success) {
                // Success!
                showToast('Job posting updated successfully!', 'success');
                
                // Close the modal
                closeJobModal();
                
                // Reload job listings
                setTimeout(() => {
                    loadJobPostings();
                }, 500);
                
                return true;
            } else {
                // Show error message
                const errorMessage = responseData.message || 'Failed to update job posting';
                console.error('API error:', errorMessage);
                showToast(`Error: ${errorMessage}`, 'error');
                $('#saveJobBtn').text('Update Job').prop('disabled', false);
                return false;
            }
        } catch (error) {
            console.error('Error updating job:', error);
            showToast('Error: ' + (error.message || 'Unknown error'), 'error');
            $('#saveJobBtn').text('Update Job').prop('disabled', false);
            return false;
        }
    }

    // Update the openPreviewModal function
    function openPreviewModal() {
        if (previewModal) {
            previewModal.style.display = 'block';
            previewModal.classList.add('show');
        }
    }

    // Helper function to get deleted job IDs from localStorage
    function getDeletedJobIds() {
        try {
            return JSON.parse(localStorage.getItem('deletedJobIds') || '[]');
        } catch (e) {
            console.error('Error parsing deletedJobIds from localStorage:', e);
            return [];
        }
    }

    // Helper function to store a deleted job ID
    function trackDeletedJob(jobId) {
        if (!jobId) return;
        
        try {
            const deletedJobs = getDeletedJobIds();
            if (!deletedJobs.includes(jobId)) {
                deletedJobs.push(jobId);
                localStorage.setItem('deletedJobIds', JSON.stringify(deletedJobs));
                console.log(`Added job ID ${jobId} to deletedJobIds tracking`);
            }
        } catch (e) {
            console.error('Error tracking deleted job:', e);
        }
    }
}); 