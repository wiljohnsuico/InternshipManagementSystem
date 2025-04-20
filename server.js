const express = require('express');
const cors = require('cors');   
const path = require('path');
const app = express();
const facultiesRoutes = require('./routes/faculties.routes'); // Add this line for faculties routes
const apiBaseUrl = "http://127.0.0.1:5004";  // Backend server URL

// Serve static files from the student directory
app.use(express.static(path.join(__dirname, 'student')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'student', 'mpl-login.html'));
});

// Use faculties routes
app.use('/api', facultiesRoutes); // Add this line to use the faculties routes

app.use(cors()); // Allow all origins (good for development)
  
const PORT = 3500;
app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}`);
});