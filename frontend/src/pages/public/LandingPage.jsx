import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck2, ShieldCheck, Clock, ArrowRight, CheckCircle2,
  Users, Award, Sparkles, Building, Lock, FileText, ChevronRight
} from 'lucide-react';
import api from '../../services/api';

export default function LandingPage() {
  const [docTypes, setDocTypes] = useState([]);

  useEffect(() => {
    async function loadDocTypes() {
      try {
        const res = await api.get('/public/document-types');
        if (res.data.success) {
          setDocTypes(res.data.documentTypes);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadDocTypes();
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800/80 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-teal-400" /> Official Institutional Portal
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Digital Academic Document <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-blue-200">
              Workflow & Issuance System
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate paperwork and department queues. Request official bona fide certificates, academic transcripts, and letters of recommendation online with real-time approval tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Apply for Document <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/verify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-navy-800/80 hover:bg-navy-800 text-white border border-slate-700 font-semibold text-sm transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Verify Issued Certificate
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-navy-800/80 text-left">
            <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-teal-400 block">100%</span>
              <span className="text-xs text-slate-400 font-medium">Paperless Workflow</span>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-400 block">24-48h</span>
              <span className="text-xs text-slate-400 font-medium">Average Issuance</span>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-400 block">Multi-Tier</span>
              <span className="text-xs text-slate-400 font-medium">Department Approvals</span>
            </div>
            <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-800">
              <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 block">Tamper-Proof</span>
              <span className="text-xs text-slate-400 font-medium">Cryptographic Hash</span>
            </div>
          </div>
        </div>
      </section>

      {/* Available Documents Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Available Academic Services</h2>
          <p className="text-sm text-slate-500 mt-2">
            Select an academic document type below to view requirements and initiate your application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docTypes.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-slate-400">Loading academic catalog...</div>
          ) : (
            docTypes.map((doc) => (
              <div
                key={doc.id}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center mb-4 group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">{doc.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{doc.description}</p>
                  
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Processing Time:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600" /> ~{doc.processing_days} Business Days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Application Fee:</span>
                      <span className="font-semibold text-slate-700">
                        {parseFloat(doc.fee_amount) > 0 ? `₹${parseFloat(doc.fee_amount).toFixed(2)}` : 'Free / Included'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-navy-800 hover:text-white text-navy-900 font-semibold text-xs transition-colors"
                  >
                    Apply Now <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="bg-slate-100/70 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Automated Pipeline</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">How Document Processing Works</h2>
            <p className="text-sm text-slate-500 mt-2">
              Every application flows automatically through transparent departmental verification milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm mb-3">1</div>
              <h4 className="font-bold text-slate-800 text-sm">Online Submission</h4>
              <p className="text-xs text-slate-500 mt-1">Student submits request and uploads supporting proofs.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm mb-3">2</div>
              <h4 className="font-bold text-slate-800 text-sm">Department Review</h4>
              <p className="text-xs text-slate-500 mt-1">Faculty evaluates academic standing, dues, or requests corrections.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm mb-3">3</div>
              <h4 className="font-bold text-slate-800 text-sm">HOD Approval</h4>
              <p className="text-xs text-slate-500 mt-1">Head of Department reviews remarks and endorses application.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm mb-3">4</div>
              <h4 className="font-bold text-slate-800 text-sm">Registrar Sign-off</h4>
              <p className="text-xs text-slate-500 mt-1">Academic Office performs institutional audit and digital signing.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm mb-3">5</div>
              <h4 className="font-bold text-slate-800 text-sm">Instant Download</h4>
              <p className="text-xs text-slate-500 mt-1">Student downloads digitally authenticated PDF document.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
