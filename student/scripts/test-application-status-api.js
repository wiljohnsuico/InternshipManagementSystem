/**
 * Test script for Application Status Update API
 * This script tests different API endpoint formats for updating application status
 * to help diagnose connectivity issues between the frontend and backend
 */

// Configuration
const API_BASE_URL = 'http://localhost:5004/api'; // Adjust port as needed
const TEST_APPLICATION_ID = 1; // Replace with a valid application ID from your system
const TEST_STATUS = 'Reviewing'; // A valid status: Pending, Reviewing, Accepted, Rejected, Withdrawn

// Prepare test endpoints (same as in employer-applications-connector.js)
const endpoints = [
    {
        name: 'POST /applications/update-status',
        url: `${API_BASE_URL}/applications/update-status`,
        method: 'POST',
        body: {
            applicationId: TEST_APPLICATION_ID,
            status: TEST_STATUS
        }
    },
    {
        name: 'PATCH /applications/:id/status',
        url: `${API_BASE_URL}/applications/${TEST_APPLICATION_ID}/status`,
        method: 'PATCH',
        body: {
            status: TEST_STATUS
        }
    },
    {
        name: 'POST /applications/:id',
        url: `${API_BASE_URL}/applications/${TEST_APPLICATION_ID}`,
        method: 'POST',
        body: {
            status: TEST_STATUS
        }
    }
];

// Get a token from localStorage
const getAuthToken = () => {
    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
    }
    return null;
};

// Test each endpoint
async function testEndpoint(endpoint) {
    console.log(`Testing: ${endpoint.name} - ${endpoint.method} ${endpoint.url}`);
    
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.warn('No auth token found, request may fail due to authentication');
        }
        
        const response = await fetch(endpoint.url, {
            method: endpoint.method,
            headers: headers,
            body: JSON.stringify(endpoint.body)
        });
        
        // Get response as text first
        const responseText = await response.text();
        
        // Try to parse as JSON
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { text: responseText };
        }
        
        // Log results
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('Response:', responseData);
        
        if (response.ok) {
            console.log(`✅ SUCCESS: ${endpoint.name} worked!`);
            return { success: true, endpoint, response: responseData };
        } else {
            console.log(`❌ ERROR: ${endpoint.name} failed!`);
            return { success: false, endpoint, response: responseData };
        }
    } catch (error) {
        console.error(`❌ EXCEPTION: ${endpoint.name} threw an error:`, error);
        return { success: false, endpoint, error: error.message };
    } finally {
        console.log('-----------------------------------');
    }
}

// Run tests
async function runTests() {
    console.log('Starting API endpoint tests for application status update...');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Application ID:', TEST_APPLICATION_ID);
    console.log('Test Status:', TEST_STATUS);
    console.log('===================================');
    
    const results = [];
    
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        results.push(result);
    }
    
    // Show summary
    console.log('===================================');
    console.log('TEST SUMMARY:');
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Successful endpoints: ${successful}/${results.length}`);
    
    if (successful > 0) {
        console.log('Working endpoints:');
        results.filter(r => r.success).forEach(r => {
            console.log(`- ${r.endpoint.name}: ${r.endpoint.method} ${r.endpoint.url}`);
        });
    } else {
        console.log('❌ No endpoints worked. Check your API server or authentication.');
    }
    
    return results;
}

// Check if this is running in a browser
if (typeof window !== 'undefined') {
    // In browser
    console.log('Running in browser environment');
    window.testApplicationAPI = runTests;
    console.log('Run window.testApplicationAPI() in console to execute tests');
} else {
    // In Node.js
    console.log('Running in Node.js environment');
    runTests().catch(console.error);
} 