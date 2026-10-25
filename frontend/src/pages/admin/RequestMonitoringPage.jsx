import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, ArrowRight, Download, Calendar, CheckSquare } from 'lucide-react';
import { StatusBadge } from '../../utils/statusBadges';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function RequestMonitoringPage() {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('All');
  const [departmentId, setDepartmentId] = useState('All');
  const [docTypeId, setDocTypeId] = useState('All');
  const [search, setSearch] = useState('');

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

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/pending', {
        params: {
          status: status !== 'All' ? status : undefined,
          department_id: departmentId !== 'All' ? departmentId : undefined,
          doc_type_id: docTypeId !== 'All' ? docTypeId : undefined,
          search: search.trim() || undefined
        }
      });
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [status, departmentId, docTypeId]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institution-Wide Request Monitoring</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status tracking of all document requests across all departments</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Department Review">Under Department Review</option>
              <option value="Correction Required">Correction Required</option>
              <option value="Pending HOD Approval">Pending HOD Approval</option>
              <option value="Pending Academic Office Verification">Office Verification</option>
              <option value="Approved">Approved</option>
              <option value="Document Issued">Document Issued</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Document Type</label>
            <select
              value={docTypeId}
              onChange={(e) => setDocTypeId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="All">All Document Types</option>
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>{dt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ref #, Student, Roll No..."
                className="w-full pl-3 pr-8 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
              />
              <button type="submit" className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Compiling requests database..." />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No applications match query"
            description="Adjust your search or filter options to inspect other requests."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Reference ID</th>
                  <th className="px-6 py-3.5">Student Details</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Document Type</th>
                  <th className="px-6 py-3.5">Workflow Status</th>
                  <th className="px-6 py-3.5">Current Stage</th>
                  <th className="px-6 py-3.5">Submission Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-navy-800">
                      {req.reference_number}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 block">{req.student_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{req.registration_number}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {req.department_name} ({req.department_code})
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">{req.document_type_name}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{req.purpose}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.current_status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {req.current_stage_name || 'Workflow Processing'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(req.submission_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {['Document Issued', 'Completed'].includes(req.current_status) && (
                          <a
                            href={`/api/documents/${req.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-semibold border border-teal-200"
                          >
                            <Download className="w-3 h-3" /> PDF
                          </a>
                        )}
                        <Link
                          to={`/approver/requests/${req.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                        >
                          <Eye className="w-3 h-3" /> Details
                        </Link>
                      </div>
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
