document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("FacultyTableBody");

    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");
    const editIndex = document.getElementById("editIndex");
    const editFirstName = document.getElementById("editFirstName");
    const editLastName = document.getElementById("editLastName");
    const editPassword = document.getElementById("editPassword");
    const editUsername = document.getElementById("editUsername");
    const editCollegeDepartment = document.getElementById("editCollegeDepartment");
    const editCourse = document.getElementById("editCourse");

    const addBtn = document.getElementById("addCompany"); // renamed for clarity

    let defaultFaculty = [
        {
            firstName: "Carlos",
            lastName: "Garcia",
            password: "admin123",
            username: "cgarcia",
            collegeDepartment: "CCS",
            course: "BSIT"
        },
        {
            firstName: "Angela",
            lastName: "Morales",
            password: "pass456",
            username: "amorales",
            collegeDepartment: "COE",
            course: "BSIE"
        }
    ];

    if (!localStorage.getItem("faculty")) {
        localStorage.setItem("faculty", JSON.stringify(defaultFaculty));
    }

    function loadFaculty() {
        tableBody.innerHTML = "";
        const facultyList = JSON.parse(localStorage.getItem("faculty")) || [];

        facultyList.forEach((faculty, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${faculty.firstName}</td>
                <td>${faculty.lastName}</td>
                <td>${faculty.password}</td>
                <td>${faculty.username}</td>
                <td>${faculty.collegeDepartment}</td>
                <td>${faculty.course}</td>
                <td class="actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            row.querySelector(".edit-btn").addEventListener("click", () => {
                openEditModal(index, faculty);
            });

            row.querySelector(".delete-btn").addEventListener("click", () => {
                if (confirm(`Are you sure you want to delete ${faculty.firstName} ${faculty.lastName}?`)) {
                    const archived = JSON.parse(localStorage.getItem("archivedFaculty")) || [];
                    archived.push(faculty);
                    localStorage.setItem("archivedFaculty", JSON.stringify(archived));

                    facultyList.splice(index, 1);
                    localStorage.setItem("faculty", JSON.stringify(facultyList));
                    loadFaculty();
                }
            });

            tableBody.appendChild(row);
        });
    }

    function openEditModal(index, faculty) {
        editIndex.value = index;
        editFirstName.value = faculty.firstName;
        editLastName.value = faculty.lastName;
        editPassword.value = faculty.password;
        editUsername.value = faculty.username;
        editCollegeDepartment.value = faculty.collegeDepartment;
        editCourse.value = faculty.course;
        editModal.style.display = "flex";
    }

    window.closeEditModal = function () {
        editModal.style.display = "none";
    };

    editForm.addEventListener("submit", function (e) {
        e.preventDefault();
        let facultyList = JSON.parse(localStorage.getItem("faculty")) || [];
        const index = parseInt(editIndex.value);

        facultyList[index] = {
            firstName: editFirstName.value,
            lastName: editLastName.value,
            password: editPassword.value,
            username: editUsername.value,
            collegeDepartment: editCollegeDepartment.value,
            course: editCourse.value
        };

        localStorage.setItem("faculty", JSON.stringify(facultyList));
        closeEditModal();
        loadFaculty();
    });

    addBtn.addEventListener("click", () => {
        const firstName = prompt("Enter First Name:");
        if (!firstName) return;

        const lastName = prompt("Enter Last Name:");
        if (!lastName) return;

        const username = prompt("Enter Username:");
        if (!username) return;

        const password = prompt("Enter Password:");
        if (!password) return;

        const collegeDepartment = prompt("Enter College Department:");
        if (!collegeDepartment) return;

        const course = prompt("Enter Course:");
        if (!course) return;

        const facultyList = JSON.parse(localStorage.getItem("faculty")) || [];
        facultyList.push({ firstName, lastName, username, password, collegeDepartment, course });
        localStorage.setItem("faculty", JSON.stringify(facultyList));
        loadFaculty();
    });

    // Fixed Search Function
    window.searchTable = function () {
        const input = document.getElementById("searchInput").value.toLowerCase();
        // Get the original data from localStorage
        const facultyList = JSON.parse(localStorage.getItem("faculty")) || [];
        
        // Clear the current table
        tableBody.innerHTML = "";
        
        // Filter faculty based on search input
        const filteredFaculty = facultyList.filter(faculty => {
            return Object.values(faculty).some(value => 
                String(value).toLowerCase().includes(input)
            );
        });
        
        // Display filtered results
        filteredFaculty.forEach((faculty, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${faculty.firstName}</td>
                <td>${faculty.lastName}</td>
                <td>${faculty.password}</td>
                <td>${faculty.username}</td>
                <td>${faculty.collegeDepartment}</td>
                <td>${faculty.course}</td>
                <td class="actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            // Re-add event listeners for all buttons
            row.querySelector(".edit-btn").addEventListener("click", () => {
                openEditModal(index, faculty);
            });

            row.querySelector(".delete-btn").addEventListener("click", () => {
                if (confirm(`Are you sure you want to delete ${faculty.firstName} ${faculty.lastName}?`)) {
                    const archived = JSON.parse(localStorage.getItem("archivedFaculty")) || [];
                    archived.push(faculty);
                    localStorage.setItem("archivedFaculty", JSON.stringify(archived));

                    facultyList.splice(index, 1);
                    localStorage.setItem("faculty", JSON.stringify(facultyList));
                    loadFaculty();
                }
            });

            tableBody.appendChild(row);
        });
        
        // Show message if no results found
        if (filteredFaculty.length === 0) {
            const noResultsRow = document.createElement("tr");
            noResultsRow.innerHTML = `
                <td colspan="8" style="text-align: center; padding: 20px;">No results found for "${input}"</td>
            `;
            tableBody.appendChild(noResultsRow);
        }
    };

    // Add logout functionality
    const dropdownLinks = document.querySelectorAll('.dropdown-menu a');
    dropdownLinks.forEach(link => {
        if (link.textContent.trim() === 'Logout') {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/admin/admin-login.html';
            });
        }
    });

    loadFaculty();
});