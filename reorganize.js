const fs = require('fs');
const path = require('path');

// Define the new directory structure
const directories = [
  'frontend/public',
  'frontend/src/components',
  'frontend/src/pages/admin',
  'frontend/src/pages/student', 
  'frontend/src/pages/employer',
  'frontend/src/assets/css',
  'frontend/src/assets/js',
  'frontend/src/assets/images',
  'frontend/src/utils',
  'frontend/src/services',
  'backend/src/routes',
  'backend/src/controllers',
  'backend/src/models',
  'backend/src/middleware',
  'backend/src/config',
  'backend/src/utils',
  'backend/uploads',
  'backend/scripts',
];

// Create directories
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory already exists: ${dir}`);
  }
});

console.log('Directory structure reorganization complete.'); 