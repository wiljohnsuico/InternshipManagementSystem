-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message` varchar(500) NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `link` varchar(255) DEFAULT NULL,
  `read` tinyint(1) DEFAULT 0,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id_index` (`user_id`),
  KEY `read_index` (`read`),
  KEY `timestamp_index` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Drop any existing foreign key constraints to ensure clean setup
SET @drop_fk_sql = '';
SELECT CONCAT('ALTER TABLE notifications DROP FOREIGN KEY ', CONSTRAINT_NAME, ';') 
INTO @drop_fk_sql
FROM information_schema.TABLE_CONSTRAINTS 
WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' 
AND TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'notifications'
AND CONSTRAINT_NAME = 'fk_notifications_user'
LIMIT 1;

-- Execute the DROP statement only if we found a constraint
SET @drop_exists = LENGTH(@drop_fk_sql) > 0;
SET @stmt = IF(@drop_exists, @drop_fk_sql, 'SELECT "No constraint to drop";');
PREPARE drop_stmt FROM @stmt;
EXECUTE drop_stmt;
DEALLOCATE PREPARE drop_stmt;

-- Check if users_tbl table exists first
SET @users_tbl_exists = 0;
SELECT COUNT(*) INTO @users_tbl_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'users_tbl';

-- Check if users table exists as fallback
SET @users_exists = 0;
SELECT COUNT(*) INTO @users_exists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'users';

-- Set up appropriate foreign key based on which table exists
SET @alter_sql = 'SELECT "No users table found"';

-- First try users_tbl with user_id (preferred)
IF @users_tbl_exists > 0 THEN
    SET @alter_sql = 'ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_user` 
                     FOREIGN KEY (`user_id`) REFERENCES `users_tbl` (`user_id`) 
                     ON DELETE CASCADE ON UPDATE CASCADE';
-- Then try users with id as fallback
ELSEIF @users_exists > 0 THEN
    SET @alter_sql = 'ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_user` 
                     FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
                     ON DELETE CASCADE ON UPDATE CASCADE';
END IF;

-- Execute the dynamically created SQL
PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 