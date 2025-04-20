document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("companyTableBody");
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");

  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const editPassword = document.getElementById("editPassword");
  const editUsername = document.getElementById("editUsername");
  const editCompany = document.getElementById("editCompanyAffiliated");
  const editIndex = document.getElementById("editIndex");

  const defaultEmployers = [
      { firstName: "Mark", lastName: "Reyes", username: "mreyes", password: "admin123", company: "ABC Corp" },
      { firstName: "Anna", lastName: "Garcia", username: "agarcia", password: "pass456", company: "XYZ Ltd" }
  ];

  if (!localStorage.getItem("employers")) {
      localStorage.setItem("employers", JSON.stringify(defaultEmployers));
  }

  function loadEmployers() {
      const employers = JSON.parse(localStorage.getItem("employers")) || [];
      tableBody.innerHTML = "";

      employers.forEach((emp, index) => {
          const row = document.createElement("tr");
          row.innerHTML = `
              <td>${index + 1}</td>
              <td>${emp.firstName}</td>
              <td>${emp.lastName}</td>
              <td>${emp.password}</td>
              <td>${emp.username}</td>
              <td>${emp.company}</td>
              <td>
                  <button class="edit-btn">Edit</button>
                  <button class="delete-btn">Delete</button>
              </td>
          `;

          row.querySelector(".edit-btn").addEventListener("click", () => {
              openEditModal(index, emp);
          });

          row.querySelector(".delete-btn").addEventListener("click", () => {
              if (confirm(`Delete ${emp.firstName} ${emp.lastName}?`)) {
                  const archived = JSON.parse(localStorage.getItem("archivedEmployers")) || [];
                  archived.push(emp);
                  localStorage.setItem("archivedEmployers", JSON.stringify(archived));

                  employers.splice(index, 1);
                  localStorage.setItem("employers", JSON.stringify(employers));
                  loadEmployers();
              }
          });

          tableBody.appendChild(row);
      });
  }

  function openEditModal(index, emp) {
      editFirstName.value = emp.firstName;
      editLastName.value = emp.lastName;
      editPassword.value = emp.password;
      editUsername.value = emp.username;
      editCompany.value = emp.company;

      // Add the index value to identify which employer is being edited
      editModal.style.display = "flex";
      editModal.dataset.index = index; // Store the index in the modal's dataset
  }

  function closeEditModal() {
      editModal.style.display = "none";
      editForm.reset();
  }

  document.getElementById("modalCloseBtn").addEventListener("click", closeEditModal);

  editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const index = parseInt(editModal.dataset.index);
      const employers = JSON.parse(localStorage.getItem("employers")) || [];

      employers[index].firstName = editFirstName.value;
      employers[index].lastName = editLastName.value;
      employers[index].password = editPassword.value;
      employers[index].username = editUsername.value;
      employers[index].company = editCompany.value;

      localStorage.setItem("employers", JSON.stringify(employers));
      closeEditModal();
      loadEmployers();
  });

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

  document.getElementById("addCompany").addEventListener("click", () => {
      const firstName = prompt("Enter First Name:");
      if (!firstName) return;

      const lastName = prompt("Enter Last Name:");
      if (!lastName) return;

      const username = prompt("Enter Username:");
      if (!username) return;

      const password = prompt("Enter Password:");
      if (!password) return;

      const company = prompt("Enter Company Affiliated:");
      if (!company) return;

      const employers = JSON.parse(localStorage.getItem("employers")) || [];
      employers.push({ firstName, lastName, username, password, company });
      localStorage.setItem("employers", JSON.stringify(employers));
      loadEmployers();
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