import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Users, FileText, Phone, Mail, Hash } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

export default function DepartmentManagementPage() {
  const { success, error: toastError } = useToast();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hod_name: '',
    hod_email: '',
    contact_phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/departments');
      if (res.data.success) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      toastError('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/admin/departments', formData);
      if (res.data.success) {
        success('Department added successfully!');
        setCreateModalOpen(false);
        setFormData({ name: '', code: '', hod_name: '', hod_email: '', contact_phone: '' });
        fetchDepartments();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/admin/departments/${selectedDept.id}`, selectedDept);
      if (res.data.success) {
        success('Department details updated.');
        setEditModalOpen(false);
        setSelectedDept(null);
        fetchDepartments();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update department.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Department Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage academic departments, faculty allocations, and HOD assignments</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3">
            <LoadingSpinner text="Loading departments..." />
          </div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-navy-50 text-navy-800 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {dept.code}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">{dept.name}</h3>
                
                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 my-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">HOD In-Charge</span>
                    <span className="font-semibold text-slate-800">{dept.hod_name || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Official Email</span>
                    <span className="text-slate-600">{dept.hod_email || 'dept@college.edu'}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block">Students</span>
                    <span className="font-bold text-slate-800 text-sm">{dept.student_count || 0}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block">Faculty</span>
                    <span className="font-bold text-slate-800 text-sm">{dept.faculty_count || 0}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block">Requests</span>
                    <span className="font-bold text-teal-700 text-sm">{dept.request_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedDept({ ...dept });
                    setEditModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-sm transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Department
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add Department">
        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Civil Engineering"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. CIVIL"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">HOD Full Name</label>
              <input
                type="text"
                value={formData.hod_name}
                onChange={(e) => setFormData({ ...formData, hod_name: e.target.value })}
                placeholder="Dr. ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">HOD Email</label>
              <input
                type="email"
                value={formData.hod_email}
                onChange={(e) => setFormData({ ...formData, hod_email: e.target.value })}
                placeholder="hod@college.edu"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
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
              {submitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {selectedDept && (
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit: ${selectedDept.name}`}>
          <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
              <input
                type="text"
                value={selectedDept.name}
                onChange={(e) => setSelectedDept({ ...selectedDept, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department Code</label>
              <input
                type="text"
                value={selectedDept.code}
                onChange={(e) => setSelectedDept({ ...selectedDept, code: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">HOD Full Name</label>
                <input
                  type="text"
                  value={selectedDept.hod_name || ''}
                  onChange={(e) => setSelectedDept({ ...selectedDept, hod_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">HOD Email</label>
                <input
                  type="email"
                  value={selectedDept.hod_email || ''}
                  onChange={(e) => setSelectedDept({ ...selectedDept, hod_email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
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
                {submitting ? 'Saving...' : 'Save Updates'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
