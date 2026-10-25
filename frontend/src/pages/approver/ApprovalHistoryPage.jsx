import React, { useState, useEffect } from 'react';
import { History, Calendar, CheckCircle, XCircle, AlertTriangle, FileText, Search } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function ApprovalHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.get('/approvals/history');
        if (res.data.success) {
          setHistory(res.data.history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const filtered = history.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      h.reference_number?.toLowerCase().includes(q) ||
      h.student_name?.toLowerCase().includes(q) ||
      h.registration_number?.toLowerCase().includes(q) ||
      h.document_type_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Decision & Action History</h1>
          <p className="text-xs text-slate-500 mt-0.5">Auditable log of all approvals, endorsements, rejections, and corrections issued</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student or ref #..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching decision log..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No past decisions recorded"
            description="Actions you perform in the approval queue will be logged here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Reference ID</th>
                  <th className="px-6 py-3.5">Applicant Name</th>
                  <th className="px-6 py-3.5">Document Type</th>
                  <th className="px-6 py-3.5">Decision Action</th>
                  <th className="px-6 py-3.5">Comments & Remarks</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-navy-800">
                      {item.reference_number}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 block">{item.student_name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.registration_number}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {item.document_type_name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.action === 'Approved' || item.action === 'Issued'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : item.action === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.action === 'Approved' || item.action === 'Issued' ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : item.action === 'Rejected' ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {item.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs text-slate-600 truncate">
                      "{item.comments}"
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(item.decision_timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
