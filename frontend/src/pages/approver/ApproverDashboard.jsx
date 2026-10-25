import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, Clock, AlertTriangle, CheckCircle, 
  ArrowRight, Users, FileText, ChevronRight, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../utils/statusBadges';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ApproverDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApproverData() {
      try {
        const res = await api.get('/approvals/pending');
        if (res.data.success) {
          setRequests(res.data.requests);
          setStats(res.data.stats || {});
        }
      } catch (err) {
        console.error('Failed to load approver data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApproverData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading approver dashboard..." />;
  }

  const roleTitle = {
    faculty: 'Department Faculty Approver',
    hod: 'Head of Department (HOD)',
    academic_office: 'Academic Office Registrar',
    admin: 'Administrator Overseer'
  }[user?.role] || 'Academic Approver';

  const pendingCount = stats.pending_count || 0;
  const correctionCount = stats.correction_count || 0;
  const approvedCount = stats.approved_count || 0;
  const rejectedCount = stats.rejected_count || 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 text-teal-400 text-xs font-semibold border border-navy-700">
            <Sparkles className="w-3.5 h-3.5" /> Department Workflow Authority
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Approver Portal: {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Role: <span className="font-semibold text-teal-300">{roleTitle}</span> 
            {user?.department_name && ` | Department of ${user.department_name}`}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/approver/queue"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <CheckSquare className="w-4 h-4" /> Open Review Queue ({pendingCount} Pending)
          </Link>
          <Link
            to="/approver/history"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-white border border-navy-700 font-semibold text-xs transition-colors"
          >
            View Decision History
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Pending Approvals</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Awaiting Student Corrections</span>
            <span className="text-2xl font-bold text-indigo-700 mt-1 block">{correctionCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Approved & Issued</span>
            <span className="text-2xl font-bold text-teal-700 mt-1 block">{approvedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Rejected Requests</span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">{rejectedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pending Reviews Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Requests Awaiting Your Action</h3>
            <p className="text-xs text-slate-500">Student applications assigned to your authorization stage</p>
          </div>
          <Link
            to="/approver/queue"
            className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
          >
            Full Queue <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            🎉 Great job! No pending document requests in your queue right now.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Reference ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Document Type</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Submission Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-navy-800">
                      {req.reference_number}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {req.student_name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">
                      {req.registration_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800">{req.document_type_name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={req.current_status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(req.submission_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/approver/requests/${req.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors"
                      >
                        Review Application <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
