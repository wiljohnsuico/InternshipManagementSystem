# API Connector Integration

This document explains how the shared API connector is integrated across the Internship Management System (IMS).

## Overview

The IMS consists of three main interfaces:
1. Student/Intern interface
2. Employer interface 
3. Admin interface

To standardize API access and improve maintainability, we've implemented a shared API connector system that works across all three interfaces.

## Components

### 1. Shared API Connector (`shared-api-connector.js`)

This is the main connector that provides a unified interface for all API calls. Key features:

- Consistent error handling
- Automatic offline support with local storage
- Background synchronization of offline changes
- Standardized data structures
- Role-based filtering
- Mock data for offline development

### 2. API Connector Bridge (`api-connector-bridge.js`)

This bridge maintains backward compatibility with existing code by:

- Extending existing connectors with shared functionality
- Creating fallback connectors when needed
- Preserving original behavior while enhancing capabilities

### 3. Interface-Specific Connectors

- `STUDENT_CONNECTOR`: For student-specific API calls
- `EMPLOYER_CONNECTOR`: For employer-specific API calls 
- `ADMIN_CONNECTOR`: For admin-specific API calls

## Integration Methods

There are three ways to integrate the shared connector:

### Method 1: Include Component (Recommended)

Add this to your HTML files:

```html
<div id="shared-connectors-container"></div>
<script>
  fetch('/student/components/shared-connectors.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('shared-connectors-container').innerHTML = html;
    });
</script>
```

### Method 2: Direct Script Include

Add these script tags to your HTML files:

```html
<meta name="api-url" content="http://localhost:5004/api">
<script src="/student/scripts/shared-api-connector.js"></script>
<script src="/student/scripts/api-connector-bridge.js"></script>
```

### Method 3: Dynamic Loader

Include the appropriate loader script:

```html
<!-- For student pages -->
<script src="/student/include-api-connector.js"></script>

<!-- For employer pages -->
<script src="/student/employers/include-api-connector.js"></script>

<!-- For admin pages -->
<script src="/admin/include-api-connector.js"></script>
```

## Usage Examples

### Student Application

```javascript
// Get student applications
const myApplications = await STUDENT_CONNECTOR.getMyApplications();

// Apply for an internship
const result = await STUDENT_CONNECTOR.applyForInternship(internshipId, {
  coverLetter: 'My cover letter...',
  resumeUrl: 'path/to/resume.pdf'
});
```

### Employer Dashboard

```javascript
// Get applications for this employer
const applications = await APPLICATIONS_CONNECTOR.loadApplications();

// Update application status
await SHARED_API_CONNECTOR.updateApplicationStatus(applicationId, 'Accepted');
```

### Admin Interface

```javascript
// Get all applications (admin view)
const allApplications = await ADMIN_CONNECTOR.getApplications();

// Update status
await ADMIN_CONNECTOR.updateApplicationStatus(applicationId, 'Rejected');
```

## API Endpoints

The shared connector handles these key endpoints:

- `/applications` - Get all applications
- `/applications/{id}` - Get specific application
- `/applications/update-status` - Update application status
- `/applications/employer` - Get employer-specific applications
- `/applications/student` - Get student-specific applications
- `/health` - Check API connectivity

## Offline Support

The system automatically:
1. Detects when the API is unavailable
2. Stores changes locally
3. Syncs changes when connection is restored
4. Provides visual indicators for offline mode

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify API URL is correct in the meta tag
3. Ensure scripts are loaded in the correct order
4. Check for network connectivity issues

## Future Improvements

- Add more comprehensive error handling
- Implement retry mechanisms for failed requests
- Add better offline indicators
- Expand shared functionality to cover more API endpoints 