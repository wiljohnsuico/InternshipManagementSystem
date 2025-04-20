document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("userTypeFilter");
  const internContainer = document.getElementById("interncont");
  const companyContainer = document.getElementById("compcont");
  const employerContainer = document.getElementById("empcont");
  const facultyContainer = document.getElementById("facultcont");

  // Hide all containers initially
  internContainer.style.display = "none";
  companyContainer.style.display = "none";
  employerContainer.style.display = "none";
  facultyContainer.style.display = "none";

  // Default to intern view
  dropdown.value = "intern";
  internContainer.style.display = "block";
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

function loadArchivedInterns() {
  const archived = JSON.parse(localStorage.getItem("archivedInterns")) || [];
  const tableBody = document.getElementById("archiveTableBody");
  tableBody.innerHTML = "";

  archived.forEach((data, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${data.studentNumber}</td>
      <td>${data.firstName}</td>
      <td>${data.lastName}</td>
      <td>${data.cdept}</td>
      <td>${data.course}</td>
      <td>${data.username}</td>
      <td>${data.password}</td>
      <td>
        <button class="restore-btn">Restore</button>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    row.querySelector(".restore-btn").addEventListener("click", () => {
      restoreData(data, index, "archivedInterns", "interns");
    });

    row.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Are you sure you want to permanently delete this intern?")) {
        deleteData(index, "archivedInterns");
        loadArchivedInterns();
      }
    });

    tableBody.appendChild(row);
  });
}

function loadArchivedCompanies() {
  const archived = JSON.parse(localStorage.getItem("archivedCompanies")) || [];
  const tableBody = document.getElementById("companyTableBody");
  tableBody.innerHTML = "";

  archived.forEach((company, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${company.name}</td>
      <td>${company.address}</td>
      <td>
        <button class="restore-btn">Restore</button>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    row.querySelector(".restore-btn").addEventListener("click", () => {
      restoreData(company, index, "archivedCompanies", "companies");
    });

    row.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Are you sure you want to permanently delete this company?")) {
        deleteData(index, "archivedCompanies");
        loadArchivedCompanies();
      }
    });

    tableBody.appendChild(row);
  });
}

function loadArchivedEmployers() {
  const archived = JSON.parse(localStorage.getItem("archivedEmployers")) || [];
  const tableBody = document.getElementById("employerTableBody");
  tableBody.innerHTML = "";

  archived.forEach((emp, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${emp.firstName}</td>
      <td>${emp.lastName}</td>
      <td>${emp.username}</td>
      <td>${emp.password}</td>
      <td>${emp.company}</td>
      <td>
        <button class="restore-btn">Restore</button>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    row.querySelector(".restore-btn").addEventListener("click", () => {
      restoreData(emp, index, "archivedEmployers", "employers");
    });

    row.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Are you sure you want to permanently delete this employer?")) {
        deleteData(index, "archivedEmployers");
        loadArchivedEmployers();
      }
    });

    tableBody.appendChild(row);
  });
}

function loadArchivedFaculty() {
  const archived = JSON.parse(localStorage.getItem("archivedFaculty")) || [];
  const tableBody = document.getElementById("facultyTableBody");
  tableBody.innerHTML = "";

  archived.forEach((faculty, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${faculty.firstName}</td>
      <td>${faculty.lastName}</td>
      <td>${faculty.username}</td>
      <td>${faculty.password}</td>
      <td>${faculty.department}</td>
      <td>
        <button class="restore-btn">Restore</button>
        <button class="delete-btn">Delete</button>
      </td>
    `;

    row.querySelector(".restore-btn").addEventListener("click", () => {
      restoreData(faculty, index, "archivedFaculty", "faculty");
    });

    row.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Are you sure you want to permanently delete this faculty?")) {
        deleteData(index, "archivedFaculty");
        loadArchivedFaculty();
      }
    });

    tableBody.appendChild(row);
  });
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

  if (activeKey === "interns") window.location.href = "Intrn.html";
  else if (activeKey === "companies") window.location.href = "Cmpny.html";
  else if (activeKey === "employers") window.location.href = "Emplyr.html";
  else if (activeKey === "faculty") window.location.href = "fclty.html";
}

function deleteData(index, archivedKey) {
  const archivedList = JSON.parse(localStorage.getItem(archivedKey)) || [];
  archivedList.splice(index, 1);
  localStorage.setItem(archivedKey, JSON.stringify(archivedList));
}
