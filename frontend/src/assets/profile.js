document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page loaded');
    
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user'));
    console.log('User data:', userData);
    
    if (!userData) {
        console.log('No user data found, redirecting to login');
        window.location.href = 'mpl-login.html';
        return;
    }

    // Load profile data from server first
    loadProfile().then(() => {
        // After profile is loaded, setup edit buttons
        setupEditButtons();

        // Fix contact button behavior
        const contactButton = document.querySelector('.btn-contact');
        if (contactButton) {
            contactButton.onclick = function(e) {
                e.preventDefault(); // Prevent default link behavior
                const email = userData.email;
                if (email) {
                    window.location.href = `mailto:${email}`;
                }
            };
        }
        
        // Setup resume modal with data from localStorage
        setupResumeModal();
    });
});

function updateProfileInfo(userData) {
    console.log('Updating profile info with:', userData);
    
    // Update basic profile info
    const nameElement = document.querySelector('.profile-info h1');
    const courseElement = document.querySelector('.profile-info p');
    
    if (nameElement && userData.first_name && userData.last_name) {
        nameElement.textContent = `${userData.first_name} ${userData.last_name}`;
    }
    if (courseElement) {
        courseElement.textContent = userData.course || 'No course specified';
    }
    
    // Update contact information
    const contactNumber = document.getElementById('contactNumber');
    const age = document.getElementById('age');
    const location = document.getElementById('location');
    
    if (contactNumber) contactNumber.textContent = userData.contact_number || 'No contact number';
    if (age) age.textContent = userData.age || 'No age specified';
    if (location) location.textContent = userData.address || 'No address specified';
    
    // Update about section
    const aboutText = document.querySelector('.about-text');
    if (aboutText) {
        aboutText.textContent = userData.about || 'No information provided';
    }
    
    // Update skills
    const skillsContainer = document.querySelector('.skills-section div');
    if (skillsContainer) {
        console.log('Processing skills for display:', userData.skills);
        let skillsArray = [];
        
        try {
            if (Array.isArray(userData.skills)) {
                skillsArray = userData.skills;
            } else if (userData.skills) {
                if (typeof userData.skills === 'string') {
                    try {
                        const parsed = JSON.parse(userData.skills);
                        skillsArray = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        skillsArray = userData.skills.split(',').map(s => s.trim()).filter(s => s);
                    }
                }
            }
        } catch (e) {
            console.error('Error processing skills for display:', e);
            skillsArray = [];
        }
        
        console.log('Final skills array for display:', skillsArray);
        
        // Clear existing skills
        skillsContainer.innerHTML = '';
        
        // Add each skill as a tag
        if (skillsArray && skillsArray.length > 0) {
            const skillsHtml = skillsArray
                .map(skill => `<span class="skill-tag">${skill}</span>`)
                .join('');
            console.log('Generated skills HTML:', skillsHtml);
            skillsContainer.innerHTML = skillsHtml;
        } else {
            skillsContainer.innerHTML = '<span class="no-skills">No skills added yet</span>';
        }
    }

    // Update website links
    const websiteLinksContainer = document.getElementById('websiteLinks');
    if (websiteLinksContainer && userData.website) {
        const websites = Array.isArray(userData.website) ? userData.website : [userData.website];
        websiteLinksContainer.innerHTML = websites
            .filter(website => website && website.trim())
            .map(website => {
                const websiteUrl = ensureHttps(website);
                return `
                    <div class="website-link">
                        <div class="website-icon">@</div>
                        <a href="${websiteUrl}" target="_blank">${website}</a>
                    </div>
                `;
            })
            .join('');
    }
}

function setupEditButtons() {
    console.log('Setting up edit buttons');
    
    // Add edit button to profile section
    const buttonGroup = document.querySelector('.button-group');
    if (!buttonGroup) {
        console.error('Button group not found');
        return;
    }
    
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-edit';
    editButton.textContent = 'Edit Profile';
    editButton.onclick = openEditModal;
    
    buttonGroup.appendChild(editButton);
}

function openEditModal() {
    console.log('Opening edit modal');
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editModal';
    modal.style.display = 'block';
    
    const userData = JSON.parse(localStorage.getItem('user'));
    console.log('User data for edit:', userData);
    
    // Parse skills for display
    let skillsString = '';
    if (userData.skills) {
        if (Array.isArray(userData.skills)) {
            skillsString = userData.skills.join(', ');
        } else if (typeof userData.skills === 'string') {
            try {
                const skillsArray = JSON.parse(userData.skills);
                skillsString = Array.isArray(skillsArray) ? skillsArray.join(', ') : userData.skills;
            } catch (e) {
                skillsString = userData.skills;
            }
        }
    }
    console.log('Skills string for edit:', skillsString);
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit Profile</h2>
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="editFirstName">First Name</label>
                    <input type="text" id="editFirstName" value="${userData.first_name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="editLastName">Last Name</label>
                    <input type="text" id="editLastName" value="${userData.last_name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="editCourse">Course</label>
                    <input type="text" id="editCourse" value="${userData.course || ''}">
                </div>
                <div class="form-group">
                    <label for="editContact">Contact Number</label>
                    <input type="tel" id="editContact" value="${userData.contact_number || ''}">
                </div>
                <div class="form-group">
                    <label for="editAge">Age</label>
                    <input type="number" id="editAge" value="${userData.age || ''}">
                </div>
                <div class="form-group">
                    <label for="editAddress">Address</label>
                    <input type="text" id="editAddress" value="${userData.address || ''}">
                </div>
                <div class="form-group">
                    <label for="editAbout">About</label>
                    <textarea id="editAbout">${userData.about || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="editSkills">Skills (comma separated)</label>
                    <input type="text" id="editSkills" value="${skillsString}" placeholder="e.g. JavaScript, Python, React">
                </div>
                <div class="form-group">
                    <label for="editWebsite">Website</label>
                    <input type="url" id="editWebsite" value="${userData.website || ''}">
                </div>
                <button type="submit" class="btn btn-save">Save Changes</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeButton = modal.querySelector('.close');
    closeButton.onclick = () => modal.remove();
    
    const form = modal.querySelector('#editProfileForm');
    form.onsubmit = handleProfileUpdate;
    
    // Close modal when clicking outside
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    };
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    console.log('Handling profile update');
    
    // Get current user data
    const currentUserData = JSON.parse(localStorage.getItem('user'));
    
    // Get skills as an array
    const skillsInput = document.getElementById('editSkills').value;
    console.log('Raw skills input:', skillsInput);
    
    const skillsArray = skillsInput
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
    
    console.log('Processed skills array:', skillsArray);

    const formData = {
        first_name: document.getElementById('editFirstName').value || currentUserData.first_name || '',
        last_name: document.getElementById('editLastName').value || currentUserData.last_name || '',
        course: document.getElementById('editCourse').value || currentUserData.course || '',
        contact_number: document.getElementById('editContact').value || currentUserData.contact_number || '',
        age: parseInt(document.getElementById('editAge').value) || currentUserData.age || null,
        address: document.getElementById('editAddress').value || currentUserData.address || '',
        about: document.getElementById('editAbout').value || currentUserData.about || '',
        skills: skillsArray,
        website: document.getElementById('editWebsite').value || currentUserData.website || ''
    };
    
    console.log('Sending update data:', formData);
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }

        const response = await fetch('http://localhost:5004/api/interns/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        console.log('Update response:', data);
        
        if (response.ok && data.success) {
            // Update local storage with the new data
            const updatedUserData = {
                ...currentUserData,
                ...formData
            };
            
            console.log('Storing updated user data:', updatedUserData);
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            
            // Force a fresh load of profile data from server
            await loadProfile();
            
            // Close the modal
            const modal = document.getElementById('editModal');
            if (modal) {
                modal.remove();
            }
            
            alert('Profile updated successfully!');
        } else {
            throw new Error(data.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        alert(error.message || 'Error updating profile. Please try again.');
    }
}

// Function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Function to add http:// if missing
function ensureHttps(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}

// Function to update website links
function updateWebsiteLinks(websites) {
    const websiteLinksContainer = document.getElementById('websiteLinks');
    websiteLinksContainer.innerHTML = ''; // Clear existing links

    if (websites && websites.length > 0) {
        websites.forEach(website => {
            if (website && website.trim()) {
                const websiteUrl = ensureHttps(website);
                const linkDiv = document.createElement('div');
                linkDiv.className = 'website-link';
                linkDiv.innerHTML = `
                    <div class="website-icon">@</div>
                    <a href="${websiteUrl}" target="_blank">${website}</a>
                `;
                websiteLinksContainer.appendChild(linkDiv);
            }
        });
    }
}

// Function to update social media links
function updateSocialLinks(socialLinks) {
    if (socialLinks) {
        if (socialLinks.instagram) {
            document.getElementById('instagramLink').href = ensureHttps(socialLinks.instagram);
        }
        if (socialLinks.linkedin) {
            document.getElementById('linkedinLink').href = ensureHttps(socialLinks.linkedin);
        }
        if (socialLinks.facebook) {
            document.getElementById('facebookLink').href = ensureHttps(socialLinks.facebook);
        }
        if (socialLinks.github) {
            document.getElementById('githubLink').href = ensureHttps(socialLinks.github);
        }
    }
}

// Update the loadProfile function
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5004/api/interns/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('Profile data from server:', data);

        if (response.ok && data.success) {
            // Update local storage with merged data
            const userData = JSON.parse(localStorage.getItem('user'));
            const updatedUserData = { 
                ...userData, 
                ...data.data
            };
            
            // Ensure skills is properly handled
            try {
                if (data.data.skills) {
                    if (Array.isArray(data.data.skills)) {
                        updatedUserData.skills = data.data.skills;
                    } else {
                        const parsed = JSON.parse(data.data.skills);
                        updatedUserData.skills = Array.isArray(parsed) ? parsed : [];
                    }
                } else {
                    updatedUserData.skills = [];
                }
                console.log('Processed skills for storage:', updatedUserData.skills);
            } catch (e) {
                console.error('Error processing skills from server:', e);
                updatedUserData.skills = [];
            }
            
            console.log('Storing updated user data:', updatedUserData);
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            
            // Update UI with fresh data
            updateProfileInfo(updatedUserData);
            return updatedUserData;
        } else {
            throw new Error(data.message || 'Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile. Please try again.');
        return null;
    }
}

// Call loadProfile when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadProfile();
});

// Update the updateProfile function to handle websites and social links
async function updateProfile(profileData) {
    try {
        // Validate website URLs if provided
        if (profileData.website) {
            const websites = profileData.website.split(',').map(url => url.trim());
            websites.forEach(website => {
                if (website && !isValidUrl(ensureHttps(website))) {
                    throw new Error(`Invalid website URL: ${website}`);
                }
            });
        }

        // Validate social media URLs if provided
        if (profileData.social_links) {
            Object.values(profileData.social_links).forEach(url => {
                if (url && !isValidUrl(ensureHttps(url))) {
                    throw new Error(`Invalid social media URL: ${url}`);
                }
            });
        }

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5004/api/interns/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile');
        }

        const data = await response.json();
        if (data.success) {
            // Update the UI
            if (profileData.website) {
                updateWebsiteLinks(profileData.website.split(',').map(url => url.trim()));
            }
            if (profileData.social_links) {
                updateSocialLinks(profileData.social_links);
            }
            alert('Profile updated successfully!');
        } else {
            throw new Error(data.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert(error.message || 'Failed to update profile');
    }
}

// Add edit functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load initial profile data
    loadProfile();

    // Add edit buttons to editable fields
    const editableFields = [
        { label: 'Contact No.', id: 'contactNumber', field: 'contact_number' },
        { label: 'Age', id: 'age', field: 'age' },
        { label: 'Location', id: 'location', field: 'address' },
        { label: 'Course', selector: '.profile-info p', field: 'course' },
        { label: 'About', selector: '.about-text', field: 'about' }
    ];

    editableFields.forEach(field => {
        const element = field.id ? document.getElementById(field.id) : document.querySelector(field.selector);
        if (element) {
            const editButton = document.createElement('button');
            editButton.className = 'btn-edit';
            editButton.innerHTML = '✎';
            editButton.onclick = () => {
                const newValue = prompt(`Enter new ${field.label}:`, element.textContent.trim());
                if (newValue !== null) {
                    const updateData = { [field.field]: newValue };
                    updateProfile(updateData);
                }
            };
            element.parentNode.appendChild(editButton);
        }
    });

    // Add skills editing
    const skillsSection = document.querySelector('.skills-section');
    if (skillsSection) {
        const editButton = document.createElement('button');
        editButton.className = 'btn-edit';
        editButton.innerHTML = '✎';
        editButton.onclick = () => {
            const currentSkills = Array.from(skillsSection.querySelectorAll('.skill-tag'))
                .map(tag => tag.textContent)
                .join(', ');
            const newSkills = prompt('Enter skills (comma-separated):', currentSkills);
            if (newSkills !== null) {
                const skillsArray = newSkills.split(',').map(s => s.trim()).filter(s => s);
                updateProfile({ skills: skillsArray });
            }
        };
        skillsSection.querySelector('h3').appendChild(editButton);
    }
});

// Add event listener for resumeUpdated event
window.addEventListener('resumeUpdated', function(event) {
    console.log('Resume updated event received:', event.detail);
    setupResumeModal();
});

// Function to setup resume modal with data from localStorage
function setupResumeModal() {
    console.log('Setting up resume modal');
    
    // Get resume data from localStorage
    const resumeData = JSON.parse(localStorage.getItem('resumeForProfile')) || JSON.parse(localStorage.getItem('resumeData'));
    const userData = JSON.parse(localStorage.getItem('userData')) || JSON.parse(localStorage.getItem('user'));
    
    if (!resumeData && !userData) {
        console.log('No resume data found');
        return;
    }
    
    // Get resume modal elements
    const modal = document.getElementById('resumeModal');
    if (!modal) {
        console.error('Resume modal not found in the DOM');
        return;
    }
    
    const resumeBtn = document.getElementById('resumeBtn');
    const closeBtn = modal.querySelector('.close');
    
    // Function to format full name consistently with middle initial
    function formatFullName(data) {
        if (!data) return "Lastname, Firstname MI";
        
        const lastName = data.lastName || data.last_name || (data.basic ? data.basic.lastName : '') || '';
        const firstName = data.firstName || data.first_name || (data.basic ? data.basic.firstName : '') || '';
        const middleName = data.middleName || data.middle_name || (data.basic ? data.basic.middleName : '') || '';
        const suffix = data.suffix || (data.basic ? data.basic.suffix : '') || '';
        
        let formattedName = lastName;
        
        if (firstName) {
            formattedName += formattedName ? ', ' + firstName : firstName;
        }
        
        if (middleName) {
            formattedName += ' ' + middleName.charAt(0).toUpperCase() + '.';
        }
        
        if (suffix) {
            formattedName += ', ' + suffix;
        }
        
        return formattedName || "Lastname, Firstname MI";
    }
    
    // Make the formatFullName function available globally
    window.profileFormatFullName = formatFullName;
    
    // Populate resume modal with data
    if (resumeData) {
        console.log('Populating resume modal with data:', resumeData);
        
        // Basic information
        const fullName = modal.querySelector('h2');
        const contactInfo = modal.querySelector('h2 + p');
        
        if (fullName) {
            // Use the formatFullName function from the HTML file if it's available
            if (window.formatFullName) {
                fullName.textContent = window.formatFullName(resumeData);
            } else {
                fullName.textContent = formatFullName(resumeData);
            }
        }
        
        if (contactInfo) {
            if (resumeData.contactInfo) {
                contactInfo.textContent = resumeData.contactInfo;
            } else if (resumeData.basic) {
                contactInfo.textContent = `${resumeData.basic.mobile || ''} | ${resumeData.basic.email || ''}`;
            } else if (userData) {
                contactInfo.textContent = `${userData.contact_number || ''} | ${userData.email || ''}`;
            }
        }
        
        // Get all resume sections
        const resumeSections = modal.querySelectorAll('.resume-section');
        
        // Populate objectives section
        const objectivesSection = Array.from(resumeSections).find(section => {
            const heading = section.querySelector('h3');
            return heading && (heading.textContent.toUpperCase() === 'OBJECTIVES');
        });
        if (objectivesSection) {
            const p = objectivesSection.querySelector('p');
            if (p) {
                if (resumeData.objectives) {
                    p.textContent = resumeData.objectives;
                    console.log('Setting objectives to:', resumeData.objectives);
                } else if (resumeData.basic && resumeData.basic.objectives) {
                    p.textContent = resumeData.basic.objectives;
                    console.log('Setting objectives from basic to:', resumeData.basic.objectives);
                } else {
                    p.textContent = 'No objectives provided';
                    console.log('No objectives found in resume data');
                }
            }
        } else {
            console.log('Objectives section not found in the resume modal');
        }
        
        // Populate basic information section
        const basicInfoSection = Array.from(resumeSections).find(section => section.querySelector('h3')?.textContent === 'Basic Information');
        if (basicInfoSection) {
            const ul = basicInfoSection.querySelector('ul');
            if (ul) {
                ul.innerHTML = '';
                
                // Age
                const age = resumeData.age || (resumeData.basic ? resumeData.basic.age : '') || userData.age || '';
                if (age) {
                    const li = document.createElement('li');
                    li.textContent = `${age} years old`;
                    ul.appendChild(li);
                }
                
                // Birthday
                const birthday = resumeData.birthday || (resumeData.basic ? resumeData.basic.birthday : '') || '';
                if (birthday) {
                    const li = document.createElement('li');
                    li.textContent = birthday;
                    ul.appendChild(li);
                }
                
                // Address
                let address = '';
                if (resumeData.address) {
                    address = resumeData.address;
                } else if (resumeData.basic && resumeData.basic.address) {
                    const addr = resumeData.basic.address;
                    address = `${addr.street || ''}, ${addr.barangay || ''}, ${addr.city || ''}, ${addr.country || ''}`;
                } else if (userData.address) {
                    address = userData.address;
                }
                
                if (address) {
                    const li = document.createElement('li');
                    li.textContent = address;
                    ul.appendChild(li);
                }
            }
        }
        
        // Populate education section
        const educationSection = Array.from(resumeSections).find(section => section.querySelector('h3')?.textContent === 'Education');
        if (educationSection) {
            const p = educationSection.querySelector('p');
            if (p) {
                if (resumeData.education) {
                    if (typeof resumeData.education === 'string') {
                        p.innerHTML = resumeData.education;
                    } else if (Array.isArray(resumeData.education)) {
                        p.innerHTML = resumeData.education.map(edu => 
                            `${edu.school || ''}<br>${edu.year || ''}${edu.date ? ' - ' + edu.date : ''}`
                        ).join('<br><br>');
                    }
                } else if (userData.course) {
                    p.innerHTML = `${userData.course || ''}<br>Quezon City University`;
                }
            }
        }
        
        // Populate work experience section
        const workSection = Array.from(resumeSections).find(section => section.querySelector('h3')?.textContent === 'Work Experience');
        if (workSection) {
            const p = workSection.querySelector('p');
            if (p) {
                if (resumeData.work) {
                    if (typeof resumeData.work === 'string') {
                        p.innerHTML = resumeData.work;
                    } else if (Array.isArray(resumeData.work)) {
                        p.innerHTML = resumeData.work.map(work => 
                            `${work.position || ''}<br>${work.company || ''}${work.duration ? ' | ' + work.duration : ''}`
                        ).join('<br><br>');
                    }
                } else {
                    p.innerHTML = 'No work experience added';
                }
            }
        } else {
            // Create work experience section if it doesn't exist
            if (resumeData.work) {
                // Find EDUCATION section to place WORK EXPERIENCE after it
                const educationSection = Array.from(resumeSections).find(section => 
                    section.querySelector('h3')?.textContent === 'Education');
                
                if (educationSection) {
                    const workSection = document.createElement('div');
                    workSection.className = 'resume-section';
                    
                    let workHtml = '';
                    if (typeof resumeData.work === 'string') {
                        workHtml = resumeData.work;
                    } else if (Array.isArray(resumeData.work)) {
                        workHtml = resumeData.work.map(work => 
                            `${work.position || ''}<br>${work.company || ''}${work.duration ? ' | ' + work.duration : ''}`
                        ).join('<br><br>');
                    }
                    
                    workSection.innerHTML = `
                        <h3>Work Experience</h3>
                        <p>${workHtml || 'No work experience added'}</p>
                    `;
                    
                    educationSection.insertAdjacentElement('afterend', workSection);
                }
            }
        }
        
        // Populate skills section
        const skillsSection = Array.from(resumeSections).find(section => section.querySelector('h3')?.textContent === 'Skills');
        if (skillsSection) {
            const ul = skillsSection.querySelector('ul');
            if (ul) {
                ul.innerHTML = '';
                
                const skills = resumeData.skills || [];
                if (skills.length > 0) {
                    skills.forEach(skill => {
                        const li = document.createElement('li');
                        li.textContent = skill;
                        ul.appendChild(li);
                    });
                } else if (userData.skills && Array.isArray(userData.skills)) {
                    userData.skills.forEach(skill => {
                        const li = document.createElement('li');
                        li.textContent = skill;
                        ul.appendChild(li);
                    });
                }
            }
        }
        
        // Update signature
        const resumeSignature = modal.querySelector('#resumeSignature');
        if (resumeSignature) {
            if (window.formatFullName) {
                resumeSignature.textContent = window.formatFullName(resumeData);
            } else {
                resumeSignature.textContent = formatFullName(resumeData);
            }
        }
    }
    
    // Set up resume button click handler
    if (resumeBtn) {
        resumeBtn.onclick = function() {
            modal.style.display = "flex";
        };
    }
    
    // Set up close button click handler
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = "none";
        };
    }
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

// Function to update the resume preview
function updateResumePreview() {
    // Get resume data from localStorage
    const resumeData = JSON.parse(localStorage.getItem('resumeForProfile') || '{}');
    
    // Update the resume modal with the data
    if (resumeData) {
        document.getElementById('resumeFullName').textContent = resumeData.fullName || '';
        document.getElementById('resumeContactInfo').textContent = resumeData.contactInfo || '';
        document.getElementById('resumeAddress').textContent = resumeData.address || '';
        document.getElementById('resumeAge').textContent = resumeData.age ? `Age: ${resumeData.age}` : '';
        document.getElementById('resumeBirthday').textContent = resumeData.birthday ? `Birthday: ${resumeData.birthday}` : '';
        
        // Update objectives
        const objectivesSection = document.getElementById('resumeObjectives');
        if (objectivesSection && resumeData.objectives) {
            objectivesSection.textContent = resumeData.objectives;
        } else if (objectivesSection) {
            objectivesSection.textContent = 'No objectives provided';
        }
        
        // Update education
        const educationSection = document.getElementById('resumeEducation');
        if (educationSection) {
            educationSection.innerHTML = resumeData.education || 'No education entries';
        }
        
        // Update skills
        const skillsSection = document.getElementById('resumeSkills');
        if (skillsSection) {
            if (resumeData.skills && resumeData.skills.length > 0) {
                skillsSection.innerHTML = resumeData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
            } else {
                skillsSection.innerHTML = 'No skills added';
            }
        }
        
        // Update resume image if available
        const resumeImage = document.getElementById('resumeImage');
        if (resumeImage && resumeData.imageData) {
            resumeImage.src = resumeData.imageData;
            resumeImage.style.display = 'block';
        } else if (resumeImage) {
            resumeImage.style.display = 'none';
        }
    }
}