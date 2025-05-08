/**
 * Include API Connector Script for Admin Pages
 * 
 * This script dynamically loads the shared API connector scripts into admin pages.
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
    const basePath = '../student/scripts/'; // Path to the student scripts from admin directory
    
    // First load the shared API connector
    loadScript(basePath + 'shared-api-connector.js', function() {
        // Then load the bridge
        loadScript(basePath + 'api-connector-bridge.js', function() {
            console.log('API connector scripts loaded successfully in admin page');
            
            // Create admin-specific connector if it doesn't exist
            if (!window.ADMIN_CONNECTOR && window.SHARED_API_CONNECTOR) {
                window.ADMIN_CONNECTOR = {
                    // Initialize with shared connector methods
                    API_URL: window.SHARED_API_CONNECTOR.API_URL,
                    
                    checkApiConnectivity: window.SHARED_API_CONNECTOR.checkApiConnectivity.bind(window.SHARED_API_CONNECTOR),
                    
                    getApplications: async function() {
                        return await window.SHARED_API_CONNECTOR.getApplications({
                            filters: { role: 'admin' }
                        });
                    },
                    
                    getApplicationById: async function(applicationId) {
                        return await window.SHARED_API_CONNECTOR.getApplicationById(applicationId);
                    },
                    
                    updateApplicationStatus: async function(applicationId, newStatus) {
                        return await window.SHARED_API_CONNECTOR.updateApplicationStatus(applicationId, newStatus);
                    }
                };
                
                console.log('Admin connector created using shared API connector');
            }
        });
    });
})(); 