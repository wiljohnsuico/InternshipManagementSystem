const fs = require('fs');
const path = require('path');

// File migration map: source path => target path
const migrationMap = [
  // Student files
  { from: 'student/mplhome.html', to: 'frontend/src/pages/student/home.html' },
  { from: 'student/mpl-login.html', to: 'frontend/src/pages/student/login.html' },
  { from: 'student/mplprofile.html', to: 'frontend/src/pages/student/profile.html' },
  { from: 'student/application-tracking.html', to: 'frontend/src/pages/student/application-tracking.html' },
  { from: 'student/jobListings.html', to: 'frontend/src/pages/student/job-listings.html' },
  { from: 'student/myApplications.html', to: 'frontend/src/pages/student/my-applications.html' },
  { from: 'student/internship-report.html', to: 'frontend/src/pages/student/internship-report.html' },
  { from: 'student/resume.html', to: 'frontend/src/pages/student/resume.html' },
  
  // CSS files
  { from: 'student/styles/*.css', to: 'frontend/src/assets/css/' },
  { from: 'student/css/*.css', to: 'frontend/src/assets/css/' },
  { from: 'admin/*.css', to: 'frontend/src/assets/css/' },
  { from: 'viewemployer/styles.css', to: 'frontend/src/assets/css/employer-view.css' },
  
  // JavaScript files
  { from: 'student/scripts/*.js', to: 'frontend/src/assets/js/' },
  { from: 'admin/*.js', to: 'frontend/src/pages/admin/' },
  { from: 'admin/admin-login.html', to: 'frontend/src/pages/admin/login.html' },
  { from: 'viewemployer/script.js', to: 'frontend/src/assets/js/employer-view.js' },
  { from: 'viewemployer/view-employer.html', to: 'frontend/src/pages/employer/view.html' },
  
  // Image files
  { from: 'student/imgs/*', to: 'frontend/src/assets/images/' },
  { from: 'student/resources/*', to: 'frontend/src/assets/images/' },
  { from: 'admin/img/*', to: 'frontend/src/assets/images/' },
];

// Function to copy a file
function copyFile(source, destination) {
  try {
    // Make sure the destination directory exists
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy file
    fs.copyFileSync(source, destination);
    console.log(`Copied: ${source} -> ${destination}`);
    return true;
  } catch (error) {
    console.error(`Error copying ${source} to ${destination}:`, error.message);
    return false;
  }
}

// Function to handle glob-like patterns
function copyFilesWithPattern(sourcePattern, destDir) {
  const sourceDir = path.dirname(sourcePattern);
  const pattern = path.basename(sourcePattern);
  
  // Simple glob matching for * wildcard
  if (pattern.includes('*')) {
    try {
      const files = fs.readdirSync(sourceDir);
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      let copied = 0;
      
      files.forEach(file => {
        if (regex.test(file)) {
          const sourcePath = path.join(sourceDir, file);
          const destPath = path.join(destDir, file);
          
          if (fs.statSync(sourcePath).isFile()) {
            if (copyFile(sourcePath, destPath)) {
              copied++;
            }
          }
        }
      });
      
      if (copied > 0) {
        console.log(`Copied ${copied} files from ${sourceDir} matching ${pattern}`);
      } else {
        console.log(`No files found in ${sourceDir} matching ${pattern}`);
      }
    } catch (error) {
      console.error(`Error reading directory ${sourceDir}:`, error.message);
    }
  } else {
    // Direct file copy
    const sourcePath = path.join(sourceDir, pattern);
    const destPath = path.join(destDir, pattern);
    copyFile(sourcePath, destPath);
  }
}

// Process the migration map
migrationMap.forEach(mapping => {
  const sourcePath = path.join(__dirname, mapping.from);
  const destPath = path.join(__dirname, mapping.to);
  
  if (sourcePath.includes('*')) {
    copyFilesWithPattern(sourcePath, path.dirname(destPath));
  } else {
    copyFile(sourcePath, destPath);
  }
});

console.log('File migration completed.');
console.log('Note: Original files remain untouched. This script only copies files to the new structure.'); 