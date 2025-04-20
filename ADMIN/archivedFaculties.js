const tableBody = document.querySelector('#archivedFacultiesTable tbody');  // Assuming you're targeting the tbody of the table in Archv.html

// Load archived faculty data
async function loadArchivedFaculties() {
    try {
        const response = await fetch(`${apiBaseUrl}/faculties/archived`);
        if (!response.ok) throw new Error('Failed to fetch archived faculties');

        const facultyList = await response.json();
        tableBody.innerHTML = "";

        if (facultyList.length === 0) {
            const noDataRow = document.createElement("tr");
            noDataRow.innerHTML = `<td colspan="8" style="text-align: center; padding: 20px;">No archived faculty data available</td>`;
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
                    <button class="restore-btn">Restore</button>
                    <button class="delete-btn">Delete Permanently</button>
                </td>
            `;

            row.querySelector(".restore-btn").addEventListener("click", () => {
                if (confirm(`Are you sure you want to restore ${faculty.first_name} ${faculty.last_name}?`)) {
                    restoreFaculty(faculty.faculty_id);
                }
            });

            row.querySelector(".delete-btn").addEventListener("click", () => {
                if (confirm(`Are you sure you want to permanently delete ${faculty.first_name} ${faculty.last_name}?`)) {
                    deleteFaculty(faculty.faculty_id);
                }
            });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching archived faculty data:', error);
    }
}

// Restore faculty function
async function restoreFaculty(facultyId) {
    try {
        const response = await fetch(`${apiBaseUrl}/faculties/restore/${facultyId}`, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Failed to restore faculty');
        alert('Faculty restored successfully');
        loadArchivedFaculties();  // Reload the archived faculties list
    } catch (error) {
        console.error('Error restoring faculty:', error);
    }
}

// Delete faculty permanently function
async function deleteFaculty(facultyId) {
    try {
        const response = await fetch(`${apiBaseUrl}/faculties/delete/${facultyId}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete faculty');
        alert('Faculty deleted permanently');
        loadArchivedFaculties();  // Reload the archived faculties list
    } catch (error) {
        console.error('Error permanently deleting faculty:', error);
    }
}

// Call to load archived faculties when page loads
document.addEventListener('DOMContentLoaded', loadArchivedFaculties);
