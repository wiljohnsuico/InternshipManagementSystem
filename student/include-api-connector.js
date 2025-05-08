/**
 * Include API Connector Script for Student Pages
 * 
 * This script dynamically loads the shared API connector scripts into student pages.
 * It maintains backward compatibility with existing code.
 */

(function() {
    // Create and load the shared API connector script
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    }
    
    // Create the meta tag for API URL configuration if it doesn't exist
    if (!document.querySelector('meta[name="api-url"]')) {
        const meta = document.createElement('meta');
        meta.name = 'api-url';
        meta.content = 'http://localhost:5004/api';
        document.head.appendChild(meta);
    }
    
    // Load the scripts in sequence
    const basePath = 'scripts/'; // Path for student pages
    
    // First load the shared API connector
    loadScript(basePath + 'shared-api-connector.js', function() {
        // Then load the bridge
        loadScript(basePath + 'api-connector-bridge.js', function() {
            console.log('API connector scripts loaded successfully in student page');
            
            // Create student-specific connector if it doesn't exist
            if (!window.STUDENT_CONNECTOR && window.SHARED_API_CONNECTOR) {
                window.STUDENT_CONNECTOR = {
                    // Initialize with shared connector methods
                    API_URL: window.SHARED_API_CONNECTOR.API_URL,
                    
                    checkApiConnectivity: window.SHARED_API_CONNECTOR.checkApiConnectivity.bind(window.SHARED_API_CONNECTOR),
                    
                    getMyApplications: async function() {
                        return await window.SHARED_API_CONNECTOR.getApplications({
                            filters: { role: 'student' }
                        });
                    },
                    
                    getApplicationById: async function(applicationId) {
                        return await window.SHARED_API_CONNECTOR.getApplicationById(applicationId);
                    },
                    
                    // Additional student-specific methods
                    searchInternships: async function(query) {
                        try {
                            return await window.SHARED_API_CONNECTOR.apiRequest('/internships/search', {
                                method: 'POST',
                                body: { query }
                            });
                        } catch (error) {
                            console.error('Error searching internships:', error);
                            return { results: [] };
                        }
                    },
                    
                    applyForInternship: async function(internshipId, applicationData) {
                        try {
                            return await window.SHARED_API_CONNECTOR.apiRequest('/applications/apply', {
                                method: 'POST',
                                body: {
                                    internshipId,
                                    ...applicationData
                                }
                            });
                        } catch (error) {
                            console.error('Error applying for internship:', error);
                            throw error;
                        }
                    }
                };
                
                console.log('Student connector created using shared API connector');
            }
        });
    });
})(); 