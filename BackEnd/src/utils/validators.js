const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password.length >= 8;
};

const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
};

const validateName = (name) => {
    return name.length >= 2 && /^[a-zA-Z\s-']+$/.test(name);
};

module.exports = {
    validateEmail,
    validatePassword,
    validatePhoneNumber,
    validateName
}; 