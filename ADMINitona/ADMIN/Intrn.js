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
  // List of ports to try
  const ports = [5004, 5005, 5006, 5007, 5008];
  
  for (const port of ports) {
    if (await checkServerAvailability(port)) {
      console.log(`Server found on port ${port}`);
      return `http://localhost:${port}`;
    }
  }
  
  // If nothing works, return the default
  console.log("Couldn't find an active server. Using default port 5004.");
  return `http://localhost:5004`;
}

document.addEventListener("DOMContentLoaded", async () => {
      const tableBody = document.getElementById("internTableBody");
      const editModal = document.getElementById("editModal");
      const editForm = document.getElementById("editForm");
      const editFirstName = document.getElementById("editFirstName");
      const editLastName = document.getElementById("editLastName");
      const editCollegeDepartment = document.getElementById("editCollegeDepartment");
      const editCourse = document.getElementById("editCourse");
      const editIndex = document.getElementById("editIndex");

      // Get the API URL
      console.log("Finding the server...");
      const API_URL = await getApiUrl();
      console.log("Using API URL:", API_URL);

      // Function to get authorization header
      function getAuthHeader() {
        const token = localStorage.getItem('adminToken');
        return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };
      }

      // Function to fetch interns from API
      async function fetchInterns() {
        try {
          console.log('Fetching interns from API');
          
          const response = await fetch(`${API_URL}/api/admin/interns`, {
            method: 'GET',
            headers: getAuthHeader()
          });

          console.log('Interns response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            throw new Error(`Error fetching interns: ${response.status} - ${errorText}`);
          }

          // Get the raw text first to debug any parsing issues
          const responseText = await response.text();
          console.log('Raw response text length:', responseText.length);
          
          if (!responseText || responseText.trim() === '') {
            console.warn('Empty response received');
            return [];
          }
          
          // Now try to parse it
          let data;
          try {
            data = JSON.parse(responseText);
            console.log('Parsed data structure:', Object.keys(data));
          } catch (err) {
            console.error('Error parsing response JSON:', err);
            console.error('Invalid JSON snippet:', responseText.substring(0, 100) + '...');
            throw new Error('Invalid JSON in response');
          }
          
          // Handle different possible response structures
          const interns = data.interns || data.data || data.internsList || [];
          console.log(`Found ${interns.length} interns`);
          
          // Log the first intern to see its structure
          if (interns.length > 0) {
            console.log('Sample intern structure:', interns[0]);
            // Check if we have the expected fields
            const sampleIntern = interns[0];
            if (!sampleIntern.intern_id && !sampleIntern.id) {
              console.warn('Warning: Interns data missing expected ID fields. Available fields:', Object.keys(sampleIntern));
            }
          }
          
          return interns;
        } catch (error) {
          console.error('Failed to fetch interns:', error.message);
          // Fallback to local storage if API fails
          const localInterns = JSON.parse(localStorage.getItem("interns")) || [];
          console.log(`Fallback: Loaded ${localInterns.length} interns from local storage`);
          return localInterns;
        }
      }

      // Function to update intern status
      async function updateInternStatus(internId, status) {
        try {
          // Check if internId is valid
          if (!internId || internId === 'undefined') {
            console.error('Invalid intern ID:', internId);
            alert("Error: Invalid intern ID");
            return false;
          }

          // Ensure the ID is treated as a number if it's numeric
          const parsedId = parseInt(internId, 10);
          const idToUse = !isNaN(parsedId) ? parsedId : internId;

          console.log(`Updating intern status for ID ${idToUse} (original: ${internId}) to ${status}`);
          
          const response = await fetch(`${API_URL}/api/admin/interns/${idToUse}/status`, {
            method: 'PATCH',
            headers: getAuthHeader(),
            body: JSON.stringify({ status })
          });

          // Get full response for better debugging
          const responseText = await response.text();
          console.log('Update status response:', response.status);
          console.log('Update status response text:', responseText);

          if (!response.ok) {
            console.error(`Error response: ${responseText}`);
            throw new Error(`Error updating intern status: ${response.status} - ${responseText}`);
          }

          return true;
        } catch (error) {
          console.error('Failed to update intern status:', error);
          alert(`Failed to update intern status: ${error.message}`);
          return false;
        }
      }

      // Function to update intern details
      async function updateIntern(internId, internData) {
        try {
          // Check if internId is valid
          if (!internId || internId === 'undefined') {
            console.error('Invalid intern ID:', internId);
            alert("Error: Invalid intern ID");
            return false;
          }

          // Ensure the ID is treated as a number if it's numeric
          const parsedId = parseInt(internId, 10);
          const idToUse = !isNaN(parsedId) ? parsedId : internId;

          console.log(`Updating intern with ID: ${idToUse} (original: ${internId})`, internData);

          const response = await fetch(`${API_URL}/api/admin/interns/${idToUse}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(internData)
          });

          // Get full response for better debugging
          const responseText = await response.text();
          console.log('Update intern response:', response.status);
          console.log('Update intern response text:', responseText);

          if (!response.ok) {
            console.error(`Error response: ${responseText}`);
            throw new Error(`Error updating intern: ${response.status} - ${responseText}`);
          }

          return true;
        } catch (error) {
          console.error('Failed to update intern:', error);
          alert(`Failed to update intern: ${error.message}`);
          return false;
        }
      }

      // Function to delete intern
      async function deleteIntern(internId) {
        try {
          const response = await fetch(`${API_URL}/api/admin/interns/${internId}`, {
            method: 'DELETE',
            headers: getAuthHeader()
          });

          if (!response.ok) {
            throw new Error(`Error deleting intern: ${response.status}`);
          }

          return true;
        } catch (error) {
          console.error('Failed to delete intern:', error);
          return false;
        }
      }

      // Function to archive intern
      async function archiveIntern(internId) {
        try {
          // Check if internId is valid
          if (!internId || internId === 'undefined') {
            console.error('Invalid intern ID:', internId);
            alert("Error: Invalid intern ID");
            return false;
          }

          // Ensure the ID is treated as a number if it's numeric
          const parsedId = parseInt(internId, 10);
          const idToUse = !isNaN(parsedId) ? parsedId : internId;
          
          console.log(`Archiving intern with ID: ${idToUse} (original: ${internId})`);
          
          const response = await fetch(`${API_URL}/api/admin/interns/${idToUse}/archive`, {
            method: 'PUT',
            headers: getAuthHeader()
          });

          // Get full response for better debugging
          const responseText = await response.text();
          console.log('Archive response status:', response.status);
          console.log('Archive response text:', responseText);
          
          if (!response.ok) {
            console.error(`Error response: ${responseText}`);
            throw new Error(`Error archiving intern: ${response.status} - ${responseText}`);
          }

          // Try to parse the response as JSON if it exists
          let responseData = {};
          if (responseText && responseText.trim() !== '') {
            try {
              responseData = JSON.parse(responseText);
            } catch (e) {
              console.warn('Could not parse response as JSON:', e);
            }
          }
          
          console.log('Archive response data:', responseData);
          
          return true;
        } catch (error) {
          console.error('Failed to archive intern:', error);
          alert(`Failed to archive intern: ${error.message}`);
          return false;
        }
      }

      // Load interns to the table
      async function loadInterns() {
        tableBody.innerHTML = "";
        console.log('Loading interns to table');
        
        try {
          const interns = await fetchInterns();
          
          if (!interns || interns.length === 0) {
            console.log('No interns found or empty array returned');
            tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No interns found</td></tr>';
            return;
          }
          
          console.log(`Processing ${interns.length} interns for display`);
          
          interns.forEach((intern, index) => {
            // Validate intern object
            if (!intern) {
              console.error('Null or undefined intern object at index', index);
              return; // Skip this iteration
            }
            
            // Log the intern data for debugging
            console.log(`Processing intern ${index + 1}:`, JSON.stringify(intern, null, 2));
            
            // Make sure intern has an ID - try to find the ID in various locations
            let internId = intern.intern_id;
            
            if (!internId) {
              console.warn('Intern missing intern_id, trying to find an alternative ID', intern);
              internId = intern.id; // Try alternate field name
            }
            
            if (!internId) {
              console.error('Cannot find any valid ID for intern:', intern);
              return; // Skip this iteration without an ID
            }
            
            // Ensure all required properties exist with fallbacks
            const firstName = intern.first_name || 'Unknown';
            const lastName = intern.last_name || 'Unknown';
            
            if (!firstName || !lastName) {
              console.error('Intern missing required name fields:', intern);
              return; // Skip this iteration
            }
            
            // Set default verification status if missing
            const verificationStatus = intern.verification_status || "Pending";
            
            // Create a status cell with appropriate styling
            let statusHtml = '';
            if (verificationStatus === "Accepted") {
              statusHtml = `<span class="status accepted">Accepted</span>`;
            } else if (verificationStatus === "Rejected") {
              statusHtml = `<span class="status rejected">Rejected</span>`;
            } else {
              statusHtml = `<span class="status pending">Pending</span>`;
          }

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
              <td>${intern.student_id || 'N/A'}</td>
              <td>${firstName}</td>
              <td>${lastName}</td>
              <td>${intern.department || 'N/A'}</td>
              <td>${intern.course || 'N/A'}</td>
              <td>${intern.email || 'N/A'}</td>
              <td>********</td>
              <td class="status-cell">${statusHtml}</td>
            <td class="actions">
                <button class="accept-btn" title="Accept this intern - allows them to apply for jobs">Accept</button>
                <button class="reject-btn" title="Reject this intern - prevents them from applying for jobs">Reject</button>
              <button class="edit-btn">Edit</button>
                <button class="archive-btn">Archive</button>
            </td>
          `;

          // Accept
            row.querySelector(".accept-btn").addEventListener("click", async () => {
              console.log("Accept button clicked for intern ID:", internId);
              
              if (!internId) {
                alert("Error: Cannot find intern ID");
                return;
              }
              
              if (confirm(`Are you sure you want to accept ${firstName} ${lastName}? This will allow them to apply for job listings.`)) {
                const success = await updateInternStatus(internId, "Accepted");
                if (success) {
                  alert(`${firstName} ${lastName} has been accepted successfully.`);
            loadInterns();
                } else {
                  alert("Failed to update intern status");
                }
              }
          });

          // Reject
            row.querySelector(".reject-btn").addEventListener("click", async () => {
              console.log("Reject button clicked for intern ID:", internId);
              
              if (!internId) {
                alert("Error: Cannot find intern ID");
                return;
              }
              
              if (confirm(`Are you sure you want to reject ${firstName} ${lastName}? This will prevent them from applying for job listings.`)) {
                const success = await updateInternStatus(internId, "Rejected");
                if (success) {
                  alert(`${firstName} ${lastName} has been rejected.`);
            loadInterns();
                } else {
                  alert("Failed to update intern status");
                }
              }
          });

          // Edit
          row.querySelector(".edit-btn").addEventListener("click", () => {
              console.log("Edit button clicked for intern ID:", internId);
              
              if (!internId) {
                alert("Error: Cannot find intern ID");
                return;
              }
              
              openEditModal(internId, intern);
            });

            // Archive
            row.querySelector(".archive-btn").addEventListener("click", async () => {
              console.log("Archive button clicked for intern ID:", internId);
              
              if (!internId) {
                alert("Error: Cannot find intern ID");
                return;
              }
              
              if (confirm(`Are you sure you want to archive ${firstName} ${lastName}? This will move them to the archive list but can be restored later.`)) {
                const success = await archiveIntern(internId);
                if (success) {
                  alert(`${firstName} ${lastName} has been archived successfully.`);
              loadInterns();
                } else {
                  alert("Failed to archive intern");
                }
            }
          });

          tableBody.appendChild(row);
        });
          
          // Add CSS for status styling if not already present
          if (!document.getElementById('status-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'status-styles';
            styleEl.textContent = `
              .status {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: bold;
              }
              .status.accepted {
                background-color: #dff0d8;
                color: #3c763d;
                border: 1px solid #d6e9c6;
              }
              .status.rejected {
                background-color: #f2dede;
                color: #a94442;
                border: 1px solid #ebccd1;
              }
              .status.pending {
                background-color: #fcf8e3;
                color: #8a6d3b;
                border: 1px solid #faebcc;
              }
              .status-cell {
                text-align: center;
              }
              .actions button {
                position: relative;
              }
              .actions button:hover::after {
                content: attr(title);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background-color: #333;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                white-space: nowrap;
                font-size: 12px;
                z-index: 10;
              }
            `;
            document.head.appendChild(styleEl);
          }
        } catch (error) {
          console.error('Failed to load interns:', error);
          tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Failed to load interns</td></tr>';
        }
      }

      function openEditModal(internId, intern) {
        editIndex.value = internId;
        editFirstName.value = intern.first_name;
        editLastName.value = intern.last_name;
        editCollegeDepartment.value = intern.department || '';
        editCourse.value = intern.course || '';
        editModal.style.display = "flex";
      }

      window.closeEditModal = function () {
        editModal.style.display = "none";
      };

      editForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const internId = editIndex.value;
        
        const internData = {
          first_name: editFirstName.value,
          last_name: editLastName.value,
          college_department: editCollegeDepartment.value,
          course: editCourse.value
        };
        
        const success = await updateIntern(internId, internData);
        if (success) {
        closeEditModal();
        loadInterns();
        } else {
          alert("Failed to update intern details");
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

      // Load interns when the page loads
      loadInterns();
    });