import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, FileText, Award, Bell, User,
  CheckSquare, History, Users, Building2, Sliders, GitBranch,
  BarChart3, ShieldAlert, Settings, X, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const role = user?.role;

  const studentLinks = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/new-request', icon: PlusCircle, label: 'New Request' },
    { to: '/student/my-requests', icon: FileText, label: 'My Requests' },
    { to: '/student/issued-documents', icon: Award, label: 'Issued Documents' },
    { to: '/student/notifications', icon: Bell, label: 'Notifications' },
    { to: '/student/profile', icon: User, label: 'Profile' }
  ];

  const approverLinks = [
    { to: '/approver/dashboard', icon: LayoutDashboard, label: 'Approver Dashboard' },
    { to: '/approver/queue', icon: CheckSquare, label: 'Approval Queue' },
    { to: '/approver/history', icon: History, label: 'Decision History' },
    { to: '/approver/documents', icon: Award, label: 'Issued Documents' }
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Overview' },
    { to: '/admin/requests', icon: FileText, label: 'Monitor Requests' },
    { to: '/admin/users', icon: Users, label: 'User Directory' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/document-types', icon: Sliders, label: 'Document Types' },
    { to: '/admin/workflows', icon: GitBranch, label: 'Workflow Config' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports & Export' },
    { to: '/admin/audit-logs', icon: ShieldAlert, label: 'Audit Logs' },
    { to: '/admin/settings', icon: Settings, label: 'System Settings' }
  ];

  let links = studentLinks;
  if (role === 'admin') links = adminLinks;
  else if (['faculty', 'hod', 'academic_office'].includes(role)) links = approverLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-teal-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-wide block leading-none">APEX UNIV</span>
              <span className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">Doc Workflow</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Capsule */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-navy-950/60 border border-navy-800">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Active Session</p>
          <p className="text-sm font-bold text-white truncate mt-0.5">{user?.name}</p>
          <p className="text-xs text-teal-400 font-medium capitalize mt-0.5">
            {user?.role === 'hod' ? 'Head of Department' : user?.role === 'academic_office' ? 'Academic Registrar' : user?.role}
          </p>
          {user?.department_name && (
            <p className="text-[11px] text-slate-400 truncate mt-1">Dept: {user.department_name}</p>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 font-semibold'
                      : 'text-slate-300 hover:bg-navy-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-navy-800 text-[11px] text-slate-500 text-center">
          &copy; {new Date().getFullYear()} Apex Institute Workflow v1.0
        </div>
      </aside>
    </>
  );
}
