document.addEventListener("DOMContentLoaded", () => {
      const tableBody = document.getElementById("internTableBody");
      const editModal = document.getElementById("editModal");
      const editForm = document.getElementById("editForm");
      const editFirstName = document.getElementById("editFirstName");
      const editLastName = document.getElementById("editLastName");
      const editCollegeDepartment = document.getElementById("editCollegeDepartment");
      const editCourse = document.getElementById("editCourse");
      const editIndex = document.getElementById("editIndex");

      let defaultInterns = [
        {
          studentNumber: "23-2345",
          firstName: "Juan",
          lastName: "Dela Cruz",
          cdept: "CCS",
          course: "BSIT",
          username: "juandelacruz",
          password: "pass123",
          verified: "Pending"
        },
        {
          studentNumber: "23-6789",
          firstName: "Maria",
          lastName: "Reyes",
          cdept: "CBA",
          course: "BSBA",
          username: "mariareyes",
          password: "secure456",
          verified: "Pending"
        }
      ];

      if (!localStorage.getItem("interns")) {
        localStorage.setItem("interns", JSON.stringify(defaultInterns));
      }

      function loadInterns() {
        tableBody.innerHTML = "";
        let interns = JSON.parse(localStorage.getItem("interns")) || [];

        interns.forEach((intern, index) => {
          if (!intern.verified || intern.verified === "false") {
            intern.verified = "Pending";
          }

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${intern.studentNumber}</td>
            <td>${intern.firstName}</td>
            <td>${intern.lastName}</td>
            <td>${intern.cdept}</td>
            <td>${intern.course}</td>
            <td>${intern.username}</td>
            <td>${intern.password}</td>
            <td>${intern.verified}</td>
            <td class="actions">
              <button class="accept-btn">Accept</button>
              <button class="reject-btn">Reject</button>
              <button class="edit-btn">Edit</button>
              <button class="delete-btn">Delete</button>
            </td>
          `;

          // Accept
          row.querySelector(".accept-btn").addEventListener("click", () => {
            interns[index].verified = "Accepted";
            localStorage.setItem("interns", JSON.stringify(interns));
            loadInterns();
          });

          // Reject
          row.querySelector(".reject-btn").addEventListener("click", () => {
            interns[index].verified = "Rejected";
            localStorage.setItem("interns", JSON.stringify(interns));
            loadInterns();
          });

          // Edit
          row.querySelector(".edit-btn").addEventListener("click", () => {
            openEditModal(index, intern);
          });

          // Delete
          row.querySelector(".delete-btn").addEventListener("click", () => {
            if (confirm(`Delete intern ${intern.firstName} ${intern.lastName}?`)) {
              const archived = JSON.parse(localStorage.getItem("archivedInterns")) || [];
              archived.push(intern);
              localStorage.setItem("archivedInterns", JSON.stringify(archived));
              interns.splice(index, 1);
              localStorage.setItem("interns", JSON.stringify(interns));
              loadInterns();
            }
          });

          tableBody.appendChild(row);
        });
      }

      function openEditModal(index, intern) {
        editIndex.value = index;
        editFirstName.value = intern.firstName;
        editLastName.value = intern.lastName;
        editCollegeDepartment.value = intern.cdept;
        editCourse.value = intern.course;
        editModal.style.display = "flex";
      }

      window.closeEditModal = function () {
        editModal.style.display = "none";
      };

      editForm.addEventListener("submit", function (e) {
        e.preventDefault();
        let interns = JSON.parse(localStorage.getItem("interns")) || [];
        const index = parseInt(editIndex.value);
        interns[index].firstName = editFirstName.value;
        interns[index].lastName = editLastName.value;
        interns[index].cdept = editCollegeDepartment.value;
        interns[index].course = editCourse.value;
        localStorage.setItem("interns", JSON.stringify(interns));
        closeEditModal();
        loadInterns();
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

      loadInterns();
    });