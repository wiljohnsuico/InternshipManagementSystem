 // Status options with colors
 const statusOptions = [
    { value: "Application Received", color: "#60a5fa" }, // blue
    { value: "Under Review", color: "#f59e0b" }, // amber
    { value: "Shortlisted", color: "#10b981" }, // emerald
    { value: "Interview Scheduled", color: "#8b5cf6" }, // violet
    { value: "Upcoming Interview", color: "#6366f1" }, // indigo
    { value: "Interviewed", color: "#3b82f6" }, // blue
    { value: "Offer Extended", color: "#059669" }, // green
    { value: "Accepted", color: "#22c55e" }, // green
    { value: "Declined", color: "#f43f5e" }, // red
    { value: "Rejected", color: "#dc2626" }, // red
    { value: "Withdrawn", color: "#78716c" }, // stone
    { value: "Unqualified", color: "#ef4444" }  // red
];

// Show status info dialog
function showStatusInfo() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('status-info').style.display = 'block';
}

// Close status info dialog
function closeStatusInfo() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('status-info').style.display = 'none';
}

// Handle status change
function handleStatusChange(event) {
    const newStatus = event.target.value;
    // In a real app, you would update the database here
    console.log(`Updating status to ${newStatus}`);
    
    // Update the status color
    const selectedOption = statusOptions.find(option => option.value === newStatus);
    if (selectedOption) {
        const indicator = event.target.previousElementSibling;
        indicator.style.backgroundColor = selectedOption.color;
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Set up status change listeners
    const statusSelects = document.querySelectorAll('.status-select');
    statusSelects.forEach(select => {
        select.addEventListener('change', handleStatusChange);
    });

    // Close dialog when clicking on overlay
    document.getElementById('overlay').addEventListener('click', closeStatusInfo);
});
