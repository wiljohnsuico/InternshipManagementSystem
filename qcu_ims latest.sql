-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 27, 2025 at 02:52 PM
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
-- Table structure for table `admin_activity_log`
--

CREATE TABLE `admin_activity_log` (
  `log_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `target_entity` varchar(50) DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_tbl`
--

CREATE TABLE `admin_tbl` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_tbl`
--

INSERT INTO `admin_tbl` (`id`, `user_id`, `department`, `created_at`, `updated_at`) VALUES
(1, 9, 'Administration', '2025-04-20 08:12:48', '2025-04-20 08:12:48');

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `application_id` int(11) NOT NULL,
  `listing_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `resume_id` int(11) DEFAULT NULL,
  `cover_letter` text DEFAULT NULL,
  `additional_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additional_info`)),
  `file_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`file_info`)),
  `status` enum('Pending','Reviewing','Accepted','Rejected') DEFAULT 'Pending',
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`application_id`, `listing_id`, `intern_id`, `resume_id`, `cover_letter`, `additional_info`, `file_info`, `status`, `applied_at`, `updated_at`) VALUES
(142, 17, 1, NULL, 'a', '{}', '{\"resume\":{\"path\":\"D:\\\\DOWNLOAD\\\\InternshipManagementSystem-20250426T133905Z-001\\\\InternshipManagementSystem\\\\BackEnd\\\\temp\\\\file_1745721965495_v1aruivm.pdf\",\"originalname\":\"Untitled document (3).pdf\",\"mimetype\":\"application/pdf\",\"size\":110937},\"supporting_docs\":[{\"path\":\"D:\\\\DOWNLOAD\\\\InternshipManagementSystem-20250426T133905Z-001\\\\InternshipManagementSystem\\\\BackEnd\\\\temp\\\\file_1745721965497_29zxrqwp.pdf\",\"originalname\":\"Untitled document (3).pdf\",\"mimetype\":\"application/pdf\",\"size\":110937}]}', 'Pending', '2025-04-27 02:46:05', '2025-04-27 02:46:05'),
(143, 13, 1, NULL, 'a', '{}', '{\"resume\":{\"path\":\"D:\\\\DOWNLOAD\\\\InternshipManagementSystem-20250426T133905Z-001\\\\InternshipManagementSystem\\\\BackEnd\\\\temp\\\\file_1745723361960_5zjk1mvf.pdf\",\"originalname\":\"internship_report_2025-04-24.pdf\",\"mimetype\":\"application/pdf\",\"size\":172499},\"supporting_docs\":[{\"path\":\"D:\\\\DOWNLOAD\\\\InternshipManagementSystem-20250426T133905Z-001\\\\InternshipManagementSystem\\\\BackEnd\\\\temp\\\\file_1745723361962_2vn0bu84.pdf\",\"originalname\":\"internship_report_2025-04-24.pdf\",\"mimetype\":\"application/pdf\",\"size\":172499}]}', 'Pending', '2025-04-27 03:09:21', '2025-04-27 03:09:21'),
(145, 16, 1, NULL, 'a', '{}', '{\"resume\":{\"path\":\"D:\\\\DOWNLOAD\\\\InternshipManagementSystem-20250426T133905Z-001\\\\InternshipManagementSystem\\\\BackEnd\\\\temp\\\\file_1745726141145_e29w5lzn.pdf\",\"originalname\":\"internship_report_2025-04-24.pdf\",\"mimetype\":\"application/pdf\",\"size\":172499},\"supporting_docs\":[{\"path\":\"D:\\\\DOWNLOAD\\\\InternshipManagementSystem-20250426T133905Z-001\\\\InternshipManagementSystem\\\\BackEnd\\\\temp\\\\file_1745726141146_rlgucrqy.pdf\",\"originalname\":\"internship_report_2025-04-24.pdf\",\"mimetype\":\"application/pdf\",\"size\":172499}]}', 'Pending', '2025-04-27 03:55:41', '2025-04-27 03:55:41');

-- --------------------------------------------------------

--
-- Table structure for table `archived_companies`
--

CREATE TABLE `archived_companies` (
  `archive_id` int(11) NOT NULL,
  `original_id` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `industry` varchar(50) DEFAULT NULL,
  `website` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `archived_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `archived_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `archived_companies_tbl`
--

CREATE TABLE `archived_companies_tbl` (
  `archive_id` int(11) NOT NULL,
  `original_company_id` int(11) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `archived_by` int(11) NOT NULL,
  `archived_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `archived_employers_tbl`
--

CREATE TABLE `archived_employers_tbl` (
  `archive_id` int(11) NOT NULL,
  `original_employer_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `archived_by` int(11) NOT NULL,
  `archived_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `archived_faculties_tbl`
--

CREATE TABLE `archived_faculties_tbl` (
  `archive_id` int(11) NOT NULL,
  `original_faculty_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `archived_by` int(11) NOT NULL,
  `archived_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `archived_interns_tbl`
--

CREATE TABLE `archived_interns_tbl` (
  `archive_id` int(11) NOT NULL,
  `original_intern_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `archived_by` int(11) NOT NULL COMMENT 'admin user_id who archived this intern',
  `archived_date` datetime NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `archived_users`
--

CREATE TABLE `archived_users` (
  `archive_id` int(11) NOT NULL,
  `original_id` int(11) DEFAULT NULL,
  `student_number` varchar(20) DEFAULT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `position` varchar(50) DEFAULT NULL,
  `specialization` varchar(100) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `college_department` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `archived_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `archived_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_tracking_tbl`
--

CREATE TABLE `attendance_tracking_tbl` (
  `attendance_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `time_in` time NOT NULL,
  `time_out` time DEFAULT NULL,
  `duration` decimal(4,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies_tbl`
--

CREATE TABLE `companies_tbl` (
  `company_id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `industry_sector` varchar(100) DEFAULT NULL,
  `company_description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `company_location` varchar(255) DEFAULT NULL,
  `company_website` varchar(255) DEFAULT NULL,
  `company_size` varchar(100) DEFAULT NULL,
  `founded_year` varchar(4) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `companies_tbl`
--

INSERT INTO `companies_tbl` (`company_id`, `company_name`, `industry_sector`, `company_description`, `created_at`, `updated_at`, `is_deleted`, `company_location`, `company_website`, `company_size`, `founded_year`, `logo_url`) VALUES
(1, 'Google', 'Technology', 'Leading search engine and technology company', '2025-04-17 06:40:57', '2025-04-17 06:40:57', 0, NULL, NULL, NULL, NULL, NULL),
(2, 'Facebook', 'Social Media', 'Popular social media platform', '2025-04-17 06:40:57', '2025-04-17 06:40:57', 0, NULL, NULL, NULL, NULL, NULL),
(3, 'Adobe', 'Software', 'Creative software development company', '2025-04-17 06:40:57', '2025-04-24 16:00:48', 0, NULL, NULL, NULL, NULL, NULL),
(4, 'Deloitte', 'Consulting', 'Global consulting and accounting firm', '2025-04-17 06:40:57', '2025-04-17 06:40:57', 0, NULL, NULL, NULL, NULL, NULL),
(5, 'BuzzFeed', 'Media', 'Digital media and news company', '2025-04-17 06:40:58', '2025-04-17 06:40:58', 0, NULL, NULL, NULL, NULL, NULL),
(6, 'Microsoft', 'Technology', 'Leading technology company', '2025-04-17 06:40:58', '2025-04-17 06:40:58', 0, NULL, NULL, NULL, NULL, NULL),
(7, 'Amazon', 'E-commerce', 'Global e-commerce and cloud computing company', '2025-04-17 06:40:58', '2025-04-17 06:40:58', 0, NULL, NULL, NULL, NULL, NULL),
(8, 'Netflix', 'Entertainment', 'Streaming media provider', '2025-04-17 06:40:58', '2025-04-17 06:40:58', 0, NULL, NULL, NULL, NULL, NULL),
(9, 'Ubisoft', 'Gaming', 'Video game development company', '2025-04-17 06:40:58', '2025-04-17 06:40:58', 0, NULL, NULL, NULL, NULL, NULL),
(10, 'IBM', 'Technology', 'Global technology and consulting company', '2025-04-17 06:40:58', '2025-04-17 06:40:58', 0, NULL, NULL, NULL, NULL, NULL),
(11, 'Shopee', NULL, NULL, '2025-04-24 07:31:17', '2025-04-24 07:35:57', 1, NULL, NULL, NULL, NULL, NULL),
(12, 'Test Company Inc.', 'Technology', 'A test company for the internship system', '2025-04-26 17:55:43', '2025-04-26 17:55:43', 0, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `daily_accomplishment_tbl`
--

CREATE TABLE `daily_accomplishment_tbl` (
  `accomplishment_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `task_completed` text NOT NULL,
  `challenges_faced` text DEFAULT NULL,
  `skills_applied` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employers`
--

CREATE TABLE `employers` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employers_tbl`
--

CREATE TABLE `employers_tbl` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employers_tbl`
--

INSERT INTO `employers_tbl` (`id`, `user_id`, `company_id`, `position`, `created_at`, `updated_at`) VALUES
(1, 11, 3, NULL, '2025-04-24 07:23:29', '2025-04-24 07:23:29'),
(2, 13, 3, NULL, '2025-04-25 11:37:51', '2025-04-25 11:37:51'),
(3, 14, 12, NULL, '2025-04-26 17:55:43', '2025-04-26 17:55:43');

-- --------------------------------------------------------

--
-- Table structure for table `faculties_tbl`
--

CREATE TABLE `faculties_tbl` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculties_tbl`
--

INSERT INTO `faculties_tbl` (`id`, `user_id`, `department`, `position`, `created_at`, `updated_at`) VALUES
(1, 6, 'CCS', 'BSIT', '2025-04-20 06:54:06', '2025-04-20 06:54:06'),
(2, 7, 'CCS', 'BSIE', '2025-04-20 06:55:04', '2025-04-20 06:55:04'),
(3, 8, 'CAFA', 'BSBA', '2025-04-20 06:58:46', '2025-04-20 06:58:46'),
(4, 10, 'BSIT', NULL, '2025-04-24 07:11:07', '2025-04-24 07:11:07');

-- --------------------------------------------------------

--
-- Table structure for table `faculty`
--

CREATE TABLE `faculty` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `internship_placements_tbl`
--

CREATE TABLE `internship_placements_tbl` (
  `placement_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `supervisor_name` varchar(100) DEFAULT NULL,
  `supervisor_contact_number` varchar(20) DEFAULT NULL,
  `supervisor_email` varchar(255) DEFAULT NULL,
  `placement_status` enum('Pending','Approved','Rejected','Completed') DEFAULT 'Pending',
  `placement_remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `year_level` int(11) DEFAULT NULL,
  `section` varchar(20) DEFAULT NULL,
  `dept` varchar(100) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `about` text DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `website` varchar(255) DEFAULT NULL,
  `social_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '{}' CHECK (json_valid(`social_links`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `verification_status` enum('Pending','Accepted','Rejected') NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interns_tbl`
--

INSERT INTO `interns_tbl` (`id`, `user_id`, `student_id`, `course`, `year_level`, `section`, `dept`, `age`, `address`, `about`, `skills`, `website`, `social_links`, `created_at`, `updated_at`, `verification_status`) VALUES
(1, 2, NULL, 'Computer Science', NULL, NULL, NULL, 19, 'Caloocan', 'asd', '[\"JavaScript\",\"Project Management\",\"Php\",\"Python\"]', 'https://www.facebook.com/rnzykima', '{}', '2025-04-17 06:41:14', '2025-04-24 10:19:14', 'Accepted'),
(2, 3, '232323', 'MILITAR', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2025-04-24 15:36:41', '2025-04-26 14:18:49', 'Rejected'),
(4, 5, '23-2000', 'BSEIASDAWD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}', '2025-04-24 10:19:02', '2025-04-24 12:38:16', 'Accepted'),
(5, 12, '23-2111', 'BSIT', NULL, NULL, NULL, 25, 'Caloocan', 'assda', '[\"wala\",\"bakit\",\"edi wow\"]', 'https://www.facebook.com/rnzykima', '{}', '2025-04-24 15:50:30', '2025-04-24 15:51:11', 'Pending');

-- --------------------------------------------------------

--
-- Table structure for table `intern_requirements_submission_tbl`
--

CREATE TABLE `intern_requirements_submission_tbl` (
  `submission_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `requirement_id` int(11) NOT NULL,
  `submission_date` date NOT NULL,
  `file` blob NOT NULL,
  `submission_status` enum('Submitted','Reviewed','Approved') NOT NULL,
  `submission_remarks` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` int(11) NOT NULL,
  `employer_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `requirements` text DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `salary` varchar(50) DEFAULT NULL,
  `job_type` enum('full-time','part-time','contract','internship') DEFAULT 'internship',
  `status` enum('open','closed','filled') DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_listings`
--

CREATE TABLE `job_listings` (
  `listing_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `job_title` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]' CHECK (json_valid(`skills`)),
  `description` text DEFAULT NULL,
  `requirements` text DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT 0,
  `status` enum('Active','Filled','Closed') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_listings`
--

INSERT INTO `job_listings` (`listing_id`, `company_id`, `job_title`, `location`, `skills`, `description`, `requirements`, `is_paid`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Software Engineer', 'Manila', '[\"JavaScript\",\"Python\"]', 'Join our engineering team to develop innovative solutions.', 'Knowledge of web technologies and programming languages.', 1, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(2, 2, 'Marketing Intern', 'Quezon City', '[\"Marketing\",\"SEO\"]', 'Help our marketing team create engaging campaigns.', 'Interest in digital marketing and social media.', 0, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(3, 3, 'Graphic Designer', 'Makati', '[\"Photoshop\",\"Illustrator\"]', 'Create visually stunning designs for our products.', 'Proficiency in Adobe Creative Suite.', 1, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(4, 4, 'Tax Analyst', 'Makati', '[\"Accounting\",\"Tax\"]', 'Assist with tax compliance and planning.', 'Accounting knowledge and attention to detail.', 1, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(5, 5, 'Content Writer', 'Pasig', '[\"Writing\",\"SEO\"]', 'Create engaging content for our website.', 'Strong writing skills and creativity.', 0, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(6, 6, 'Web Developer', 'Taguig', '[\"HTML\",\"CSS\",\"JavaScript\"]', 'Develop and maintain web applications.', 'Experience with front-end technologies.', 1, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(7, 7, 'Project Manager', 'Davao', '[\"Agile\",\"Scrum\"]', 'Lead projects from conception to completion.', 'Project management experience and leadership skills.', 1, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(8, 8, 'HR Intern', 'Makati', '[\"Recruitment\"]', 'Support the HR team in recruitment and onboarding.', 'Interest in human resources and people management.', 0, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(9, 9, 'Game Developer', 'Cavite', '[\"Unity\",\"C#\"]', 'Contribute to the development of exciting games.', 'Knowledge of game development and programming.', 1, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(10, 10, 'Operations Intern', 'Cebu', '[\"Excel\",\"Data Analysis\"]', 'Assist with operational processes and data analysis.', 'Analytical skills and attention to detail.', 0, 'Active', '2025-04-17 06:40:58', '2025-04-17 06:40:58'),
(11, 3, 'Backend Developer', 'Manila', '[]', 'a', 'a', 1, 'Active', '2025-04-25 22:14:32', '2025-04-25 22:14:32'),
(12, 3, 'Backend Developer', 'Manila', '[\"wala\",\"wala\"]', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaassdaaaaaaaaaaasssdaaaaaaaaaaaaa', 1, 'Active', '2025-04-26 16:36:41', '2025-04-26 16:36:41'),
(13, 3, 'Backend Developer', 'Manila', '[\"wala\",\"wala\"]', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaassdaaaaaaaaaaasssdaaaaaaaaaaaaa', 1, 'Active', '2025-04-26 16:36:41', '2025-04-26 16:36:41'),
(14, 3, 'Backend Developer', 'Manila', '[\"wala\",\"walaaaa\"]', 'asdasdasaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaakmadsakmassdakmadsakmlassdakmlassdakmlassdaklmassdamklassda', 1, 'Closed', '2025-04-26 16:49:32', '2025-04-27 06:39:55'),
(15, 3, 'Backend Developer', 'Manila', '[\"wala\",\"walaaaa\"]', 'asdasdasaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaakmadsakmassdakmadsakmlassdakmlassdakmlassdaklmassdamklassda', 1, 'Active', '2025-04-26 16:49:32', '2025-04-26 16:49:32'),
(16, 3, 'Backend Developer', 'Manila', '[\"assd\",\"assd\",\"asd\"]', '1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'aajnhasfdjnhdfsnjhsfdnjkfsdadnjksdfanjkfdsanjkfdasdnjkfsdadnjksfdadnjkfdsanjkdfasd', 1, 'Closed', '2025-04-26 16:56:03', '2025-04-27 07:48:59'),
(17, 3, 'Backend Developer', 'Manila', '[\"assd\",\"assd\",\"asd\"]', '1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'aajnhasfdjnhdfsnjhsfdnjkfsdadnjksdfanjkfdsanjkfdasdnjkfsdadnjksfdadnjkfdsanjkdfasd', 1, 'Active', '2025-04-26 16:56:03', '2025-04-26 16:56:03'),
(18, 3, 'Backend Developer', 'Manila', '[\"assd\",\"asd\"]', 'asdasdasddasdasdassdasdasdasdadsasdadsada', 'dassdasddasddasdasdasdaqsdsasddasdad', 1, 'Closed', '2025-04-27 05:37:11', '2025-04-27 07:48:53'),
(19, 3, 'Backend Developer', 'Manila', '[\"assd\",\"asd\"]', 'asdasdasddasdasdassdasdasdasdadsasdadsada', 'dassdasddasddasdasdasdaqsdsasddasdad', 1, 'Closed', '2025-04-27 05:37:11', '2025-04-27 07:48:57'),
(20, 3, 'Try lang', 'Marikina', '[\"try\",\"lang\"]', 'try try try try try try', 'try try try try try try', 1, 'Closed', '2025-04-27 05:43:53', '2025-04-27 06:50:08'),
(21, 3, 'Okay na', 'Manila na Marikina', '[\"hello\",\"hi\"]', 'Hello sali na kayo please', 'walang req kahit ano basta haha', 1, 'Active', '2025-04-27 05:43:53', '2025-04-27 06:52:22');

-- --------------------------------------------------------

--
-- Table structure for table `monthly_report_tbl`
--

CREATE TABLE `monthly_report_tbl` (
  `report_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `summary` text NOT NULL,
  `projects_completed` text NOT NULL,
  `major_achievements` text NOT NULL,
  `challenges` text NOT NULL,
  `skills_developed` text NOT NULL,
  `overall_experience` text DEFAULT NULL,
  `supervisor_feedback` text DEFAULT NULL,
  `supervisor_approved` tinyint(1) DEFAULT 0,
  `faculty_feedback` text DEFAULT NULL,
  `faculty_approved` tinyint(1) DEFAULT 0,
  `status` enum('Draft','Submitted','Supervisor Approved','Faculty Approved','Needs Revision') DEFAULT 'Draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `read` tinyint(1) DEFAULT 0,
  `link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `message`, `type`, `timestamp`, `read`, `link`, `created_at`, `updated_at`) VALUES
(1, 9, 'Welcome to Internship Management System! Thank you for joining our platform. Get started by exploring internship opportunities.', 'welcome', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13'),
(2, 6, 'Welcome to Internship Management System! Thank you for joining our platform. Get started by exploring internship opportunities.', 'welcome', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13'),
(3, 7, 'Welcome to Internship Management System! Thank you for joining our platform. Get started by exploring internship opportunities.', 'welcome', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13'),
(4, 8, 'Welcome to Internship Management System! Thank you for joining our platform. Get started by exploring internship opportunities.', 'welcome', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13'),
(5, 10, 'Welcome to Internship Management System! Thank you for joining our platform. Get started by exploring internship opportunities.', 'welcome', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13'),
(6, 11, 'Welcome to Internship Management System! Thank you for joining our platform. Get started by exploring internship opportunities.', 'welcome', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13'),
(7, 2, 'Welcome to Internship Management System! Thank you for joining our platform. Get started by exploring internship opportunities.', 'welcome', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13'),
(8, 3, 'Welcome to Internship Management System! Thank you for joining our platform. Get started by exploring internship opportunities.', 'welcome', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13'),
(9, 5, 'Welcome to Internship Management System! Thank you for joining our platform. Get started by exploring internship opportunities.', 'welcome', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13'),
(16, 9, 'System Update Notification: The notification system has been implemented. You can now receive real-time notifications.', 'system', '2025-04-24 11:19:13', 0, NULL, '2025-04-24 11:19:13', '2025-04-24 11:19:13');

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
-- Table structure for table `resumes`
--

CREATE TABLE `resumes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `basic` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '{}' CHECK (json_valid(`basic`)),
  `education` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]' CHECK (json_valid(`education`)),
  `work` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]' CHECK (json_valid(`work`)),
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '[]' CHECK (json_valid(`skills`)),
  `image_data` mediumtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `resumes`
--

INSERT INTO `resumes` (`id`, `user_id`, `basic`, `education`, `work`, `skills`, `image_data`, `created_at`, `updated_at`) VALUES
(1, 2, '{\"firstName\":\"Justin Neil Lawrence\",\"middleName\":\"Caranguian\",\"lastName\":\"Cabang\",\"suffix\":\"\",\"birthday\":\"2005-10-04\",\"age\":\"19\",\"mobile\":\"09123123123\",\"email\":\"justincabang@gmail.com\",\"address\":{\"street\":\"Mark ST, Kingstown Subd.\",\"barangay\":\"Brgy. 171\",\"city\":\"Caloocan\",\"country\":\"Ohio\"}}', '[{\"school\":\"a\",\"year\":\"\",\"date\":\"\"}]', '[{\"position\":\"Secret\",\"company\":\"Wala pa eh\",\"duration\":\"Kanina lang\"}]', '[\"JavaScript\",\"Project Management\",\"Php\",\"Python\"]', 'data:image/jpeg;base64,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', '2025-04-17 08:40:02', '2025-04-26 13:37:37');
INSERT INTO `resumes` (`id`, `user_id`, `basic`, `education`, `work`, `skills`, `image_data`, `created_at`, `updated_at`) VALUES
(2, 3, '{\"firstName\":\"Wil\",\"middleName\":\"Swiko\",\"lastName\":\"Suico\",\"suffix\":\"Jr.\",\"birthday\":\"1984-12-01\",\"age\":\"85\",\"mobile\":\"123010101010\",\"email\":\"suico@gmail.com\",\"address\":{\"street\":\"Tandang\",\"barangay\":\"Sora\",\"city\":\"asd\",\"country\":\"assd\"},\"objectives\":\"asdasdasda\"}', '[{\"school\":\"assd\",\"year\":\"assds\",\"date\":\"\"}]', '[{\"position\":\"ewan\",\"company\":\"q\",\"duration\":\"q\"}]', '[\"qq\",\"qq\",\"qq\",\"qq\"]', 'data:image/jpeg;base64,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', '2025-04-18 06:22:35', '2025-04-18 06:22:35');
INSERT INTO `resumes` (`id`, `user_id`, `basic`, `education`, `work`, `skills`, `image_data`, `created_at`, `updated_at`) VALUES
(3, 5, '{\"firstName\":\"Hi\",\"middleName\":\"Hello\",\"lastName\":\"Hi\",\"suffix\":\"Jr.\",\"birthday\":\"2000-10-10\",\"age\":\"25\",\"mobile\":\"09123123123\",\"email\":\"hello@gmail.com\",\"address\":{\"street\":\"assdad\",\"barangay\":\"assd\",\"city\":\"ads\",\"country\":\"assd\"},\"objectives\":\"assd\"}', '[{\"school\":\"assd\",\"year\":\"assdassd\",\"date\":\"2019 - 2020\"}]', '[{\"position\":\"a\",\"company\":\"a\",\"duration\":\"a\"}]', '[\"a\",\"a\",\"a\"]', 'data:image/jpeg;base64,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', '2025-04-18 15:34:35', '2025-04-18 15:34:35');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `program` varchar(100) DEFAULT NULL,
  `year_level` int(11) DEFAULT NULL,
  `gpa` decimal(3,2) DEFAULT NULL,
  `resume_url` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','student','employer','coordinator') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `role`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2b$10$mLtMg.vQRQmL6vA0o3vI5OLBGXnvcZrjF6vHvE4xW2HnEd06Ke5sa', 'admin@example.com', 'admin', '2025-04-26 18:35:22', '2025-04-26 18:35:22');

-- --------------------------------------------------------

--
-- Table structure for table `users_tbl`
--

CREATE TABLE `users_tbl` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','Faculty','Employer','Intern') NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users_tbl`
--

INSERT INTO `users_tbl` (`user_id`, `first_name`, `last_name`, `email`, `password`, `role`, `contact_number`, `created_at`, `updated_at`, `is_deleted`) VALUES
(2, 'Justin', 'Cabang', 'justincabang@gmail.com', '$2a$10$TZXiD/JE/chYv5iG0FSrVeBcfPdzJzyWbgRo0yFgD7IRhu6Z7UEz6', 'Intern', '09090909090', '2025-04-17 06:41:14', '2025-04-26 17:58:36', 0),
(3, 'Wil', 'Suico', 'suico@gmail.com', '$2a$10$vYBGXSG9Ed7nTe2tCFA1vuNvay59Fgvchy3PrZ72o0Eguyo8i8ky6', 'Intern', '09090909090', '2025-04-18 06:10:02', '2025-04-24 15:36:41', 0),
(5, 'Hello', 'Hi', 'hello@gmail.com', '$2a$10$XjkBAMp8VnOmuapqWNoHWeiAGLvYNnFZWyw0LIvBbdt7cRbwoID8K', 'Intern', '09232123122', '2025-04-18 15:23:21', '2025-04-24 10:19:02', 0),
(6, 'Justin Neil Lawrence', 'Cabang', 'Faculty Ni Justin Cabang', '$2a$10$8V0ZIX4JxCTZ44.lteaf3ePmutVFJUzS4youZzjqyYec7n6sv7fay', 'Faculty', NULL, '2025-04-20 06:54:06', '2025-04-24 07:15:42', 1),
(7, 'Wiljohn', 'Suico', 'Faculty Ni Suico', '$2a$10$RJWpoZtY2JwdmMFn1YYhs.XBT.ZwQ./3bPfwifyG7sTQsynAIWUUe', 'Faculty', NULL, '2025-04-20 06:55:04', '2025-04-24 16:00:56', 0),
(8, 'Hello', 'Test', 'HelloHi', '$2a$10$9mIYLpSAGrG5g0LEAsCaQ.hM6a5TgSq.zUWHJwwZgaFsYbmVnA2de', 'Faculty', NULL, '2025-04-20 06:58:45', '2025-04-20 06:58:45', 0),
(9, 'System', 'Administrator', 'admin@gmail.com', '$2a$10$dJlhT3X9VPIn1BqfyEiBS.xf4yquPm39P1K5uoapQPzWt0AsnXAxW', 'Admin', '1234567890', '2025-04-20 08:12:48', '2025-04-20 08:12:48', 0),
(10, 'Wiljohn', 'Suico', 'wiljohnsuico@gmail.com', '$2a$10$i195GzLTWYBmK7KzAr4Wo.9wwtmW0mb69le25ODseg86nh2tFc3sW', 'Faculty', NULL, '2025-04-24 07:11:06', '2025-04-26 14:19:18', 0),
(11, 'lol', 'lol', 'assd@gmail.com', '$2a$10$C7nRY/1.eyrTb/Bft2eMr.hKyooAHT2ixj3/b/WdJZWcMLmYjJdNy', 'Employer', NULL, '2025-04-24 07:23:29', '2025-04-26 14:19:13', 0),
(12, 'test', 'test', 'test@gmail.com', '$2a$10$yHPQZBiceVaITGCBvCXyQu64WeHfQh86Xsnt0CydRqIpFtB3P3Rqa', 'Intern', '09090909090', '2025-04-24 15:50:30', '2025-04-24 15:51:11', 0),
(13, 'Employer', 'One', 'employer@gmail.com', '$2a$10$CZrHPVANEbaBVDSlrB74TO..v9R0covs0oqunX1Zx0gS6IgiJyVnq', 'Employer', NULL, '2025-04-25 11:37:51', '2025-04-25 11:37:51', 0),
(14, 'Test', 'Employer', 'employer@example.com', '$2a$10$3qOQFT7sh1/x6Nsxxw5wUem3U3Bqw51BB7okyqgYCe6RaywRn2eo.', 'Employer', NULL, '2025-04-26 17:55:43', '2025-04-26 17:55:43', 0);

-- --------------------------------------------------------

--
-- Table structure for table `weekly_report_tbl`
--

CREATE TABLE `weekly_report_tbl` (
  `report_id` int(11) NOT NULL,
  `intern_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `week_start_date` date NOT NULL,
  `week_end_date` date NOT NULL,
  `summary` text NOT NULL,
  `key_learnings` text NOT NULL,
  `goals_achieved` text DEFAULT NULL,
  `next_week_goals` text DEFAULT NULL,
  `supervisor_feedback` text DEFAULT NULL,
  `supervisor_approved` tinyint(1) DEFAULT 0,
  `faculty_feedback` text DEFAULT NULL,
  `faculty_approved` tinyint(1) DEFAULT 0,
  `status` enum('Draft','Submitted','Supervisor Approved','Faculty Approved','Needs Revision') DEFAULT 'Draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_activity_log`
--
ALTER TABLE `admin_activity_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_admin_id` (`admin_id`),
  ADD KEY `idx_activity_type` (`activity_type`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `admin_tbl`
--
ALTER TABLE `admin_tbl`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_admin_user` (`user_id`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`application_id`),
  ADD UNIQUE KEY `listing_id` (`listing_id`,`intern_id`),
  ADD KEY `resume_id` (`resume_id`),
  ADD KEY `idx_application_status` (`status`),
  ADD KEY `idx_application_intern` (`intern_id`);

--
-- Indexes for table `archived_companies`
--
ALTER TABLE `archived_companies`
  ADD PRIMARY KEY (`archive_id`),
  ADD KEY `archived_by` (`archived_by`);

--
-- Indexes for table `archived_companies_tbl`
--
ALTER TABLE `archived_companies_tbl`
  ADD PRIMARY KEY (`archive_id`);

--
-- Indexes for table `archived_employers_tbl`
--
ALTER TABLE `archived_employers_tbl`
  ADD PRIMARY KEY (`archive_id`);

--
-- Indexes for table `archived_faculties_tbl`
--
ALTER TABLE `archived_faculties_tbl`
  ADD PRIMARY KEY (`archive_id`);

--
-- Indexes for table `archived_interns_tbl`
--
ALTER TABLE `archived_interns_tbl`
  ADD PRIMARY KEY (`archive_id`),
  ADD KEY `idx_original_intern_id` (`original_intern_id`),
  ADD KEY `idx_archived_date` (`archived_date`);

--
-- Indexes for table `archived_users`
--
ALTER TABLE `archived_users`
  ADD PRIMARY KEY (`archive_id`),
  ADD KEY `archived_by` (`archived_by`);

--
-- Indexes for table `attendance_tracking_tbl`
--
ALTER TABLE `attendance_tracking_tbl`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `intern_id` (`intern_id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `idx_attendance_date` (`date`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`);

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
  ADD KEY `intern_id` (`intern_id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `idx_accomplishment_date` (`date`);

--
-- Indexes for table `employers`
--
ALTER TABLE `employers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `employers_tbl`
--
ALTER TABLE `employers_tbl`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_employer_user` (`user_id`),
  ADD KEY `idx_employers_user_id` (`user_id`),
  ADD KEY `idx_employers_company_id` (`company_id`);

--
-- Indexes for table `faculties_tbl`
--
ALTER TABLE `faculties_tbl`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_faculty_user` (`user_id`);

--
-- Indexes for table `faculty`
--
ALTER TABLE `faculty`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `internship_placements_tbl`
--
ALTER TABLE `internship_placements_tbl`
  ADD PRIMARY KEY (`placement_id`),
  ADD KEY `intern_id` (`intern_id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `idx_placement_status` (`placement_status`);

--
-- Indexes for table `internship_requirements_tbl`
--
ALTER TABLE `internship_requirements_tbl`
  ADD PRIMARY KEY (`requirement_id`);

--
-- Indexes for table `interns_tbl`
--
ALTER TABLE `interns_tbl`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD KEY `idx_intern_user` (`user_id`);

--
-- Indexes for table `intern_requirements_submission_tbl`
--
ALTER TABLE `intern_requirements_submission_tbl`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `fk_interns_irs_idx` (`intern_id`),
  ADD KEY `fk_requirements_irs_idx` (`requirement_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employer_id` (`employer_id`);

--
-- Indexes for table `job_listings`
--
ALTER TABLE `job_listings`
  ADD PRIMARY KEY (`listing_id`),
  ADD KEY `idx_job_listing_status` (`status`),
  ADD KEY `idx_job_listing_company` (`company_id`);

--
-- Indexes for table `monthly_report_tbl`
--
ALTER TABLE `monthly_report_tbl`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `idx_monthly_report_date` (`year`,`month`),
  ADD KEY `idx_monthly_report_intern` (`intern_id`),
  ADD KEY `idx_monthly_report_company` (`company_id`),
  ADD KEY `idx_monthly_report_status` (`status`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_user` (`user_id`),
  ADD KEY `idx_notification_read` (`read`),
  ADD KEY `idx_notifications_user_id` (`user_id`);

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
-- Indexes for table `resumes`
--
ALTER TABLE `resumes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `users_tbl`
--
ALTER TABLE `users_tbl`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_user_role` (`role`);

--
-- Indexes for table `weekly_report_tbl`
--
ALTER TABLE `weekly_report_tbl`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `idx_weekly_report_dates` (`week_start_date`,`week_end_date`),
  ADD KEY `idx_weekly_report_intern` (`intern_id`),
  ADD KEY `idx_weekly_report_company` (`company_id`),
  ADD KEY `idx_weekly_report_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_activity_log`
--
ALTER TABLE `admin_activity_log`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_tbl`
--
ALTER TABLE `admin_tbl`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `application_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;

--
-- AUTO_INCREMENT for table `archived_companies`
--
ALTER TABLE `archived_companies`
  MODIFY `archive_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `archived_companies_tbl`
--
ALTER TABLE `archived_companies_tbl`
  MODIFY `archive_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `archived_employers_tbl`
--
ALTER TABLE `archived_employers_tbl`
  MODIFY `archive_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `archived_faculties_tbl`
--
ALTER TABLE `archived_faculties_tbl`
  MODIFY `archive_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `archived_interns_tbl`
--
ALTER TABLE `archived_interns_tbl`
  MODIFY `archive_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `archived_users`
--
ALTER TABLE `archived_users`
  MODIFY `archive_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_tracking_tbl`
--
ALTER TABLE `attendance_tracking_tbl`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies_tbl`
--
ALTER TABLE `companies_tbl`
  MODIFY `company_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `daily_accomplishment_tbl`
--
ALTER TABLE `daily_accomplishment_tbl`
  MODIFY `accomplishment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employers`
--
ALTER TABLE `employers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employers_tbl`
--
ALTER TABLE `employers_tbl`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `faculties_tbl`
--
ALTER TABLE `faculties_tbl`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `faculty`
--
ALTER TABLE `faculty`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `intern_requirements_submission_tbl`
--
ALTER TABLE `intern_requirements_submission_tbl`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_listings`
--
ALTER TABLE `job_listings`
  MODIFY `listing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `monthly_report_tbl`
--
ALTER TABLE `monthly_report_tbl`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

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
-- AUTO_INCREMENT for table `resumes`
--
ALTER TABLE `resumes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users_tbl`
--
ALTER TABLE `users_tbl`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `weekly_report_tbl`
--
ALTER TABLE `weekly_report_tbl`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_tbl`
--
ALTER TABLE `admin_tbl`
  ADD CONSTRAINT `admin_tbl_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_users_admin` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `job_listings` (`listing_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_3` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `archived_companies`
--
ALTER TABLE `archived_companies`
  ADD CONSTRAINT `archived_companies_ibfk_1` FOREIGN KEY (`archived_by`) REFERENCES `users_tbl` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `archived_users`
--
ALTER TABLE `archived_users`
  ADD CONSTRAINT `archived_users_ibfk_1` FOREIGN KEY (`archived_by`) REFERENCES `users_tbl` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance_tracking_tbl`
--
ALTER TABLE `attendance_tracking_tbl`
  ADD CONSTRAINT `attendance_tracking_tbl_ibfk_1` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_tracking_tbl_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE;

--
-- Constraints for table `daily_accomplishment_tbl`
--
ALTER TABLE `daily_accomplishment_tbl`
  ADD CONSTRAINT `daily_accomplishment_tbl_ibfk_1` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `daily_accomplishment_tbl_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE;

--
-- Constraints for table `employers`
--
ALTER TABLE `employers`
  ADD CONSTRAINT `employers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employers_tbl`
--
ALTER TABLE `employers_tbl`
  ADD CONSTRAINT `employers_tbl_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employers_tbl_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_companies_employers` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_employers` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `faculties_tbl`
--
ALTER TABLE `faculties_tbl`
  ADD CONSTRAINT `faculties_tbl_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_faculties_users` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `internship_placements_tbl`
--
ALTER TABLE `internship_placements_tbl`
  ADD CONSTRAINT `internship_placements_tbl_ibfk_1` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `internship_placements_tbl_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE;

--
-- Constraints for table `interns_tbl`
--
ALTER TABLE `interns_tbl`
  ADD CONSTRAINT `interns_tbl_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`employer_id`) REFERENCES `employers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `job_listings`
--
ALTER TABLE `job_listings`
  ADD CONSTRAINT `job_listings_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE;

--
-- Constraints for table `monthly_report_tbl`
--
ALTER TABLE `monthly_report_tbl`
  ADD CONSTRAINT `monthly_report_tbl_ibfk_1` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `monthly_report_tbl_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `resumes`
--
ALTER TABLE `resumes`
  ADD CONSTRAINT `resumes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `weekly_report_tbl`
--
ALTER TABLE `weekly_report_tbl`
  ADD CONSTRAINT `weekly_report_tbl_ibfk_1` FOREIGN KEY (`intern_id`) REFERENCES `interns_tbl` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `weekly_report_tbl_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies_tbl` (`company_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
