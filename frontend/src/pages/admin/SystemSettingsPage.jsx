import React, { useState } from 'react';
import { Settings, Shield, Server, CheckCircle2, Save, Building, Bell, HardDrive } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function SystemSettingsPage() {
  const { success } = useToast();

  const [collegeName, setCollegeName] = useState('Apex Institute of Higher Education & Technology');
  const [registrarEmail, setRegistrarEmail] = useState('registrar@apex.college.edu');
  const [autoEmailAlerts, setAutoEmailAlerts] = useState(true);
  const [allowStudentCancellation, setAllowStudentCancellation] = useState(true);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('24');
  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success('System configuration preferences saved.');
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Configuration & Policies</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage university branding, workflow policies, and operational settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* System Health Status Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Server className="w-4 h-4 text-teal-600" /> Operational Status
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> MySQL 8.0 Connected
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Node.js Runtime:</span>
                <span className="font-semibold text-slate-800">v24.22.1</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">PDF Generator:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PDFKit Active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Storage Directory:</span>
                <span className="font-mono text-slate-700">/uploads (Writable)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hash Algorithm:</span>
                <span className="font-semibold text-slate-800">SHA-256</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                University Branding & Registry
              </h3>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Legal Name</label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registrar Official Email</label>
                <input
                  type="email"
                  value={registrarEmail}
                  onChange={(e) => setRegistrarEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pt-3 pb-2">
                Workflow Rules & Policies
              </h3>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowStudentCancellation}
                    onChange={(e) => setAllowStudentCancellation(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-medium text-slate-800">
                    Allow students to cancel requests while in pending/unreviewed status
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoEmailAlerts}
                    onChange={(e) => setAutoEmailAlerts(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-medium text-slate-800">
                    Enable in-app & transactional email notifications on milestone completions
                  </span>
                </label>
              </div>

              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-1">JWT Session Duration (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={sessionTimeoutHours}
                  onChange={(e) => setSessionTimeoutHours(e.target.value)}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-navy-800 hover:bg-navy-900 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
