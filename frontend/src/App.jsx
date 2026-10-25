import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import ServicesPage from './pages/public/ServicesPage';
import AboutPage from './pages/public/AboutPage';
import VerifyCertificatePage from './pages/public/VerifyCertificatePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import NewRequestPage from './pages/student/NewRequestPage';
import MyRequestsPage from './pages/student/MyRequestsPage';
import RequestDetailPage from './pages/student/RequestDetailPage';
import IssuedDocumentsPage from './pages/student/IssuedDocumentsPage';
import NotificationsPage from './pages/student/NotificationsPage';
import StudentProfilePage from './pages/student/StudentProfilePage';

// Approver Pages
import ApproverDashboard from './pages/approver/ApproverDashboard';
import ApprovalQueuePage from './pages/approver/ApprovalQueuePage';
import ApprovalDetailPage from './pages/approver/ApprovalDetailPage';
import ApprovalHistoryPage from './pages/approver/ApprovalHistoryPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import DepartmentManagementPage from './pages/admin/DepartmentManagementPage';
import DocumentTypeManagementPage from './pages/admin/DocumentTypeManagementPage';
import WorkflowConfigPage from './pages/admin/WorkflowConfigPage';
import RequestMonitoringPage from './pages/admin/RequestMonitoringPage';
import ReportsPage from './pages/admin/ReportsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';

function UniversalRequestRedirect() {
  const { id } = useParams();
  const { user } = useAuth();
  if (user?.role === 'student') return <Navigate to={`/student/requests/${id}`} replace />;
  return <Navigate to={`/approver/requests/${id}`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/verify" element={<VerifyCertificatePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="new-request" element={<NewRequestPage />} />
        <Route path="my-requests" element={<MyRequestsPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="issued-documents" element={<IssuedDocumentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Approver Routes (Faculty, HOD, Academic Office) */}
      <Route
        path="/approver"
        element={
          <ProtectedRoute allowedRoles={['faculty', 'hod', 'academic_office', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ApproverDashboard />} />
        <Route path="queue" element={<ApprovalQueuePage />} />
        <Route path="requests/:id" element={<ApprovalDetailPage />} />
        <Route path="history" element={<ApprovalHistoryPage />} />
        <Route path="documents" element={<IssuedDocumentsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="requests" element={<RequestMonitoringPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="departments" element={<DepartmentManagementPage />} />
        <Route path="document-types" element={<DocumentTypeManagementPage />} />
        <Route path="workflows" element={<WorkflowConfigPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Universal Request Redirect */}
      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute allowedRoles={['student', 'faculty', 'hod', 'academic_office', 'admin']}>
            <UniversalRequestRedirect />
          </ProtectedRoute>
        }
      />

      {/* Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
