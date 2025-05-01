document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("facultyTableBody");
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");
    const addFacultyModal = document.getElementById("addFacultyModal");
    const addFacultyForm = document.getElementById("addFacultyForm");

    const editFirstName = document.getElementById("editFirstName");
    const editLastName = document.getElementById("editLastName");
    const editEmail = document.getElementById("editEmail");
    const editDepartment = document.getElementById("editDepartment");
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

    // Function to fetch faculty members from API
    async function fetchFaculty() {
        try {
            const response = await fetch(`${API_URL}/api/admin/faculties`, {
                method: 'GET',
                headers: getAuthHeader()
            });

            if (!response.ok) {
                throw new Error(`Error fetching faculty: ${response.status}`);
            }

            const data = await response.json();
            return data.faculty || [];
        } catch (error) {
            console.error('Failed to fetch faculty:', error);
            alert("Failed to load faculty data. Please try again later.");
            return [];
        }
    }

    // Function to create new faculty member
    async function createFaculty(facultyData) {
        try {
            console.log('Sending faculty data:', {...facultyData, password: '[REDACTED]'});
            
            // Check if token is valid
            const token = localStorage.getItem('adminToken');
            if (!token) {
                console.error('No admin token found');
                alert('You need to login again. Redirecting to login page.');
                setTimeout(() => {
                    window.location.href = "/admin/admin-login.html";
                }, 1000);
                return false;
            }
            
            console.log('Making POST request to', `${API_URL}/api/admin/faculties`);
            const response = await fetch(`${API_URL}/api/admin/faculties`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: JSON.stringify(facultyData)
            });
            
            console.log('Response status:', response.status);
            
            let responseData;
            try {
                responseData = await response.json();
                console.log('Response data:', responseData);
            } catch (e) {
                console.error('Error parsing response:', e);
                responseData = { message: 'Could not parse server response' };
            }
            
            if (!response.ok) {
                throw new Error(responseData.message || `Error creating faculty: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to create faculty:', error);
            alert(error.message || 'Failed to add faculty');
            return false;
        }
    }

    // Function to update faculty member
    async function updateFaculty(facultyId, facultyData) {
        try {
            console.log('Attempting to update faculty with ID:', facultyId);
            console.log('Update data:', facultyData);
            
            if (!facultyId) {
                throw new Error('Invalid faculty ID');
            }
            
            console.log('Making PUT request to', `${API_URL}/api/admin/faculties/${facultyId}`);
            
            const response = await fetch(`${API_URL}/api/admin/faculties/${facultyId}`, {
                method: 'PUT',
                headers: getAuthHeader(),
                body: JSON.stringify(facultyData)
            });
            
            console.log('Response status:', response.status);
            
            let responseData;
            try {
                responseData = await response.json();
                console.log('Response data:', responseData);
            } catch (e) {
                console.error('Error parsing response:', e);
                responseData = { message: 'Could not parse server response' };
            }

            if (!response.ok) {
                throw new Error(responseData.message || `Error updating faculty: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Failed to update faculty:', error);
            alert(error.message || 'Failed to update faculty details');
            return false;
        }
    }

    // Function to archive faculty member
    async function archiveFaculty(facultyId) {
        try {
            console.log('Attempting to archive faculty with ID:', facultyId);
            
            if (!facultyId) {
                throw new Error('Invalid faculty ID');
            }
            
            console.log('Making PUT request to', `${API_URL}/api/admin/faculties/${facultyId}/archive`);
            
            const response = await fetch(`${API_URL}/api/admin/faculties/${facultyId}/archive`, {
                method: 'PUT',
                headers: getAuthHeader()
            });
            
            console.log('Response status:', response.status);
            
            let responseData;
            try {
                responseData = await response.json();
                console.log('Response data:', responseData);
            } catch (e) {
                console.error('Error parsing response:', e);
                responseData = { message: 'Could not parse server response' };
            }

            if (!response.ok) {
                throw new Error(responseData.message || `Error archiving faculty: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Failed to archive faculty:', error);
            alert(error.message || 'Failed to archive faculty');
            return false;
        }
    }

    async function loadFaculty() {
        tableBody.innerHTML = "";
        const faculty = await fetchFaculty();
        
        console.log('Loaded faculty data:', faculty);

        faculty.forEach((fac, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${fac.first_name}</td>
                <td>${fac.last_name}</td>
                <td>${fac.email}</td>
                <td>${fac.department || 'N/A'}</td>
                <td class="actions">
                    <button class="edit-btn">Edit</button>
                    <button class="edit-btn archive-btn">Archive</button>
                </td>
            `;

            const facultyId = fac.id;
            console.log(`Row ${index + 1}: Faculty ID = ${facultyId}`);
            
            row.querySelector(".edit-btn").addEventListener("click", () => {
                openEditModal(facultyId, fac);
            });

            row.querySelector(".archive-btn").addEventListener("click", async () => {
                if (confirm(`Are you sure you want to archive ${fac.first_name} ${fac.last_name}? This will move them to the archive list but can be restored later.`)) {
                    console.log('Archive confirmed for faculty:', facultyId, fac);
                    const success = await archiveFaculty(facultyId);
                    if (success) {
                        alert(`${fac.first_name} ${fac.last_name} has been archived successfully.`);
                        loadFaculty();
                    }
                }
            });

            tableBody.appendChild(row);
        });
    }

    function openEditModal(facultyId, faculty) {
        console.log('Opening edit modal for faculty:', facultyId, faculty);
        
        if (!facultyId) {
            console.error('Invalid faculty ID for edit:', facultyId);
            alert('Cannot edit this faculty member: Invalid ID');
            return;
        }
        
        editIndex.value = facultyId;
        editFirstName.value = faculty.first_name;
        editLastName.value = faculty.last_name;
        editEmail.value = faculty.email || '';
        editDepartment.value = faculty.department || '';
        editModal.style.display = "flex";
    }

    function closeEditModal() {
        editModal.style.display = "none";
        editForm.reset();
    }

    function closeAddModal() {
        addFacultyModal.style.display = "none";
        addFacultyForm.reset();
    }

    // Add global functions for closing modals
    window.closeEditModal = closeEditModal;
    window.closeAddModal = closeAddModal;

    editForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const facultyId = editIndex.value;
        
        const facultyData = {
            first_name: editFirstName.value,
            last_name: editLastName.value,
            email: editEmail.value,
            department: editDepartment.value
        };

        const success = await updateFaculty(facultyId, facultyData);
        if (success) {
            closeEditModal();
            loadFaculty();
        } else {
            alert("Failed to update faculty details");
        }
    });

    // Handle Add Faculty form submission
    addFacultyForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const facultyData = {
            first_name: document.getElementById("facultyFirstName").value,
            last_name: document.getElementById("facultyLastName").value,
            email: document.getElementById("facultyEmail").value,
            password: document.getElementById("facultyPassword").value,
            department: document.getElementById("facultyDepartment").value
        };
        
        try {
            const success = await createFaculty(facultyData);
            if (success) {
                closeAddModal();
                loadFaculty();
            }
        } catch (error) {
            console.error('Form submission error:', error);
            alert(`Failed to add faculty: ${error.message || 'Unknown error'}`);
        }
    });

    // Add Faculty button click
    document.getElementById("addFaculty").addEventListener("click", () => {
        addFacultyModal.style.display = "flex";
    });

    // Fixed Search Function
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
        const dropdownMenu = document.querySelector(".dropdown-menu");
        if (dropdownMenu) {
            dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
        }
    };

    // Add logout functionality
    document.querySelector('.dropdown-menu a').addEventListener('click', function(e) {
        if (this.textContent === 'Logout') {
            e.preventDefault();
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/admin/admin-login.html';
        }
    });

    loadFaculty();
});