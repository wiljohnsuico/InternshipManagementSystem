// resume.js - Handles all resume functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load user data from localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    // Get form elements
    const firstNameInput = document.querySelector('input[name="firstName"]');
    const middleNameInput = document.querySelector('input[name="middleName"]');
    const lastNameInput = document.querySelector('input[name="lastName"]');
    const suffixInput = document.querySelector('input[name="suffix"]');
    const birthdayInput = document.querySelector('input[name="birthday"]');
    const ageInput = document.querySelector('input[name="age"]');
    const mobileInput = document.querySelector('input[name="mobile"]');
    const emailInput = document.querySelector('input[name="email"]');
    const objectivesInput = document.querySelector('textarea[name="objectives"]');
    
    const streetInput = document.querySelector('input[name="street"]');
    const barangayInput = document.querySelector('input[name="barangay"]');
    const cityInput = document.querySelector('input[name="city"]');
    const countryInput = document.querySelector('input[name="country"]');
    
    const skillsInput = document.querySelector('.skills-box');
    const saveButton = document.querySelector('.submit-btn');
    const statusMessage = document.getElementById('statusMessage');
    const previewImage = document.getElementById('preview-image');
    const placeholderText = document.querySelector('.placeholder-text');
    
    // API base URL - Make sure this matches your backend server
    const API_BASE_URL = 'http://localhost:5004';
    
    // Load resume data if it exists
    loadResumeData();
    
    // Add form submission handler
    saveButton.addEventListener('click', saveResume);
    
    // Function to save resume data
    async function saveResume(e) {
        e.preventDefault();
        
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('You must be logged in to save your resume.', 'error');
            return;
        }
        
        try {
            // Get education entries
            const educationEntries = [];
            document.querySelectorAll('.education-entry').forEach(entry => {
                const schoolInput = entry.querySelector('input[name="school"]');
                const yearInput = entry.querySelector('input[name="year"]');
                const dateInput = entry.querySelector('input[name="date"]');
                
                if (schoolInput && schoolInput.value.trim()) {
                    educationEntries.push({
                        school: schoolInput.value,
                        year: yearInput ? yearInput.value : '',
                        date: dateInput ? dateInput.value : ''
                    });
                }
            });
            
            // Get work experience entries
            const workEntries = [];
            document.querySelectorAll('.work-entry').forEach(entry => {
                const positionInput = entry.querySelector('input[name="position"]');
                const companyInput = entry.querySelector('input[name="company"]');
                const durationInput = entry.querySelector('input[name="duration"]');
                
                if (positionInput && positionInput.value.trim() && companyInput && companyInput.value.trim()) {
                    workEntries.push({
                        position: positionInput.value,
                        company: companyInput.value,
                        duration: durationInput ? durationInput.value : ''
                    });
                }
            });
            
            // Get skills (comma separated)
            const skills = skillsInput.value.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
            
            // Get objectives text
            const objectives = objectivesInput.value.trim();
            
            // Process image data to reduce size before saving
            let imageData = '';
            if (previewImage.src && previewImage.src.startsWith('data:image')) {
                try {
                    // Create a temporary image for compression
                    const tempImg = new Image();
                    
                    // Need to wait for the image to load before getting dimensions
                    tempImg.onload = function() {
                        // Create a canvas to resize the image
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 400;
                        const MAX_HEIGHT = 400;
                        
                        let width = tempImg.width;
                        let height = tempImg.height;
                        
                        // Calculate new dimensions while maintaining aspect ratio
                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Draw and compress the image
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(tempImg, 0, 0, width, height);
                        
                        // Get compressed image data (reduced quality)
                        imageData = canvas.toDataURL('image/jpeg', 0.6);
                        console.log('Image compressed successfully');
                        
                        // Now that compression is done, continue with the save process
                        completeResumeSave({
                            basic: {
                                firstName: firstNameInput.value,
                                middleName: middleNameInput.value,
                                lastName: lastNameInput.value,
                                suffix: suffixInput.value,
                                birthday: birthdayInput.value,
                                age: ageInput.value,
                                mobile: mobileInput.value,
                                email: emailInput.value,
                                address: {
                                    street: streetInput.value,
                                    barangay: barangayInput.value,
                                    city: cityInput.value,
                                    country: countryInput.value
                                }
                            },
                            objectives: objectives,
                            education: educationEntries,
                            work: workEntries,
                            skills: skills,
                            imageData: imageData
                        });
                    };
                    
                    // Set the source to trigger loading
                    tempImg.src = previewImage.src;
                    return; // Exit here as the save will be handled by the onload callback
                } catch (e) {
                    console.error('Error compressing image:', e);
                    imageData = previewImage.src;
                }
            } else {
                imageData = previewImage.src || '';
            }
            
            // Build resume data object
            const resumeData = {
                basic: {
                    firstName: firstNameInput.value,
                    middleName: middleNameInput.value,
                    lastName: lastNameInput.value,
                    suffix: suffixInput.value,
                    birthday: birthdayInput.value,
                    age: ageInput.value,
                    mobile: mobileInput.value,
                    email: emailInput.value,
                    address: {
                        street: streetInput.value,
                        barangay: barangayInput.value,
                        city: cityInput.value,
                        country: countryInput.value
                    }
                },
                objectives: objectives,
                education: educationEntries,
                work: workEntries,
                skills: skills,
                imageData: imageData
            };
            
            // Complete the save process if not waiting for image compression
            completeResumeSave(resumeData);
        } catch (error) {
            console.error('Error saving resume:', error);
            showMessage(`An error occurred while saving your resume: ${error.message}`, 'error');
        }
    }
    
    // Function to complete the resume save process
    async function completeResumeSave(resumeData) {
        try {
            // Save to localStorage
            localStorage.setItem('resumeData', JSON.stringify(resumeData));
            
            // Also update the resumeForProfile data to sync with profile page
            const resumeForProfile = {
                fullName: `${resumeData.basic.firstName || ''} ${resumeData.basic.middleName ? resumeData.basic.middleName + ' ' : ''}${resumeData.basic.lastName || ''}${resumeData.basic.suffix ? ' ' + resumeData.basic.suffix : ''}`,
                contactInfo: `${resumeData.basic.mobile || ''} | ${resumeData.basic.email || ''}`,
                address: resumeData.basic.address ? 
                    `${resumeData.basic.address.street || ''}, ${resumeData.basic.address.barangay || ''}, ${resumeData.basic.address.city || ''}, ${resumeData.basic.address.country || ''}` : '',
                age: resumeData.basic.age || '',
                birthday: resumeData.basic.birthday || '',
                objectives: resumeData.objectives || '',
                skills: resumeData.skills || [],
                firstName: resumeData.basic.firstName || '',
                middleName: resumeData.basic.middleName || '',
                lastName: resumeData.basic.lastName || '',
                suffix: resumeData.basic.suffix || ''
            };
            
            // Format education entries
            if (resumeData.education && resumeData.education.length > 0) {
                resumeForProfile.education = resumeData.education.map(edu => 
                    `${edu.school || ''}<br>${edu.year || ''}${edu.date ? ' - ' + edu.date : ''}`
                ).join('<br><br>');
            }
            
            // Format work experience entries
            if (resumeData.work && resumeData.work.length > 0) {
                resumeForProfile.work = resumeData.work.map(work => 
                    `${work.position || ''}<br>${work.company || ''}${work.duration ? ' | ' + work.duration : ''}`
                ).join('<br><br>');
            }
            
            localStorage.setItem('resumeForProfile', JSON.stringify(resumeForProfile));
            
            // Log what we're sending to the server
            console.log('Sending resume data with compressed image');
            
            const token = localStorage.getItem('token');
            // Save to backend
            const response = await fetch(`${API_BASE_URL}/api/interns/resume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(resumeData)
            });
            
            // Log the response status
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const responseData = await response.json();
                console.log('Response data:', responseData);
                showMessage('Resume saved successfully!', 'success');
                
                // Update profile data with skills
                try {
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    userData.skills = resumeData.skills;
                    localStorage.setItem('userData', JSON.stringify(userData));
                    
                    // Also update user data in the main storage that profile.js uses
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    user.skills = resumeData.skills;
                    localStorage.setItem('user', JSON.stringify(user));
                } catch (e) {
                    console.error('Error updating user data:', e);
                }
                
                // Trigger an update event to notify other parts of the app
                window.dispatchEvent(new CustomEvent('resumeUpdated', { detail: resumeData }));
            } else {
                let errorMessage = 'Failed to save resume';
                try {
                    const error = await response.json();
                    errorMessage = error.message || errorMessage;
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                showMessage(`${errorMessage} (Status: ${response.status})`, 'error');
            }
        } catch (error) {
            console.error('Error in completeResumeSave:', error);
            showMessage(`An error occurred while saving your resume: ${error.message}`, 'error');
        }
    }
    
    // Function to load resume data
    async function loadResumeData() {
        // First, try to get data from localStorage
        let resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}');
        
        // If not in localStorage, try to get from backend
        if (Object.keys(resumeData).length === 0) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    console.log('Fetching resume data from API...');
                    const response = await fetch(`${API_BASE_URL}/api/interns/resume`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    console.log('Resume API response status:', response.status);
                    
                    if (response.ok) {
                        const result = await response.json();
                        console.log('Resume API response:', result);
                        if (result.success && result.data) {
                            resumeData = result.data;
                            // Save to localStorage for faster access next time
                            localStorage.setItem('resumeData', JSON.stringify(resumeData));
                            
                            // Also update the resumeForProfile data for consistency
                            updateResumeForProfile(resumeData);
                        }
                    } else {
                        console.error('Error fetching resume:', response.status);
                        showMessage(`Could not load resume data (Status: ${response.status})`, 'error');
                    }
                } catch (error) {
                    console.error('Error loading resume data:', error);
                    showMessage(`Error: ${error.message}`, 'error');
                }
            }
        }
        
        // Fill form with data if we have it
        if (resumeData && Object.keys(resumeData).length > 0) {
            console.log('Filling form with resume data:', resumeData);
            
            // Fill basic information
            if (resumeData.basic) {
                firstNameInput.value = resumeData.basic.firstName || '';
                middleNameInput.value = resumeData.basic.middleName || '';
                lastNameInput.value = resumeData.basic.lastName || '';
                suffixInput.value = resumeData.basic.suffix || '';
                birthdayInput.value = resumeData.basic.birthday || '';
                ageInput.value = resumeData.basic.age || '';
                mobileInput.value = resumeData.basic.mobile || '';
                emailInput.value = resumeData.basic.email || '';
                
                if (resumeData.basic.address) {
                    streetInput.value = resumeData.basic.address.street || '';
                    barangayInput.value = resumeData.basic.address.barangay || '';
                    cityInput.value = resumeData.basic.address.city || '';
                    countryInput.value = resumeData.basic.address.country || '';
                }
            }
            
            // Fill objectives
            objectivesInput.value = resumeData.objectives || '';
            
            // Fill education information
            if (resumeData.education && resumeData.education.length > 0) {
                // Clear existing entries
                document.querySelector('.education-entries').innerHTML = '';
                
                // Add new entries
                resumeData.education.forEach((edu, index) => {
                    const newEntry = document.createElement('div');
                    newEntry.className = 'education-entry';
                    
                    newEntry.innerHTML = `
                        <div class="education-number">${index + 1}</div>
                        <div class="form-group">
                            <input type="text" name="school" value="${edu.school || ''}">
                        </div>
                        <div class="form-group">
                            <input type="text" name="year" value="${edu.year || ''}">
                        </div>
                        <div class="form-group" style="flex: 0.5;">
                            <input type="text" name="date" value="${edu.date || ''}">
                        </div>
                        <button class="delete-btn" onclick="deleteEducationEntry(this)">×</button>
                    `;
                    
                    document.querySelector('.education-entries').appendChild(newEntry);
                });
            }
            
            // Fill work experience information
            if (resumeData.work && resumeData.work.length > 0) {
                // Clear existing entries
                document.querySelector('.work-entries').innerHTML = '';
                
                // Add new entries
                resumeData.work.forEach((work, index) => {
                    const newEntry = document.createElement('div');
                    newEntry.className = 'work-entry';
                    
                    newEntry.innerHTML = `
                        <div class="work-number">${index + 1}</div>
                        <div class="form-group">
                            <input type="text" name="position" value="${work.position || ''}">
                        </div>
                        <div class="form-group">
                            <input type="text" name="company" value="${work.company || ''}">
                        </div>
                        <div class="form-group" style="flex: 0.5;">
                            <input type="text" name="duration" value="${work.duration || ''}">
                        </div>
                        <button class="delete-btn" onclick="deleteWorkEntry(this)">×</button>
                    `;
                    
                    document.querySelector('.work-entries').appendChild(newEntry);
                });
            }
            
            // Fill skills
            if (resumeData.skills && resumeData.skills.length > 0) {
                skillsInput.value = resumeData.skills.join(', ');
            }
            
            // Set profile image if available
            if (resumeData.imageData) {
                try {
                    // Attempt to compress the image on load as well
                    if (resumeData.imageData.startsWith('data:image')) {
                        const tempImg = new Image();
                        tempImg.onload = function() {
                            // Create canvas for resizing
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 400;
                            const MAX_HEIGHT = 400;
                            
                            let width = tempImg.width;
                            let height = tempImg.height;
                            
                            // Calculate new dimensions
                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                }
                            }
                            
                            canvas.width = width;
                            canvas.height = height;
                            
                            // Draw and compress
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(tempImg, 0, 0, width, height);
                            
                            // Use the compressed version
                            previewImage.src = canvas.toDataURL('image/jpeg', 0.7);
                            previewImage.style.display = 'block';
                            placeholderText.style.display = 'none';
                        };
                        tempImg.src = resumeData.imageData;
                    } else {
                        // Fallback to original image if not a data URL
                        previewImage.src = resumeData.imageData;
                        previewImage.style.display = 'block';
                        placeholderText.style.display = 'none';
                    }
                } catch (e) {
                    console.error('Error processing image on load:', e);
                    previewImage.src = resumeData.imageData;
                    previewImage.style.display = 'block';
                    placeholderText.style.display = 'none';
                }
            }
        }
        
        // If we don't have resume data but have user data, prefill with user profile data
        else if (userData && Object.keys(userData).length > 0) {
            firstNameInput.value = userData.first_name || '';
            middleNameInput.value = userData.middle_name || '';
            lastNameInput.value = userData.last_name || '';
            emailInput.value = userData.email || '';
            mobileInput.value = userData.contact_number || '';
            
            if (userData.skills && Array.isArray(userData.skills)) {
                skillsInput.value = userData.skills.join(', ');
            }
        }
    }
    
    // Function to update resumeForProfile data from resumeData
    function updateResumeForProfile(resumeData) {
        if (!resumeData || !resumeData.basic) return;
        
        const resumeForProfile = {
            fullName: `${resumeData.basic.firstName || ''} ${resumeData.basic.middleName ? resumeData.basic.middleName + ' ' : ''}${resumeData.basic.lastName || ''}${resumeData.basic.suffix ? ' ' + resumeData.basic.suffix : ''}`,
            contactInfo: `${resumeData.basic.mobile || ''} | ${resumeData.basic.email || ''}`,
            address: resumeData.basic.address ? 
                `${resumeData.basic.address.street || ''}, ${resumeData.basic.address.barangay || ''}, ${resumeData.basic.address.city || ''}, ${resumeData.basic.address.country || ''}` : '',
            age: resumeData.basic.age || '',
            birthday: resumeData.basic.birthday || '',
            objectives: resumeData.objectives || resumeData.basic.objectives || '',
            skills: resumeData.skills || [],
            firstName: resumeData.basic.firstName || '',
            middleName: resumeData.basic.middleName || '',
            lastName: resumeData.basic.lastName || '',
            suffix: resumeData.basic.suffix || ''
        };
        
        // Format education entries
        if (resumeData.education && resumeData.education.length > 0) {
            resumeForProfile.education = resumeData.education.map(edu => 
                `${edu.school || ''}<br>${edu.year || ''}${edu.date ? ' - ' + edu.date : ''}`
            ).join('<br><br>');
        }
        
        // Format work experience entries
        if (resumeData.work && resumeData.work.length > 0) {
            resumeForProfile.work = resumeData.work.map(work => 
                `${work.position || ''}<br>${work.company || ''}${work.duration ? ' | ' + work.duration : ''}`
            ).join('<br><br>');
        }
        
        // Log the profile data we're about to save
        console.log('Saving resume profile data with objectives:', resumeForProfile.objectives);
        
        // Save updated profile to localStorage
        localStorage.setItem('resumeForProfile', JSON.stringify(resumeForProfile));
    }
    
    // Function to show messages to the user
    function showMessage(message, type = 'info') {
        console.log(`${type.toUpperCase()} message:`, message);
        
        // Style status message element
        if (!statusMessage.classList.contains('styled')) {
            statusMessage.classList.add('styled');
            const style = document.createElement('style');
            style.textContent = `
                .status-message {
                    margin: 15px 0;
                    padding: 10px;
                    border-radius: 4px;
                    text-align: center;
                    display: none;
                }
                .status-message.success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                    display: block;
                }
                .status-message.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                    display: block;
                }
                .status-message.info {
                    background-color: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                    display: block;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Set the message content and type
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        
        // Make it disappear after 5 seconds
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = 'status-message';
        }, 5000);
    }
    
    // Add CSS for work experience entries
    const style = document.createElement('style');
    style.textContent = `
        .work-entry {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
        }
        .work-number {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            background-color: #4a7ebb;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 10px;
        }
    `;
    document.head.appendChild(style);
}); 