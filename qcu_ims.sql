-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 06, 2025 at 05:51 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `qcu_ims`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_tbl`
--

CREATE TABLE `admin_tbl` (
  `admin_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact_number` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_tracking_tbl`
--

CREATE TABLE `attendance_tracking_tbl` (
  `attendance_id` int(11) NOT NULL,
  `intern_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `semester` enum('1st Semester','2nd Semester') DEFAULT NULL,
  `time_in` timestamp NULL DEFAULT NULL,
  `time_out` timestamp NULL DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies_tbl`
--

CREATE TABLE `companies_tbl` (
  `company_id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `industry_sector` varchar(255) NOT NULL,
  `contact_person_name` varchar(255) NOT NULL,
  `contact_person_number` int(11) NOT NULL,
  `contact_person_email` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `company_description` text NOT NULL,
  `available_intern_position` varchar(255) NOT NULL,
  `skills_qualifications` varchar(255) NOT NULL,
  `intern_duration` int(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_accomplishment_tbl`
--

CREATE TABLE `daily_accomplishment_tbl` (
  `accomplishment_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `task_completed` varchar(255) NOT NULL,
  `challenges_faced` varchar(255) NOT NULL,
  `skills_applied` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employers_tbl`
--

CREATE TABLE `employers_tbl` (
  `employer_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contact_number` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faculties_tbl`
--

CREATE TABLE `faculties_tbl` (
  `faculty_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) NOT NULL,
  `dept` enum('CCS','COE','CEE','CBA') NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact_number` int(11) NOT NULL,
  `date_registered` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `internship_placements_tbl`
--

CREATE TABLE `internship_placements_tbl` (
  `placement_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `department` varchar(255) NOT NULL,
  `supervisor_name` varchar(255) NOT NULL,
  `supervisor_contact_number` int(11) NOT NULL,
  `supervisor_email` varchar(255) NOT NULL,
  `placement_status` enum('Approved','For Review','Rejected') NOT NULL,
  `placement_remarks` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `internship_requirements_tbl`
--

CREATE TABLE `internship_requirements_tbl` (
  `requirement_id` int(11) NOT NULL,
  `requirement_name` varchar(255) NOT NULL,
  `requirement_description` text NOT NULL,
  `due_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interns_tbl`
--

CREATE TABLE `interns_tbl` (
  `intern_id` int(11) NOT NULL,
  `student_id` int(6) NOT NULL,
  `user_id` int(11) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `contact_number` int(11) NOT NULL,
  `section` varchar(10) NOT NULL,
  `dept` enum('CCS','COE','CEE','CBA') NOT NULL,
  `skills_qualifications` varchar(255) NOT NULL,
  `preferred_intern_fields` varchar(255) NOT NULL,
  `rsm_cv` blob NOT NULL,
  `date_registered` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('Available','Ongoing','Completed') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `intern_requirements_submission_tbl`
--

CREATE TABLE `intern_requirements_submission_tbl` (
  `submission_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `requirement_id` int(11) NOT NULL,
  `submission_date` date NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `submission_status` enum('Submitted','Reviewed','Approved') NOT NULL,
  `submission_remarks` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `performance_evaluation_tbl`
--

CREATE TABLE `performance_evaluation_tbl` (
  `eval_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `eval_date` date NOT NULL,
  `eval_criteria` varchar(255) NOT NULL,
  `rating_score` int(3) NOT NULL,
  `remarks` varchar(255) NOT NULL,
  `evaluated_on` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports_tbl`
--

CREATE TABLE `reports_tbl` (
  `report_id` int(11) NOT NULL,
  `intern_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `report_type` varchar(45) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `generated_report` blob DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users_tbl`
--

CREATE TABLE `users_tbl` (
  `user_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `user_role` enum('Intern','Employer','Faculty','Admin') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_tbl`
--
ALTER TABLE `admin_tbl`
  ADD PRIMARY KEY (`admin_id`),
  ADD KEY `fk_users_admin_idx` (`user_id`);

--
-- Indexes for table `attendance_tracking_tbl`
--
ALTER TABLE `attendance_tracking_tbl`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `fk_interns_attendance_tracking_idx` (`intern_id`);

--
-- Indexes for table `companies_tbl`
--
ALTER TABLE `companies_tbl`
  ADD PRIMARY KEY (`company_id`);

--
-- Indexes for table `daily_accomplishment_tbl`
--
ALTER TABLE `daily_accomplishment_tbl`
  ADD PRIMARY KEY (`accomplishment_id`),
  ADD KEY `fk_interns_daily_accomplishment_idx` (`intern_id`);

--
-- Indexes for table `employers_tbl`
--
ALTER TABLE `employers_tbl`
  ADD PRIMARY KEY (`employer_id`),
  ADD KEY `fk_users_employers_idx` (`user_id`),
  ADD KEY `fk_companies_employers_idx` (`company_id`);

--
-- Indexes for table `faculties_tbl`
--
ALTER TABLE `faculties_tbl`
  ADD PRIMARY KEY (`faculty_id`),
  ADD KEY `fk_faculties_users` (`user_id`);

--
-- Indexes for table `internship_placements_tbl`
--
ALTER TABLE `internship_placements_tbl`
  ADD PRIMARY KEY (`placement_id`),
  ADD KEY `fk_interns_ip_idx` (`intern_id`),
  ADD KEY `fk_companies_ip_idx` (`company_id`);

--
-- Indexes for table `internship_requirements_tbl`
--
ALTER TABLE `internship_requirements_tbl`
  ADD PRIMARY KEY (`requirement_id`);

--
-- Indexes for table `interns_tbl`
--
ALTER TABLE `interns_tbl`
  ADD PRIMARY KEY (`intern_id`),
  ADD KEY `fk_users_interns_idx` (`user_id`);

--
-- Indexes for table `intern_requirements_submission_tbl`
--
ALTER TABLE `intern_requirements_submission_tbl`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `fk_interns_irs_idx` (`intern_id`),
  ADD KEY `fk_requirements_irs_idx` (`requirement_id`);

--
-- Indexes for table `performance_evaluation_tbl`
--
ALTER TABLE `performance_evaluation_tbl`
  ADD PRIMARY KEY (`eval_id`),
  ADD KEY `fk_interns_perfeval_idx` (`intern_id`),
  ADD KEY `fk_companies_perfeval_idx` (`company_id`);

--
-- Indexes for table `reports_tbl`
--
ALTER TABLE `reports_tbl`
  ADD PRIMARY KEY (`report_id`);

--
-- Indexes for table `users_tbl`
--
ALTER TABLE `users_tbl`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_tbl`
--
ALTER TABLE `admin_tbl`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_tracking_tbl`
--
ALTER TABLE `attendance_tracking_tbl`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies_tbl`
--
ALTER TABLE `companies_tbl`
  MODIFY `company_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `daily_accomplishment_tbl`
--
ALTER TABLE `daily_accomplishment_tbl`
  MODIFY `accomplishment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employers_tbl`
--
ALTER TABLE `employers_tbl`
  MODIFY `employer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `faculties_tbl`
--
ALTER TABLE `faculties_tbl`
  MODIFY `faculty_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `internship_placements_tbl`
--
ALTER TABLE `internship_placements_tbl`
  MODIFY `placement_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `internship_requirements_tbl`
--
ALTER TABLE `internship_requirements_tbl`
  MODIFY `requirement_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `interns_tbl`
--
ALTER TABLE `interns_tbl`
  MODIFY `intern_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `intern_requirements_submission_tbl`
--
ALTER TABLE `intern_requirements_submission_tbl`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `performance_evaluation_tbl`
--
ALTER TABLE `performance_evaluation_tbl`
  MODIFY `eval_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reports_tbl`
--
ALTER TABLE `reports_tbl`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users_tbl`
--
ALTER TABLE `users_tbl`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_tbl`
--
ALTER TABLE `admin_tbl`
  ADD CONSTRAINT `fk_users_admin` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `attendance_tracking_tbl`
--
ALTER TABLE `attendance_tracking_tbl`
  ADD CONSTRAINT `fk_interns_attendance_tracking` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`intern_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `daily_accomplishment_tbl`
--
ALTER TABLE `daily_accomplishment_tbl`
  ADD CONSTRAINT `fk_interns_daily_accomplishment` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`intern_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `employers_tbl`
--
ALTER TABLE `employers_tbl`
  ADD CONSTRAINT `fk_companies_employers` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_employers` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `faculties_tbl`
--
ALTER TABLE `faculties_tbl`
  ADD CONSTRAINT `fk_faculties_users` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `internship_placements_tbl`
--
ALTER TABLE `internship_placements_tbl`
  ADD CONSTRAINT `fk_companies_ip` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_interns_ip` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`intern_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `interns_tbl`
--
ALTER TABLE `interns_tbl`
  ADD CONSTRAINT `fk_users_interns` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `intern_requirements_submission_tbl`
--
ALTER TABLE `intern_requirements_submission_tbl`
  ADD CONSTRAINT `fk_interns_irs` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`intern_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_requirements_irs` FOREIGN KEY (`requirement_id`) REFERENCES `internship_requirements_tbl` (`requirement_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `performance_evaluation_tbl`
--
ALTER TABLE `performance_evaluation_tbl`
  ADD CONSTRAINT `fk_companies_perfeval` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_interns_perfeval` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`intern_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
