/**
 * API Diagnostics Script
 * 
 * This script helps diagnose API connectivity issues by testing various endpoints
 * and providing detailed error information.
 * 
 * Usage:
 * 1. Load this script in the browser console: 
 *    fetch('/student/scripts/api-diagnostics.js').then(r => r.text()).then(eval)
 * 2. Run the diagnostics: API_DIAGNOSTICS.runAllTests()
 */

const API_DIAGNOSTICS = {
    // Base API URL detection
    API_URL: document.querySelector('meta[name="api-url"]')?.getAttribute('content') || 'http://localhost:5004/api',
    
    // Get auth token from local storage
    getAuthToken() {
        return localStorage.getItem('token') || 
               localStorage.getItem('authToken') || 
               localStorage.getItem('adminToken') || 
               localStorage.getItem('employerToken') || 
               null;
    },
    
    // Basic health check
    async checkApiHealth() {
        console.log(`Testing API health at ${this.API_URL}/health`);
        
        try {
            const startTime = performance.now();
            const response = await fetch(`${this.API_URL}/health`);
            const endTime = performance.now();
            
            console.log(`API health check response time: ${Math.round(endTime - startTime)}ms`);
            
            if (response.ok) {
                console.log('✅ API health check successful!');
                try {
                    const data = await response.json();
                    console.log('Health response:', data);
                } catch (e) {
                    console.log('Response is not JSON:', await response.text());
                }
                return true;
            } else {
                console.error(`❌ API health check failed: ${response.status} ${response.statusText}`);
                return false;
            }
        } catch (error) {
            console.error('❌ API health check error:', error);
            return false;
        }
    },
    
    // Test employer dashboard endpoint
    async testEmployerDashboardEndpoint() {
        const endpoints = [
            `${this.API_URL}/dashboard/employers/dashboard/stats`,
            `${this.API_URL}/employer/dashboard/stats`,
            `${this.API_URL}/employers/dashboard/stats`
        ];
        
        const token = this.getAuthToken();
        if (!token) {
            console.warn('⚠️ No auth token found, authentication-required endpoints will fail');
        }
        
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        console.log(`Testing employer dashboard endpoints with token:`, !!token);
        
        let foundWorkingEndpoint = false;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Testing: ${endpoint}`);
                const startTime = performance.now();
                const response = await fetch(endpoint, { headers });
                const endTime = performance.now();
                
                console.log(`Response time: ${Math.round(endTime - startTime)}ms`);
                
                if (response.ok) {
                    console.log(`✅ Endpoint ${endpoint} is working!`);
                    try {
                        const data = await response.json();
                        console.log('Response data:', data);
                    } catch (e) {
                        console.log('Response is not JSON:', await response.text());
                    }
                    foundWorkingEndpoint = true;
                } else {
                    console.warn(`❌ Endpoint ${endpoint} returned ${response.status} ${response.statusText}`);
                    try {
                        const text = await response.text();
                        console.log('Error response:', text);
                    } catch (e) {
                        console.log('Could not read response body');
                    }
                }
            } catch (error) {
                console.error(`❌ Error testing ${endpoint}:`, error);
            }
        }
        
        return foundWorkingEndpoint;
    },
    
    // Test applications endpoint
    async testApplicationsEndpoint() {
        const endpoints = [
            `${this.API_URL}/applications/employer`,
            `${this.API_URL}/applications`
        ];
        
        const token = this.getAuthToken();
        if (!token) {
            console.warn('⚠️ No auth token found, authentication-required endpoints will fail');
        }
        
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        console.log(`Testing applications endpoints with token:`, !!token);
        
        let foundWorkingEndpoint = false;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Testing: ${endpoint}`);
                const startTime = performance.now();
                const response = await fetch(endpoint, { headers });
                const endTime = performance.now();
                
                console.log(`Response time: ${Math.round(endTime - startTime)}ms`);
                
                if (response.ok) {
                    console.log(`✅ Endpoint ${endpoint} is working!`);
                    try {
                        const data = await response.json();
                        console.log(`Found ${data.applications?.length || 0} applications`);
                    } catch (e) {
                        console.log('Response is not JSON:', await response.text());
                    }
                    foundWorkingEndpoint = true;
                } else {
                    console.warn(`❌ Endpoint ${endpoint} returned ${response.status} ${response.statusText}`);
                    try {
                        const text = await response.text();
                        console.log('Error response:', text);
                    } catch (e) {
                        console.log('Could not read response body');
                    }
                }
            } catch (error) {
                console.error(`❌ Error testing ${endpoint}:`, error);
            }
        }
        
        return foundWorkingEndpoint;
    },
    
    // Test job listings endpoint
    async testJobListingsEndpoint() {
        const endpoints = [
            `${this.API_URL}/jobs/employer/my-listings`,
            `${this.API_URL}/employer/jobs/active`,
            `${this.API_URL}/jobs/employer?status=active`
        ];
        
        const token = this.getAuthToken();
        if (!token) {
            console.warn('⚠️ No auth token found, authentication-required endpoints will fail');
        }
        
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        console.log(`Testing job listings endpoints with token:`, !!token);
        
        let foundWorkingEndpoint = false;
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Testing: ${endpoint}`);
                const startTime = performance.now();
                const response = await fetch(endpoint, { headers });
                const endTime = performance.now();
                
                console.log(`Response time: ${Math.round(endTime - startTime)}ms`);
                
                if (response.ok) {
                    console.log(`✅ Endpoint ${endpoint} is working!`);
                    try {
                        const data = await response.json();
                        const jobs = data.listings || data.jobs || [];
                        console.log(`Found ${jobs.length} job listings`);
                    } catch (e) {
                        console.log('Response is not JSON:', await response.text());
                    }
                    foundWorkingEndpoint = true;
                } else {
                    console.warn(`❌ Endpoint ${endpoint} returned ${response.status} ${response.statusText}`);
                    try {
                        const text = await response.text();
                        console.log('Error response:', text);
                    } catch (e) {
                        console.log('Could not read response body');
                    }
                }
            } catch (error) {
                console.error(`❌ Error testing ${endpoint}:`, error);
            }
        }
        
        return foundWorkingEndpoint;
    },
    
    // Run all tests
    async runAllTests() {
        console.log('🔍 Starting API diagnostics...');
        console.log('API URL:', this.API_URL);
        console.log('Authentication token present:', !!this.getAuthToken());
        console.log('==================================');
        
        const healthOk = await this.checkApiHealth();
        console.log('==================================');
        
        const dashboardOk = await this.testEmployerDashboardEndpoint();
        console.log('==================================');
        
        const applicationsOk = await this.testApplicationsEndpoint();
        console.log('==================================');
        
        const jobsOk = await this.testJobListingsEndpoint();
        console.log('==================================');
        
        console.log('📋 Diagnostics Summary:');
        console.log(`API Health: ${healthOk ? '✅ OK' : '❌ FAILED'}`);
        console.log(`Dashboard Endpoints: ${dashboardOk ? '✅ OK' : '❌ FAILED'}`);
        console.log(`Applications Endpoints: ${applicationsOk ? '✅ OK' : '❌ FAILED'}`);
        console.log(`Job Listings Endpoints: ${jobsOk ? '✅ OK' : '❌ FAILED'}`);
        
        if (!healthOk) {
            console.log('API server may be down or unreachable. Check server status.');
        }
        
        if (!dashboardOk) {
            console.log('Dashboard endpoints are not responding. This may be due to:');
            console.log('1. Missing dashboard.routes.js registration in index.js');
            console.log('2. Authentication issues with your token');
            console.log('3. Route path mismatch between frontend and backend');
        }
        
        if (!applicationsOk) {
            console.log('Applications endpoints are not responding. This may be due to:');
            console.log('1. Authentication issues with your token');
            console.log('2. Route path mismatch between frontend and backend');
        }
        
        if (!jobsOk) {
            console.log('Job listings endpoints are not responding. This may be due to:');
            console.log('1. Authentication issues with your token');
            console.log('2. Route path mismatch between frontend and backend');
            console.log('3. Missing company association for the employer account');
        }
        
        return {
            healthOk,
            dashboardOk,
            applicationsOk,
            jobsOk,
            apiUrl: this.API_URL,
            hasToken: !!this.getAuthToken()
        };
    }
};

// Make diagnostics available globally
window.API_DIAGNOSTICS = API_DIAGNOSTICS;

// Log usage instructions
console.log('API Diagnostics loaded! ✅');
console.log('Run API_DIAGNOSTICS.runAllTests() to check API connectivity'); 