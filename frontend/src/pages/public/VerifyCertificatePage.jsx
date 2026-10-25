import React, { useState } from 'react';
import { Search, ShieldCheck, AlertCircle, FileCheck, Calendar, User, Building, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function VerifyCertificatePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.get(`/public/verify/${encodeURIComponent(code.trim())}`);
      if (res.data.success && res.data.verified) {
        setResult(res.data.certificate);
      } else {
        setError('No valid academic record found matching this verification query.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Certificate record not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Official Certificate Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Verify the authenticity of any bona fide certificate, transcript, or academic endorsement issued by Apex Institute.
        </p>
      </div>

      {/* Verification Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter Document Number (e.g. DOC-BON-2026-0001) or Hash"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify Record'}
          </button>
        </form>
        <p className="text-[11px] text-slate-400 mt-2">
          Tip: You can test with demo document number: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">DOC-BON-2026-0001</code>
        </p>
      </div>

      {/* Verification Result Card */}
      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 border-b border-emerald-200/60 pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-base">Officially Verified & Authentic</h3>
              <p className="text-xs text-emerald-700">Document certified by Apex Institute of Higher Education & Technology</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 block mb-0.5">Document Type:</span>
              <span className="font-bold text-slate-800 text-sm">{result.document_type_name}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 block mb-0.5">Certificate Number:</span>
              <span className="font-bold font-mono text-slate-800 text-sm">{result.document_number}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 block mb-0.5">Student Name:</span>
              <span className="font-bold text-slate-800">{result.student_name}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 block mb-0.5">Registration Number:</span>
              <span className="font-bold font-mono text-slate-800">{result.registration_number}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 block mb-0.5">Department:</span>
              <span className="font-semibold text-slate-800">{result.department_name}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-emerald-100">
              <span className="text-slate-400 block mb-0.5">Issuance Date:</span>
              <span className="font-semibold text-slate-800">{new Date(result.issue_date).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-mono break-all">
            Cryptographic Hash: {result.verification_code}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 animate-in fade-in">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-600 mb-2" />
          <h3 className="font-bold text-base mb-1">Verification Unsuccessful</h3>
          <p className="text-xs text-rose-600">{error}</p>
        </div>
      )}
    </div>
  );
}
