document.addEventListener("DOMContentLoaded", function() {
    const openAddInternshipButton = document.getElementById("postInternship");
    const createJobPostingButton = document.getElementById("createJobPosting");
    const addInternshipModal = document.getElementById("postInternship-modal");
    const closeAddInternshipModal = document.getElementById("closeAddInternshipModal");
    const submitInternshipForm = document.querySelector("#postInternship-modal form");

    // Event for 'Post An Internship' in dropdown menu
    if(openAddInternshipButton) {
        openAddInternshipButton.addEventListener("click", function(){
            addInternshipModal.classList.add("active");
            document.body.classList.add("no-scroll");
        });
    }

    // Event for 'Create job posting' button
    if(createJobPostingButton) {
        createJobPostingButton.addEventListener("click", function(){
            addInternshipModal.classList.add("active");
            document.body.classList.add("no-scroll");
        });
    }

    if(closeAddInternshipModal){
        closeAddInternshipModal.addEventListener("click", function(){
            addInternshipModal.classList.remove("active");
            document.body.classList.remove("no-scroll");
        });
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

    // Initialize with sample data if storage is empty
    if(!localStorage.getItem("internships")) {
        initializeSampleData();
    }
});

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Sample data initialization
function initializeSampleData() {
    const sampleInternships = [
        {
            id: generateId(),
            position: "Financial Analyst Intern",
            salary: "Unpaid",
            quota: "25",
            skills: "",
            details: "..."
        },
        {
            id: generateId(),
            position: "Financial Analyst Intern",
            salary: "Paid",
            quota: "4",
            skills: "",
            details: "..."
        },
        {
            id: generateId(),
            position: "Accounting Intern",
            salary: "Unpaid",
            quota: "12",
            skills: "",
            details: "..."
        },
        {
            id: generateId(),
            position: "Financial Analyst Intern",
            salary: "Unpaid",
            quota: "12",
            skills: "",
            details: "..."
        }
    ];

    localStorage.setItem("internships", JSON.stringify(sampleInternships));
    
    // Set sample stats
    localStorage.setItem("activeInternshipCount", "28");
    localStorage.setItem("applicationReceivedCount", "26");
    localStorage.setItem("hiredInternsCount", "2");
}

// Load internships from localStorage
function loadInternships() {
    const tableBody = document.getElementById("internship-table-body");
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
            <td>${intern.skills || ""}</td>
            <td>${intern.details}</td>
        `;
        tableBody.appendChild(row);
    });
  
    // Update stats from localStorage or calculated
    updateStatsFromStorage();
}
  
// Update stats from localStorage or with default values
function updateStatsFromStorage() {
    const activeEl = document.getElementById("activeInternship");
    const applicationsEl = document.getElementById("applicationReceived");
    const hiredEl = document.getElementById("hiredInterns");
    
    if(activeEl) activeEl.textContent = localStorage.getItem("activeInternshipCount") || "28";
    if(applicationsEl) applicationsEl.textContent = localStorage.getItem("applicationReceivedCount") || "26";
    if(hiredEl) hiredEl.textContent = localStorage.getItem("hiredInternsCount") || "2";
}

// Update stats with calculated values
function updateStats(count) {
    const activeEl = document.getElementById("activeInternship");
    const applicationsEl = document.getElementById("applicationReceived");
    const hiredEl = document.getElementById("hiredInterns");
    
    if(activeEl) activeEl.textContent = count;
    if(applicationsEl) applicationsEl.textContent = count * 2;
    if(hiredEl) hiredEl.textContent = Math.floor(count / 10) || 0;
    
    // Store the values in localStorage
    localStorage.setItem("activeInternshipCount", count);
    localStorage.setItem("applicationReceivedCount", count * 2);
    localStorage.setItem("hiredInternsCount", Math.floor(count / 10) || 0);
}
  
// Add internship to localStorage
function addInternship() {
    const newInternship = {
        id: generateId(),
        position: document.getElementById("jobTitle").value,
        salary: document.getElementById("salary").value,
        quota: document.getElementById("qouta").value,
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
