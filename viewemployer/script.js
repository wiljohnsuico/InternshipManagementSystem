document.addEventListener("DOMContentLoaded", () => {
    const jobListing = document.getElementById("job-listing");
    const mapFrame = document.getElementById("map-frame");
    const modal = document.getElementById("apply-modal");
    const closeBtn = document.querySelector(".close-btn");
    const jobTitlePlaceholder = document.getElementById("job-title-placeholder");
    const applicationForm = document.getElementById("application-form");

    const jobs = [
        { title: "Frontend Developer Intern", description: "Learn HTML, CSS, and JavaScript.", location: "14.599512,120.981254" },
        { title: "Backend Developer Intern", description: "Work with Node.js and databases.", location: "14.676041,121.043700" },
        { title: "UI/UX Designer Intern", description: "Create user-friendly interfaces.", location: "14.554729,121.024445" },
        { title: "Data Science Intern", description: "Analyze and process data.", location: "14.586916,121.061001" }
    ];

    function updateJobListings() {
        jobListing.innerHTML = "";
        jobs.forEach(job => {
            const jobBox = document.createElement("div");
            jobBox.classList.add("job-box");
            jobBox.innerHTML = `
                <h3>${job.title}</h3>
                <p>${job.description}</p>
                <button>Apply Now</button>
            `;

            jobBox.addEventListener("click", () => {
                mapFrame.src = `https://www.google.com/maps?q=${job.location}&output=embed`;
            });

            // Apply Button Click (Open Modal)
            jobBox.querySelector("button").addEventListener("click", (e) => {
                e.stopPropagation();
                jobTitlePlaceholder.textContent = job.title;
                modal.style.display = "flex";
            });

            jobListing.appendChild(jobBox);
        });
    }

    // Close Modal
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Submit Form
    applicationForm.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Application submitted!");
        modal.style.display = "none";
        applicationForm.reset();
    });

    // Close modal when clicking outside content
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    updateJobListings();
});
