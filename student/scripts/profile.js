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