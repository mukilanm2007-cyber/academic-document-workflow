import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Trash2, ArrowUp, ArrowDown, Save, CheckCircle2, Shield } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function WorkflowConfigPage() {
  const { success, error: toastError } = useToast();

  const [workflows, setWorkflows] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/workflows');
      if (res.data.success) {
        setWorkflows(res.data.workflows);
        if (res.data.workflows.length > 0 && !selectedDocId) {
          setSelectedDocId(res.data.workflows[0].id);
          setStages(res.data.workflows[0].stages || []);
        }
      }
    } catch (err) {
      toastError('Failed to fetch workflows.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleSelectDoc = (doc) => {
    setSelectedDocId(doc.id);
    setStages(doc.stages ? [...doc.stages] : []);
  };

  const handleAddStage = () => {
    const newStage = {
      stage_name: `Verification Stage ${stages.length + 1}`,
      stage_order: stages.length + 1,
      approver_role: 'faculty',
      department_required: true,
      is_final_approval: false
    };
    setStages([...stages, newStage]);
  };

  const handleRemoveStage = (index) => {
    if (stages.length <= 1) {
      toastError('A workflow must have at least one stage.');
      return;
    }
    const updated = stages.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stage_order: idx + 1 }));
    setStages(updated);
  };

  const handleMoveStage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const updated = [...stages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setStages(updated.map((s, idx) => ({ ...s, stage_order: idx + 1 })));
  };

  const handleStageChange = (index, field, value) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };
    setStages(updated);
  };

  const handleSaveWorkflow = async () => {
    if (stages.length === 0) {
      toastError('Workflow requires at least one stage.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/admin/workflows/${selectedDocId}`, {
        stages
      });
      if (res.data.success) {
        success('Approval workflow configuration updated successfully!');
        fetchWorkflows();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save workflow.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading workflow stages..." />;
  }

  const selectedWorkflow = workflows.find((w) => w.id === selectedDocId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurable Approval Workflows</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-stage routing, roles, and review milestones for each academic document type
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Document Type Selector */}
        <div className="md:col-span-1 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Select Document Offering
          </span>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {workflows.map((wf) => {
              const isSelected = wf.id === selectedDocId;
              return (
                <button
                  key={wf.id}
                  onClick={() => handleSelectDoc(wf)}
                  className={`w-full p-4 text-left transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-teal-50/50 border-l-4 border-teal-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{wf.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{wf.code}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {wf.stages?.length || 0} Stages
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Columns: Stage Editor */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Pipeline for: {selectedWorkflow?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stages execute sequentially from Stage 1 to the final issuance stage
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddStage}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" /> Add Stage
                </button>
                <button
                  onClick={handleSaveWorkflow}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Workflow'}
                </button>
              </div>
            </div>

            {/* Stages Stack */}
            <div className="space-y-4">
              {stages.map((stage, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-navy-800 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Stage {idx + 1}
                      </span>
                      {idx === stages.length - 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Final Stage & Document Issuance
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveStage(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStage(idx, 1)}
                        disabled={idx === stages.length - 1}
                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveStage(idx)}
                        disabled={stages.length <= 1}
                        className="p-1 rounded-lg text-slate-400 hover:bg-rose-100 hover:text-rose-600 disabled:opacity-30"
                        title="Delete Stage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Stage Title</label>
                      <input
                        type="text"
                        value={stage.stage_name}
                        onChange={(e) => handleStageChange(idx, 'stage_name', e.target.value)}
                        placeholder="e.g. Department Faculty Review"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Authorized Approver Role</label>
                      <select
                        value={stage.approver_role}
                        onChange={(e) => handleStageChange(idx, 'approver_role', e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        <option value="faculty">Faculty Approver</option>
                        <option value="hod">Head of Department (HOD)</option>
                        <option value="academic_office">Academic Office Registrar</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!stage.department_required}
                        onChange={(e) => handleStageChange(idx, 'department_required', e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-slate-700">Require approver from student's department</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
