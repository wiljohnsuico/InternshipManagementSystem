# Project Structure Documentation

This document outlines the organization of the Internship Management System project. The project follows a clear separation between frontend and backend components.

## Directory Structure

```
InternshipManagementSystem/
├── frontend/                 # Frontend application
│   ├── public/               # Static public files
│   └── src/                  # Source code
│       ├── components/       # Reusable UI components
│       ├── pages/            # Page-specific components
│       │   ├── admin/        # Admin-specific pages
│       │   ├── student/      # Student-specific pages
│       │   └── employer/     # Employer-specific pages
│       ├── assets/           # Static assets
│       │   ├── css/          # CSS stylesheets
│       │   ├── js/           # JavaScript utilities
│       │   └── images/       # Images and icons
│       ├── utils/            # Utility functions
│       └── services/         # API service calls
│
├── backend/                  # Backend application
│   ├── src/                  # Source code
│   │   ├── routes/           # API routes definitions
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Database models
│   │   ├── middleware/       # Custom middleware
│   │   ├── config/           # Configuration files
│   │   └── utils/            # Utility functions
│   ├── uploads/              # File upload storage
│   └── scripts/              # Utility scripts
│
├── package.json              # Project dependencies
└── README.md                 # Project documentation
```

## Purpose of Directories

### Frontend

- **public**: Contains static files like HTML, favicon, etc.
- **src/components**: Reusable UI components used across multiple pages
- **src/pages**: Page-specific components organized by user role
- **src/assets**: Static resources (CSS, JavaScript, images)
- **src/utils**: Helper functions, formatters, validators
- **src/services**: API client code to interact with backend

### Backend

- **src/routes**: API route definitions
- **src/controllers**: Request handlers for each route
- **src/models**: Database models and schema definitions
- **src/middleware**: Custom middleware for authentication, validation, etc.
- **src/config**: Configuration for database, server, etc.
- **src/utils**: Utility functions for backend operations
- **uploads**: Storage location for uploaded files
- **scripts**: Database scripts, migrations, seeds, etc.

## Migration Plan

To migrate from the old structure to the new one:

1. Move student HTML/CSS/JS files to frontend/src/pages/student
2. Move admin HTML/CSS/JS files to frontend/src/pages/admin
3. Move employer HTML/CSS/JS files to frontend/src/pages/employer
4. Extract common components to frontend/src/components
5. Organize CSS files in frontend/src/assets/css
6. Organize JS utility files in frontend/src/assets/js
7. Move images to frontend/src/assets/images
8. Ensure backend code is properly organized in the backend directory

Note: This structure follows modern web application architecture practices and improves maintainability and scalability. 