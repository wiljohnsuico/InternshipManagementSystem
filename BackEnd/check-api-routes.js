/**
 * Check API Routes Script
 * 
 * This utility script tests connectivity to essential API endpoints
 * especially focusing on application update endpoints
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// API base URL
const API_BASE_URL = 'http://localhost:5004/api';

// Mock token for testing
const TEST_TOKEN = 'mock_token_for_testing';

// Test application ID (replace with a valid one from your database)
const TEST_APPLICATION_ID = '157'; // Based on error message in screenshot

// Routes to test - primarily status update routes
const routesToTest = [
    {
        name: 'Applications Update-Status',
        url: `${API_BASE_URL}/applications/update-status`,
        method: 'POST',
        body: { applicationId: TEST_APPLICATION_ID, status: 'Pending' },
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TEST_TOKEN}` }
    },
    {
        name: 'Applications Status (PATCH)',
        url: `${API_BASE_URL}/applications/${TEST_APPLICATION_ID}/status`,
        method: 'PATCH',
        body: { status: 'Pending' },
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TEST_TOKEN}` }
    },
    {
        name: 'Applications Status (PUT)',
        url: `${API_BASE_URL}/applications/${TEST_APPLICATION_ID}/status`,
        method: 'PUT',
        body: { status: 'Pending' },
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TEST_TOKEN}` }
    },
    {
        name: 'Health Check',
        url: `${API_BASE_URL}/health`,
        method: 'GET'
    }
];

// Test a single route
async function testRoute(route) {
    console.log(`\nTesting route: ${route.name} - ${route.method} ${route.url}`);
    
    try {
        const options = {
            method: route.method,
            headers: route.headers || {},
            // Add body for non-GET requests
            ...(route.method !== 'GET' && { 
                body: JSON.stringify(route.body)
            })
        };
        
        const startTime = Date.now();
        const response = await fetch(route.url, options);
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        
        // Try to parse response as text
        let responseText;
        try {
            responseText = await response.text();
        } catch (e) {
            responseText = 'Could not parse response text';
        }
        
        // Try to parse as JSON if applicable
        let jsonData = null;
        try {
            if (responseText && responseText.trim().startsWith('{')) {
                jsonData = JSON.parse(responseText);
            }
        } catch (e) {
            // Not JSON or invalid JSON
        }
        
        const result = {
            status: response.status,
            statusText: response.statusText,
            responseTime: `${responseTime}ms`,
            headers: Object.fromEntries([...response.headers.entries()]),
            body: jsonData || responseText
        };
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Response Time: ${responseTime}ms`);
        
        if (response.ok) {
            console.log('✅ Route is working properly');
        } else {
            console.log('❌ Route returned an error status');
        }
        
        console.log('Response:');
        console.log(jsonData ? JSON.stringify(jsonData, null, 2) : responseText);
        
        return { route, result, success: response.ok };
    } catch (error) {
        console.log(`❌ Failed to test route: ${error.message}`);
        return { 
            route, 
            result: { 
                error: error.message,
                stack: error.stack 
            }, 
            success: false 
        };
    }
}

// Test all routes
async function testAllRoutes() {
    console.log('Starting API route tests...');
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log('='.repeat(50));
    
    const results = [];
    
    for (const route of routesToTest) {
        const result = await testRoute(route);
        results.push(result);
    }
    
    console.log('\n='.repeat(50));
    console.log('Test summary:');
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ ${successful} routes working properly`);
    console.log(`❌ ${results.length - successful} routes failed`);
    
    // Save results to file
    const resultFilePath = path.join(__dirname, 'api-test-results.json');
    fs.writeFileSync(
        resultFilePath, 
        JSON.stringify(results, null, 2)
    );
    
    console.log(`\nResults saved to ${resultFilePath}`);
}

// Run the tests
testAllRoutes().catch(error => {
    console.error('Error running tests:', error);
}); 