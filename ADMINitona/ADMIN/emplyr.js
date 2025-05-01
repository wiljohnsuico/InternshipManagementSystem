document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("employerTableBody");
  const editModal = document.getElementById("editModal");
  const editForm = document.getElementById("editForm");
  const addEmployerModal = document.getElementById("addEmployerModal");
  const addEmployerForm = document.getElementById("addEmployerForm");

  const editFirstName = document.getElementById("editFirstName");
  const editLastName = document.getElementById("editLastName");
  const editEmail = document.getElementById("editEmail");
  const editCompany = document.getElementById("editCompanyAffiliated");
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

  // Function to fetch employers from API
  async function fetchEmployers() {
    try {
      const response = await fetch(`${API_URL}/api/admin/employers`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Error fetching employers: ${response.status}`);
      }

      const data = await response.json();
      return data.employers || [];
    } catch (error) {
      console.error('Failed to fetch employers:', error);
      // Show error notification
      alert("Failed to load employers data. Please try again later.");
      return [];
    }
  }

  // Function to create new employer
  async function createEmployer(employerData) {
    try {
      const response = await fetch(`${API_URL}/api/admin/employers`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(employerData)
      });

      if (!response.ok) {
        throw new Error(`Error creating employer: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to create employer:', error);
      return false;
    }
  }

  // Function to update employer
  async function updateEmployer(employerId, employerData) {
    try {
      const response = await fetch(`${API_URL}/api/admin/employers/${employerId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(employerData)
      });

      if (!response.ok) {
        throw new Error(`Error updating employer: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to update employer:', error);
      return false;
    }
  }

  // Function to archive employer
  async function archiveEmployer(employerId) {
    try {
      console.log(`Attempting to archive employer with ID:`, employerId);
      
      // Better ID validation
      if (!employerId) {
        console.error('Empty employer ID provided:', employerId);
        alert('Invalid employer ID provided. Please try again.');
        return false;
      }
      
      // Ensure the ID is treated as a number if it's numeric
      const parsedId = parseInt(employerId, 10);
      const idToUse = !isNaN(parsedId) ? parsedId : employerId;
      
      console.log(`Sending archive request for employer ID: ${idToUse}`);
      
      const response = await fetch(`${API_URL}/api/admin/employers/${idToUse}/archive`, {
        method: 'PUT',
        headers: getAuthHeader()
      });

      // Get response data
      let responseData;
      try {
        const responseText = await response.text();
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Error parsing response:', e);
        responseData = { message: 'Could not parse server response' };
      }

      console.log('Archive response:', response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Error archiving employer: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to archive employer:', error);
      alert(error.message || 'Failed to archive employer');
      return false;
    }
  }

  async function loadEmployers() {
    tableBody.innerHTML = "";
    const employers = await fetchEmployers();
    
    console.log('Loaded employers data:', employers);

    employers.forEach((emp, index) => {
      // Debug the employer object to see available properties
      console.log(`Employer ${index+1}:`, emp);
      
      // Get the employer ID safely - could be 'employer_id' or 'id' depending on API
      const employerId = emp.employer_id || emp.id;
      
      if (!employerId) {
        console.warn('Employer without ID found:', emp);
      } else {
        console.log(`Employer ${index+1} has ID:`, employerId);
      }
      
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${index + 1}</td>
          <td>${emp.first_name}</td>
          <td>${emp.last_name}</td>
          <td>${emp.email}</td>
          <td>${emp.company_name || 'N/A'}</td>
          <td>
              <button class="edit-btn">Edit</button>
              <button class="edit-btn archive-btn">Archive</button>
          </td>
      `;

      row.querySelector(".edit-btn").addEventListener("click", () => {
          openEditModal(employerId, emp);
      });

      row.querySelector(".archive-btn").addEventListener("click", async () => {
        if (confirm(`Are you sure you want to archive ${emp.first_name} ${emp.last_name}? This will move them to the archive list but can be restored later.`)) {
          try {
            console.log(`Initiating archive for employer ${emp.first_name} ${emp.last_name} with ID:`, employerId);
            const success = await archiveEmployer(employerId);
            if (success) {
              alert(`${emp.first_name} ${emp.last_name} has been archived successfully.`);
              loadEmployers();
            } else {
              console.error('Archive operation failed but did not throw an error');
            }
          } catch (err) {
            console.error('Error in archive button handler:', err);
            alert(err.message || 'Failed to archive employer');
          }
        }
      });

      tableBody.appendChild(row);
    });
  }

  function openEditModal(employerId, emp) {
      editFirstName.value = emp.first_name;
      editLastName.value = emp.last_name;
      editEmail.value = emp.email;
      editCompany.value = emp.company_name || '';
      editIndex.value = employerId;

      editModal.style.display = "flex";
  }

  function closeEditModal() {
      editModal.style.display = "none";
      editForm.reset();
  }

  function closeAddModal() {
      addEmployerModal.style.display = "none";
      addEmployerForm.reset();
  }

  // Add global function for closing modals
  window.closeEditModal = closeEditModal;
  window.closeAddModal = closeAddModal;

  editForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const employerId = editIndex.value;
      
      const employerData = {
          first_name: editFirstName.value,
          last_name: editLastName.value,
          email: editEmail.value,
          company_name: editCompany.value
      };

      const success = await updateEmployer(employerId, employerData);
      if (success) {
          closeEditModal();
          loadEmployers();
      } else {
          alert("Failed to update employer details");
      }
  });

  addEmployerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      const employerData = {
          first_name: document.getElementById("employerFirstName").value,
          last_name: document.getElementById("employerLastName").value,
          email: document.getElementById("employerEmail").value,
          password: document.getElementById("employerPassword").value,
          company_name: document.getElementById("employerCompany").value
      };
      
      const success = await createEmployer(employerData);
      if (success) {
          closeAddModal();
          loadEmployers();
      } else {
          alert("Failed to add employer");
      }
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

  document.getElementById("addEmployer").addEventListener("click", () => {
      addEmployerModal.style.display = "flex";
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

  loadEmployers();
});