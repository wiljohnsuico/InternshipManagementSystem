const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5004;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directories
app.use('/assets', express.static(path.join(__dirname, 'frontend/src/assets')));
app.use('/js', express.static(path.join(__dirname, 'frontend/src/assets/js')));
app.use('/css', express.static(path.join(__dirname, 'frontend/src/assets/css')));
app.use('/images', express.static(path.join(__dirname, 'frontend/src/assets/images')));
app.use('/components', express.static(path.join(__dirname, 'frontend/src/components')));

// Routes for different user types
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/student/login.html'));
});

// Student routes
app.get('/student/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/student/login.html'));
});

app.get('/student/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/student/home.html'));
});

app.get('/student/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/student/profile.html'));
});

app.get('/student/job-listings', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/student/job-listings.html'));
});

app.get('/student/my-applications', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/student/my-applications.html'));
});

app.get('/student/application-tracking', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/student/application-tracking.html'));
});

app.get('/student/internship-report', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/student/internship-report.html'));
});

app.get('/student/resume', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/student/resume.html'));
});

// Admin routes
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/admin/login.html'));
});

// Employer routes
app.get('/employer/view', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/src/pages/employer/view.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
}); 