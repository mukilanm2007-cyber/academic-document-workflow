import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Upload, Clock, CheckCircle2, AlertCircle, X, 
  Send, Save, ArrowLeft, Info, Paperclip 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function NewRequestPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [docTypes, setDocTypes] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTypes, setFetchingTypes] = useState(true);

  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await api.get('/public/document-types');
        if (res.data.success) {
          setDocTypes(res.data.documentTypes);
          if (res.data.documentTypes.length > 0) {
            setSelectedDocId(res.data.documentTypes[0].id.toString());
          }
        }
      } catch (err) {
        toastError('Failed to load document types.');
      } finally {
        setFetchingTypes(false);
      }
    }
    loadTypes();
  }, []);

  const selectedDoc = docTypes.find((d) => d.id.toString() === selectedDocId.toString());

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      // Validate file size (max 5MB each)
      const validFiles = selectedFiles.filter(f => f.size <= 5 * 1024 * 1024);
      if (validFiles.length < selectedFiles.length) {
        toastError('Some files were ignored because they exceed the 5MB size limit.');
      }
      setFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (isDraft = false) => {
    if (!selectedDocId) {
      toastError('Please choose a document type.');
      return;
    }

    if (!purpose.trim() || purpose.trim().length < 5) {
      toastError('Please state the specific purpose of the document (min 5 characters).');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document_type_id', selectedDocId);
      formData.append('purpose', purpose.trim());
      formData.append('additional_details', additionalDetails.trim());
      formData.append('is_draft', isDraft ? 'true' : 'false');

      files.forEach((file) => {
        formData.append('attachments', file);
      });

      const res = await api.post('/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        success(isDraft ? 'Request saved as draft!' : 'Document request submitted successfully!');
        navigate(`/student/requests/${res.data.requestId}`);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to submit document request.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingTypes) {
    return <LoadingSpinner text="Loading academic services..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Academic Document Application</h1>
          <p className="text-xs text-slate-500 mt-0.5">Submit an official request to your department for approval</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Step 1: Document Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            1. Select Document Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {docTypes.map((doc) => {
              const isSelected = selectedDocId.toString() === doc.id.toString();
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id.toString())}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900">{doc.name}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{doc.description}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-600 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1 text-teal-700 font-semibold">
                      <Clock className="w-3 h-3" /> ~{doc.processing_days} Days
                    </span>
                    <span className="font-medium text-slate-500">
                      {parseFloat(doc.fee_amount) > 0 ? `₹${parseFloat(doc.fee_amount)}` : 'Free'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Requirements Box for Selected Document */}
        {selectedDoc && selectedDoc.requirements && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">Department Mandatory Requirements:</span>
              <p className="text-slate-600 mt-0.5">{selectedDoc.requirements}</p>
            </div>
          </div>
        )}

        {/* Step 2: Request Purpose and Details */}
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            2. Purpose & Academic Justification
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purpose of Request <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Applying for State Higher Education Scholarship / Visa Application / Employment"
              required
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              This reason will be officially inscribed on the generated certificate or verification document.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Details / Specific Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Provide any specific notes, semester marks breakdown, target organization, or urgency details..."
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Step 3: Supporting File Uploads */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            3. Upload Supporting Documents
          </label>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              Drag and drop supporting files here, or{' '}
              <label className="text-teal-600 hover:text-teal-800 cursor-pointer underline">
                browse files
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Accepted formats: PDF, DOCX, JPG, PNG (Max 5MB per file, up to 5 files)
            </p>
          </div>

          {/* Uploaded File List */}
          {files.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-700 block">Attached Files ({files.length}):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-800">{file.name}</span>
                      <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save as Draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> {loading ? 'Submitting Application...' : 'Submit Application for Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
