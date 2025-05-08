/**
 * Utility for ensuring required directories exist with proper permissions
 */

const fs = require('fs');
const path = require('path');

// Base directories that should exist
const REQUIRED_DIRS = [
    // Logs directory
    { path: path.join(__dirname, '../../logs'), mode: 0o755 },
    
    // Uploads directory
    { path: path.join(__dirname, '../../uploads'), mode: 0o755 },
    
    // Temporary uploads directory
    { path: path.join(__dirname, '../../temp_uploads'), mode: 0o755 },
    
    // Resume uploads directory
    { path: path.join(__dirname, '../../uploads/resumes'), mode: 0o755 },
    
    // Profile pictures directory
    { path: path.join(__dirname, '../../uploads/profile_pics'), mode: 0o755 },
    
    // Company logos directory
    { path: path.join(__dirname, '../../uploads/logos'), mode: 0o755 },
    
    // Attachments directory
    { path: path.join(__dirname, '../../uploads/attachments'), mode: 0o755 },
    
    // Temp directory
    { path: path.join(__dirname, '../../temp'), mode: 0o755 }
];

/**
 * Check if directory exists and create it if not
 * @param {string} dirPath Directory path to check
 * @param {number} mode Directory permissions mode
 * @returns {boolean} true if directory exists or was created successfully
 */
function ensureDirectoryExists(dirPath, mode = 0o755) {
    try {
        // Check if directory exists
        if (fs.existsSync(dirPath)) {
            // Check if it's actually a directory
            const stats = fs.statSync(dirPath);
            if (!stats.isDirectory()) {
                console.error(`Path exists but is not a directory: ${dirPath}`);
                return false;
            }
            
            return true;
        }
        
        // Create directory with specified permissions
        fs.mkdirSync(dirPath, { recursive: true, mode });
        console.log(`Created directory: ${dirPath}`);
        return true;
    } catch (error) {
        console.error(`Failed to create directory ${dirPath}:`, error);
        return false;
    }
}

/**
 * Check if directory is writable
 * @param {string} dirPath Directory path to check
 * @returns {boolean} true if directory is writable
 */
function isDirectoryWritable(dirPath) {
    try {
        // Try to write a test file
        const testFile = path.join(dirPath, '.write-test');
        fs.writeFileSync(testFile, 'test');
        
        // Clean up test file
        fs.unlinkSync(testFile);
        return true;
    } catch (error) {
        console.error(`Directory is not writable: ${dirPath}`);
        return false;
    }
}

/**
 * Ensure all required directories exist and are writable
 * @returns {boolean} true if all directories exist and are writable
 */
function ensureAllDirectories() {
    let success = true;
    
    for (const dir of REQUIRED_DIRS) {
        const dirExists = ensureDirectoryExists(dir.path, dir.mode);
        
        if (!dirExists) {
            success = false;
            continue;
        }
        
        // Check if directory is writable
        const isWritable = isDirectoryWritable(dir.path);
        if (!isWritable) {
            success = false;
        }
    }
    
    return success;
}

module.exports = {
    ensureDirectoryExists,
    isDirectoryWritable,
    ensureAllDirectories,
    REQUIRED_DIRS
}; 