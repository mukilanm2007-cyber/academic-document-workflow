import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FileText, Search, PlusCircle, Calendar, Download, 
  ArrowRight, Filter, AlertTriangle, Eye 
} from 'lucide-react';
import { StatusBadge } from '../../utils/statusBadges';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function MyRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'All';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');

  const statusTabs = [
    'All',
    'Submitted',
    'Under Department Review',
    'Correction Required',
    'Pending HOD Approval',
    'Document Issued',
    'Rejected'
  ];

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      try {
        const res = await api.get('/requests/my', {
          params: {
            status: selectedStatus !== 'All' ? selectedStatus : undefined
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
    }
    fetchRequests();
  }, [selectedStatus]);

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.reference_number?.toLowerCase().includes(q) ||
      r.document_type_name?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Document Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track and manage all your submitted academic document requests</p>
        </div>
        <Link
          to="/student/new-request"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> New Application
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
            {statusTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedStatus(tab);
                  setSearchParams(tab === 'All' ? {} : { status: tab });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedStatus === tab
                    ? 'bg-navy-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or purpose..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Requests Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading applications..." />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            title="No applications match your filter"
            description="You have not submitted requests in this category or no results matched your search."
            action={
              <Link
                to="/student/new-request"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Start Application
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Reference ID</th>
                  <th className="px-6 py-3.5">Document Type</th>
                  <th className="px-6 py-3.5">Current Status</th>
                  <th className="px-6 py-3.5">Current Stage</th>
                  <th className="px-6 py-3.5">Submitted On</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-navy-800">
                      {req.reference_number}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 block">{req.document_type_name}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{req.purpose}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.current_status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-slate-600">
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-xs border border-teal-200"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>
                        )}
                        <Link
                          to={`/student/requests/${req.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
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
