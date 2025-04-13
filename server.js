const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the student directory
app.use(express.static(path.join(__dirname, 'student')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'student', 'mpl-login.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}`);
}); 