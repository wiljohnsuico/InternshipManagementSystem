document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("internTableBody");
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const editCollegeDepartment = document.getElementById("editCollegeDepartment");
  const editCourse = document.getElementById("editCourse");
  const editInternId = document.getElementById("editInternId");

  // Toast alert
  const showToast = (message, duration = 3000) => {
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  };

  // Fetch interns from the backend and load into the table
function loadInterns() {
  fetch("http://localhost:5004/api/admin/interns")
    .then(response => response.json())
    .then(interns => {
      tableBody.innerHTML = "";

      interns.forEach((intern, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${intern.student_no}</td>
          <td>${intern.first_name}</td>
          <td>${intern.middle_name}</td>
          <td>${intern.last_name}</td>
          <td>${intern.contact_number}</td>
          <td>${intern.year_level}</td>
          <td>${intern.section}</td>
          <td>${intern.dept}</td>
          <td>${intern.course}</td>
          <td>${intern.skills}</td>
          <td>${intern.intern_fields}</td>
          <td>${intern.rsm_cv}</td>
          <td>${intern.email}</td>
          <td>${intern.password}</td>
          <td>${intern.status}</td>
          <td class="actions">
            <button class="accept-btn">Accept</button>
            <button class="reject-btn">Reject</button>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
          </td>
        `;

        // Accept
        row.querySelector(".accept-btn").addEventListener("click", (e) => {
          e.target.disabled = true;
          e.target.innerText = "Processing…";
          console.log(`Accept clicked for ID: ${intern.intern_id}`);
          updateInternStatus(intern.intern_id, "accept");
        });

        // Reject
        row.querySelector(".reject-btn").addEventListener("click", (e) => {
          e.target.disabled = true;
          e.target.innerText = "Processing…";
          console.log(`Reject clicked for ID: ${intern.intern_id}`);
          updateInternStatus(intern.intern_id, "reject");
        });

        // Edit
        row.querySelector(".edit-btn").addEventListener("click", () => {
          openEditModal(intern);
        });

        // Delete
        row.querySelector(".delete-btn").addEventListener("click", () => {
          if (confirm(`Delete intern ${intern.first_name} ${intern.last_name}?`)) {
            deleteIntern(intern.intern_id);
          }
        });

        tableBody.appendChild(row);
      });
    })
    .catch(err => console.error("Error fetching interns:", err));
}

// Accept/Reject intern
function updateInternStatus(internId, action) {
  fetch(`http://localhost:5004/api/admin/interns/${action}/${internId}`, {
    method: "PATCH",
  })
    .then(response => response.json())
    .then(data => {
      console.log(data.message || `${action} successful`);
      showToast(data.message || `Intern ${action}ed.`);
      loadInterns();
    })
    .catch(err => {
      console.error(`Failed to ${action} intern:`, err);
      showToast(`Failed to ${action} intern.`, 4000);
    });
}

  // Delete intern
function deleteIntern(internId) {
  fetch(`http://localhost:5004/api/admin/interns/${internId}`, {
    method: "DELETE",
  })
    .then(response => response.json())
    .then(data => {
      showToast(data.message || "Intern deleted.");
      loadInterns();
    })
    .catch(err => {
      console.error("Failed to delete intern:", err);
      showToast("Failed to delete intern.", 4000);
    });
}


  // Open edit modal
  function openEditModal(intern) {
    editInternId.value = intern.intern_id;
    editFirstName.value = intern.first_name;
    editLastName.value = intern.last_name;
    editCollegeDepartment.value = intern.dept;
    editCourse.value = intern.course;
    editModal.style.display = "flex";
  }

  // Close edit modal
  window.closeEditModal = function () {
    editModal.style.display = "none";
  };

  // Edit form submit
editForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const internId = editInternId.value;
  const updatedIntern = {
    first_name: editFirstName.value,
    last_name: editLastName.value,
    dept: editCollegeDepartment.value,
    course: editCourse.value,
  };

  fetch(`http://localhost:5004/api/admin/interns/${internId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedIntern),
  })
    .then(response => response.json())
    .then(() => {
      closeEditModal();
      showToast("Intern updated successfully.");
      loadInterns();
    })
    .catch(err => {
      console.error("Failed to update intern:", err);
      showToast("Failed to update intern.", 4000);
    }); 
});


  // Search interns
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

  // Initial load
  loadInterns();
});
