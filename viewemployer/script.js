document.addEventListener("DOMContentLoaded", () => {
    const jobListing = document.getElementById("job-listing");
    const mapFrame = document.getElementById("map-frame");

    // Job Listings with Locations
    const jobs = [
        { 
            title: "Frontend Developer Intern", 
            description: "Learn HTML, CSS, and JavaScript.", 
            location: "14.599512,120.981254" // Manila
        },
        { 
            title: "Backend Developer Intern", 
            description: "Work with Node.js and databases.", 
            location: "14.676041,121.043700" // Lugaw Place
        },
        { 
            title: "UI/UX Designer Intern", 
            description: "Create user-friendly interfaces.", 
            location: "14.554729,121.024445" // Makati
        },
        { 
            title: "Data Science Intern", 
            description: "Analyze and process data.", 
            location: "14.586916,121.061001" // Quezon City
        }
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

            jobListing.appendChild(jobBox);
        });
    }

    updateJobListings();
});
