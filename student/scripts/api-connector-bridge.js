/**
 * API Connector Bridge
 * 
 * This script creates bridges between different API connectors to ensure
 * they can work together seamlessly. It helps with backward compatibility
 * and ensures all dashboard functionality works even if some connectors are missing.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing API connector bridges');
    
    // Wait a short time to ensure other connectors have loaded
    setTimeout(() => {
        initializeConnectorBridges();
    }, 100);
});

function initializeConnectorBridges() {
    // Create bridge between existing DB_CONNECTOR and shared connector
    if (window.DB_CONNECTOR && window.SHARED_API_CONNECTOR) {
        console.log('Bridging existing DB_CONNECTOR with shared connector');
        
        // Ensure shared connector methods are available in DB_CONNECTOR
        window.DB_CONNECTOR.apiRequest = window.DB_CONNECTOR.apiRequest || 
            function(...args) { return window.SHARED_API_CONNECTOR.apiRequest(...args); };
            
        window.DB_CONNECTOR.getApplications = window.DB_CONNECTOR.getApplications || 
            function(...args) { return window.SHARED_API_CONNECTOR.getApplications(...args); };
            
        window.DB_CONNECTOR.getDashboardStats = window.DB_CONNECTOR.getDashboardStats || 
            function(...args) { return window.SHARED_API_CONNECTOR.getDashboardStats(...args); };
    }
    
    // Extending EMPLOYER_APPLICATIONS_CONNECTOR with shared functionality
    if (window.APPLICATIONS_CONNECTOR && window.SHARED_API_CONNECTOR) {
        console.log('Extending APPLICATIONS_CONNECTOR with shared functionality');
        
        // Add useful methods from shared connector
        window.APPLICATIONS_CONNECTOR.apiRequest = window.APPLICATIONS_CONNECTOR.apiRequest ||
            function(...args) { return window.SHARED_API_CONNECTOR.apiRequest(...args); };
            
        window.APPLICATIONS_CONNECTOR.getDashboardStats = window.APPLICATIONS_CONNECTOR.getDashboardStats ||
            function(...args) { return window.SHARED_API_CONNECTOR.getDashboardStats(...args); };
    }
    
    // Create api-connector-bridge object to track initialized bridges
    window.API_CONNECTOR_BRIDGES = {
        initialized: true,
        timestamp: new Date().toISOString(),
        bridges: {
            DB_CONNECTOR: !!window.DB_CONNECTOR,
            SHARED_API_CONNECTOR: !!window.SHARED_API_CONNECTOR,
            APPLICATIONS_CONNECTOR: !!window.APPLICATIONS_CONNECTOR,
            EMPLOYER_DASHBOARD_CONNECTOR: !!window.EMPLOYER_DASHBOARD_CONNECTOR
        }
    };
    
    console.log('API connector bridges initialized successfully');
}

// Helper function to load a connector script dynamically
function loadConnectorScript(scriptPath) {
    return new Promise((resolve, reject) => {
        if (!scriptPath) {
            reject(new Error('No script path provided'));
            return;
        }
        
        const script = document.createElement('script');
        script.src = scriptPath;
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
}

// Export functions for external use
window.API_CONNECTOR_BRIDGE_UTILS = {
    loadConnectorScript,
    initializeConnectorBridges
}; 