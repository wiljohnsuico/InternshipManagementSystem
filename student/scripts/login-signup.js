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
            
            const loginData = {
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            };

            try {
                const response = await fetch('http://localhost:5004/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

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
                            window.location.href = 'mplhome.html';
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
                alert('Error during login. Please try again.');
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
