document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("companyTableBody");
  const addCompanyModal = document.getElementById("addCompanyModal");
  const addCompanyForm = document.getElementById("addCompanyForm");

  const addCompanyName = document.getElementById("addCompanyName");
  const addIndustrySector = document.getElementById("addIndustrySector");
  const addFullName = document.getElementById("addFullName");
  const addEmail = document.getElementById("addEmail");
  const addPassword = document.getElementById("addPassword");
  const addContactNumber = document.getElementById("addContactNumber");
  const addAddress = document.getElementById("addAddress");
  const addDescription = document.getElementById("addDescription");
  const addInternPosition = document.getElementById("addInternPosition");
  const addSkills = document.getElementById("addSkills");
  const addInternDuration = document.getElementById("addInternDuration");

  const editCompanyName = document.getElementById("editCompanyName");
  const editIndustrySector = document.getElementById("editIndustrySector");
  const editFullName = document.getElementById("editFullName");
  const editEmail = document.getElementById("editEmail");
  const editPassword = document.getElementById("editPassword");
  const editContactNumber = document.getElementById("editContactNumber");
  const editAddress = document.getElementById("editAddress");
  const editDescription = document.getElementById("editDescription");
  const editInternPosition = document.getElementById("editInternPosition");
  const editSkills = document.getElementById("editSkills");
  const editInternDuration = document.getElementById("editInternDuration");

  let currentEditId = null;

  // Load companies from the API
  async function loadCompanies() {
    try {
      const res = await fetch("http://localhost:5004/api/companies");
      const companies = await res.json();
      tableBody.innerHTML = ""; // Clear table before populating

      companies.forEach((company, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${company.company_name}</td>
          <td>${company.industry_sector}</td>
          <td>${company.full_name}</td>
          <td>${company.email}</td>
          <td>${company.password}</td>
          <td>${company.contact_number}</td>
          <td>${company.address}</td>
          <td>${company.description}</td>
          <td>${company.intern_position}</td>
          <td>${company.skills}</td>
          <td>${company.intern_duration}</td>
          <td>
            <button class="edit-btn" data-id="${company.company_id}">Edit</button>
            <button class="delete-btn" data-id="${company.company_id}">Delete</button>
          </td>
        `;
        row.querySelector(".edit-btn").addEventListener("click", () => openEditModal(company));
        row.querySelector(".delete-btn").addEventListener("click", () => deleteCompany(company.company_id));
        tableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading companies:", err);
    }
  }

  // Open modal for adding a company
  document.getElementById("addCompanyButton").addEventListener("click", () => {
    addCompanyModal.style.display = "flex"; // Show modal
  });

  // Close the add company modal
  document.getElementById("modalCloseBtn").addEventListener("click", () => {
    addCompanyModal.style.display = "none";
    addCompanyForm.reset(); // Clear form fields
  });

  // Handle Add Company form submission
  addCompanyForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent page reload

    const newCompany = {
      company_name: addCompanyName.value,
      industry_sector: addIndustrySector.value,
      full_name: addFullName.value,
      contact_number: addContactNumber.value,
      address: addAddress.value,
      description: addDescription.value,
      intern_position: addInternPosition.value,
      skills: addSkills.value,
      intern_duration: addInternDuration.value,
    };

    const newUser = {
      email: addEmail.value,
      password: addPassword.value
    };

    try {
      // Step 1: Add user to users_tbl
      const userResponse = await fetch("http://localhost:5004/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newUser)
      });

      if (userResponse.ok) {
        // Step 2: Add company to companies_tbl
        await fetch("http://localhost:5004/api/companies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(newCompany)
        });

        loadCompanies(); // Reload the companies list
        addCompanyModal.style.display = "none"; // Close the modal
      } else {
        console.error("Failed to add user");
      }
    } catch (err) {
      console.error("Failed to add company or user:", err);
    }
  });

  // Open the edit modal and populate with current company details
  function openEditModal(company) {
    editCompanyName.value = company.company_name;
    editIndustrySector.value = company.industry_sector;
    editFullName.value = company.full_name;
    editEmail.value = company.email;
    editPassword.value = company.password;
    editContactNumber.value = company.contact_number;
    editAddress.value = company.address;
    editDescription.value = company.description;
    editInternPosition.value = company.intern_position;
    editSkills.value = company.skills;
    editInternDuration.value = company.intern_duration;
    currentEditId = company.company_id;
    document.getElementById("editCompanyModal").style.display = "flex"; // Show the edit modal
  }

  // Handle Edit Company form submission
  document.getElementById("editCompanyForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedCompany = {
      company_name: editCompanyName.value,
      industry_sector: editIndustrySector.value,
      full_name: editFullName.value,
      contact_number: editContactNumber.value,
      address: editAddress.value,
      description: editDescription.value,
      intern_position: editInternPosition.value,
      skills: editSkills.value,
      intern_duration: editInternDuration.value,
      email: editEmail.value,
      password: editPassword.value
    };    

    try {
      await fetch(`http://localhost:5004/api/companies/${currentEditId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedCompany)
      });
      loadCompanies(); // Reload the list
      document.getElementById("editCompanyModal").style.display = "none"; // Close modal
    } catch (err) {
      console.error("Failed to update company:", err);
    }
  });

  // Delete a company
  async function deleteCompany(companyId) {
    if (confirm("Are you sure you want to delete this company?")) {
      try {
        await fetch(`http://localhost:5004/api/companies/${companyId}`, {
          method: "DELETE"
        });
        loadCompanies(); // Reload companies after deletion
      } catch (err) {
        console.error("Error deleting company:", err);
      }
    }
  }

  // Search functionality
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

  // Load companies on page load
  loadCompanies();
});
