# Digital Academic Document Workflow System

An enterprise-grade, full-stack academic document requesting, review, approval, and issuance web application built for colleges and universities. The platform digitizes paper-heavy workflows, allowing students to apply for bona fide certificates, transcripts, and recommendation letters online with multi-tier departmental approvals and cryptographic PDF issuance.

---

## 🏛️ Key Features

- **Multi-Role Role-Based Access Control (RBAC)**:
  - **Student**: Submit applications, upload proofs, track live progress timeline, resubmit requested corrections, download digitally issued certificates.
  - **Faculty Approver**: Review department-specific student requests, inspect attachments, approve & advance, request corrections, or reject with mandatory comments.
  - **Head of Department (HOD)**: Department-level executive review and endorsement.
  - **Academic Office / Registrar**: University-wide audit, final approval, and automated digital certificate generation with cryptographic verification hash.
  - **System Administrator**: Manage user accounts, departments, document offerings, configurable approval workflow pipelines, institutional analytics, audit trails, and CSV reports.

- **Dynamic Multi-Tier Approval Workflow Engine**:
  - Configurable review pipelines per document type (e.g. Faculty -> HOD -> Registrar).
  - Workflow transitions enforced strictly on the backend.
  - Automatic status transitions: `Draft` -> `Submitted` -> `Under Department Review` -> `Pending HOD Approval` -> `Pending Academic Office Verification` -> `Document Issued` -> `Completed`.
  - Correction cycle with dedicated notes, allowing students to fix attachments and resubmit without restarting the application.

- **Automated PDF Generation & Tamper Protection**:
  - Dynamic PDF generation via `pdfkit` embedding university branding, student credentials, purpose, registrar digital signature placeholders, and cryptographic SHA-256 anti-tamper hashes.
  - Public `/verify` endpoint allowing employers, embassies, and institutions to verify document authenticity online.

- **Reports & Data Export**:
  - Filterable by date range, department, document type, status, and student roll number.
  - 1-Click CSV export.

---

## 💻 Technology Stack

### Frontend
- **React.js 18** with **Vite**
- **Tailwind CSS** (Navy Blue `#0F172A`, Crisp White `#FFFFFF`, Teal Accent `#0D9488`)
- **React Router v6** for client-side navigation
- **Axios** with Bearer token interceptors & session handling
- **Lucide React** for icons
- **Recharts** for administrative analytics and workflow charts

### Backend
- **Node.js** & **Express.js** REST API
- **JWT (JSON Web Token)** for stateless authentication
- **bcryptjs** (10-round salted hashing)
- **Multer** for secure file uploads with MIME & size restrictions (5MB limit)
- **PDFKit** for server-side institutional certificate generation
- **Helmet** & **Express Rate Limiting** for web security

### Database
- **MySQL 8.0**
- Structured relational tables with foreign keys and cascade rules
- Parameterized queries via `mysql2/promise` connection pooling to prevent SQL injection

---

## 📁 Project Architecture

```
academic-document-workflow/
├── backend/
│   ├── src/
│   │   ├── config/          # MySQL connection pool & automated database initialization
│   │   ├── controllers/     # Auth, Request, Approval, Document, Admin, Notification controllers
│   │   ├── middleware/      # JWT auth, RBAC authorization, Multer uploads, centralized error handling
│   │   ├── routes/          # REST API route declarations
│   │   ├── services/        # Workflow state machine, PDFKit generation, Notifications, Audit logs
│   │   ├── utils/           # Logger
│   │   ├── validators/      # Input validation logic
│   │   ├── app.js           # Express application configuration
│   │   └── server.js        # Server bootstrapper & DB auto-checker
│   ├── tests/
│   │   ├── workflow.test.js    # Unit tests for RBAC, status mapping, and authorization
│   │   └── integration.test.js # End-to-end integration tests (Auth -> Request -> Approval -> PDF -> CSV)
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # Badges, Modals, ConfirmDialogs, Navbar, Sidebar, Spinners
│   │   ├── context/         # AuthContext (JWT session) and ToastContext (UI alerts)
│   │   ├── layouts/         # PublicLayout and DashboardLayout
│   │   ├── pages/
│   │   │   ├── public/      # LandingPage, ServicesPage, AboutPage, LoginPage, RegisterPage, VerifyCertificatePage
│   │   │   ├── student/     # StudentDashboard, NewRequestPage, MyRequestsPage, RequestDetailPage, IssuedDocumentsPage, Profile
│   │   │   ├── approver/    # ApproverDashboard, ApprovalQueuePage, ApprovalDetailPage, ApprovalHistoryPage
│   │   │   └── admin/       # AdminDashboard, UserManagement, DepartmentManagement, DocumentTypes, Workflows, Reports, AuditLogs
│   │   ├── services/        # Axios API client
│   │   ├── utils/           # Reusable status badges
│   │   ├── App.jsx          # Role-based route definitions
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── database/
│   ├── schema.sql           # Database DDL: 11 tables with foreign keys, enums, and indexes
│   ├── seed.sql             # Realistic demo dataset (Users, Departments, Document Types, Workflows, Requests)
│   └── mysql-data/          # Local standalone MySQL data directory
├── uploads/                 # Server storage for uploads and issued PDFs
├── start-db.ps1             # PowerShell script to start standalone MySQL Community Server on port 3307
├── package.json             # Root runner scripts
└── README.md
```

---

## 🔑 Demo Login Credentials

The seed data provides pre-configured accounts across all roles. The login page also features **1-Click Demo Fill buttons** for testing.

| Role | Name | Email Address | Password | Department / Roll No |
|---|---|---|---|---|
| **System Administrator** | System Administrator | `admin@college.edu` | `Admin@123` | All Departments |
| **Faculty Approver** | Prof. Arvind Swamy | `faculty.cs@college.edu` | `Faculty@123` | Computer Science (CSE) |
| **Faculty Approver** | Prof. Sunita Rao | `faculty.ee@college.edu` | `Faculty@123` | Electronics (ECE) |
| **Head of Dept (HOD)** | Dr. Rajesh Sharma | `hod.cs@college.edu` | `Hod@123` | Computer Science (CSE) |
| **Academic Office** | Academic Registrar | `academic.office@college.edu` | `Office@123` | Office of Academic Affairs |
| **Student 1** | Aarav Patel | `student1@college.edu` | `Student@123` | CSE &bull; `CS2022001` (4th Year) |
| **Student 2** | Diya Sen | `student2@college.edu` | `Student@123` | CSE &bull; `CS2022002` (3rd Year) |
| **Student 3** | Rohan Verma | `student3@college.edu` | `Student@123` | ECE &bull; `EC2022001` (4th Year) |
| **Student 4** | Kavya Nair | `student4@college.edu` | `Student@123` | MECH &bull; `ME2022001` (2nd Year) |
| **Student 5** | Vikram Malhotra | `student5@college.edu` | `Student@123` | CSE &bull; `CS2022005` (1st Year) |

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Node.js**: v18+ or v24+
- **MySQL Server**: 8.0 Community Server installed (or using the local standalone datadir in `database/mysql-data`)

### 1. Start the MySQL Server
Run the local MySQL server script:
```powershell
./start-db.ps1
```
*Note: This starts MySQL 8.0 on `127.0.0.1:3307` with `root` user and empty password.*

Alternatively, if you are using an existing MySQL service running on port 3306:
Update `backend/.env` with your MySQL credentials:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=academic_document_workflow
```

### 2. Initialize and Seed the Database
Run the turnkey database initializer:
```powershell
npm run init-db
```
This automatically connects to MySQL, executes `database/schema.sql`, and seeds initial data from `database/seed.sql`.

### 3. Start the Backend API Server
```powershell
npm run backend
```
- Server starts at: **`http://localhost:5000`**
- Health check: **`http://localhost:5000/api/health`**

### 4. Start the Frontend Development Server
In a new terminal window:
```powershell
npm run frontend
```
- Web Application opens at: **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

Run backend unit and integration tests:
```powershell
npm test
```

### Test Coverage Summary:
- **Unit Tests (`workflow.test.js`)**:
  - Salting and bcrypt password hashing & verification.
  - JWT generation, payload decoding, and expiration validation.
  - Workflow role-to-status mapping engine.
  - Authorization permission matrix (Faculty department matching, Student blockage, Admin override).
- **Integration Tests (`integration.test.js`)**:
  - End-to-end student login -> request creation (`REQ-YYYY-XXXX`).
  - Faculty stage review and approval.
  - HOD approval milestone.
  - Academic Office sign-off and dynamic PDF certificate generation.
  - Student secure PDF download verification.
  - Admin dashboard stats, CSV report export, and public `/verify` lookup.

---

## 🛡️ Security Features

1. **Authentication & Authorization**:
   - Passwords hashed using `bcrypt` (10 rounds).
   - JWT tokens signed with server-side secrets.
   - RBAC middleware (`authorizeRoles`) strictly enforced on all REST endpoints.
2. **SQL Injection Defense**:
   - 100% parameterized queries via `mysql2/promise`.
3. **Data Privacy**:
   - Students can only view their own requests and downloads.
   - Cross-student access returns HTTP 403 Forbidden.
4. **Anti-Tamper Digital Certificates**:
   - Issued PDFs feature cryptographic SHA-256 verification hashes verifiable at `/verify`.
   - File downloads increment download audit counts.
5. **Rate Limiting & Security Headers**:
   - Helmet protection for cross-origin security headers.
   - IP rate-limiting on authentication endpoints (max 100 requests per 15 minutes).

---

## 📜 Academic Document Types Included

1. **Bona Fide Certificate** (Enrollment verification for bank loans, passport, transit pass)
2. **Academic Transcript** (Official record of completed courses and semester grades)
3. **Recommendation Letter (LOR)** (Faculty and HOD academic endorsement for higher studies)
4. **Course Completion Certificate** (Provisional degree sign-off)
5. **Student Status Verification** (Third-party & visa authority verification)
6. **Other Academic Documents** (Medium of instruction, character endorsements)

---

## 📄 License
Apex Institute of Technology & Science - Educational & Administrative Academic License.
