const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');  // Adjusted path

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// POST /api/resume
router.post('/resume', upload.single('image'), async (req, res) => {
  const data = req.body;
  const image = req.file;

  // Parse education entries
  const education = [];
  Object.keys(data).forEach((key) => {
    const match = key.match(/^education\[(\d+)]\[(\w+)]$/);
    if (match) {
      const index = parseInt(match[1]);
      const field = match[2];

      if (!education[index]) education[index] = {};
      education[index][field] = data[key];
    }
  });

  // Log parsed education to verify it's correct
  console.log('Parsed education entries:', education);  // <-- Debugging step

  const resume = {
    first_name: data.first_name,
    last_name: data.last_name,
    suffix: data.suffix,
    birthday: data.birthday,
    age: data.age,
    mobile: data.mobile,
    email: data.email,
    address: {
      house: data.house,
      barangay: data.barangay,
      city: data.city,
      country: data.country,
    },
    skills: data.skills,
    education,
    imagePath: image ? image.path : null,
  };

  try {
    // Insert resume data into resumes_tbl
    const [resumeResult] = await db.query(`
      INSERT INTO resumes_tbl (
        first_name, last_name, suffix, birthday, age, mobile, email,
        house, barangay, city, country, skills, image_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      resume.first_name,
      resume.last_name,
      resume.suffix,
      resume.birthday,
      resume.age,
      resume.mobile,
      resume.email,
      resume.address.house,
      resume.address.barangay,
      resume.address.city,
      resume.address.country,
      resume.skills,
      resume.imagePath
    ]);

    const resumeId = resumeResult.insertId;

    // Log resumeId to verify if it's correctly inserted
    console.log('Inserted Resume ID:', resumeId);

    // Insert education into education_tbl
    for (const edu of education) {
      if (edu.school && edu.year && edu.date) {
        // Log each education entry to verify
        console.log('Inserting Education Entry:', edu);

        // Assuming 'year' = start_year and 'date' = end_year
        await db.query(`
          INSERT INTO education_tbl (resume_id, school_name, start_year, end_year, degree)
          VALUES (?, ?, ?, ?, ?)
        `, [
          resumeId,
          edu.school,
          edu.year, // assuming start_year
          edu.date, // assuming end_year
          edu.degree || null
        ]);
      } else {
        // If any education entry is missing essential data, skip it
        console.log('Skipping Education Entry (missing data):', edu);
      }
    }

    res.json({ message: '✅ Resume saved to database!', id: resumeId });
  } catch (err) {
    console.error('❌ Error saving resume:', err);
    res.status(500).json({ error: '❌ Failed to save resume. Please try again later.' });
  }
});

module.exports = router;
