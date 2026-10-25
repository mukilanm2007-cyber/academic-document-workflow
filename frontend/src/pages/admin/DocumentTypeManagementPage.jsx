import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Edit2, Clock, CheckCircle2, XCircle, FileText, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

export default function DocumentTypeManagementPage() {
  const { success, error: toastError } = useToast();

  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    processing_days: 3,
    requirements: '',
    fee_amount: 0,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDocTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/document-types');
      if (res.data.success) {
        setDocTypes(res.data.documentTypes);
      }
    } catch (err) {
      toastError('Failed to fetch document types.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocTypes();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/admin/document-types', formData);
      if (res.data.success) {
        success('Document type created successfully!');
        setCreateModalOpen(false);
        setFormData({ name: '', code: '', description: '', processing_days: 3, requirements: '', fee_amount: 0, is_active: true });
        fetchDocTypes();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create document type.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/admin/document-types/${selectedDoc.id}`, selectedDoc);
      if (res.data.success) {
        success('Document type updated successfully.');
        setEditModalOpen(false);
        setSelectedDoc(null);
        fetchDocTypes();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update document type.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Document Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure certificate offerings, required proofs, fees, and standard processing SLAs</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Document Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3">
            <LoadingSpinner text="Loading document configuration..." />
          </div>
        ) : (
          docTypes.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    doc.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {doc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <span className="font-mono text-xs font-bold text-teal-700 block mb-1">{doc.code}</span>
                <h3 className="font-bold text-slate-900 text-base mb-2">{doc.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{doc.description}</p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Processing SLA:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" /> ~{doc.processing_days} Days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fee Amount:</span>
                    <span className="font-semibold text-slate-800">₹{parseFloat(doc.fee_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Workflow Stages:</span>
                    <span className="font-semibold text-slate-800">{doc.stage_count || 0} Stages</span>
                  </div>
                </div>

                {doc.requirements && (
                  <div className="text-[11px] text-slate-600 mb-3">
                    <span className="font-bold text-slate-700 block mb-0.5">Required Proofs:</span>
                    <p className="text-slate-500 truncate">{doc.requirements}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedDoc({ ...doc });
                    setEditModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-sm transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Configuration
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="New Document Type">
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Medium of Instruction Certificate"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Document Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. MOI_CERT"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Processing Time (Days)</label>
              <input
                type="number"
                min="1"
                value={formData.processing_days}
                onChange={(e) => setFormData({ ...formData, processing_days: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fee (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.fee_amount}
                onChange={(e) => setFormData({ ...formData, fee_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mandatory Requirements / Documents</label>
            <input
              type="text"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g. College ID Card, Marksheet"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm"
            >
              {submitting ? 'Creating...' : 'Create Type'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {selectedDoc && (
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit: ${selectedDoc.name}`}>
          <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Name</label>
              <input
                type="text"
                value={selectedDoc.name}
                onChange={(e) => setSelectedDoc({ ...selectedDoc, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Processing Time (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={selectedDoc.processing_days}
                  onChange={(e) => setSelectedDoc({ ...selectedDoc, processing_days: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={selectedDoc.fee_amount}
                  onChange={(e) => setSelectedDoc({ ...selectedDoc, fee_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Requirements</label>
              <textarea
                rows={2}
                value={selectedDoc.requirements || ''}
                onChange={(e) => setSelectedDoc({ ...selectedDoc, requirements: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={!!selectedDoc.is_active}
                  onChange={(e) => setSelectedDoc({ ...selectedDoc, is_active: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-800">Document Type Active and Available for Request</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white font-bold rounded-xl shadow-sm"
              >
                {submitting ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
