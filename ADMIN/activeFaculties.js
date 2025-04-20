const tableBody = document.querySelector('#facultiesTable tbody');  // Assuming you're targeting the tbody of the table in fclty.html

// Load active faculty data
async function loadActiveFaculties() {
    try {
        const response = await fetch(`${apiBaseUrl}/faculties`);
        if (!response.ok) throw new Error('Failed to fetch faculties');

        const facultyList = await response.json();
        tableBody.innerHTML = "";

        if (facultyList.length === 0) {
            const noDataRow = document.createElement("tr");
            noDataRow.innerHTML = `<td colspan="8" style="text-align: center; padding: 20px;">No active faculty data available</td>`;
            tableBody.appendChild(noDataRow);
            return;
        }

        facultyList.forEach((faculty, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${faculty.first_name}</td>
                <td>${faculty.middle_name}</td>
                <td>${faculty.last_name}</td>
                <td>${faculty.contact_number}</td>
                <td>${faculty.email}</td>
                <td>${faculty.dept}</td>
                <td>${faculty.course}</td>
                <td class="actions">
                    <button class="archive-btn">Archive</button>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            row.querySelector(".archive-btn").addEventListener("click", () => {
                if (confirm(`Are you sure you want to archive ${faculty.first_name} ${faculty.last_name}?`)) {
                    archiveFaculty(faculty.faculty_id);
                }
            });

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
        console.error('Error fetching active faculty data:', error);
    }
}

// Archive faculty function
async function archiveFaculty(facultyId) {
    try {
        const response = await fetch(`${apiBaseUrl}/faculties/archive/${facultyId}`, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Failed to archive faculty');
        alert('Faculty archived successfully');
        loadActiveFaculties();  // Reload the active faculties list
    } catch (error) {
        console.error('Error archiving faculty:', error);
    }
}

// Delete faculty function
async function deleteFaculty(facultyId) {
    try {
        const response = await fetch(`${apiBaseUrl}/faculties/${facultyId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete faculty');
        alert('Faculty deleted successfully');
        loadActiveFaculties();  // Reload the active faculties list
    } catch (error) {
        console.error('Error deleting faculty:', error);
    }
}

// Edit faculty modal (you can customize this)
function openEditModal(index, faculty) {
    // Implement modal opening logic here for editing
    console.log(`Editing faculty #${index + 1}:`, faculty);
}

// Call to load active faculties when page loads
document.addEventListener('DOMContentLoaded', loadActiveFaculties);
