document.addEventListener("DOMContentLoaded", () => {
  const companyTableBody = document.getElementById("companyTableBody");
  const editModal = document.getElementById("editModal");
  const addCompanyModal = document.getElementById("addCompanyModal");
  const editForm = document.getElementById("editForm");
  const addCompanyForm = document.getElementById("addCompanyForm");
  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const editWebsite = document.getElementById("editWebsite");
  const editIndustry = document.getElementById("editIndustry");
  const editIndex = document.getElementById("editIndex");
  const API_URL = "http://localhost:5004";

  // Function to get authorization header
  function getAuthHeader() {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Function to fetch companies from API
  async function fetchCompanies() {
    try {
      console.log('Fetching companies from API');
      const response = await fetch(`${API_URL}/api/admin/companies`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Error fetching companies: ${response.status}`);
      }

      const data = await response.json();
      console.log('Companies data received:', data);
      
      if (!data.companies || !Array.isArray(data.companies)) {
        console.warn('Invalid companies data format:', data);
        return [];
      }
      
      return data.companies || [];
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      alert("Failed to load companies data. Please try again later.");
      return [];
    }
  }

  // Function to update company
  async function updateCompany(companyId, companyData) {
    try {
      const response = await fetch(`${API_URL}/api/admin/companies/${companyId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(companyData)
      });

      if (!response.ok) {
        throw new Error(`Error updating company: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to update company:', error);
      return false;
    }
  }

  // Function to delete company
  async function archiveCompany(companyId) {
    try {
      if (!companyId || companyId === 'undefined') {
        throw new Error('Invalid company ID provided');
      }

      console.log(`Attempting to archive company with ID: ${companyId}`);
      
      const response = await fetch(`${API_URL}/api/admin/companies/${companyId}/archive`, {
        method: 'PUT',
        headers: getAuthHeader()
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `Error archiving company: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to archive company:', error);
      alert(error.message || 'Failed to archive company');
      return false;
    }
  }

  // Function to create new company
  async function createCompany(companyData) {
    try {
      const response = await fetch(`${API_URL}/api/admin/companies`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(companyData)
      });

      if (!response.ok) {
        throw new Error(`Error creating company: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to create company:', error);
      return false;
    }
  }

  // Load companies to the table
  async function loadCompanies() {
    companyTableBody.innerHTML = "";
    const companies = await fetchCompanies();
    
    console.log('Loaded companies data:', companies);

    companies.forEach((company, index) => {
      const row = document.createElement("tr");
      
      // Ensure company_id is valid
      const companyId = company.company_id || company.id;
      console.log(`Row ${index + 1}: Company ID = ${companyId}, Name = ${company.company_name}`);
      
      if (!companyId) {
        console.error('Company missing ID:', company);
      }
      
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${company.company_name}</td>
        <td>${company.address || 'N/A'}</td>
        <td>${company.industry || 'N/A'}</td>
        <td>${company.website || 'N/A'}</td>
        <td>
          <button class="edit-btn">Edit</button>
          <button class="edit-btn archive-btn">Archive</button>
        </td>
      `;

      // Edit
      row.querySelector(".edit-btn").addEventListener("click", () => {
        openEditModal(companyId, company);
      });

      // Archive (formerly Delete)
      row.querySelector(".archive-btn").addEventListener("click", async () => {
        if (confirm(`Are you sure you want to archive ${company.company_name}? This will move it to the archive list but can be restored later.`)) {
          try {
            const success = await archiveCompany(companyId);
            if (success) {
              alert(`${company.company_name} has been archived successfully.`);
              loadCompanies();
            }
          } catch (err) {
            alert(err.message || 'Failed to archive company');
          }
        }
      });

      companyTableBody.appendChild(row);
    });
  }

  function openEditModal(companyId, company) {
    if (!companyId || companyId === 'undefined') {
      console.error('Invalid company ID:', companyId);
      alert('Cannot edit this company: Invalid ID');
      return;
    }
    
    console.log('Opening edit modal for company ID:', companyId);
    
    editIndex.value = companyId;
    editFirstName.value = company.company_name;
    editLastName.value = company.address || '';
    
    // Make sure these fields exist in the form
    if (editWebsite) editWebsite.value = company.website || '';
    if (editIndustry) editIndustry.value = company.industry || '';
    
    editModal.style.display = "flex";
  }

  function openAddModal() {
    // Reset form fields
    document.getElementById("companyName").value = '';
    document.getElementById("companyAddress").value = '';
    document.getElementById("companyIndustry").value = '';
    document.getElementById("companyWebsite").value = '';
    
    // Show modal
    addCompanyModal.style.display = "flex";
  }

  window.closeEditModal = function () {
    editModal.style.display = "none";
    editForm.reset();
  };

  window.closeAddModal = function () {
    addCompanyModal.style.display = "none";
    addCompanyForm.reset();
  };

  editForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const companyId = editIndex.value;
    
    const companyData = {
      company_name: editFirstName.value,
      address: editLastName.value,
      website: editWebsite ? editWebsite.value : '',
      industry: editIndustry ? editIndustry.value : ''
    };
    
    const success = await updateCompany(companyId, companyData);
    if (success) {
      closeEditModal();
      loadCompanies();
    } else {
      alert("Failed to update company details");
    }
  });

  // Add Company Form Submit
  addCompanyForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const companyData = {
      company_name: document.getElementById("companyName").value,
      address: document.getElementById("companyAddress").value,
      industry: document.getElementById("companyIndustry").value,
      website: document.getElementById("companyWebsite").value
    };
    
    const success = await createCompany(companyData);
    if (success) {
      closeAddModal();
      loadCompanies();
    } else {
      alert("Failed to create company");
    }
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

  // Add Company Button Click
  document.getElementById("addCompany").addEventListener("click", function() {
    openAddModal();
  });

  // Function to toggle dropdown menu
  window.toggleDropdown = function() {
    const dropdownMenu = document.querySelector(".dropdown-menu");
    if (dropdownMenu) {
      dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
    }
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

  // Load companies when the page loads
  loadCompanies();
});