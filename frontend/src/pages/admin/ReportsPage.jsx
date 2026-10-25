import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Filter, Calendar, FileText, 
  CheckCircle, Clock, XCircle, Search, RefreshCw 
} from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../utils/statusBadges';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function ReportsPage() {
  const [departments, setDepartments] = useState([]);
  const [docTypes, setDocTypes] = useState([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentId, setDepartmentId] = useState('All');
  const [docTypeId, setDocTypeId] = useState('All');
  const [status, setStatus] = useState('All');
  const [registrationNumber, setRegistrationNumber] = useState('');

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchMeta = async () => {
    try {
      const [deptRes, docRes] = await Promise.all([
        api.get('/public/departments'),
        api.get('/public/document-types')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.departments);
      if (docRes.data.success) setDocTypes(docRes.data.documentTypes);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          department_id: departmentId !== 'All' ? departmentId : undefined,
          doc_type_id: docTypeId !== 'All' ? docTypeId : undefined,
          status: status !== 'All' ? status : undefined,
          registration_number: registrationNumber.trim() || undefined
        }
      });
      if (res.data.success) {
        setRecords(res.data.records);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [departmentId, docTypeId, status]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (departmentId !== 'All') params.append('department_id', departmentId);
    if (docTypeId !== 'All') params.append('doc_type_id', docTypeId);
    if (status !== 'All') params.append('status', status);
    if (registrationNumber.trim()) params.append('registration_number', registrationNumber.trim());
    params.append('format', 'csv');

    window.open(`/api/admin/reports?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutional Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">Filter, audit, and export comprehensive document processing metrics</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Export Report (CSV)
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Filtered</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{summary.total || 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Approved / Issued</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{summary.approved || 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Pending Review</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">{summary.pending || 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Corrections</span>
          <span className="text-2xl font-bold text-indigo-700 mt-1 block">{summary.corrections || 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Rejected</span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">{summary.rejected || 0}</span>
        </div>
      </div>

      {/* Filter Form Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Document Type</label>
            <select
              value={docTypeId}
              onChange={(e) => setDocTypeId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="All">All Documents</option>
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>{dt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Department Review">Dept Review</option>
              <option value="Correction Required">Correction Required</option>
              <option value="Approved">Approved</option>
              <option value="Document Issued">Document Issued</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-1.5 px-3 bg-navy-800 hover:bg-navy-900 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Filter
            </button>
          </div>
        </form>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Generating report table..." />
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No records found matching specified parameters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Reference ID</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Document Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submission</th>
                  <th className="px-4 py-3">Turnaround</th>
                  <th className="px-4 py-3">Issued Doc #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-navy-800">{r.reference_number}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.student_name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.registration_number}</td>
                    <td className="px-4 py-3 text-slate-600">{r.department_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.document_type_name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.current_status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(r.submission_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">
                      {r.turnaround_days ? `${Number(r.turnaround_days).toFixed(1)} d` : 'In Progress'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-teal-700">
                      {r.issued_doc_number || '—'}
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
