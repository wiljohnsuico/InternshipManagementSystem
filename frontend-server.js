const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the student directory
app.use('/student', express.static(path.join(__dirname, 'student')));

// Serve static files from the admin directory
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve static files from the ADMINitona directory
app.use('/ADMINitona', express.static(path.join(__dirname, 'ADMINitona')));

// Root path redirects to student login
app.use('/', (req, res, next) => {
    if (req.path === '/') {
        return res.redirect('/student/mpl-login.html');
    }
    next();
});

// All other routes that don't match a static file are handled by the student login
app.get('*', (req, res) => {
    if (!req.path.startsWith('/admin/') && !req.path.startsWith('/student/') && !req.path.startsWith('/ADMINitona/')) {
        res.sendFile(path.join(__dirname, 'student', 'mpl-login.html'));
    } else {
        res.status(404).send('File not found');
    }
});

const PORT = 3500;
app.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}`);
    console.log(`Access the student login at http://localhost:${PORT}/student/mpl-login.html`);
    console.log(`Access the admin login at http://localhost:${PORT}/admin/admin-login.html`);
    console.log(`Access the admin dashboard at http://localhost:${PORT}/ADMINitona/ADMIN/Intrn.html (after login)`);
});
    