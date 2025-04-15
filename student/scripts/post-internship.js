document.addEventListener("DOMContentLoaded", function() {
    const openAddInternshipButton = document.getElementById("postInternship");
    const addInternshipModal = document.getElementById("postInternship-modal");
    const closeAddInternshipModal = document.getElementById("closeAddInternshipModal");
    const submitInternshipForm = document.querySelector("#postInternship-modal form");

    if(openAddInternshipButton) {
        openAddInternshipButton.addEventListener("click", function(){
            addInternshipModal.classList.add("active");
            document.body.classList.add("no-scroll");
        });
    }

    if(closeAddInternshipModal){
        closeAddInternshipModal.addEventListener("click", function(){
            addInternshipModal.classList.remove("active");
            document.body.classList.remove("no-scroll");
        })
    }

    window.addEventListener("click", function(e) {
        const modal = document.getElementById("postInternship-modal");
        if (e.target === modal) {
            modal.classList.remove("active");
            document.body.classList.remove("no-scroll");
        }
    });
    
    // Handle the form submission
    if(submitInternshipForm) {
        submitInternshipForm.addEventListener("submit", function(e) {
            e.preventDefault();
            addInternship();
        });
    }
});

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
  
// Load internships from localStorage
function loadInternships() {
    const tableBody = document.getElementById("internship-table-body") || document.getElementById("internship-tabe-body");
    const internships = JSON.parse(localStorage.getItem("internships")) || [];
  
    tableBody.innerHTML = "";
  
    if (internships.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="availability-message">
                No internships posted yet.
                </td>
            </tr>
        `;
        updateStats(0);
        return;
    }
  
    internships.forEach(intern => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${intern.position}</td>
            <td>${intern.salary}</td>
            <td>${intern.quota}</td>
            <td>${intern.skills}</td>
            <td>${intern.details}</td>
        `;
        tableBody.appendChild(row);
    });
  
    updateStats(internships.length);
}
  
// Update stats
function updateStats(count) {
    const activeEl = document.getElementById("activeInternship") || document.getElementById("activeInternships");
    const applicationsEl = document.getElementById("applicationReceived") || document.getElementById("applicationsReceived");
    const hiredEl = document.getElementById("hiredInterns");
    
    if(activeEl) activeEl.textContent = count;
    if(applicationsEl) applicationsEl.textContent = count * 5;
    if(hiredEl) hiredEl.textContent = Math.min(count, 1); // Show at least one hired if there are internships
}
  
// Add internship to localStorage
function addInternship() {
    const newInternship = {
        id: generateId(),
        position: document.getElementById("jobTitle").value, // Changed from position to jobTitle
        salary: document.getElementById("salary").value,
        quota: document.getElementById("qouta").value, // Changed from quota to qouta
        skills: document.getElementById("skills").value,
        details: document.getElementById("details").value
    };
  
    let internships = JSON.parse(localStorage.getItem("internships")) || [];
    internships.push(newInternship);
    localStorage.setItem("internships", JSON.stringify(internships));
  
    // Clear form
    document.getElementById("jobTitle").value = '';
    document.getElementById("salary").value = '';
    document.getElementById("qouta").value = '';
    document.getElementById("skills").value = '';
    document.getElementById("details").value = '';
  
    // Close modal
    document.getElementById("postInternship-modal").classList.remove("active");
    document.body.classList.remove("no-scroll");
  
    // Reload list
    loadInternships();
}
  
// Run on page load
window.onload = function() {
    loadInternships();
};

// Modify the loadInternships function to include delete buttons
function loadInternships() {
    const tableBody = document.getElementById("internship-table-body") || document.getElementById("internship-tabe-body");
    const internships = JSON.parse(localStorage.getItem("internships")) || [];
  
    tableBody.innerHTML = "";
  
    if (internships.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="availability-message">
                No internships posted yet.
                </td>
            </tr>
        `;
        updateStats(0);
        return;
    }
  
    internships.forEach(intern => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${intern.position}</td>
            <td>${intern.salary}</td>
            <td>${intern.quota}</td>
            <td>${intern.skills}</td>
            <td>${intern.details}</td>
            <td>
                <button class="delete-btn" data-id="${intern.id}">
                    Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Add event listeners to all delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const internshipId = this.getAttribute('data-id');
            deleteInternship(internshipId);
        });
    });
  
    updateStats(internships.length);
}

// Function to delete an internship
function deleteInternship(id) {
    // Confirm before deletion
    if (confirm('Are you sure you want to delete this internship posting?')) {
        // Get current internships
        let internships = JSON.parse(localStorage.getItem("internships")) || [];
        
        // Filter out the internship with the matching id
        internships = internships.filter(internship => internship.id !== id);
        
        // Save the updated internships array
        localStorage.setItem("internships", JSON.stringify(internships));
        
        // Reload the internships list
        loadInternships();
        
        // Show confirmation message
        alert('Internship posting deleted successfully!');
    }
}
