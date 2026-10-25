import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, Ban, FileText, CheckCircle2, Clock, 
  AlertTriangle, XCircle, Send, Paperclip, User, Building, Calendar, Hash, RefreshCw
} from 'lucide-react';
import { StatusBadge } from '../../utils/statusBadges';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Resubmit modal state
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [resubmitPurpose, setResubmitPurpose] = useState('');
  const [resubmitDetails, setResubmitDetails] = useState('');
  const [resubmitFiles, setResubmitFiles] = useState([]);
  const [resubmitLoading, setResubmitLoading] = useState(false);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      if (res.data.success) {
        setData(res.data);
        setResubmitPurpose(res.data.request.purpose);
        setResubmitDetails(res.data.request.additional_details || '');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await api.post(`/requests/${id}/cancel`);
      if (res.data.success) {
        success('Request cancelled successfully.');
        setCancelDialogOpen(false);
        fetchDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    setResubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('purpose', resubmitPurpose);
      formData.append('additional_details', resubmitDetails);
      resubmitFiles.forEach((f) => formData.append('attachments', f));

      const res = await api.post(`/requests/${id}/resubmit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        success('Request resubmitted successfully! It is now under department review.');
        setResubmitModalOpen(false);
        fetchDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to resubmit request.');
    } finally {
      setResubmitLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading request details and approval history..." />;
  }

  if (!data || !data.request) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Request not found or access denied.</p>
        <button
          onClick={() => navigate('/student/my-requests')}
          className="mt-4 px-4 py-2 bg-navy-800 text-white rounded-xl text-xs font-semibold"
        >
          Return to My Requests
        </button>
      </div>
    );
  }

  const { request, history, attachments, stages } = data;
  const isStudent = user?.role === 'student';
  const canCancel = isStudent && ['Draft', 'Submitted', 'Correction Required'].includes(request.current_status);
  const canResubmit = isStudent && request.current_status === 'Correction Required';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-navy-800 bg-navy-50 px-2 py-0.5 rounded-lg border border-navy-200">
                {request.reference_number}
              </span>
              <StatusBadge status={request.current_status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {request.document_type_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {canResubmit && (
            <button
              onClick={() => setResubmitModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resubmit Corrections
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => setCancelDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-xs"
            >
              <Ban className="w-3.5 h-3.5" /> Cancel Request
            </button>
          )}

          {['Document Issued', 'Completed'].includes(request.current_status) && (
            <a
              href={`/api/documents/${request.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
            >
              <Download className="w-4 h-4" /> Download Official Certificate
            </a>
          )}
        </div>
      </div>

      {/* Prominent Alert Banners based on status */}
      {request.current_status === 'Correction Required' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Action Required: Corrections Requested</h3>
              <p className="text-xs text-amber-800 mt-1 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200 font-medium leading-relaxed">
                "{request.correction_notes || 'Please verify and correct the attached documents and resubmit.'}"
              </p>
            </div>
          </div>
          <button
            onClick={() => setResubmitModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl whitespace-nowrap shadow-sm"
          >
            Resubmit Now
          </button>
        </div>
      )}

      {request.current_status === 'Rejected' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-900 text-sm">Application Rejected</h3>
            <p className="text-xs text-rose-700 mt-1 bg-rose-100/60 p-2.5 rounded-xl border border-rose-200 font-medium">
              "{request.rejection_reason || 'Department criteria not satisfied.'}"
            </p>
          </div>
        </div>
      )}

      {['Document Issued', 'Completed'].includes(request.current_status) && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Official Academic Document Issued!</h3>
              <p className="text-xs text-emerald-700">
                Document Number: <span className="font-mono font-bold text-emerald-950">{request.document_number}</span>
              </p>
            </div>
          </div>
          <a
            href={`/api/documents/${request.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm"
          >
            <Download className="w-4 h-4" /> Download PDF Now
          </a>
        </div>
      )}

      {/* Main Grid: Details + Interactive Approval Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Request Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Core Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Application Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Stated Purpose:</span>
                <p className="font-semibold text-slate-800 text-sm leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {request.purpose}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Additional Details:</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-h-[44px]">
                  {request.additional_details || 'None provided.'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Department:</span>
                <span className="font-semibold text-slate-800">{request.department_name} ({request.department_code})</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Expected Processing:</span>
                <span className="font-semibold text-slate-800">~{request.processing_days} Business Days</span>
              </div>
            </div>
          </div>

          {/* Student Information Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Student Applicant Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Full Name:</span>
                <span className="font-semibold text-slate-800">{request.student_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Roll / Reg. No:</span>
                <span className="font-mono font-bold text-slate-800">{request.registration_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Degree Program:</span>
                <span className="font-semibold text-slate-800">{request.program || 'B.Tech'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Academic Year:</span>
                <span className="font-semibold text-slate-800">{request.academic_year || 'Final Year'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Email Address:</span>
                <span className="text-slate-700">{request.student_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number:</span>
                <span className="text-slate-700">{request.student_phone || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Attached Supporting Documents Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Supporting Files & Proofs ({attachments.length})
            </h3>

            {attachments.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No supporting documents were attached with this request.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-3">
                      <Paperclip className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{file.file_name}</span>
                      <span className="text-[10px] text-slate-400">({(file.file_size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <a
                      href={`/api/documents/attachments/${file.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" /> View / Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Approval Workflow Timeline */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Approval Pipeline Timeline
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Submission Milestone */}
              <div className="relative">
                <span className="absolute -left-6 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 ring-4 ring-white text-white">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Application Submitted</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(request.submission_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Dynamic Stages Configured for this Document Type */}
              {stages.map((stg) => {
                const stageHistory = history.find(h => h.workflow_stage_id === stg.id);
                const isPassed = request.current_stage_order > stg.stage_order || ['Approved', 'Document Issued', 'Completed'].includes(request.current_status);
                const isCurrent = request.current_stage_id === stg.id && !['Completed', 'Document Issued', 'Rejected', 'Cancelled'].includes(request.current_status);

                return (
                  <div key={stg.id} className="relative">
                    <span
                      className={`absolute -left-6 top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                        isPassed
                          ? 'bg-teal-500 text-white'
                          : isCurrent
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-slate-300 text-slate-500'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : isCurrent ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <span className="text-[9px] font-bold">{stg.stage_order}</span>
                      )}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold ${isCurrent ? 'text-navy-900' : isPassed ? 'text-slate-800' : 'text-slate-400'}`}>
                          {stg.stage_name}
                        </h4>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {stg.approver_role}
                        </span>
                      </div>

                      {stageHistory ? (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                          <p className="font-semibold text-slate-700">
                            {stageHistory.action}: by {stageHistory.approver_name}
                          </p>
                          <p className="text-slate-500 italic">"{stageHistory.comments}"</p>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(stageHistory.decision_timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : isCurrent ? (
                        <p className="text-[11px] text-amber-600 font-medium">Currently awaiting reviewer action</p>
                      ) : (
                        <p className="text-[11px] text-slate-400">Pending previous milestones</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Final Document Issuance Milestone */}
              <div className="relative">
                <span
                  className={`absolute -left-6 top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                    ['Document Issued', 'Completed'].includes(request.current_status)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-300 text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                </span>
                <div>
                  <h4 className={`text-xs font-bold ${['Document Issued', 'Completed'].includes(request.current_status) ? 'text-emerald-900' : 'text-slate-400'}`}>
                    Official Document Issued
                  </h4>
                  {request.completion_date && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(request.completion_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resubmit Corrections Modal */}
      <Modal
        isOpen={resubmitModalOpen}
        onClose={() => setResubmitModalOpen(false)}
        title="Resubmit Corrected Application"
      >
        <form onSubmit={handleResubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>Approver Feedback:</strong> "{request.correction_notes}"
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Updated Purpose / Justification</label>
            <input
              type="text"
              value={resubmitPurpose}
              onChange={(e) => setResubmitPurpose(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Clarifications</label>
            <textarea
              rows={3}
              value={resubmitDetails}
              onChange={(e) => setResubmitDetails(e.target.value)}
              placeholder="Explain how you addressed the reviewer's comments..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Attach Replacement Proofs / Files</label>
            <input
              type="file"
              multiple
              onChange={(e) => setResubmitFiles(Array.from(e.target.files))}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResubmitModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resubmitLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {resubmitLoading ? 'Resubmitting...' : 'Confirm Resubmission'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Document Application?"
        message="Are you sure you want to cancel this request? Once cancelled, it cannot be processed further and you will need to create a new application."
        confirmText="Yes, Cancel Application"
        loading={cancelLoading}
      />
    </div>
  );
}
