import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckSquare, ArrowRight, Filter, Clock, User } from 'lucide-react';
import { StatusBadge } from '../../utils/statusBadges';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function ApprovalQueuePage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/approvals/pending', {
        params: {
          status: statusFilter !== 'All' ? statusFilter : undefined,
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
    fetchQueue();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchQueue();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Approval Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">Evaluate student applications, attachments, and advance workflow stages</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
          {['All', 'Submitted', 'Under Department Review', 'Correction Required', 'Pending HOD Approval', 'Pending Academic Office Verification'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or ref #..."
            className="w-full pl-8 pr-16 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-2.5 bg-teal-600 text-white text-[11px] font-semibold rounded-lg hover:bg-teal-700"
          >
            Find
          </button>
        </form>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Refreshing approval queue..." />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No applications pending in this queue"
            description="All document requests matching this filter have been processed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Reference ID</th>
                  <th className="px-6 py-3.5">Applicant Details</th>
                  <th className="px-6 py-3.5">Document Type</th>
                  <th className="px-6 py-3.5">Current Status</th>
                  <th className="px-6 py-3.5">Stage Name</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
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
                      <span className="text-[11px] text-slate-500 font-mono">
                        {req.registration_number} &bull; {req.department_code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">{req.document_type_name}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{req.purpose}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.current_status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {req.current_stage_name || 'Department Review'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(req.submission_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Link
                        to={`/approver/requests/${req.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors"
                      >
                        Review <ArrowRight className="w-3.5 h-3.5" />
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
