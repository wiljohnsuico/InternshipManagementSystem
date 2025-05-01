/**
 * Database Connector Script
 * 
 * This script provides connectivity between the front-end and backend API,
 * with fallback to mock data when the API is not available.
 */

const DB_CONNECTOR = {
    // API Configuration
    API_URL: document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api',
    
    // Check if the API is available
    checkApiConnectivity: async function() {
        try {
            console.log(`Checking API connectivity at ${this.API_URL}/health`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.API_URL}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.warn('API connectivity check failed:', error);
            return false;
        }
    },
    
    // Get applications
    getApplications: async function() {
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return this.getMockApplications();
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, returning mock applications');
                return this.getMockApplications();
            }
            
            // Try multiple endpoints
            try {
                const response = await fetch(`${this.API_URL}/applications/employer`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Applications fetched successfully:', data);
                    return this.normalizeApplicationsData(data);
                }
                
                // Try alternative endpoint
                const altResponse = await fetch(`${this.API_URL}/employers/applications`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (altResponse.ok) {
                    const altData = await altResponse.json();
                    console.log('Applications fetched from alternative endpoint:', altData);
                    return this.normalizeApplicationsData(altData);
                }
                
                // If both endpoints fail
                console.warn('Both API endpoints failed, returning mock applications');
                return this.getMockApplications();
            } catch (error) {
                console.error('Error fetching applications:', error);
                return this.getMockApplications();
            }
        } catch (error) {
            console.error('Error in getApplications:', error);
            return this.getMockApplications();
        }
    },
    
    // Get a single application by ID
    getApplicationById: async function(applicationId) {
        if (!applicationId) {
            console.error('No application ID provided');
            return null;
        }
        
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return this.getMockApplicationById(applicationId);
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, returning mock application');
                return this.getMockApplicationById(applicationId);
            }
            
            // Try to get the specific application
            try {
                const response = await fetch(`${this.API_URL}/applications/${applicationId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Application fetched successfully:', data);
                    return this.normalizeApplicationData(data);
                }
                
                // If direct fetch fails, try getting all applications and filtering
                const applications = await this.getApplications();
                const application = applications.find(app => app.id === applicationId);
                
                if (application) {
                    return application;
                }
                
                console.warn(`Application with ID ${applicationId} not found, returning mock data`);
                return this.getMockApplicationById(applicationId);
            } catch (error) {
                console.error('Error fetching application by ID:', error);
                return this.getMockApplicationById(applicationId);
            }
        } catch (error) {
            console.error('Error in getApplicationById:', error);
            return this.getMockApplicationById(applicationId);
        }
    },
    
    // Update application status
    updateApplicationStatus: async function(applicationId, newStatus) {
        if (!applicationId) {
            console.error('No application ID provided');
            return { success: false, error: 'No application ID provided' };
        }
        
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return { success: false, error: 'No authentication token found' };
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, simulating status update success');
                return { success: true, status: newStatus };
            }
            
            // Send the status update
            const response = await fetch(`${this.API_URL}/applications/${applicationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (response.ok) {
                const data = await response.json();
                return { success: true, ...data };
            } else {
                return { success: false, error: `API returned ${response.status}` };
            }
        } catch (error) {
            console.error('Error updating application status:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Save application notes
    saveApplicationNotes: async function(applicationId, notes) {
        if (!applicationId) {
            console.error('No application ID provided');
            return { success: false, error: 'No application ID provided' };
        }
        
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return { success: false, error: 'No authentication token found' };
            }
            
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, simulating notes save success');
                return { success: true, notes };
            }
            
            // Send the notes update
            const response = await fetch(`${this.API_URL}/applications/${applicationId}/notes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ notes })
            });
            
            if (response.ok) {
                const data = await response.json();
                return { success: true, ...data };
            } else {
                return { success: false, error: `API returned ${response.status}` };
            }
        } catch (error) {
            console.error('Error saving application notes:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Normalize applications data from various API formats
    normalizeApplicationsData: function(data) {
        let applications = [];
        
        // Check various data structures the API might return
        if (data.applications && Array.isArray(data.applications)) {
            applications = data.applications;
        } else if (Array.isArray(data)) {
            applications = data;
        } else if (data.data && Array.isArray(data.data)) {
            applications = data.data;
        } else if (data.items && Array.isArray(data.items)) {
            applications = data.items;
        } else {
            console.error('Unexpected data format:', data);
            return [];
        }
        
        // Normalize each application
        return applications.map(app => this.normalizeApplicationData(app));
    },
    
    // Normalize a single application
    normalizeApplicationData: function(app) {
        return {
            id: app.id || app._id || app.applicationId || app.application_id || '',
            studentName: app.studentName || app.student_name || 
                (app.student ? `${app.student.firstName || app.student.first_name || ''} ${app.student.lastName || app.student.last_name || ''}`.trim() : ''),
            studentId: app.studentId || app.student_id || (app.student ? app.student.id || app.student._id || '' : ''),
            studentEmail: app.studentEmail || app.student_email || (app.student ? app.student.email || '' : ''),
            studentPhone: app.studentPhone || app.student_phone || (app.student ? app.student.phone || '' : 'Not provided'),
            jobTitle: app.jobTitle || app.job_title || app.position || '',
            jobId: app.jobId || app.job_id || '',
            appliedDate: app.appliedDate || app.applied_date || app.createdAt || app.created_at || new Date(),
            status: app.status || 'Pending',
            coverLetter: app.coverLetter || app.cover_letter || '',
            resumeUrl: app.resumeUrl || app.resume_url || '',
            notes: app.notes || '',
            activities: app.activities || app.activity_log || [],
            matchScore: app.matchScore || app.match_score || null,
            // Include all original data to avoid losing anything
            originalData: app
        };
    },
    
    // Get mock applications data
    getMockApplications: function() {
        return [
            {
                id: 'app-1',
                studentName: 'John Doe',
                studentId: 'STU-1001',
                studentEmail: 'john.doe@example.com',
                studentPhone: '(555) 123-4567',
                jobTitle: 'Frontend Developer Intern',
                jobId: 'job-1',
                appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                status: 'Pending',
                coverLetter: 'I am excited to apply for this position...',
                resumeUrl: ''
            },
            {
                id: 'app-2',
                studentName: 'Jane Smith',
                studentId: 'STU-1002',
                studentEmail: 'jane.smith@example.com',
                studentPhone: '(555) 987-6543',
                jobTitle: 'Backend Developer Intern',
                jobId: 'job-2',
                appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                status: 'Reviewed',
                coverLetter: 'With my experience in backend development...',
                resumeUrl: ''
            },
            {
                id: 'app-3',
                studentName: 'Michael Brown',
                studentId: 'STU-1003',
                studentEmail: 'michael.brown@example.com',
                studentPhone: '(555) 456-7890',
                jobTitle: 'UX Design Intern',
                jobId: 'job-3',
                appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                status: 'Interviewed',
                coverLetter: 'I believe my design skills would be a great fit...',
                resumeUrl: ''
            }
        ];
    },
    
    // Get a mock application by ID
    getMockApplicationById: function(applicationId) {
        // Check if the ID matches one of our mock applications
        const mockApps = this.getMockApplications();
        const foundApp = mockApps.find(app => app.id === applicationId);
        
        if (foundApp) {
            return foundApp;
        }
        
        // Create a new mock application based on the ID
        return {
            id: applicationId,
            studentName: 'Mock Student',
            studentId: 'STU-MOCK',
            studentEmail: 'mock.student@example.com',
            studentPhone: '(555) 123-4567',
            jobTitle: 'Mock Position Intern',
            jobId: 'job-mock',
            appliedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'Pending',
            coverLetter: 'This is a mock cover letter for demonstration purposes. In a real application, this would contain the student\'s actual cover letter text explaining their interest in the position and qualifications.',
            resumeUrl: '',
            notes: '',
            activities: [
                {
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    action: 'Application received',
                    user: 'System'
                }
            ]
        };
    },
    
    // Format date for display
    formatDate: function(dateString) {
        if (!dateString) return 'Unknown date';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    }
};

// Make available globally
window.DB_CONNECTOR = DB_CONNECTOR;

// Initialize the connector when the script loads
console.log('Database connector initialized with API URL:', DB_CONNECTOR.API_URL); 