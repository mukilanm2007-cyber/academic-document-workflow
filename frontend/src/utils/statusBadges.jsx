import React from 'react';
import { 
  FileEdit, Send, Clock, AlertTriangle, UserCheck, 
  CheckCircle, CheckCheck, XCircle, FileCheck2, Ban 
} from 'lucide-react';

export function StatusBadge({ status, size = 'md' }) {
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : 'text-xs md:text-sm px-2.5 py-1 gap-1.5 font-medium';

  switch (status) {
    case 'Draft':
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <FileEdit className="w-3.5 h-3.5" /> Draft
        </span>
      );
    case 'Submitted':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <Send className="w-3.5 h-3.5" /> Submitted
        </span>
      );
    case 'Under Department Review':
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5" /> Dept Review
        </span>
      );
    case 'Correction Required':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Correction Required
        </span>
      );
    case 'Pending HOD Approval':
      return (
        <span className={`inline-flex items-center rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
          <UserCheck className="w-3.5 h-3.5" /> HOD Approval
        </span>
      );
    case 'Pending Academic Office Verification':
      return (
        <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5" /> Office Verification
        </span>
      );
    case 'Approved':
      return (
        <span className={`inline-flex items-center rounded-full bg-teal-50 text-teal-700 border border-teal-200 ${sizeClasses}`}>
          <CheckCircle className="w-3.5 h-3.5" /> Approved
        </span>
      );
    case 'Document Issued':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <FileCheck2 className="w-3.5 h-3.5" /> Document Issued
        </span>
      );
    case 'Completed':
      return (
        <span className={`inline-flex items-center rounded-full bg-green-50 text-green-700 border border-green-200 ${sizeClasses}`}>
          <CheckCheck className="w-3.5 h-3.5" /> Completed
        </span>
      );
    case 'Rejected':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    case 'Cancelled':
      return (
        <span className={`inline-flex items-center rounded-full bg-gray-100 text-gray-600 border border-gray-200 ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
}
