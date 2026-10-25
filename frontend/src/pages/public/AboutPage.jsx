import React from 'react';
import { Shield, CheckCircle, Lock, Users, Cpu, FileCheck } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Institutional Governance</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
          About the Digital Academic Document Workflow System
        </h1>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          Apex Institute’s digital academic documentation infrastructure provides an auditable, multi-tier automated pipeline for verifying student academic credentials and issuing digitally signed documents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Role-Based Segregation</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Strict separation of duties between Students, Department Faculty mentors, Heads of Department (HODs), and the Academic Registrar's Office.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Cryptographic Verification</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every issued PDF document embeds a SHA-256 cryptographic verification checksum, allowing embassies, employers, and graduate schools to authenticate records instantly.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Comprehensive Audit Trail</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every action, approval milestone, rejection explanation, correction note, and file download is persistently timestamped and logged for regulatory compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
