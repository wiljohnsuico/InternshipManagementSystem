// Simple startup script 
const { spawn } = require('child_process'); 
const path = require('path'); 
 
// Set environment variables 
process.env.NODE_ENV = 'development'; 
process.env.USE_MOCK_DB = 'false'; 
 
// Start the app 
require('./src/app.js'); 
