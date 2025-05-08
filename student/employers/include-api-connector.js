/**
 * Include API Connector Script
 * 
 * This script dynamically loads the shared API connector scripts into employer pages.
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
    const basePath = '../scripts/'; // Adjust this path based on the file location
    
    // First load the shared API connector
    loadScript(basePath + 'shared-api-connector.js', function() {
        // Then load the bridge
        loadScript(basePath + 'api-connector-bridge.js', function() {
            console.log('API connector scripts loaded successfully');
        });
    });
})(); 