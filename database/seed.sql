-- ============================================================
-- Seed Data: academic_document_workflow
-- Digital Academic Document Workflow System
-- ============================================================

USE `academic_document_workflow`;

-- Disable foreign key checks for clean reload
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `issued_documents`;
TRUNCATE TABLE `supporting_documents`;
TRUNCATE TABLE `approval_history`;
TRUNCATE TABLE `document_requests`;
TRUNCATE TABLE `workflow_assignments`;
TRUNCATE TABLE `workflow_stages`;
TRUNCATE TABLE `document_types`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `departments`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Departments
INSERT INTO `departments` (`id`, `name`, `code`, `hod_name`, `hod_email`, `contact_phone`) VALUES
(1, 'Computer Science & Engineering', 'CSE', 'Dr. Rajesh Sharma', 'hod.cs@college.edu', '+91 9876543210'),
(2, 'Electronics & Communication Engineering', 'ECE', 'Dr. Meena Iyer', 'hod.ec@college.edu', '+91 9876543211'),
(3, 'Mechanical Engineering', 'MECH', 'Dr. Anand Kumar', 'hod.me@college.edu', '+91 9876543212');

-- 2. Users (Hashed passwords using bcrypt 10 rounds)
-- Admin@123 => $2a$10$nu7W7RUxm6wEoYK/FVDhxuu39mZ3zIUpE.LuKqEcxrtMx3kyC6s8e
-- Faculty@123 => $2a$10$12lVpAC7lKCmFlQ3TUcgT.jdLayQHGifByohHA9NQZJzadUULAcni
-- Hod@123 => $2a$10$lJSNN0tjm9PU9hzYuMeuheSWaYovFXJq8p0FlHvTsGj0TC90jjv3a
-- Office@123 => $2a$10$yEu5uhMDzIxcvJSNpLUSpukUrk9j2urLz0ESnN51SBda.8GZm0sb.
-- Student@123 => $2a$10$nISxwVzXCB7BVP3JVS1l3eT3f8rEGaN0ENQZ8ejPW.CtAfn3I1l6G

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `department_id`, `registration_number`, `phone`, `account_status`, `academic_year`, `program`) VALUES
-- Admin
(1, 'System Administrator', 'admin@college.edu', '$2a$10$nu7W7RUxm6wEoYK/FVDhxuu39mZ3zIUpE.LuKqEcxrtMx3kyC6s8e', 'admin', NULL, 'ADM2020001', '+91 9000000001', 'active', NULL, NULL),

-- Faculty / Department Approvers
(2, 'Prof. Arvind Swamy', 'faculty.cs@college.edu', '$2a$10$12lVpAC7lKCmFlQ3TUcgT.jdLayQHGifByohHA9NQZJzadUULAcni', 'faculty', 1, 'FAC2021001', '+91 9000000002', 'active', NULL, NULL),
(3, 'Prof. Sunita Rao', 'faculty.ee@college.edu', '$2a$10$12lVpAC7lKCmFlQ3TUcgT.jdLayQHGifByohHA9NQZJzadUULAcni', 'faculty', 2, 'FAC2021002', '+91 9000000003', 'active', NULL, NULL),

-- HOD
(4, 'Dr. Rajesh Sharma', 'hod.cs@college.edu', '$2a$10$lJSNN0tjm9PU9hzYuMeuheSWaYovFXJq8p0FlHvTsGj0TC90jjv3a', 'hod', 1, 'HOD2019001', '+91 9000000004', 'active', NULL, NULL),

-- Academic Office Staff
(5, 'Academic Office Registrar', 'academic.office@college.edu', '$2a$10$yEu5uhMDzIxcvJSNpLUSpukUrk9j2urLz0ESnN51SBda.8GZm0sb.', 'academic_office', NULL, 'OFF2018001', '+91 9000000005', 'active', NULL, NULL),

-- 5 Students
(6, 'Aarav Patel', 'student1@college.edu', '$2a$10$nISxwVzXCB7BVP3JVS1l3eT3f8rEGaN0ENQZ8ejPW.CtAfn3I1l6G', 'student', 1, 'CS2022001', '+91 9111111111', 'active', '4th Year', 'B.Tech Computer Science'),
(7, 'Diya Sen', 'student2@college.edu', '$2a$10$nISxwVzXCB7BVP3JVS1l3eT3f8rEGaN0ENQZ8ejPW.CtAfn3I1l6G', 'student', 1, 'CS2022002', '+91 9111111112', 'active', '3rd Year', 'B.Tech Computer Science'),
(8, 'Rohan Verma', 'student3@college.edu', '$2a$10$nISxwVzXCB7BVP3JVS1l3eT3f8rEGaN0ENQZ8ejPW.CtAfn3I1l6G', 'student', 2, 'EC2022001', '+91 9111111113', 'active', '4th Year', 'B.Tech Electronics & Comm.'),
(9, 'Kavya Nair', 'student4@college.edu', '$2a$10$nISxwVzXCB7BVP3JVS1l3eT3f8rEGaN0ENQZ8ejPW.CtAfn3I1l6G', 'student', 3, 'ME2022001', '+91 9111111114', 'active', '2nd Year', 'B.Tech Mechanical Eng.'),
(10, 'Vikram Malhotra', 'student5@college.edu', '$2a$10$nISxwVzXCB7BVP3JVS1l3eT3f8rEGaN0ENQZ8ejPW.CtAfn3I1l6G', 'student', 1, 'CS2022005', '+91 9111111115', 'active', '1st Year', 'B.Tech Computer Science');

-- 3. Document Types
INSERT INTO `document_types` (`id`, `name`, `code`, `description`, `processing_days`, `requirements`, `fee_amount`, `is_active`) VALUES
(1, 'Bona Fide Certificate', 'BONAFIDE', 'Official certificate verifying student enrollment status for bank loans, passport applications, or bus passes.', 2, 'College ID Card copy, Semester Fee Receipt', 50.00, 1),
(2, 'Academic Transcript', 'TRANSCRIPT', 'Official cumulative academic record showing all courses taken and grades earned up to the current semester.', 5, 'Consolidated Grade Sheets, ID Proof, Clearance Form', 200.00, 1),
(3, 'Recommendation Letter', 'LOR', 'Letter of recommendation endorsed by department faculty and HOD for higher studies or employment applications.', 4, 'Updated Resume, Statement of Purpose (SOP), Target University/Company Details', 100.00, 1),
(4, 'Course Completion Certificate', 'COURSE_COMPLETION', 'Certificate issued after successful completion of all degree course requirements before the convocation ceremony.', 7, 'Final Semester Marksheet, Library & Hostel Clearance, Fee Clearance', 150.00, 1),
(5, 'Bonafide / Student Status Verification', 'STATUS_VERIFICATION', 'Third-party or visa authority verification of current academic standing and active enrollment.', 3, 'Request letter from verifying agency or visa application copy', 100.00, 1),
(6, 'Other Academic Documents', 'OTHER', 'Custom academic endorsements, medium of instruction certificate, character/conduct certificate, etc.', 3, 'Specific justification and supporting proofs', 50.00, 1);

-- 4. Workflow Stages Configuration
-- Document Type 1: Bona Fide Certificate (3 stages: Faculty -> HOD -> Academic Office)
INSERT INTO `workflow_stages` (`id`, `document_type_id`, `stage_name`, `stage_order`, `approver_role`, `department_required`, `is_final_approval`) VALUES
(1, 1, 'Department Faculty Review', 1, 'faculty', 1, 0),
(2, 1, 'HOD Approval', 2, 'hod', 1, 0),
(3, 1, 'Academic Office Issuance', 3, 'academic_office', 0, 1),

-- Document Type 2: Academic Transcript (2 stages: Department Faculty Review -> Academic Office Issuance)
(4, 2, 'Department Academic Audit', 1, 'faculty', 1, 0),
(5, 2, 'Academic Office Verification & Issuance', 2, 'academic_office', 0, 1),

-- Document Type 3: Recommendation Letter (2 stages: Faculty Mentor Review -> HOD Endorsement)
(6, 3, 'Faculty Mentor Review', 1, 'faculty', 1, 0),
(7, 3, 'HOD Final Endorsement', 2, 'hod', 1, 1),

-- Document Type 4: Course Completion Certificate (3 stages: Faculty -> HOD -> Academic Office)
(8, 4, 'Department Clearance Review', 1, 'faculty', 1, 0),
(9, 4, 'HOD Approval', 2, 'hod', 1, 0),
(10, 4, 'Academic Office Final Issuance', 3, 'academic_office', 0, 1),

-- Document Type 5: Student Status Verification (2 stages: Faculty Review -> Academic Office)
(11, 5, 'Department Verification', 1, 'faculty', 1, 0),
(12, 5, 'Academic Office Sign-off', 2, 'academic_office', 0, 1),

-- Document Type 6: Other Academic Documents (2 stages: Faculty Review -> Academic Office)
(13, 6, 'Faculty Evaluation', 1, 'faculty', 1, 0),
(14, 6, 'Academic Office Approval', 2, 'academic_office', 0, 1);

-- 5. Document Requests (Diverse statuses for realistic demo)
INSERT INTO `document_requests` (`id`, `reference_number`, `student_id`, `document_type_id`, `department_id`, `purpose`, `additional_details`, `current_stage_id`, `current_status`, `correction_notes`, `submission_date`, `completion_date`) VALUES
-- Request 1: CS2022001 Bona Fide - Issued / Completed
(1, 'REQ-2026-0001', 6, 1, 1, 'Applying for State Government Education Scholarship 2026.', 'Need verification of current 4th year enrollment status and hostel residency.', 3, 'Document Issued', NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),

-- Request 2: CS2022001 Transcript - Under Department Review
(2, 'REQ-2026-0002', 6, 2, 1, 'Applying for MS in Computer Science at University of Wisconsin.', 'Required for international graduate school application deadline.', 4, 'Under Department Review', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),

-- Request 3: CS2022002 Recommendation Letter - Pending HOD Approval
(3, 'REQ-2026-0003', 7, 3, 1, 'Summer Research Internship at Indian Institute of Science (IISc).', 'Under guidance of Prof. Arvind Swamy in Distributed Systems lab.', 7, 'Pending HOD Approval', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),

-- Request 4: CS2022002 Bona Fide - Correction Required
(4, 'REQ-2026-0004', 7, 1, 1, 'Passport Renewal and Visa documentation.', 'Urgent application for international conference travel in Singapore.', 1, 'Correction Required', 'Please upload a clearer copy of your latest semester fee payment receipt. The current attachment is blurred.', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL),

-- Request 5: EC2022001 Course Completion Certificate - Submitted (pending initial faculty review)
(5, 'REQ-2026-0005', 8, 4, 2, 'Immediate joining requirement at Qualcomm India Pvt. Ltd.', 'All core credits and capstone project viva completed.', 8, 'Submitted', NULL, DATE_SUB(NOW(), INTERVAL 5 HOUR), NULL),

-- Request 6: ME2022001 Status Verification - Rejected
(6, 'REQ-2026-0006', 9, 5, 3, 'Off-campus hackathon participation NOC and verification.', 'Requesting participation certificate without submitting event endorsement.', 11, 'Rejected', 'Hackathon clashes with scheduled mid-semester examinations. Please seek written waiver from academic coordinator.', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),

-- Request 7: CS2022005 Bona Fide - Draft
(7, 'REQ-2026-0007', 10, 1, 1, 'Metro student concession railway pass renewal.', 'Daily transit between residence and college campus.', 1, 'Draft', NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL);

-- 6. Approval History for existing requests
INSERT INTO `approval_history` (`id`, `request_id`, `workflow_stage_id`, `approver_id`, `action`, `comments`, `previous_status`, `new_status`, `decision_timestamp`) VALUES
-- History for Request 1 (Fully approved and issued)
(1, 1, 1, 2, 'Approved', 'Student academic standing and attendance verified (>85%). Forwarded to HOD.', 'Submitted', 'Pending HOD Approval', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 1, 2, 4, 'Approved', 'Endorsed for State Scholarship grant. Forwarded to Academic Office.', 'Pending HOD Approval', 'Pending Academic Office Verification', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 1, 3, 5, 'Issued', 'Official Bona Fide Certificate generated and digitally certified.', 'Pending Academic Office Verification', 'Document Issued', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- History for Request 3 (Faculty approved, now waiting for HOD)
(4, 3, 6, 2, 'Approved', 'Strong candidate with grade 9.2 CGPA and published paper in IEEE conference. Recommended for HOD sign-off.', 'Submitted', 'Pending HOD Approval', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- History for Request 4 (Faculty requested correction)
(5, 4, 1, 2, 'Correction Requested', 'Please upload a clearer copy of your latest semester fee payment receipt. The current attachment is blurred.', 'Submitted', 'Correction Required', DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- History for Request 6 (Rejected by Department)
(6, 6, 11, 3, 'Rejected', 'Hackathon clashes with scheduled mid-semester examinations. Please seek written waiver from academic coordinator.', 'Submitted', 'Rejected', DATE_SUB(NOW(), INTERVAL 4 DAY));

-- 7. Supporting Documents Sample
INSERT INTO `supporting_documents` (`id`, `request_id`, `file_name`, `stored_name`, `file_path`, `file_size`, `file_type`, `upload_timestamp`) VALUES
(1, 1, 'College_ID_Card.pdf', 'demo_college_id_card.pdf', 'uploads/demo_college_id_card.pdf', 154200, 'application/pdf', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 1, 'Semester_Fee_Receipt.pdf', 'demo_fee_receipt.pdf', 'uploads/demo_fee_receipt.pdf', 210400, 'application/pdf', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 2, 'Consolidated_Grade_Card.pdf', 'demo_grade_card.pdf', 'uploads/demo_grade_card.pdf', 345000, 'application/pdf', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(4, 3, 'Student_Resume_CV.pdf', 'demo_resume.pdf', 'uploads/demo_resume.pdf', 182300, 'application/pdf', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- 8. Issued Documents Sample (For Request 1)
INSERT INTO `issued_documents` (`id`, `request_id`, `document_number`, `file_path`, `issue_date`, `issued_by`, `verification_code`, `download_count`, `last_downloaded_at`) VALUES
(1, 1, 'DOC-BON-2026-0001', 'uploads/issued_bonafide_REQ-2026-0001.pdf', DATE_SUB(NOW(), INTERVAL 1 DAY), 5, 'b7f43a9e1d82c4f091a27e3658b4cd09', 2, NOW());

-- 9. Notifications
INSERT INTO `notifications` (`id`, `user_id`, `request_id`, `title`, `message`, `read_status`, `type`, `created_at`) VALUES
-- Student 1
(1, 6, 1, 'Document Ready for Download', 'Your Bona Fide Certificate (REQ-2026-0001) has been officially issued and is available for download.', 1, 'success', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 6, 2, 'Request Under Review', 'Your Academic Transcript request (REQ-2026-0002) is currently under Department Faculty Review.', 0, 'info', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Student 2
(3, 7, 4, 'Correction Required on Request REQ-2026-0004', 'Prof. Arvind Swamy has requested corrections: Please upload a clearer copy of your fee receipt.', 0, 'warning', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 7, 3, 'Stage Advanced to HOD Approval', 'Your Recommendation Letter request (REQ-2026-0003) was approved by Faculty and forwarded to HOD Dr. Rajesh Sharma.', 0, 'info', DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Approvers
(5, 2, 2, 'New Document Request Assigned', 'Student Aarav Patel (CS2022001) submitted Academic Transcript request REQ-2026-0002.', 0, 'action', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 4, 3, 'Pending HOD Approval', 'Recommendation Letter request REQ-2026-0003 has been forwarded by Prof. Arvind Swamy for your final approval.', 0, 'action', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 10. Audit Logs
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `affected_entity`, `entity_id`, `details`, `ip_address`, `timestamp`) VALUES
(1, 1, 'SYSTEM_INIT', 'DATABASE', 1, 'Database schema and system seed configuration initialized.', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 6, 'REQUEST_SUBMIT', 'document_requests', 1, 'Submitted request for Bona Fide Certificate (REQ-2026-0001).', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 2, 'STAGE_APPROVAL', 'document_requests', 1, 'Approved stage 1 (Department Faculty Review) for REQ-2026-0001.', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 4, 'STAGE_APPROVAL', 'document_requests', 1, 'Approved stage 2 (HOD Approval) for REQ-2026-0001.', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, 5, 'DOCUMENT_ISSUE', 'issued_documents', 1, 'Generated official PDF document DOC-BON-2026-0001 for request REQ-2026-0001.', '127.0.0.1', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(6, 6, 'DOCUMENT_DOWNLOAD', 'issued_documents', 1, 'Downloaded official issued document DOC-BON-2026-0001.', '127.0.0.1', NOW());
