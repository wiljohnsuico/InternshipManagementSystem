document.addEventListener("DOMContentLoaded", function() {
    const adminLoginForm = document.getElementById("adminLoginForm");
    const loginMessage = document.getElementById("loginMessage");
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    
    // Toggle password visibility
    togglePassword.addEventListener("click", function() {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        const icon = togglePassword.querySelector("i");
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    });
    
    // Handle login form submission
    adminLoginForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        
        if (!username || !password) {
            showMessage("Please enter both username and password", "error");
            return;
        }
        
        try {
            const loginData = {
                username: username,
                password: password
            };
            
            showMessage("Logging in...", "info");
            
            const response = await fetch('http://localhost:5004/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Check if user role is Admin
                if (data.user.role !== 'Admin') {
                    showMessage("Access denied. Only admin users can login here.", "error");
                    return;
                }
                
                // Store token and user data in localStorage
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify({
                    user_id: data.user.user_id,
                    role: data.user.role,
                    email: data.user.email,
                    first_name: data.user.first_name,
                    last_name: data.user.last_name
                }));
                
                showMessage("Login successful! Redirecting to admin dashboard...", "success");
                
                // Redirect to admin dashboard after a short delay
                setTimeout(() => {
                    window.location.href = "/ADMINitona/ADMIN/Intrn.html";
                }, 1000);
            } else {
                showMessage(data.message || "Invalid credentials. Please try again.", "error");
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage("Server error. Please try again later.", "error");
        }
    });
    
    // Function to show login messages
    function showMessage(message, type) {
        loginMessage.textContent = message;
        loginMessage.style.display = "block";
        
        // Remove all classes
        loginMessage.classList.remove("error", "success", "info");
        
        // Add appropriate class
        if (type === "error") {
            loginMessage.classList.add("error");
        } else if (type === "success") {
            loginMessage.classList.add("success");
        } else if (type === "info") {
            loginMessage.style.display = "block";
            loginMessage.style.backgroundColor = "#e3f2fd";
            loginMessage.style.color = "#2196f3";
            loginMessage.style.border = "1px solid #2196f3";
        }
    }
    
    // Check if user is already logged in
    if (localStorage.getItem('adminToken') && localStorage.getItem('adminUser')) {
        const adminUser = JSON.parse(localStorage.getItem('adminUser'));
        
        if (adminUser.role === 'Admin') {
            window.location.href = "/ADMINitona/ADMIN/Intrn.html";
        }
    }
}); 