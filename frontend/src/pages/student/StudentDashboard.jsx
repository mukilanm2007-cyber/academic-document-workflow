import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Clock, CheckCircle2, Award, AlertTriangle, PlusCircle, 
  ArrowRight, Download, Calendar, Sparkles, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../utils/statusBadges';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/requests/my');
        if (res.data.success) {
          setRequests(res.data.requests);
        }
      } catch (err) {
        console.error('Failed to load student requests:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading student dashboard..." />;
  }

  const total = requests.length;
  const pending = requests.filter(r => ['Submitted', 'Under Department Review', 'Pending HOD Approval', 'Pending Academic Office Verification'].includes(r.current_status)).length;
  const issued = requests.filter(r => ['Document Issued', 'Completed'].includes(r.current_status)).length;
  const corrections = requests.filter(r => r.current_status === 'Correction Required').length;

  const activeRequests = requests.filter(r => !['Completed', 'Cancelled', 'Rejected'].includes(r.current_status)).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-teal-500/10 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-950/60 text-teal-400 text-xs font-semibold border border-navy-700">
            <Sparkles className="w-3.5 h-3.5" /> Student Academic Services
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Roll No: <span className="font-mono text-teal-300">{user?.registration_number || 'CS2022001'}</span> | Department: {user?.department_name || 'Engineering'} | {user?.program || 'B.Tech'}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/student/new-request"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" /> Apply for New Document
          </Link>
          <Link
            to="/student/my-requests"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-white border border-navy-700 font-semibold text-xs transition-colors"
          >
            View All Applications ({total})
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Applications</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Under Processing</span>
            <span className="text-2xl font-bold text-indigo-700 mt-1 block">{pending}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Issued Documents</span>
            <span className="text-2xl font-bold text-teal-700 mt-1 block">{issued}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Action Required</span>
            <span className="text-2xl font-bold text-amber-700 mt-1 block">{corrections}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Required Banner if Corrections Exist */}
      {corrections > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Correction Required on {corrections} request(s)!</span>
              <p className="text-xs text-amber-700 mt-0.5">Faculty approver has requested additional details or clearer files.</p>
            </div>
          </div>
          <Link
            to="/student/my-requests?status=Correction+Required"
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs whitespace-nowrap shadow-sm"
          >
            Review & Resubmit
          </Link>
        </div>
      )}

      {/* Active Requests List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Active Applications Tracking</h3>
            <p className="text-xs text-slate-500">Live progress of your current academic requests</p>
          </div>
          <Link
            to="/student/my-requests"
            className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {activeRequests.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            You do not have any pending requests. Click "Apply for New Document" to submit a request.
          </div>
        ) : (
          <div className="space-y-3">
            {activeRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-navy-800">{req.reference_number}</span>
                    <StatusBadge status={req.current_status} size="sm" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{req.document_type_name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">Purpose: {req.purpose}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(req.submission_date).toLocaleDateString()}
                  </span>

                  {['Document Issued', 'Completed'].includes(req.current_status) && (
                    <a
                      href={`/api/documents/${req.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}

                  <Link
                    to={`/student/requests/${req.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
