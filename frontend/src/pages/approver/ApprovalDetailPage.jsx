import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Download, 
  Paperclip, User, Building, Calendar, Hash, FileText, Send, ShieldCheck
} from 'lucide-react';
import { StatusBadge } from '../../utils/statusBadges';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

export default function ApprovalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Decision Modal States
  const [actionType, setActionType] = useState(null); // 'Approve' | 'Reject' | 'Correction'
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      if (res.data.success) {
        setData(res.data);
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

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if ((actionType === 'Reject' || actionType === 'Correction') && (!comments || comments.trim().length < 5)) {
      toastError('Mandatory remarks (minimum 5 characters) are required.');
      return;
    }

    setActionLoading(true);
    try {
      let endpoint = `/approvals/${id}/approve`;
      if (actionType === 'Reject') endpoint = `/approvals/${id}/reject`;
      else if (actionType === 'Correction') endpoint = `/approvals/${id}/request-correction`;

      const res = await api.post(endpoint, {
        comments: comments.trim() || (actionType === 'Approve' ? 'Approved and advanced.' : '')
      });

      if (res.data.success) {
        success(res.data.message || 'Action executed successfully!');
        setActionType(null);
        setComments('');
        fetchDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to process decision.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading applicant file..." />;
  }

  if (!data || !data.request) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Document request not found.</p>
        <button
          onClick={() => navigate('/approver/queue')}
          className="mt-4 px-4 py-2 bg-navy-800 text-white rounded-xl text-xs font-semibold"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const { request, history, attachments, stages } = data;
  const isTerminal = ['Completed', 'Document Issued', 'Rejected', 'Cancelled'].includes(request.current_status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/approver/queue')}
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

        {/* Action Buttons for Approver */}
        {!isTerminal && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                setActionType('Correction');
                setComments('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs shadow-sm transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Request Correction
            </button>

            <button
              onClick={() => {
                setActionType('Reject');
                setComments('');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs shadow-sm transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject Request
            </button>

            <button
              onClick={() => {
                setActionType('Approve');
                setComments('Approved after verifying academic credentials and department records.');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all transform hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve & Advance
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Attachments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Profile Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" /> Student Applicant Information
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                Department of {request.department_name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Student Full Name:</span>
                <span className="font-bold text-slate-900 text-sm">{request.student_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Registration Number:</span>
                <span className="font-mono font-bold text-navy-800 text-sm">{request.registration_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Degree / Program:</span>
                <span className="font-semibold text-slate-800">{request.program || 'B.Tech Regular'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Academic Standing:</span>
                <span className="font-semibold text-slate-800">{request.academic_year || 'Final Year'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Student Email:</span>
                <span className="text-slate-700">{request.student_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Contact Phone:</span>
                <span className="text-slate-700">{request.student_phone || 'None listed'}</span>
              </div>
            </div>
          </div>

          {/* Request Reason & Purpose */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Document Requirements & Justification
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 font-semibold">Purpose Provided by Student:</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
                  {request.purpose}
                </p>
              </div>

              {request.additional_details && (
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Additional Details / Clarifications:</span>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                    {request.additional_details}
                  </p>
                </div>
              )}

              {request.document_requirements && (
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Standard Verification Criteria:</span>
                  <p className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-teal-900 leading-relaxed">
                    {request.document_requirements}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attached Supporting Documents */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
              Submitted Attachments & Proofs ({attachments.length})
            </h3>

            {attachments.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No supporting files attached.</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate mr-3">
                      <Paperclip className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{file.file_name}</span>
                      <span className="text-[10px] text-slate-400">({(file.file_size / 1024).toFixed(0)} KB)</span>
                    </div>
                    <a
                      href={`/api/documents/attachments/${file.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Download className="w-3 h-3" /> Preview Document
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Timeline & Approval Trail */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Workflow Status Trail
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {/* Submission */}
              <div className="relative">
                <span className="absolute -left-6 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-white ring-4 ring-white">
                  <CheckCircle2 className="w-3 h-3" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Submitted by Student</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(request.submission_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Stages */}
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
                      {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
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

                      {stageHistory && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                          <p className="font-semibold text-slate-700">
                            {stageHistory.action}: by {stageHistory.approver_name}
                          </p>
                          <p className="text-slate-500 italic">"{stageHistory.comments}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        title={
          actionType === 'Approve'
            ? 'Approve Document Application'
            : actionType === 'Reject'
            ? 'Reject Document Application'
            : 'Request Corrections from Student'
        }
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {actionType === 'Approve' &&
              'Approving will advance this application to the subsequent approval stage or generate and issue the final official PDF document if this is the final stage.'}
            {actionType === 'Reject' &&
              'Rejecting will terminate this application. You must provide a clear, mandatory reason explaining why the application was declined.'}
            {actionType === 'Correction' &&
              'Requesting corrections allows the student to update their application purpose, details, or upload new files, after which it will return for review.'}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comments / Remarks {actionType !== 'Approve' && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                actionType === 'Approve'
                  ? 'Add any departmental remarks or endorsements...'
                  : actionType === 'Reject'
                  ? 'Explain reason for rejection (min 5 characters)...'
                  : 'Describe the required changes or missing documents...'
              }
              required={actionType !== 'Approve'}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActionType(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-1.5 ${
                actionType === 'Reject'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : actionType === 'Correction'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              {actionLoading ? 'Processing...' : `Confirm ${actionType}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
