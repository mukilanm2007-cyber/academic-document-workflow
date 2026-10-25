import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, FileText, CheckCircle, Clock, XCircle, Award, 
  ArrowRight, BarChart3, TrendingUp, Sparkles, ChevronRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import api from '../../services/api';
import { StatusBadge } from '../../utils/statusBadges';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminStats() {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Compiling college administrative analytics..." />;
  }

  const stats = data?.stats || {};
  const docTypeData = (data?.requestsByDocType || []).map(d => ({
    name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
    requests: d.count
  }));

  const deptData = (data?.requestsByDept || []).map(d => ({
    department: d.code || d.name,
    count: d.count
  }));

  const COLORS = ['#0D9488', '#38BDF8', '#6366F1', '#A855F7', '#F59E0B', '#EF4444'];

  const statusPieData = (data?.statusDistribution || []).map(s => ({
    name: s.status,
    value: s.count
  }));

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 text-teal-400 text-xs font-semibold border border-navy-700">
            <Sparkles className="w-3.5 h-3.5" /> Institutional Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Apex Institute Document Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time oversight of student applications, department approval queues, and official document issuance.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all transform hover:-translate-y-0.5"
          >
            <BarChart3 className="w-4 h-4" /> Reports & CSV Export
          </Link>
          <Link
            to="/admin/workflows"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-white border border-navy-700 font-semibold text-xs transition-colors"
          >
            Configure Workflows
          </Link>
        </div>
      </div>

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Total Users</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{stats.total_users || 0}</span>
          <span className="text-[10px] text-slate-400">{stats.total_students || 0} Students &bull; {stats.total_faculty || 0} Staff</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Total Requests</span>
          <span className="text-xl font-bold text-navy-800 mt-1 block">{stats.total_requests || 0}</span>
          <span className="text-[10px] text-slate-400">All Departments</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Pending Review</span>
          <span className="text-xl font-bold text-amber-600 mt-1 block">{stats.pending_approvals || 0}</span>
          <span className="text-[10px] text-amber-600 font-medium">In Queue</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Approved & Issued</span>
          <span className="text-xl font-bold text-teal-600 mt-1 block">{stats.approved_requests || 0}</span>
          <span className="text-[10px] text-teal-600 font-medium">{stats.issued_documents_count || 0} PDFs Issued</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Rejected</span>
          <span className="text-xl font-bold text-rose-600 mt-1 block">{stats.rejected_requests || 0}</span>
          <span className="text-[10px] text-slate-400">With Reason</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium block">Avg Turnaround</span>
          <span className="text-xl font-bold text-indigo-600 mt-1 block">
            {stats.avg_processing_days || 2.5} Days
          </span>
          <span className="text-[10px] text-slate-400">Submission to Issue</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Requests by Document Type */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Applications by Document Type</h3>
              <p className="text-xs text-slate-500">Distribution across academic certificate categories</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={docTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="requests" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Application Status Breakdown</h3>
              <p className="text-xs text-slate-500">Current workflow distribution</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {statusPieData.length === 0 ? (
              <p className="text-xs text-slate-400">No requests submitted yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent University Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Institutional Submissions</h3>
            <p className="text-xs text-slate-500">Latest document requests across all departments</p>
          </div>
          <Link
            to="/admin/requests"
            className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
          >
            Monitor All Requests <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3">Reference ID</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.recentRequests || []).map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-navy-800">
                    {req.reference_number}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900 block">{req.student_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{req.registration_number}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{req.department_name}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{req.document_type_name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.current_status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(req.submission_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/approver/requests/${req.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                    >
                      Audit <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
