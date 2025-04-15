const fs = require('fs');
const path = require('path');
const db = require('./database');

async function setupDatabase() {
    try {
        console.log('Setting up database...');
        
        // Read the SQL file
        const sql = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8');
        
        // Split into individual statements and filter out empty ones
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        // Execute each statement
        for (let statement of statements) {
            try {
                console.log('Executing statement:', statement);
                await db.query(statement);
                console.log('Statement executed successfully');
            } catch (error) {
                console.error('Error executing statement:', statement);
                console.error('Error details:', error);
                throw error;
            }
        }
        
        console.log('Database setup completed successfully');
        
        // Create a test user if none exists
        const [existingUsers] = await db.query('SELECT COUNT(*) as count FROM users_tbl');
        if (existingUsers[0].count === 0) {
            console.log('Creating test user...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 10);
            
            await db.query(
                `INSERT INTO users_tbl (first_name, last_name, email, password, role) 
                 VALUES (?, ?, ?, ?, ?)`,
                ['Test', 'User', 'test@example.com', hashedPassword, 'Intern']
            );
            console.log('Test user created successfully');
            
            // Get the user_id of the created user
            const [newUser] = await db.query(
                'SELECT user_id FROM users_tbl WHERE email = ?',
                ['test@example.com']
            );
            
            // Create corresponding intern record
            if (newUser && newUser[0]) {
                await db.query(
                    `INSERT INTO interns_tbl (user_id) VALUES (?)`,
                    [newUser[0].user_id]
                );
                console.log('Intern record created successfully');
            }
        }
        
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    } finally {
        // Always close the database connection
        await db.end();
    }
}

// Run setup
setupDatabase().then(() => {
    console.log('Setup complete');
    process.exit(0);
}); 