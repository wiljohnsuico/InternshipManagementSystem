document.addEventListener("DOMContentLoaded", function () {
  // Login popup elements
  let openLoginButton = document.getElementById("openLogin");
  let closeLoginButton = document.getElementById("closeLogin");
  let loginPopup = document.getElementById("loginPopup");
  
  // Signup popup elements
  let signupLink = document.getElementById("signup-now");
  let closeSignupButton = document.getElementById("closeSignup");
  let signupPopup = document.getElementById("signupPopup");
  
  console.log("JavaScript Loaded"); // Debugging step
  
  // Open login popup
  if (openLoginButton) {
      openLoginButton.addEventListener("click", function () {
          console.log("Open login button clicked"); // Debugging step
          loginPopup.classList.add("active"); // Show login popup
      });
  }
  
  // Close login popup
  if (closeLoginButton) {
      closeLoginButton.addEventListener("click", function () {
          console.log("Close login button clicked"); // Debugging step
          loginPopup.classList.remove("active"); // Hide login popup
      });
  }
  
  // Open signup popup from the login popup
  if (signupLink) {
      signupLink.addEventListener("click", function (e) {
          e.preventDefault(); // Prevent default link behavior
          console.log("Signup link clicked"); // Debugging step
          loginPopup.classList.remove("active"); // Hide login popup
          signupPopup.classList.add("active"); // Show signup popup
      });
  }
  
  // Close signup popup
  if (closeSignupButton) {
      closeSignupButton.addEventListener("click", function () {
          console.log("Close signup button clicked"); // Debugging step
          signupPopup.classList.remove("active"); // Hide signup popup
      });
  }
  
  // Close popups when clicking outside
  window.addEventListener("click", function (event) {
      if (event.target === loginPopup) {
          loginPopup.classList.remove("active");
      }
      if (event.target === signupPopup) {
          signupPopup.classList.remove("active");
      }
  });
});