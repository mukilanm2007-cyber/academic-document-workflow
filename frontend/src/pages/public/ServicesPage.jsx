import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, FileCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export default function ServicesPage() {
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const res = await api.get('/public/document-types');
        if (res.data.success) {
          setDocTypes(res.data.documentTypes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          Academic Document Services Catalog
        </h1>
        <p className="mt-3 text-base text-slate-500">
          Apex Institute offers direct digital request processing for all official college certifications, transcripts, and records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docTypes.map((doc) => (
          <div
            key={doc.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                  {doc.code}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">{doc.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{doc.description}</p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" /> Processing Duration
                  </span>
                  <span className="font-semibold text-slate-800">{doc.processing_days} Business Days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Application Fee</span>
                  <span className="font-semibold text-slate-800">
                    {parseFloat(doc.fee_amount) > 0 ? `₹${parseFloat(doc.fee_amount).toFixed(2)}` : 'Free'}
                  </span>
                </div>
              </div>

              {doc.requirements && (
                <div className="text-xs text-slate-600 mb-4">
                  <span className="font-semibold text-slate-700 block mb-1">Required Documents:</span>
                  <p className="text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {doc.requirements}
                  </p>
                </div>
              )}
            </div>

            <Link
              to="/login"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-medium text-xs transition-colors"
            >
              Apply Online <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
