document.addEventListener("DOMContentLoaded", function () {
    // Modal elements
    const openLoginButton = document.getElementById("openLogin");
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal");
    const closeLoginButton = document.getElementById("closeLogin");
    const closeSignupButton = document.getElementById("closeSignup");
    const signupLink = document.getElementById("signup-now");
    
    // Form elements
    const loginForm = loginModal.querySelector("form");
    const signupForm = signupModal.querySelector("form");
    
    // Modal helper functions
    function openLoginModal() {
        loginModal.classList.add("active");
        signupModal.classList.remove("active");
        document.body.classList.add("no-scroll");
    }

    function closeLoginModal() {
        loginModal.classList.remove("active");
        document.body.classList.remove("no-scroll");
    }

    function openSignupModal() {
        signupModal.classList.add("active");
        loginModal.classList.remove("active");
        document.body.classList.add("no-scroll");
    }

    function closeSignupModal() {
        signupModal.classList.remove("active");
        document.body.classList.remove("no-scroll");
    }
    
    // Open login modal
    if (openLoginButton) {
        openLoginButton.addEventListener("click", openLoginModal);
    }
    
    // Close login modal
    if (closeLoginButton) {
        closeLoginButton.addEventListener("click", closeLoginModal);
    }
    
    // Switch from login to signup
    if (signupLink) {
        signupLink.addEventListener("click", function (e) {
            e.preventDefault();
            openSignupModal();
        });
    }
    
    // Close signup modal
    if (closeSignupButton) {
        closeSignupButton.addEventListener("click", closeSignupModal);
    }
    
    // Close modals when clicking outside
    /*
    window.addEventListener("click", function (event) {
        if (event.target === loginModal) {
            loginModal.classList.remove("active");
            document.body.classList.remove("no-scroll");
        }
        if (event.target === signupModal) {
            signupModal.classList.remove("active");
            document.body.classList.remove("no-scroll");
        }
    });   
    */  

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const loginEmailInput = document.getElementById('loginEmail');
            const loginPasswordInput = document.getElementById('loginPassword');
            
            if (!loginEmailInput || !loginPasswordInput) {
                alert('Login form inputs not found. Please try again.');
                return;
            }
            
            // Display a loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
            }
            
            const loginData = {
                email: loginEmailInput.value,
                password: loginPasswordInput.value
            };

            try {
                console.log('Attempting login for email:', loginData.email);
                
                const response = await fetch('http://localhost:5004/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                console.log('Login response status:', response.status);
                
                if (!response.ok) {
                    if (response.status === 0 || response.status === 404) {
                        throw new Error('Network error: API server might be down or unreachable');
                    }
                    
                    // Try to parse error response
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || `Login failed with status code ${response.status}`);
                }

                const data = await response.json();
                console.log('Login response:', { ...data, token: data.token ? '[HIDDEN]' : null });

                if (data.success) {
                    // Use handleSuccessfulLogin if available, otherwise fall back to default behavior
                    if (typeof handleSuccessfulLogin === 'function') {
                        // Use the centralized login handler
                        handleSuccessfulLogin(data.user, data.token);
                    } else {
                        // Fall back to existing implementation
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
                                window.location.href = '/faculty/faculty.html';
                                break;
                            case 'Admin':
                                window.location.href = 'mplhome.html';
                                break;
                            default:
                                alert('Unknown user role');
                        }
                    }
                } else {
                    alert(data.message || 'Login failed for unknown reason');
                }
            } catch (error) {
                console.error('Login error:', error);
                
                // More descriptive error messages based on error type
                if (error.message.includes('Network error')) {
                    alert('Unable to connect to the server. Please check if the backend is running and try again.');
                } else {
                    alert('Error during login: ' + error.message);
                }
            } finally {
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            }
        });
    }

    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const signupData = {
                email: document.getElementById('signupEmail').value,
                password: document.getElementById('signupPassword').value,
                role: 'Intern',
                first_name: document.getElementById('firstName').value,
                last_name: document.getElementById('lastName').value,
                student_id: document.getElementById('studentId').value
            };

            try {
                console.log('Signup data:', { ...signupData, password: '[HIDDEN]' });
                const response = await fetch('http://localhost:5004/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(signupData)
                });

                const data = await response.json();
                console.log('Signup response:', data);

                if (response.ok && data.success) {
                    alert('Signup successful! Please login.');
                    signupForm.reset();
                    closeSignupModal();
                    openLoginModal();
                } else {
                    alert(data.message || 'Signup failed. Please try again.');
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert('Error during signup. Please try again.');
            }
        });
    }
});
