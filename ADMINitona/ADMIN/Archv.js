// Global variables
let API_URL = 'http://localhost:5004'; // Default value, will be updated

// Create a function to check if a server is running on a specific port
async function checkServerAvailability(port) {
  try {
    console.log(`Checking port ${port}...`);
    // Use a simple timeout promise to avoid hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 1000)
    );
    
    const fetchPromise = fetch(`http://localhost:${port}/api/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Race between the fetch and the timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    return response.ok;
  } catch (error) {
    console.log(`Server not available on port ${port}`);
    return false;
  }
}

// Function to get the API URL - simpler and more reliable
async function getApiUrl() {
  // List of ports to try - added 50041 as first priority port based on server logs
  const ports = [50041, 5004, 5005, 50040, 5006, 5007, 5008];
  
  for (const port of ports) {
    if (await checkServerAvailability(port)) {
      console.log(`Server found on port ${port}`);
      return `http://localhost:${port}`;
    }
  }
  
  // If nothing works, return the default
  console.log("Couldn't find an active server. Using default port 50041.");
  return `http://localhost:5004`;
}

// Function to get authorization header
function getAuthHeader() {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// All the fetch functions defined globally
// Function to fetch archived interns from API
async function fetchArchivedInterns() {
  try {
    console.log('Fetching archived interns from API');
    const response = await fetch(`${API_URL}/api/admin/archived/interns`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    console.log('Archived interns response status:', response.status);
    
    if (!response.ok) {
      // Get the response text for better error debugging
      const errorText = await response.text();
      console.error('Error response from server:', errorText);
      throw new Error(`Error fetching archived interns: ${response.status} - ${errorText}`);
    }

    // Get response text first for debugging
    const responseText = await response.text();
    console.log('Archived interns raw response:', responseText);
    
    // Then parse the JSON
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      throw new Error(`Error parsing archived interns response: ${e.message}`);
    }
    
    console.log('Archived interns data received:', data);
    
    // Check the structure of the data
    if (!data) {
      console.warn('Empty response received from archived interns endpoint');
      return [];
    }
    
    // Handle different possible response structures
    const internsData = data.archivedInterns || data.interns || data.data || [];
    console.log('Extracted interns data:', internsData);
    
    // Check if we have any interns
    if (internsData.length > 0) {
      console.log('First archived intern structure:', internsData[0]);
    }
    
    return internsData;
  } catch (error) {
    console.error('Failed to fetch archived interns:', error);
    alert("Failed to load archived interns data: " + error.message);
    return [];
  }
}

// Function to restore intern
async function restoreIntern(internId) {
  try {
    console.log(`Attempting to restore intern with ID: ${internId}`);
    
    if (!internId) {
      console.error('Invalid intern ID provided:', internId);
      alert('Invalid intern ID provided');
      return false;
    }
    
    const response = await fetch(`${API_URL}/api/admin/archived/interns/${internId}/restore`, {
      method: 'PUT',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || `Error restoring intern: ${response.status}`;
      } catch (e) {
        errorMessage = `Error restoring intern: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return true;
  } catch (error) {
    console.error('Failed to restore intern:', error);
    alert(error.message || 'Failed to restore intern');
    return false;
  }
}

// Function to permanently delete intern
async function permanentlyDeleteIntern(internId) {
  try {
    console.log(`Attempting to permanently delete intern with ID: ${internId}`);
    
    if (!internId) {
      console.error('Invalid intern ID provided:', internId);
      alert('Invalid intern ID provided');
      return false;
    }
    
    const response = await fetch(`${API_URL}/api/admin/archived/interns/${internId}/permanent`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from server:', errorText);
      throw new Error(`Error permanently deleting intern: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to permanently delete intern:', error);
    alert('Failed to permanently delete intern');
    return false;
  }
}

// Function to load archived interns into the table
async function loadArchivedInterns() {
  try {
    const tableBody = document.getElementById("archiveTableBody");
    tableBody.innerHTML = "<tr><td colspan='9' style='text-align: center;'>Loading...</td></tr>";
    
    const interns = await fetchArchivedInterns();
    
    tableBody.innerHTML = ""; // Clear the loading message
    
    console.log('Received archived interns data:', interns);
    
    if (!interns || interns.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='9' style='text-align: center;'>No archived interns found</td></tr>";
      return;
    }

    interns.forEach((intern, index) => {
      // Log the intern data to debug its structure
      console.log(`Processing archived intern ${index+1}:`, intern);
      
      // Make sure we have the necessary data
      if (!intern || (!intern.first_name && !intern.last_name)) {
        console.warn('Invalid intern data found:', intern);
        return; // Skip this intern
      }
      
      // Extract archive_id with fallbacks - some tables use archive_id, some use id
      const archiveId = intern.archive_id || intern.id;
      
      console.log(`Archived intern ${index+1} has archive_id:`, archiveId);
      
      if (!archiveId) {
        console.warn('Intern without archive_id found:', intern);
      }
      
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${intern.student_id || 'N/A'}</td>
        <td>${intern.first_name || 'N/A'}</td>
        <td>${intern.last_name || 'N/A'}</td>
        <td>${intern.department || 'N/A'}</td>
        <td>${intern.course || 'N/A'}</td>
        <td>${intern.email || 'N/A'}</td>
        <td>${intern.verification_status || 'Unknown'}</td>
        <td>
          <button class="edit-btn restore-btn">Restore</button>
          <button class="edit-btn delete-btn">Delete</button>
        </td>
      `;

      row.querySelector(".restore-btn").addEventListener("click", async () => {
        if (confirm(`Are you sure you want to restore ${intern.first_name} ${intern.last_name}? This will move them back to the active intern list.`)) {
          console.log('Restoring intern with archive_id:', archiveId);
          const success = await restoreIntern(archiveId);
          if (success) {
            alert(`${intern.first_name} ${intern.last_name} has been restored successfully.`);
            loadArchivedInterns(); 
          }
        }
      });

      row.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm(`WARNING: You are about to permanently delete ${intern.first_name} ${intern.last_name}. This action cannot be undone. Are you sure you want to proceed?`)) {
          console.log('Permanently deleting intern with archive_id:', archiveId);
          const success = await permanentlyDeleteIntern(archiveId);
          if (success) {
            alert(`${intern.first_name} ${intern.last_name} has been permanently deleted.`);
            loadArchivedInterns();
          }
        }
      });

      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading archived interns:", error);
    const tableBody = document.getElementById("archiveTableBody");
    tableBody.innerHTML = "<tr><td colspan='9' style='text-align: center;'>Error loading archived interns: " + error.message + "</td></tr>";
  }
}

// Document ready handler
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded, initializing archive page...");
  const dropdown = document.getElementById("userTypeFilter");
  const internContainer = document.getElementById("interncont");
  const companyContainer = document.getElementById("compcont");
  const employerContainer = document.getElementById("empcont");
  const facultyContainer = document.getElementById("facultcont");
  
  // Get the API URL
  console.log("Finding the server...");
  API_URL = await getApiUrl(); // Update the global variable
  console.log("Using API URL:", API_URL);

  // Hide all containers initially
  internContainer.style.display = "none";
  companyContainer.style.display = "none";
  employerContainer.style.display = "none";
  facultyContainer.style.display = "none";

  // Default to intern view
  dropdown.value = "intern";
  internContainer.style.display = "block";
  // Call the global loadArchivedInterns function
  loadArchivedInterns();

  dropdown.addEventListener("change", () => {
    internContainer.style.display = "none";
    companyContainer.style.display = "none";
    employerContainer.style.display = "none";
    facultyContainer.style.display = "none";

    const value = dropdown.value;
    if (value === "intern") {
      internContainer.style.display = "block";
      loadArchivedInterns();
    } else if (value === "company") {
      companyContainer.style.display = "block";
      loadArchivedCompanies();
    } else if (value === "employer") {
      employerContainer.style.display = "block";
      loadArchivedEmployers();
    } else if (value === "faculty") {
      facultyContainer.style.display = "block";
      loadArchivedFaculty();
    }
  });

  document.getElementById("searchInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchTable();
    }
  });

  // Function to fetch archived companies from API
  window.fetchArchivedCompanies = async function() {
    try {
      console.log('Fetching archived companies from API');
      const response = await fetch(`${API_URL}/api/admin/archived/companies`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Error fetching archived companies: ${response.status}`);
      }

      const data = await response.json();
      console.log('Archived companies data received:', data);
      
      return data.archivedCompanies || [];
    } catch (error) {
      console.error('Failed to fetch archived companies:', error);
      alert("Failed to load archived companies data. Please try again later.");
      return [];
    }
  };
  
  // Function to fetch archived employers from API
  window.fetchArchivedEmployers = async function() {
    try {
      console.log('Fetching archived employers from API');
      const response = await fetch(`${API_URL}/api/admin/archived/employers`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      console.log('Archived employers response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error fetching archived employers: ${response.status}`);
      }

      // Get response text first for debugging
      const responseText = await response.text();
      console.log('Archived employers raw response:', responseText);
      
      // Then parse the JSON
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Error parsing JSON response:', e);
        throw new Error(`Error parsing archived employers response: ${e.message}`);
      }
      
      console.log('Archived employers data received:', data);
      
      // Check the structure of the data
      if (!data) {
        console.warn('Empty response received from archived employers endpoint');
        return [];
      }
      
      // Handle different possible response structures
      const employersData = data.archivedEmployers || data.employers || data.data || [];
      console.log('Extracted employers data:', employersData);
      
      return employersData;
    } catch (error) {
      console.error('Failed to fetch archived employers:', error);
      alert("Failed to load archived employers data: " + error.message);
      return [];
    }
  };
  
  // Function to fetch archived faculty from API
  window.fetchArchivedFaculty = async function() {
    try {
      console.log('Fetching archived faculty from API');
      const response = await fetch(`${API_URL}/api/admin/archived/faculties`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Error fetching archived faculty: ${response.status}`);
      }

      const data = await response.json();
      console.log('Archived faculty data received:', data);
      
      return data.archivedFaculty || [];
    } catch (error) {
      console.error('Failed to fetch archived faculty:', error);
      alert("Failed to load archived faculty data. Please try again later.");
      return [];
    }
  };
  
  // Function to restore company
  window.restoreCompany = async function(companyId) {
    try {
      console.log(`Attempting to restore company with ID: ${companyId}`);
      
      if (!companyId) {
        console.error('Invalid company ID provided:', companyId);
        alert('Invalid company ID provided');
        return false;
      }
      
      // Use the correct archive_id field from the archived item
      const response = await fetch(`${API_URL}/api/admin/archived/companies/${companyId}/restore`, {
        method: 'PUT',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Error restoring company: ${response.status}`;
        } catch (e) {
          errorMessage = `Error restoring company: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      console.error('Failed to restore company:', error);
      alert(error.message || 'Failed to restore company');
      return false;
    }
  };
  
  // Function to restore employer
  window.restoreEmployer = async function(employerId) {
    try {
      console.log(`Attempting to restore employer with ID: ${employerId}`);
      
      if (!employerId) {
        console.error('Invalid employer ID provided:', employerId);
        alert('Invalid employer ID provided');
        return false;
      }
      
      // Ensure the ID is treated as a number if it's numeric
      const parsedId = parseInt(employerId, 10);
      const idToUse = !isNaN(parsedId) ? parsedId : employerId;
      
      console.log(`Sending restore request for employer archive ID: ${idToUse}`);
      
      // Use the correct archive_id field from the archived item
      const response = await fetch(`${API_URL}/api/admin/archived/employers/${idToUse}/restore`, {
        method: 'PUT',
        headers: getAuthHeader()
      });

      console.log('Restore response status:', response.status);
      
      // Get full response text for debugging
      const responseText = await response.text();
      console.log('Restore response text:', responseText);
      
      let errorMessage;
      if (!response.ok) {
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || `Error restoring employer: ${response.status}`;
          } else {
            errorMessage = `Error restoring employer: ${response.status} (No response body)`;
          }
        } catch (e) {
          console.error('Error parsing JSON response:', e);
          errorMessage = `Error restoring employer: ${response.status} - ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      alert('Employer restored successfully');
      return true;
    } catch (error) {
      console.error('Failed to restore employer:', error);
      alert(error.message || 'Failed to restore employer');
      return false;
    }
  };
  
  // Function to restore faculty
  window.restoreFaculty = async function(facultyId) {
    try {
      console.log(`Attempting to restore faculty with ID: ${facultyId}`);
      
      if (!facultyId) {
        console.error('Invalid faculty ID provided:', facultyId);
        alert('Invalid faculty ID provided');
        return false;
      }
      
      // Use the correct archive_id field from the archived item
      const response = await fetch(`${API_URL}/api/admin/archived/faculties/${facultyId}/restore`, {
        method: 'PUT',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Error restoring faculty: ${response.status}`;
        } catch (e) {
          errorMessage = `Error restoring faculty: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      console.error('Failed to restore faculty:', error);
      alert(error.message || 'Failed to restore faculty');
      return false;
    }
  };
  
  // Function to permanently delete company
  window.permanentlyDeleteCompany = async function(companyId) {
    try {
      console.log(`Attempting to permanently delete company with ID: ${companyId}`);
      
      if (!companyId) {
        console.error('Invalid company ID provided:', companyId);
        alert('Invalid company ID provided');
        return false;
      }
      
      const response = await fetch(`${API_URL}/api/admin/archived/companies/${companyId}/permanent`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Error deleting company: ${response.status}`;
        } catch (e) {
          errorMessage = `Error deleting company: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete company:', error);
      alert(error.message || 'Failed to permanently delete company');
      return false;
    }
  };
  
  // Function to permanently delete employer
  window.permanentlyDeleteEmployer = async function(employerId) {
    try {
      console.log(`Attempting to permanently delete employer with ID: ${employerId}`);
      
      if (!employerId) {
        console.error('Invalid employer ID provided:', employerId);
        alert('Invalid employer ID provided');
        return false;
      }
      
      const response = await fetch(`${API_URL}/api/admin/archived/employers/${employerId}/permanent`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Error deleting employer: ${response.status}`;
        } catch (e) {
          errorMessage = `Error deleting employer: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete employer:', error);
      alert(error.message || 'Failed to permanently delete employer');
      return false;
    }
  };
  
  // Function to permanently delete faculty
  window.permanentlyDeleteFaculty = async function(facultyId) {
    try {
      console.log(`Attempting to permanently delete faculty with ID: ${facultyId}`);
      
      if (!facultyId) {
        console.error('Invalid faculty ID provided:', facultyId);
        alert('Invalid faculty ID provided');
        return false;
      }
      
      const response = await fetch(`${API_URL}/api/admin/archived/faculties/${facultyId}/permanent`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Error deleting faculty: ${response.status}`;
        } catch (e) {
          errorMessage = `Error deleting faculty: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete faculty:', error);
      alert(error.message || 'Failed to permanently delete faculty');
      return false;
    }
  };
  
  // Make functions available globally
  window.getAuthHeader = getAuthHeader;
  window.loadArchivedInterns = loadArchivedInterns;
  window.loadArchivedCompanies = loadArchivedCompanies;
  window.loadArchivedEmployers = loadArchivedEmployers;
  window.loadArchivedFaculty = loadArchivedFaculty;
  window.searchTable = searchTable;
});

function searchTable() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const userType = document.getElementById("userTypeFilter").value;
  let tableBody;

  switch (userType) {
    case "intern":
      tableBody = document.getElementById("archiveTableBody");
      break;
    case "company":
      tableBody = document.getElementById("companyTableBody");
      break;
    case "employer":
      tableBody = document.getElementById("employerTableBody");
      break;
    case "faculty":
      tableBody = document.getElementById("facultyTableBody");
      break;
  }

  if (!tableBody) return;

  const rows = tableBody.getElementsByTagName("tr");
  for (let row of rows) {
    const cells = Array.from(row.getElementsByTagName("td"));
    const match = cells.some(cell => cell.textContent.toLowerCase().includes(searchTerm));
    row.style.display = match ? "" : "none";
  }
}

async function loadArchivedCompanies() {
  try {
    const tableBody = document.getElementById("companyTableBody");
  tableBody.innerHTML = "";

    const companies = await window.fetchArchivedCompanies();
    
    if (companies.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>No archived companies found</td></tr>";
      return;
    }

    companies.forEach((company, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
        <td>${company.company_name}</td>
        <td>${company.address || 'N/A'}</td>
        <td>${company.industry || 'N/A'}</td>
        <td>${company.website || 'N/A'}</td>
        <td>
          <button class="edit-btn restore-btn">Restore</button>
          <button class="edit-btn delete-btn">Delete</button>
      </td>
    `;

      // Use the archive_id as the primary identifier for archive operations
      const archiveId = company.archive_id;
      
      row.querySelector(".restore-btn").addEventListener("click", async () => {
        if (confirm(`Are you sure you want to restore ${company.company_name}?`)) {
          console.log('Restoring company with archive_id:', archiveId);
          const success = await window.restoreCompany(archiveId);
          if (success) {
            alert(`${company.company_name} has been restored successfully.`);
            loadArchivedCompanies(); 
          }
        }
      });

      row.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm(`WARNING: You are about to permanently delete ${company.company_name}. This action cannot be undone. Are you sure you want to proceed?`)) {
          console.log('Permanently deleting company with archive_id:', archiveId);
          const success = await window.permanentlyDeleteCompany(archiveId);
          if (success) {
            alert(`${company.company_name} has been permanently deleted.`);
            loadArchivedCompanies();
          }
      }
    });

    tableBody.appendChild(row);
  });
  } catch (error) {
    console.error("Error loading archived companies:", error);
    const tableBody = document.getElementById("companyTableBody");
    tableBody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>Error loading archived companies</td></tr>";
  }
}

async function loadArchivedEmployers() {
  try {
    const tableBody = document.getElementById("employerTableBody");
  tableBody.innerHTML = "";

    const employers = await window.fetchArchivedEmployers();
    
    console.log('Received archived employers data:', employers);
    
    if (!employers || employers.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>No archived employers found</td></tr>";
      return;
    }

    employers.forEach((emp, index) => {
      // Debug to see the employer object structure
      console.log(`Archived employer ${index+1}:`, emp);
      
      // Make sure we have the necessary data
      if (!emp || !emp.first_name) {
        console.warn('Invalid employer data found:', emp);
        return; // Skip this employer
      }
      
      // Extract archive_id with fallbacks
      const archiveId = emp.archive_id || emp.id || emp.original_employer_id;
      
      console.log(`Archived employer ${index+1} has archive_id:`, archiveId);
      
      if (!archiveId) {
        console.warn('Employer without archive_id found:', emp);
      }
      
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
        <td>${emp.first_name || 'N/A'}</td>
        <td>${emp.last_name || 'N/A'}</td>
        <td>${emp.email || 'N/A'}</td>
        <td>${emp.company_name || 'N/A'}</td>
        <td>
          <button class="edit-btn restore-btn">Restore</button>
          <button class="edit-btn delete-btn">Delete</button>
      </td>
    `;

      row.querySelector(".restore-btn").addEventListener("click", async () => {
        if (confirm(`Are you sure you want to restore ${emp.first_name} ${emp.last_name}?`)) {
          console.log('Restoring employer with archive_id:', archiveId);
          const success = await window.restoreEmployer(archiveId);
          if (success) {
            alert(`${emp.first_name} ${emp.last_name} has been restored successfully.`);
            loadArchivedEmployers();
          }
        }
      });

      row.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm(`WARNING: You are about to permanently delete ${emp.first_name} ${emp.last_name}. This action cannot be undone. Are you sure you want to proceed?`)) {
          console.log('Permanently deleting employer with archive_id:', archiveId);
          const success = await window.permanentlyDeleteEmployer(archiveId);
          if (success) {
            alert(`${emp.first_name} ${emp.last_name} has been permanently deleted.`);
        loadArchivedEmployers();
          }
      }
    });

    tableBody.appendChild(row);
  });
  } catch (error) {
    console.error("Error loading archived employers:", error);
    const tableBody = document.getElementById("employerTableBody");
    tableBody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>Error loading archived employers: " + error.message + "</td></tr>";
  }
}

async function loadArchivedFaculty() {
  try {
  const tableBody = document.getElementById("facultyTableBody");
  tableBody.innerHTML = "";

    const faculty = await window.fetchArchivedFaculty();
    
    if (faculty.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>No archived faculty found</td></tr>";
      return;
    }

    faculty.forEach((fac, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
        <td>${fac.first_name}</td>
        <td>${fac.last_name}</td>
        <td>${fac.email}</td>
        <td>${fac.department || 'N/A'}</td>
        <td>
          <button class="edit-btn restore-btn">Restore</button>
          <button class="edit-btn delete-btn">Delete</button>
      </td>
    `;

      // Use the archive_id as the primary identifier for archive operations
      const archiveId = fac.archive_id;
      
      row.querySelector(".restore-btn").addEventListener("click", async () => {
        if (confirm(`Are you sure you want to restore ${fac.first_name} ${fac.last_name}?`)) {
          console.log('Restoring faculty with archive_id:', archiveId);
          const success = await window.restoreFaculty(archiveId);
          if (success) {
            alert(`${fac.first_name} ${fac.last_name} has been restored successfully.`);
            loadArchivedFaculty();
          }
        }
      });

      row.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm(`WARNING: You are about to permanently delete ${fac.first_name} ${fac.last_name}. This action cannot be undone. Are you sure you want to proceed?`)) {
          console.log('Permanently deleting faculty with archive_id:', archiveId);
          const success = await window.permanentlyDeleteFaculty(archiveId);
          if (success) {
            alert(`${fac.first_name} ${fac.last_name} has been permanently deleted.`);
        loadArchivedFaculty();
          }
      }
    });

    tableBody.appendChild(row);
  });
  } catch (error) {
    console.error("Error loading archived faculty:", error);
    const tableBody = document.getElementById("facultyTableBody");
    tableBody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>Error loading archived faculty</td></tr>";
  }
}

function restoreData(data, index, archivedKey, activeKey) {
  const archivedList = JSON.parse(localStorage.getItem(archivedKey)) || [];
  archivedList.splice(index, 1);
  localStorage.setItem(archivedKey, JSON.stringify(archivedList));

  const activeList = JSON.parse(localStorage.getItem(activeKey)) || [];

  const isDuplicate =
    activeKey === "interns"
      ? activeList.some(item => item.studentNumber === data.studentNumber)
      : activeKey === "companies"
      ? activeList.some(item => item.name === data.name)
      : activeList.some(item => item.username === data.username);

  if (!isDuplicate) {
    activeList.push(data);
    localStorage.setItem(activeKey, JSON.stringify(activeList));
  }

  alert(`${data.firstName || data.name || data.studentNumber} has been restored successfully.`);
  
  if (activeKey === "interns") loadArchivedInterns();
}

function deleteData(index, archivedKey) {
  const archivedList = JSON.parse(localStorage.getItem(archivedKey)) || [];
  archivedList.splice(index, 1);
  localStorage.setItem(archivedKey, JSON.stringify(archivedList));
}
