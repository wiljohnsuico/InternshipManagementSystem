/**
 * Employer Applications Connector
 * Handles loading and managing employer applications data
 */

const APPLICATIONS_CONNECTOR = {
    // API Configuration
    API_URL: document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api',
    
    // Initialize the connector
    init: function() {
        console.log('Initializing Employer Applications Connector');
        this.setupEventListeners();
    },
    
    // Set up event listeners
    setupEventListeners: function() {
        document.addEventListener('applications-updated', () => {
            this.loadApplications();
        });
    },
    
    // Load all applications
    loadApplications: async function() {
        console.log('Loading applications...');
        
        try {
            // Get authentication token
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                console.warn('No authentication token found');
                return this.getMockApplications();
            }
            
            // Check API connectivity
            const isApiAvailable = await this.checkApiConnectivity();
            if (!isApiAvailable) {
                console.warn('API not available, using mock data');
                return this.getMockApplications();
            }
            
            // Try only the correct endpoint for employer applications
            const endpoints = [
                `${this.API_URL}/applications/employer`
            ];
            
            let applications = null;
            let error = null;
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`Trying endpoint: ${endpoint}`);
                    const response = await fetch(endpoint, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        // The backend returns { success, count, applications: [...] }
                        if (data && data.success && Array.isArray(data.applications)) {
                            applications = this.normalizeApplicationsData(data.applications);
                        } else {
                            applications = [];
                        }
                        break;
                    }
                } catch (e) {
                    error = e;
                    console.warn(`Failed to fetch from ${endpoint}:`, e);
                    continue;
                }
            }
            
            if (applications) {
                console.log('Applications loaded successfully:', applications);
                return applications;
            }
            
            console.warn('All endpoints failed, using mock data');
            throw error || new Error('Failed to load applications from any endpoint');
            
        } catch (error) {
            console.error('Error loading applications:', error);
            return this.getMockApplications();
        }
    },
    
    // Check API connectivity
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
            id: app.id || app._id || app.applicationId || '',
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
            // Include all original data to avoid losing anything
            originalData: app
        };
    },
    
    // Get mock applications data
    getMockApplications: function() {
        console.log('Returning mock applications data');
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
                coverLetter: 'I am excited to apply for this position as it aligns with my skills in web development...',
                resumeUrl: '',
                notes: '',
                activities: [
                    {
                        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        action: 'Application received',
                        user: 'System'
                    }
                ]
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
                resumeUrl: '',
                notes: 'Strong candidate with good technical background',
                activities: [
                    {
                        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                        action: 'Application received',
                        user: 'System'
                    },
                    {
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                        action: 'Status changed to Reviewed',
                        user: 'Employer'
                    }
                ]
            }
        ];
    }
};

// Initialize the connector when the script loads
document.addEventListener('DOMContentLoaded', () => {
    APPLICATIONS_CONNECTOR.init();
    console.log('Applications connector initialized with API URL:', APPLICATIONS_CONNECTOR.API_URL);
}); 