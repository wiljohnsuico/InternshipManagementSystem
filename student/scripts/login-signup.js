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
    
    // Open login modal
    if (openLoginButton) {
        openLoginButton.addEventListener("click", function () {
            loginModal.classList.add("active");
            document.body.classList.add("no-scroll");
        });
    }
    
    // Close login modal
    if (closeLoginButton) {
        closeLoginButton.addEventListener("click", function () {
            loginModal.classList.remove("active");
            document.body.classList.remove("no-scroll");
        });
    }
    
    // Switch from login to signup
    if (signupLink) {
        signupLink.addEventListener("click", function (e) {
            e.preventDefault();
            loginModal.classList.remove("active");
            signupModal.classList.add("active");
        });
    }
    
    // Close signup modal
    if (closeSignupButton) {
        closeSignupButton.addEventListener("click", function () {
            signupModal.classList.remove("active");
            document.body.classList.remove("no-scroll");
        });
    }
    
    // Close modals when clicking outside
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

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            try {
                const response = await fetch('http://localhost:5001/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log('Login response:', data);

                if (data.success) {
                    // Store the token in localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Redirect based on role
                    switch (data.user.role) {
                        case 'Intern':
                            window.location.href = 'mplhome.html';
                            break;
                        case 'Employer':
                            window.location.href = 'mplemployerprofile.html';
                            break;
                        case 'Faculty':
                            window.location.href = 'faculty-dashboard.html';
                            break;
                        case 'Admin':
                            window.location.href = 'admin-dashboard.html';
                            break;
                        default:
                            alert('Unknown role');
                    }
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }

    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const formData = {
                email: document.getElementById("signupEmail").value,
                password: document.getElementById("password").value,
                confirmPassword: document.getElementById("confirmPassword").value,
                first_name: document.getElementById("firstname").value,
                last_name: document.getElementById("lastname").value,
                student_id: document.getElementById("studentId").value,
                role: 'Intern' // Default role for signup
            };

            console.log('Signup data being sent:', { ...formData, password: '***' });

            if (formData.password !== formData.confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                const response = await fetch('http://localhost:5001/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                console.log('Signup response status:', response.status);
                const data = await response.json();
                console.log('Signup response data:', data);

                if (response.ok && data.success) {
                    alert('Signup successful! Please login.');
                    signupModal.classList.remove("active");
                    loginModal.classList.add("active");
                    signupForm.reset(); // Clear the form
                } else {
                    // Handle specific error messages
                    const errorMessage = data.message || 'Signup failed. Please try again.';
                    alert(errorMessage);
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert('An error occurred during signup. Please check your connection and try again.');
            }
        });
    }
});
