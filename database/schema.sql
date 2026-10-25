-- ============================================================
-- Database: academic_document_workflow
-- Digital Academic Document Workflow System
-- ============================================================

CREATE DATABASE IF NOT EXISTS `academic_document_workflow` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `academic_document_workflow`;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `hod_name` VARCHAR(100) NULL,
  `hod_email` VARCHAR(100) NULL,
  `contact_phone` VARCHAR(30) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'faculty', 'hod', 'academic_office', 'admin') NOT NULL,
  `department_id` INT NULL,
  `registration_number` VARCHAR(50) NULL UNIQUE,
  `phone` VARCHAR(30) NULL,
  `account_status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `academic_year` VARCHAR(20) NULL,
  `program` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_dept` (`department_id`),
  INDEX `idx_users_reg_no` (`registration_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Document Types Table
CREATE TABLE IF NOT EXISTS `document_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT,
  `processing_days` INT DEFAULT 3,
  `requirements` TEXT, -- JSON string or comma-separated list of required fields/attachments
  `fee_amount` DECIMAL(10,2) DEFAULT 0.00,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Workflow Stages Configuration Table
CREATE TABLE IF NOT EXISTS `workflow_stages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_type_id` INT NOT NULL,
  `stage_name` VARCHAR(100) NOT NULL,
  `stage_order` INT NOT NULL,
  `approver_role` ENUM('faculty', 'hod', 'academic_office', 'admin') NOT NULL,
  `department_required` BOOLEAN DEFAULT TRUE,
  `is_final_approval` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`) ON DELETE CASCADE,
  INDEX `idx_workflow_doc_order` (`document_type_id`, `stage_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Document Requests Table
CREATE TABLE IF NOT EXISTS `document_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reference_number` VARCHAR(50) NOT NULL UNIQUE,
  `student_id` INT NOT NULL,
  `document_type_id` INT NOT NULL,
  `department_id` INT NOT NULL,
  `purpose` TEXT NOT NULL,
  `additional_details` TEXT NULL,
  `current_stage_id` INT NULL,
  `current_status` ENUM(
    'Draft',
    'Submitted',
    'Under Department Review',
    'Correction Required',
    'Pending HOD Approval',
    'Pending Academic Office Verification',
    'Approved',
    'Rejected',
    'Document Issued',
    'Completed',
    'Cancelled'
  ) NOT NULL DEFAULT 'Submitted',
  `correction_notes` TEXT NULL,
  `rejection_reason` TEXT NULL,
  `submission_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completion_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`document_type_id`) REFERENCES `document_types`(`id`),
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
  FOREIGN KEY (`current_stage_id`) REFERENCES `workflow_stages`(`id`) ON DELETE SET NULL,
  INDEX `idx_req_student` (`student_id`),
  INDEX `idx_req_status` (`current_status`),
  INDEX `idx_req_dept` (`department_id`),
  INDEX `idx_req_ref` (`reference_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Approval History Table
CREATE TABLE IF NOT EXISTS `approval_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` INT NOT NULL,
  `workflow_stage_id` INT NULL,
  `approver_id` INT NOT NULL,
  `action` ENUM('Approved', 'Rejected', 'Correction Requested', 'Forwarded', 'Issued') NOT NULL,
  `comments` TEXT NOT NULL,
  `previous_status` VARCHAR(50) NOT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `decision_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`request_id`) REFERENCES `document_requests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`workflow_stage_id`) REFERENCES `workflow_stages`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`),
  INDEX `idx_appr_req` (`request_id`),
  INDEX `idx_appr_user` (`approver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Supporting Documents Table (Uploaded attachments)
CREATE TABLE IF NOT EXISTS `supporting_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `stored_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_size` INT NOT NULL,
  `file_type` VARCHAR(100) NOT NULL,
  `upload_timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`request_id`) REFERENCES `document_requests`(`id`) ON DELETE CASCADE,
  INDEX `idx_supp_req` (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Issued Documents Table (Generated official certificates)
CREATE TABLE IF NOT EXISTS `issued_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `request_id` INT NOT NULL UNIQUE,
  `document_number` VARCHAR(100) NOT NULL UNIQUE,
  `file_path` VARCHAR(255) NOT NULL,
  `issue_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `issued_by` INT NOT NULL,
  `verification_code` VARCHAR(64) NOT NULL,
  `download_count` INT DEFAULT 0,
  `last_downloaded_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`request_id`) REFERENCES `document_requests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`issued_by`) REFERENCES `users`(`id`),
  INDEX `idx_issued_doc_num` (`document_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `request_id` INT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `read_status` BOOLEAN DEFAULT FALSE,
  `type` VARCHAR(50) DEFAULT 'info',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`request_id`) REFERENCES `document_requests`(`id`) ON DELETE SET NULL,
  INDEX `idx_notif_user` (`user_id`, `read_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `affected_entity` VARCHAR(100) NOT NULL,
  `entity_id` INT NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_entity` (`affected_entity`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Workflow Assignments Table (Stage specific role/user mapping)
CREATE TABLE IF NOT EXISTS `workflow_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `workflow_stage_id` INT NOT NULL,
  `department_id` INT NULL,
  `assigned_user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`workflow_stage_id`) REFERENCES `workflow_stages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
