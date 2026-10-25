import React, { useState, useEffect } from 'react';
import { Award, Download, Calendar, ShieldCheck, Search, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function IssuedDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await api.get('/documents');
        if (res.data.success) {
          setDocuments(res.data.documents);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDocuments();
  }, []);

  const filtered = documents.filter((doc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      doc.document_number?.toLowerCase().includes(q) ||
      doc.document_type_name?.toLowerCase().includes(q) ||
      doc.reference_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issued Academic Documents</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Download and store your officially authenticated university certificates and transcripts
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search certificate # or type..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching issued certificates..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No issued documents yet"
          description="Your approved documents will appear here once all required department and academic office verifications are completed."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Certified
                  </span>
                </div>

                <span className="font-mono text-xs font-bold text-navy-800 block mb-1">
                  {doc.document_number}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{doc.document_type_name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  Purpose: {doc.purpose}
                </p>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Issue Date:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      {new Date(doc.issue_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Application Ref:</span>
                    <span className="font-mono text-slate-700">{doc.reference_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Downloads:</span>
                    <span className="font-semibold text-slate-800">{doc.download_count || 0} times</span>
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
                <a
                  href={`/api/documents/${doc.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Official PDF
                </a>
                <p className="text-[10px] text-slate-400 text-center font-mono truncate">
                  Hash: {doc.verification_code?.slice(0, 16)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
