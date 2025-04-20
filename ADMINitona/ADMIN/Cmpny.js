document.addEventListener("DOMContentLoaded", () => {
  const companyTableBody = document.getElementById("companyTableBody");
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const editIndex = document.getElementById("editIndex");

  let defaultCompanies = [
    { name: "Globe Telecom", address: "Taguig City", status: "Active" },
    { name: "Smart Communications", address: "Makati City", status: "Inactive" },
    { name: "Accenture", address: "Quezon City", status: "Active" }
  ];

  if (!localStorage.getItem("companies")) {
    localStorage.setItem("companies", JSON.stringify(defaultCompanies));
  }

  function loadCompanies() {
    companyTableBody.innerHTML = "";
    let companies = JSON.parse(localStorage.getItem("companies")) || [];

    companies.forEach((company, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${company.name}</td>
        <td>${company.address}</td>
        <td>${company.status}</td>
        <td>
          <button class="edit-btn">Edit</button>
          <button class="delete-btn">Delete</button>
          <button class="toggle-btn">${company.status === "Active" ? "Set Inactive" : "Set Active"}</button>
        </td>
      `;

      // Edit
      row.querySelector(".edit-btn").addEventListener("click", () => {
        openEditModal(index, company);
      });

      // Delete
      row.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm(`Delete ${company.name}?`)) {
          const archived = JSON.parse(localStorage.getItem("archivedCompanies")) || [];
          archived.push(company);
          localStorage.setItem("archivedCompanies", JSON.stringify(archived));
          companies.splice(index, 1);
          localStorage.setItem("companies", JSON.stringify(companies));
          loadCompanies();
        }
      });

      // Toggle Status
      row.querySelector(".toggle-btn").addEventListener("click", () => {
        company.status = company.status === "Active" ? "Inactive" : "Active";
        localStorage.setItem("companies", JSON.stringify(companies));
        loadCompanies();
      });

      companyTableBody.appendChild(row);
    });
  }

  function openEditModal(index, company) {
    editIndex.value = index;
    editFirstName.value = company.name;
    editLastName.value = company.address;
    editModal.style.display = "flex";
  }

  window.closeEditModal = function () {
    editModal.style.display = "none";
  };

  editForm.addEventListener("submit", function (e) {
    e.preventDefault();
    let companies = JSON.parse(localStorage.getItem("companies")) || [];
    const index = parseInt(editIndex.value);
    companies[index].name = editFirstName.value;
    companies[index].address = editLastName.value;
    localStorage.setItem("companies", JSON.stringify(companies));
    closeEditModal();
    loadCompanies();
  });

  // Search
  window.searchTable = function () {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const tableBody = document.getElementById("companyTableBody");
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

  // Add new company
  document.getElementById("addCompany").addEventListener("click", () => {
    const name = prompt("Enter company name:");
    if (!name) return;
    const address = prompt("Enter company address:");
    if (!address) return;

    let companies = JSON.parse(localStorage.getItem("companies")) || [];
    companies.push({ name, address, status: "Active" });
    localStorage.setItem("companies", JSON.stringify(companies));
    loadCompanies();
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

  loadCompanies();
});

// Dropdown
window.toggleDropdown = function () {
  document.getElementById("dropdownMenu").classList.toggle("show");
};

window.onclick = function (event) {
  if (!event.target.closest('.admin-text')) {
    const dropdown = document.getElementById("dropdownMenu");
    if (dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  }
};