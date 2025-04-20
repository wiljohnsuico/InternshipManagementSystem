document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("companyTableBody");
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");
  
    const editFirstName = document.getElementById("editFirstName");
    const editMiddleName = document.getElementById("editMiddleName");
    const editLastName = document.getElementById("editLastName");
    const editContactNumber = document.getElementById("editContactNumber");
    const editEmail = document.getElementById("editEmail");
    const editPassword = document.getElementById("editPassword");
    const editCompany = document.getElementById("editCompanyAffiliated");

    let currentEditId = null;
  
    async function loadEmployers() {
        try {
          const res = await fetch("http://localhost:5004/api/employers"); // Adjust as needed
          const employers = await res.json();
          tableBody.innerHTML = "";
      
          employers.forEach((emp, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${index + 1}</td>
              <td>${emp.first_name}</td>
              <td>${emp.middle_name || ''}</td>
              <td>${emp.last_name}</td>
              <td>${emp.contact_number || ''}</td>
              <td>${emp.email}</td>
              <td>${emp.password || ''}</td>
              <td>${emp.company_name || emp.company || ''}</td>
              <td>
                <button class="edit-btn" data-id="${emp.employer_id}">Edit</button>
                <button class="delete-btn" data-id="${emp.employer_id}">Delete</button>
              </td>
            `;
            row.querySelector(".edit-btn").addEventListener("click", () => openEditModal(emp));
            row.querySelector(".delete-btn").addEventListener("click", () => deleteEmployer(emp.employer_id));
            tableBody.appendChild(row);
          });
        } catch (err) {
          console.error("Error loading employers:", err);
        }
    }
  
    function openEditModal(emp) {
        editFirstName.value = emp.first_name;
        editMiddleName.value = emp.middle_name;
        editLastName.value = emp.last_name;
        editPassword.value = emp.password;
        editEmail.value = emp.email;
        editContactNumber.value = emp.contact_number;
        editCompany.value = emp.company_name || emp.company;
        currentEditId = emp.employer_id;
        editModal.style.display = "flex";
    }
  
    function closeEditModal() {
        editModal.style.display = "none";
        editForm.reset();
        currentEditId = null;
    }

    document.getElementById("modalCloseBtn").addEventListener("click", closeEditModal);
  
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const updatedEmployer = {
        first_name: editFirstName.value,
        middle_name: editMiddleName.value,
        last_name: editLastName.value,
        email: editEmail.value,
        password: editPassword.value,
        contact_number: editContactNumber.value,
        company: editCompany.value
      };
      
      try {
        if (currentEditId) {
          // Edit operation
          await fetch(`http://localhost:5004/api/employers/${currentEditId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedEmployer)
          });
        } else {
          // Add operation
          await fetch("http://localhost:5004/api/employers", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedEmployer)
          });
        }

        closeEditModal();
        loadEmployers();
      } catch (err) {
        console.error("Failed to save employer:", err);
      }
    });
  
    async function deleteEmployer(id) {
        if (!confirm("Are you sure you want to delete this employer?")) return;
        try {
          await fetch(`http://localhost:5004/api/employers/${id}`, {
            method: "DELETE"
          });
          loadEmployers();
        } catch (err) {
          console.error("Error deleting employer:", err);
        }
    }
  
    // Search filter
    window.searchTable = function () {
        const input = document.getElementById("searchInput").value.toLowerCase();
        const rows = tableBody.getElementsByTagName("tr");
    
        for (let row of rows) {
            const cells = row.getElementsByTagName("td");
            let matched = false;
            for (let cell of cells) {
                if (cell.textContent.toLowerCase().includes(input)) {
                    matched = true;
                    break;
                }
            }
            row.style.display = matched ? "" : "none";
        }
    };
  
    // Add Employer button
    document.getElementById("addCompany").addEventListener("click", () => {
        // Open the modal
        editModal.style.display = "flex";
        // Clear the form to make it an 'Add' form instead of 'Edit'
        editForm.reset();
        currentEditId = null; // Ensure you're not editing an existing employer
        document.getElementById("modalCloseBtn").innerHTML = "Cancel";
    });
  
  // Function to toggle dropdown menu
  window.toggleDropdown = function() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
  };

  // Handle logout functionality
  document.querySelector('.dropdown-menu a').addEventListener('click', function(e) {
    if (this.textContent === 'Logout') {
      e.preventDefault();
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/admin-login.html';
    }
  });

    loadEmployers();
});
