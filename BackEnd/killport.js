/**
 * Script to kill any processes using port 5004
 * Run this before starting the server if you get EADDRINUSE errors
 */

const { exec } = require('child_process');

const PORT = 5004;

console.log(`Attempting to find and kill processes using port ${PORT}...`);

// Windows command to find the PID using the port
const findCommand = `netstat -ano | findstr :${PORT}`;

exec(findCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error finding process: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  
  if (!stdout.trim()) {
    console.log(`No process found using port ${PORT}`);
    return;
  }
  
  console.log('Found processes:');
  console.log(stdout);
  
  // Extract PID from the output
  const lines = stdout.trim().split('\n');
  const pids = new Set();
  
  for (const line of lines) {
    const match = line.match(/\s+(\d+)$/);
    if (match && match[1]) {
      pids.add(match[1]);
    }
  }
  
  if (pids.size === 0) {
    console.log('Could not extract PIDs from netstat output');
    return;
  }
  
  console.log(`Found PIDs: ${Array.from(pids).join(', ')}`);
  
  // Kill each process
  for (const pid of pids) {
    console.log(`Attempting to kill process with PID ${pid}...`);
    
    exec(`taskkill /F /PID ${pid}`, (killError, killStdout, killStderr) => {
      if (killError) {
        console.error(`Error killing process: ${killError.message}`);
        return;
      }
      
      if (killStderr) {
        console.error(`Kill error: ${killStderr}`);
        return;
      }
      
      console.log(`Process killed: ${killStdout.trim()}`);
    });
  }
}); 