/**
 * Fix script for login-related issues
 * Run: node fix-login.js
 */

const fs = require('fs');
const path = require('path');

console.log('Fixing login-related issues...');

// 1. Create a .env file if it doesn't exist
const envPath = path.join(__dirname, 'BackEnd', '.env');
if (!fs.existsSync(envPath)) {
    console.log('Creating .env file...');
    const envContent = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=qcu_ims
DB_PORT=3306

# JWT Configuration
JWT_SECRET=internship-management-system-secret-key
TOKEN_EXPIRE=24h

# Server Configuration
PORT=5004
NODE_ENV=development`;

    fs.writeFileSync(envPath, envContent);
    console.log('Created .env file successfully.');
}

// 2. Update login.html to add proper error handling
const loginHtmlPath = path.join(__dirname, 'student', 'auth', 'login.html');
if (fs.existsSync(loginHtmlPath)) {
    const loginHtml = fs.readFileSync(loginHtmlPath, 'utf8');
    
    // Check if our error handling elements already exist
    if (!loginHtml.includes('connection-status')) {
        console.log('Updating login.html to add error handling...');
        
        // Find a good place to insert our code - before the closing body tag
        let updatedHtml = loginHtml;
        
        if (loginHtml.includes('</body>')) {
            const insertPosition = loginHtml.lastIndexOf('</body>');
            const beforeInsert = loginHtml.substring(0, insertPosition);
            const afterInsert = loginHtml.substring(insertPosition);
            
            const insertContent = `
<!-- Connection status elements -->
<div id="connection-status" class="alert alert-warning" style="display: none; margin-top: 10px;">
    Checking API server connection...
</div>

<div id="server-error" class="alert alert-danger" style="display: none; margin-top: 10px;">
    Cannot connect to the server. Please make sure the backend is running.
    <button id="retry-connection" class="btn btn-sm btn-outline-primary mt-2">Retry Connection</button>
</div>

<!-- API connection check script -->
<script>
    // Check API server connection
    function checkServerConnection() {
        document.getElementById('connection-status').style.display = 'block';
        document.getElementById('server-error').style.display = 'none';
        
        fetch('http://localhost:5004/api/status')
            .then(response => {
                if (response.ok) {
                    document.getElementById('connection-status').style.display = 'none';
                    document.getElementById('server-error').style.display = 'none';
                    console.log('API server is running');
                    return true;
                } else {
                    throw new Error('API server returned an error');
                }
            })
            .catch(error => {
                console.error('API server connection error:', error);
                document.getElementById('connection-status').style.display = 'none';
                document.getElementById('server-error').style.display = 'block';
                return false;
            });
    }

    // Run the connection check when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        checkServerConnection();
        
        // Add event listener to retry button
        const retryButton = document.getElementById('retry-connection');
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                checkServerConnection();
            });
        }
    });
</script>
`;
            
            updatedHtml = beforeInsert + insertContent + afterInsert;
            fs.writeFileSync(loginHtmlPath, updatedHtml);
            console.log('Updated login.html successfully.');
        } else {
            console.log('Could not find a good place to insert connection error handling in login.html');
        }
    } else {
        console.log('login.html already has connection error handling.');
    }
} else {
    console.log('login.html not found at expected path:', loginHtmlPath);
}

// 3. Update login-signup.js to handle fetch errors
const loginJsPath = path.join(__dirname, 'student', 'scripts', 'login-signup.js');
if (fs.existsSync(loginJsPath)) {
    console.log('Updating login-signup.js to improve error handling...');
    const loginJs = fs.readFileSync(loginJsPath, 'utf8');
    
    // Find the login form handler
    if (loginJs.includes('loginForm.addEventListener')) {
        let updatedJs = loginJs;
        
        // Replace the fetch code with better error handling
        const fetchStartRegex = /fetch\('http:\/\/localhost:5004\/api\/auth\/login'/;
        const fetchStartPos = updatedJs.search(fetchStartRegex);
        
        if (fetchStartPos !== -1) {
            // Find the entire try-catch block
            const tryStartPos = updatedJs.lastIndexOf('try', fetchStartPos);
            const catchPos = updatedJs.indexOf('catch', fetchStartPos);
            const catchEndPos = updatedJs.indexOf('}', updatedJs.indexOf('}', catchPos));
            
            if (tryStartPos !== -1 && catchPos !== -1 && catchEndPos !== -1) {
                const beforeTry = updatedJs.substring(0, tryStartPos);
                const afterCatch = updatedJs.substring(catchEndPos + 1);
                
                const newTryCatch = `try {
                console.log('Attempting login...');
                
                const response = await fetch('http://localhost:5004/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });
                
                console.log('Login response status:', response.status);
                
                // Handle connection refused error (status 0)
                if (response.status === 0) {
                    throw new Error('Could not connect to server. Please make sure the backend is running.');
                }
                
                const data = await response.json();
                console.log('Login response:', { ...data, token: data.token ? '[HIDDEN]' : null });

                if (response.ok && data.success) {
                    // Store token and user data
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify({
                        user_id: data.user.user_id,
                        role: data.user.role,
                        email: data.user.email,
                        first_name: data.user.first_name,
                        last_name: data.user.last_name
                    }));

                    // Show success message
                    alert('Login successful! Welcome ' + data.user.first_name + '!');

                    // Redirect based on role
                    switch (data.user.role) {
                        case 'Intern':
                            window.location.href = 'mplhome.html';
                            break;
                        case 'Employer':
                            window.location.href = '/student/employers/dashboard.html';
                            break;
                        case 'Faculty':
                            window.location.href = 'mplhome.html';
                            break;
                        case 'Admin':
                            window.location.href = 'mplhome.html';
                            break;
                        default:
                            alert('Unknown user role');
                    }
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                
                if (error.message.includes('Could not connect')) {
                    alert(error.message);
                } else {
                    alert('Error during login. ' + error.message);
                }
            }`;
                
                updatedJs = beforeTry + newTryCatch + afterCatch;
                fs.writeFileSync(loginJsPath, updatedJs);
                console.log('Updated login-signup.js successfully.');
            } else {
                console.log('Could not find the complete try-catch block in login-signup.js');
            }
        } else {
            console.log('Could not find the fetch call in login-signup.js');
        }
    } else {
        console.log('Could not find login form handler in login-signup.js');
    }
} else {
    console.log('login-signup.js not found at expected path:', loginJsPath);
}

console.log('\nFix script completed. Next steps:');
console.log('1. Make sure MySQL is running and properly configured');
console.log('2. Start the backend server: cd BackEnd && node start-server.js');
console.log('3. Verify the backend is running: node check-server.js');
console.log('4. Start the frontend: npm start'); 