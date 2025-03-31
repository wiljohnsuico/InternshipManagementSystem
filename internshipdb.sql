-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 29, 2025 at 03:59 PM
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
-- Database: `internshipdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance_tracking_tbl`
--

CREATE TABLE `attendance_tracking_tbl` (
  `attendance_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `time_in` varchar(10) NOT NULL,
  `time_out` varchar(10) NOT NULL,
  `total_hours_work` int(12) NOT NULL,
  `remarks` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_accomplishments_tbl`
--

CREATE TABLE `daily_accomplishments_tbl` (
  `accomplishment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `task_completed` varchar(50) NOT NULL,
  `challenges_faced` varchar(100) NOT NULL,
  `skills_applied` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `intern_opportunities_tbl`
--

CREATE TABLE `intern_opportunities_tbl` (
  `intern_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `position_title` varchar(50) NOT NULL,
  `description` varchar(100) NOT NULL,
  `skills_qualification` varchar(100) NOT NULL,
  `start_date` varchar(50) NOT NULL,
  `end_date` varchar(50) NOT NULL,
  `location` varchar(20) NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `partner_comp_tbl`
--

CREATE TABLE `partner_comp_tbl` (
  `company_id` int(11) NOT NULL,
  `company_name` varchar(50) NOT NULL,
  `industry_sector` varchar(50) NOT NULL,
  `company_email` varchar(50) NOT NULL,
  `company_contact_number` int(11) NOT NULL,
  `address` varchar(100) NOT NULL,
  `available_intern_position` int(11) NOT NULL,
  `skills_qualifications` varchar(100) NOT NULL,
  `intern_duration` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `performance_evaluation_tbl`
--

CREATE TABLE `performance_evaluation_tbl` (
  `eval_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `eval_date` date NOT NULL,
  `eval_criteria` varchar(50) NOT NULL,
  `rating_score` int(10) NOT NULL,
  `comments` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports_tbl`
--

CREATE TABLE `reports_tbl` (
  `report_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `report_type` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `generated_reports` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `students_tbl`
--

CREATE TABLE `students_tbl` (
  `student_id` int(12) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `contact_number` int(11) NOT NULL,
  `academic_prog_dept` varchar(10) NOT NULL,
  `year_level` varchar(10) NOT NULL,
  `skills_qualifications` varchar(254) NOT NULL,
  `preferred_intern_fields` varchar(254) NOT NULL,
  `internship_status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance_tracking_tbl`
--
ALTER TABLE `attendance_tracking_tbl`
  ADD PRIMARY KEY (`attendance_id`);

--
-- Indexes for table `daily_accomplishments_tbl`
--
ALTER TABLE `daily_accomplishments_tbl`
  ADD PRIMARY KEY (`accomplishment_id`);

--
-- Indexes for table `intern_opportunities_tbl`
--
ALTER TABLE `intern_opportunities_tbl`
  ADD PRIMARY KEY (`intern_id`);

--
-- Indexes for table `partner_comp_tbl`
--
ALTER TABLE `partner_comp_tbl`
  ADD PRIMARY KEY (`company_id`);

--
-- Indexes for table `performance_evaluation_tbl`
--
ALTER TABLE `performance_evaluation_tbl`
  ADD PRIMARY KEY (`eval_id`);

--
-- Indexes for table `reports_tbl`
--
ALTER TABLE `reports_tbl`
  ADD PRIMARY KEY (`report_id`);

--
-- Indexes for table `students_tbl`
--
ALTER TABLE `students_tbl`
  ADD PRIMARY KEY (`student_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance_tracking_tbl`
--
ALTER TABLE `attendance_tracking_tbl`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `daily_accomplishments_tbl`
--
ALTER TABLE `daily_accomplishments_tbl`
  MODIFY `accomplishment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `intern_opportunities_tbl`
--
ALTER TABLE `intern_opportunities_tbl`
  MODIFY `intern_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `partner_comp_tbl`
--
ALTER TABLE `partner_comp_tbl`
  MODIFY `company_id` int(11) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT for table `students_tbl`
--
ALTER TABLE `students_tbl`
  MODIFY `student_id` int(12) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
