document.addEventListener("DOMContentLoaded", function () {
    let openButton = document.getElementById("openLogin");
    let closeButton = document.getElementById("closeLogin");
    let popup = document.getElementById("loginPopup"); // Corrected ID

    console.log("JavaScript Loaded"); // Debugging step

    openButton.addEventListener("click", function () {
        console.log("Open button clicked"); // Debugging step
        popup.classList.add("active"); // Show popup
    });

    closeButton.addEventListener("click", function () {
        console.log("Close button clicked"); // Debugging step
        popup.classList.remove("active"); // Hide popup
    });
});