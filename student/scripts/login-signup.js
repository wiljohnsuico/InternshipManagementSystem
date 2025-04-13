document.addEventListener("DOMContentLoaded", function () {
    // Modal elements
    const openLoginButton = document.getElementById("openLogin");
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal");
    const closeLoginButton = document.getElementById("closeLogin");
    const closeSignupButton = document.getElementById("closeSignup");
    const signupLink = document.getElementById("signup-now");
    
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
});
