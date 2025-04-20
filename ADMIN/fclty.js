document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("FacultyTableBody");

    // Edit Modal
    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editForm");
    const editIndex = document.getElementById("editIndex");
    const editFirstName = document.getElementById("editFirstName");
    const editMiddleName = document.getElementById("editMiddleName");
    const editLastName = document.getElementById("editLastName");
    const editPassword = document.getElementById("editPassword");
    const editEmail = document.getElementById("editEmail");
    const editCollegeDepartment = document.getElementById("editCollegeDepartment");
    const editCourse = document.getElementById("editCourse");
    const editContactNumber = document.getElementById("editContactNumber");

    // Add Modal
    const addBtn = document.getElementById("addCompany");
    const addModal = document.getElementById("addModal");
    const addForm = document.getElementById("addFacultyForm");

   // Load faculty data
    async function loadFaculty() {
        try {
            const response = await fetch(`${apiBaseUrl}/faculties`);
            if (!response.ok) throw new Error('Failed to fetch faculties');

            const facultyList = await response.json();
            tableBody.innerHTML = "";

            if (facultyList.length === 0) {
                const noDataRow = document.createElement("tr");
                noDataRow.innerHTML = `<td colspan="10" style="text-align: center; padding: 20px;">No faculty data available</td>`;
                tableBody.appendChild(noDataRow);
                return;
            }

            facultyList.forEach((faculty, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${faculty.first_name}</td>
                    <td>${faculty.middle_name || 'N/A'}</td>  <!-- Display middle name -->
                    <td>${faculty.last_name}</td>
                    <td>${faculty.password}</td>
                    <td>${faculty.email}</td>
                    <td>${faculty.dept}</td>
                    <td>${faculty.course}</td>
                    <td>${faculty.contact_number || 'N/A'}</td>  <!-- Display contact number -->
                    <td class="actions">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                `;

                row.querySelector(".edit-btn").addEventListener("click", () => {
                    openEditModal(index, faculty);
                });

                row.querySelector(".delete-btn").addEventListener("click", () => {
                    if (confirm(`Are you sure you want to delete ${faculty.first_name} ${faculty.last_name}?`)) {
                        deleteFaculty(faculty.faculty_id);
                    }
                });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching faculty data:', error);
    }
}

    // Open edit modal
    function openEditModal(index, faculty) {
        editIndex.value = faculty.faculty_id;
        editFirstName.value = faculty.first_name;
        editMiddleName.value = faculty.middle_name;
        editLastName.value = faculty.last_name;
        editPassword.value = faculty.password;
        editEmail.value = faculty.email;
        editCollegeDepartment.value = faculty.dept;
        editCourse.value = faculty.course;
        editContactNumber.value = faculty.contact_number;
        editModal.style.display = "flex";
    }

    // Close edit modal
    window.closeEditModal = function () {
        editModal.style.display = "none";
    };

    // Submit edit form
    editForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const facultyId = parseInt(editIndex.value);

        const updatedFaculty = {
            first_name: editFirstName.value.trim(),
            middle_name: editMiddleName.value.trim(),
            last_name: editLastName.value.trim(),
            password: editPassword.value.trim(),
            email: editEmail.value.trim(),
            dept: editCollegeDepartment.value,
            course: editCourse.value,
            contact_number: editContactNumber.value.trim()
        };

        try {
            const response = await fetch(`${apiBaseUrl}/faculties/${facultyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFaculty)
            });

            if (!response.ok) throw new Error('Failed to update faculty');
            await loadFaculty();
            closeEditModal();
            alert("Faculty updated successfully.");
        } catch (error) {
            console.error('Error updating faculty:', error);
            alert("Error updating faculty.");
        }
    });

    // Open add modal
    addBtn.addEventListener("click", () => {
        addModal.style.display = "flex";
    });

    // Close add modal
    window.closeAddModal = function () {
        addModal.style.display = "none";
    };

    // Submit add form
    addForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const facultyData = {
            first_name: document.getElementById("addFirstName").value.trim(),
            middle_name: document.getElementById("addMiddleName").value.trim(),
            last_name: document.getElementById("addLastName").value.trim(),
            password: document.getElementById("addPassword").value.trim(),
            email: document.getElementById("addEmail").value.trim(),
            dept: document.getElementById("addCollegeDepartment").value,
            course: document.getElementById("addCourse").value,
            contact_number: document.getElementById("addContactNumber").value.trim()
        };

        try {
            const response = await fetch(`${apiBaseUrl}/faculties`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(facultyData)
            });

            if (!response.ok) throw new Error("Failed to add faculty");
            alert("Faculty successfully added.");
            addForm.reset();
            closeAddModal();
            loadFaculty();
        } catch (err) {
            console.error("Add error:", err);
            alert("Error adding faculty.");
        }
    });

    async function deleteFaculty(facultyId) {
        try {
            const response = await fetch(`${apiBaseUrl}/faculties/${facultyId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error("Failed to delete faculty");

            alert("Faculty deleted successfully.");
            loadFaculty();
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error deleting faculty.");
        }
    }

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
