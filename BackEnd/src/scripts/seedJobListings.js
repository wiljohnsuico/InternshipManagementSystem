const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedJobListings() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'qcu_ims'
    });

    try {
        console.log('Connected to database, starting to seed job listings...');

        // First, let's ensure we have at least a couple of companies
        const companies = [
            { name: 'Google', sector: 'Technology', description: 'Leading search engine and technology company' },
            { name: 'Facebook', sector: 'Social Media', description: 'Popular social media platform' },
            { name: 'Adobe', sector: 'Software', description: 'Creative software development company' },
            { name: 'Deloitte', sector: 'Consulting', description: 'Global consulting and accounting firm' },
            { name: 'BuzzFeed', sector: 'Media', description: 'Digital media and news company' },
            { name: 'Microsoft', sector: 'Technology', description: 'Leading technology company' },
            { name: 'Amazon', sector: 'E-commerce', description: 'Global e-commerce and cloud computing company' },
            { name: 'Netflix', sector: 'Entertainment', description: 'Streaming media provider' },
            { name: 'Ubisoft', sector: 'Gaming', description: 'Video game development company' },
            { name: 'IBM', sector: 'Technology', description: 'Global technology and consulting company' }
        ];

        // Insert companies if they don't exist already
        for (const company of companies) {
            const [existing] = await connection.query(
                'SELECT * FROM companies_tbl WHERE company_name = ?',
                [company.name]
            );

            if (existing.length === 0) {
                await connection.query(
                    'INSERT INTO companies_tbl (company_name, industry_sector, company_description) VALUES (?, ?, ?)',
                    [company.name, company.sector, company.description]
                );
                console.log(`Created company: ${company.name}`);
            } else {
                console.log(`Company ${company.name} already exists, skipping...`);
            }
        }

        // Get all companies
        const [allCompanies] = await connection.query('SELECT * FROM companies_tbl');
        
        if (allCompanies.length === 0) {
            console.log('No companies found, cannot create job listings');
            return;
        }

        // Sample job listings
        const jobListings = [
            {
                company: 'Google',
                title: 'Software Engineer',
                location: 'Manila',
                skills: ['JavaScript', 'Python'],
                description: 'Join our engineering team to develop innovative solutions.',
                requirements: 'Knowledge of web technologies and programming languages.',
                is_paid: true,
                positions: 3,
                deadline: new Date(new Date().setDate(new Date().getDate() + 30))
            },
            {
                company: 'Facebook',
                title: 'Marketing Intern',
                location: 'Quezon City',
                skills: ['Marketing', 'SEO'],
                description: 'Help our marketing team create engaging campaigns.',
                requirements: 'Interest in digital marketing and social media.',
                is_paid: false,
                positions: 2,
                deadline: new Date(new Date().setDate(new Date().getDate() + 45))
            },
            {
                company: 'Adobe',
                title: 'Graphic Designer',
                location: 'Makati',
                skills: ['Photoshop', 'Illustrator'],
                description: 'Create visually stunning designs for our products.',
                requirements: 'Proficiency in Adobe Creative Suite.',
                is_paid: true,
                positions: 1,
                deadline: new Date(new Date().setDate(new Date().getDate() + 60))
            },
            {
                company: 'Deloitte',
                title: 'Tax Analyst',
                location: 'Makati',
                skills: ['Accounting', 'Tax'],
                description: 'Assist with tax compliance and planning.',
                requirements: 'Accounting knowledge and attention to detail.',
                is_paid: true,
                positions: 4,
                deadline: new Date(new Date().setDate(new Date().getDate() + 15))
            },
            {
                company: 'BuzzFeed',
                title: 'Content Writer',
                location: 'Pasig',
                skills: ['Writing', 'SEO'],
                description: 'Create engaging content for our website.',
                requirements: 'Strong writing skills and creativity.',
                is_paid: false,
                positions: 2,
                deadline: new Date(new Date().setDate(new Date().getDate() + 20))
            },
            {
                company: 'Microsoft',
                title: 'Web Developer',
                location: 'Taguig',
                skills: ['HTML', 'CSS', 'JavaScript'],
                description: 'Develop and maintain web applications.',
                requirements: 'Experience with front-end technologies.',
                is_paid: true,
                positions: 3,
                deadline: new Date(new Date().setDate(new Date().getDate() + 40))
            },
            {
                company: 'Amazon',
                title: 'Project Manager',
                location: 'Davao',
                skills: ['Agile', 'Scrum'],
                description: 'Lead projects from conception to completion.',
                requirements: 'Project management experience and leadership skills.',
                is_paid: true,
                positions: 1,
                deadline: new Date(new Date().setDate(new Date().getDate() + 25))
            },
            {
                company: 'Netflix',
                title: 'HR Intern',
                location: 'Makati',
                skills: ['Recruitment'],
                description: 'Support the HR team in recruitment and onboarding.',
                requirements: 'Interest in human resources and people management.',
                is_paid: false,
                positions: 2,
                deadline: new Date(new Date().setDate(new Date().getDate() + 30))
            },
            {
                company: 'Ubisoft',
                title: 'Game Developer',
                location: 'Cavite',
                skills: ['Unity', 'C#'],
                description: 'Contribute to the development of exciting games.',
                requirements: 'Knowledge of game development and programming.',
                is_paid: true,
                positions: 5,
                deadline: new Date(new Date().setDate(new Date().getDate() + 60))
            },
            {
                company: 'IBM',
                title: 'Operations Intern',
                location: 'Cebu',
                skills: ['Excel', 'Data Analysis'],
                description: 'Assist with operational processes and data analysis.',
                requirements: 'Analytical skills and attention to detail.',
                is_paid: false,
                positions: 3,
                deadline: new Date(new Date().setDate(new Date().getDate() + 15))
            }
        ];

        // Insert job listings
        let createdCount = 0;
        
        for (const job of jobListings) {
            // Find company ID
            const company = allCompanies.find(c => c.company_name === job.company);
            
            if (!company) {
                console.log(`Company ${job.company} not found, skipping job listing`);
                continue;
            }
            
            // Check if job listing already exists
            const [existing] = await connection.query(
                'SELECT * FROM job_listings WHERE job_title = ? AND company_id = ? AND location = ?',
                [job.title, company.company_id, job.location]
            );
            
            if (existing.length > 0) {
                console.log(`Job listing "${job.title}" at ${job.company} already exists, skipping...`);
                continue;
            }
            
            // Insert job listing
            await connection.query(
                `INSERT INTO job_listings 
                (company_id, job_title, location, skills, description, requirements, is_paid, positions, deadline, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
                [
                    company.company_id,
                    job.title,
                    job.location,
                    JSON.stringify(job.skills),
                    job.description,
                    job.requirements,
                    job.is_paid ? 1 : 0,
                    job.positions || 1,
                    job.deadline || null
                ]
            );
            
            createdCount++;
            console.log(`Created job listing: ${job.title} at ${job.company}`);
        }

        console.log(`Successfully created ${createdCount} job listings!`);
    } catch (error) {
        console.error('Error seeding job listings:', error);
    } finally {
        await connection.end();
        console.log('Database connection closed');
    }
}

// Run the seeding function
seedJobListings()
    .then(() => {
        console.log('Job listings seeding completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Job listings seeding failed:', error);
        process.exit(1);
    }); 