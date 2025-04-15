const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the student directory
app.use(express.static(path.join(__dirname, 'student')));

// Handle all routes by sending the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'student', 'mpl-login.html'));
});

const PORT = 3500;
app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}`);
    console.log(`Access the login page at http://localhost:${PORT}/mpl-login.html`);
});
    