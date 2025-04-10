document.addEventListener("DOMContentLoaded", () => {
    const jobListings = document.getElementById("job-listings");
    const searchTitle = document.getElementById("search-title");
    const searchLocation = document.getElementById("search-location");
    const paidFilter = document.getElementById("paid");
    const unpaidFilter = document.getElementById("unpaid");
    const allFilter = document.getElementById("all");
    const resetFilters = document.getElementById("reset-filters");

    /// wala to
    const jobs = [
        { title: "Software Engineer", company: "Google", location: "Manila", skills: ["JavaScript", "Python"], salary: "Paid" },
        { title: "Marketing Intern", company: "Facebook", location: "Quezon City", skills: ["Marketing", "SEO"], salary: "Unpaid" },
        { title: "Graphic Designer", company: "Adobe", location: "Makati", skills: ["Photoshop", "Illustrator"], salary: "Paid" },
        { title: "Tax Analyst", company: "Deloitte", location: "Makati", skills: ["Accounting", "Tax"], salary: "Paid" },
        { title: "Content Writer", company: "BuzzFeed", location: "Pasig", skills: ["Writing", "SEO"], salary: "Unpaid" },
        { title: "Web Developer", company: "Microsoft", location: "Taguig", skills: ["HTML", "CSS", "JavaScript"], salary: "Paid" },
        { title: "Project Manager", company: "Amazon", location: "Davao", skills: ["Agile", "Scrum"], salary: "Paid" },
        { title: "HR Intern", company: "Netflix", location: "Makati", skills: ["Recruitment"], salary: "Unpaid" },
        { title: "Game Developer", company: "Ubisoft", location: "Cavite", skills: ["Unity", "C#"], salary: "Paid" },
        { title: "Operations Intern", company: "IBM", location: "Cebu", skills: ["Excel", "Data Analysis"], salary: "Unpaid" }
    ];

    function displayJobs(filter = "All", searchQuery = "", locationQuery = "") {
        jobListings.innerHTML = "";  // Clear previous results

        let filteredJobs = jobs.filter(job => {
            const matchesSalary = filter === "All" || job.salary === filter;
            const matchesSearch = searchQuery === "" || 
                                  job.title.toLowerCase().includes(searchQuery) ||
                                  job.company.toLowerCase().includes(searchQuery) ||
                                  job.skills.some(skill => skill.toLowerCase().includes(searchQuery));
            const matchesLocation = locationQuery === "" || job.location.toLowerCase().includes(locationQuery);
            return matchesSalary && matchesSearch && matchesLocation;
        });

        document.getElementById("result-count").textContent = filteredJobs.length;

        if (filteredJobs.length === 0) {
            jobListings.innerHTML = `<p>No results found.</p>`;
            return;
        }

        filteredJobs.forEach(job => {
            jobListings.innerHTML += `
                <div class="job-card">
                    <h2>${job.title}</h2>
                    <p>${job.company} - ${job.location}</p>
                    <p>Skills: ${job.skills.join(", ")}</p>
                    <p><strong>${job.salary}</strong></p>
                    <button class="apply-btn">Apply Now</button>
                </div>
            `;
        })
    }

    function updateResults() {
        const titleQuery = searchTitle.value.toLowerCase().trim();
        const locationQuery = searchLocation.value.toLowerCase().trim();
        const selectedFilter = paidFilter.checked ? "Paid" : unpaidFilter.checked ? "Unpaid" : "All";
        displayJobs(selectedFilter, titleQuery, locationQuery);
    }

    // REAL-TIME SEARCH & FILTER FUNCTIONALITY
    searchTitle.addEventListener("input", updateResults);
    searchLocation.addEventListener("input", updateResults);
    paidFilter.addEventListener("change", updateResults);
    unpaidFilter.addEventListener("change", updateResults);
    allFilter.addEventListener("change", updateResults);

    // RESET FUNCTION
    resetFilters.addEventListener("click", () => {
        searchTitle.value = "";
        searchLocation.value = "";
        allFilter.checked = true;  // Reset filter selection to "All"
        updateResults();
    });

    // INITIAL DISPLAY
    displayJobs();
});
