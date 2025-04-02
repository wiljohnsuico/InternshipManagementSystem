document.addEventListener('DOMContentLoaded', () => {
    const birthdayInput = document.getElementById('birthday-input');
    const ageInput = document.getElementById('age-input');
    const educationContainer = document.getElementById('education-container');
    const addEducationButton = document.getElementById('add-education');

    // Function to calculate age
    function calculateAge(birthday) {
        const today = new Date();
        const birthDate = new Date(birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        
        // Check if birthday hasn't occurred this year
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    // Event listener for birthday input
    birthdayInput.addEventListener('change', (e) => {
        const birthday = e.target.value;
        if (birthday) {
            const calculatedAge = calculateAge(birthday);
            ageInput.value = calculatedAge;
        }
    });

    // Add Education functionality
    addEducationButton.addEventListener('click', () => {
        const newEducationEntry = document.createElement('div');
        newEducationEntry.className = 'grid grid-3';
        newEducationEntry.innerHTML = `
            <input type="text" placeholder="School" class="form-input">
            <input type="text" placeholder="Year" class="form-input">
            <input type="date" class="form-input">
        `;
        educationContainer.appendChild(newEducationEntry);
    });
});