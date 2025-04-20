#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Collect admin information
console.log("=== Create QCU IMS Admin Account ===");

rl.question('Enter admin email (or press Enter for default admin@qcuims.com): ', (email) => {
  rl.question('Enter admin password (or press Enter for default admin123): ', (password) => {
    rl.question('Enter admin first name (or press Enter for default "System"): ', (firstName) => {
      rl.question('Enter admin last name (or press Enter for default "Administrator"): ', (lastName) => {
        console.log("\nCreating admin account...");
        
        // Format the parameters
        const formattedEmail = email || '';
        const formattedPassword = password || '';
        const formattedFirstName = firstName || '';
        const formattedLastName = lastName || '';
        
        // Run the create-admin.js script with the provided parameters
        const createAdmin = spawn('node', [
          'BackEnd/src/scripts/create-admin.js',
          formattedEmail,
          formattedPassword,
          formattedFirstName,
          formattedLastName
        ]);
        
        createAdmin.stdout.on('data', (data) => {
          console.log(data.toString());
        });
        
        createAdmin.stderr.on('data', (data) => {
          console.error(`Error: ${data}`);
        });
        
        createAdmin.on('close', (code) => {
          console.log(`\nProcess exited with code ${code}`);
          if (code === 0) {
            console.log("\n=== Admin Account Created Successfully ===");
            console.log("You can now log in using the provided credentials at");
            console.log("http://localhost:3500/admin/admin-login.html");
          } else {
            console.log("\n=== Failed to Create Admin Account ===");
            console.log("Please check the error messages above and try again.");
          }
          rl.close();
        });
      });
    });
  });
}); 