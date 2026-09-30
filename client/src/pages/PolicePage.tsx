import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Eye, Filter, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { Police } from '../types';
import { DataTable } from '../components/common/DataTable';
import { Drawer } from '../components/common/Drawer';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';

export const PolicePage: React.FC = () => {
  const [officers, setOfficers] = useState<Police[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [rankFilter, setRankFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Police | null>(null);
  const [formData, setFormData] = useState({
    police_id: '',
    rank: 'Inspector',
    name: '',
    branch: 'Crime Branch',
    age: '',
    number: '',
    address: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Police | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    loadPolice();
  }, [rankFilter, branchFilter]);

  const loadPolice = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (rankFilter) params.rank = rankFilter;
      if (branchFilter) params.branch = branchFilter;

      const res = await api.getPoliceList(params);
      setOfficers(res.data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch police officers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingOfficer(null);
    setFormData({
      police_id: '',
      rank: 'Inspector',
      name: '',
      branch: 'Crime Branch',
      age: '',
      number: '',
      address: '',
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (officer: Police, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOfficer(officer);
    setFormData({
      police_id: String(officer.police_id),
      rank: officer.rank,
      name: officer.name,
      branch: officer.branch,
      age: String(officer.age),
      number: officer.number,
      address: officer.address,
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleOpenDelete = (officer: Police, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(officer);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const pid = parseInt(formData.police_id, 10);
    const age = parseInt(formData.age, 10);

    if (!editingOfficer && (isNaN(pid) || pid <= 0)) {
      errors.police_id = 'Valid numeric Police ID is required';
    }
    if (!formData.name.trim()) {
      errors.name = 'Officer name is required';
    }
    if (!formData.rank.trim()) {
      errors.rank = 'Rank is required';
    }
    if (!formData.branch.trim()) {
      errors.branch = 'Branch is required';
    }
    if (isNaN(age) || age < 21 || age > 65) {
      errors.age = 'Officer age must be between 21 and 65';
    }
    if (!formData.number.trim()) {
      errors.number = 'Contact number is required';
    }
    if (!formData.address.trim()) {
      errors.address = 'Station / residential address is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      if (editingOfficer) {
        await api.updatePolice(editingOfficer.police_id, {
          rank: formData.rank.trim(),
          name: formData.name.trim(),
          branch: formData.branch.trim(),
          age: parseInt(formData.age, 10),
          number: formData.number.trim(),
          address: formData.address.trim(),
        });
        showToast('success', 'Officer details updated successfully');
      } else {
        await api.createPolice({
          police_id: parseInt(formData.police_id, 10),
          rank: formData.rank.trim(),
          name: formData.name.trim(),
          branch: formData.branch.trim(),
          age: parseInt(formData.age, 10),
          number: formData.number.trim(),
          address: formData.address.trim(),
        });
        showToast('success', 'New officer appointed successfully');
      }
      setIsDrawerOpen(false);
      loadPolice();
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deletePolice(deleteTarget.police_id);
      showToast('success', `Officer #${deleteTarget.police_id} removed`);
      setDeleteTarget(null);
      loadPolice();
    } catch (err: any) {
      showToast('error', err.message || 'Cannot delete officer');
    } finally {
      setIsDeleting(false);
    }
  };

  // Distinct branches and ranks for filters
  const distinctRanks = useMemo(() => {
    const set = new Set<string>();
    officers.forEach((o) => set.add(o.rank));
    return Array.from(set);
  }, [officers]);

  const distinctBranches = useMemo(() => {
    const set = new Set<string>();
    officers.forEach((o) => set.add(o.branch));
    return Array.from(set);
  }, [officers]);

  // Columns definition
  const columns = useMemo<ColumnDef<Police>[]>(
    () => [
      {
        accessorKey: 'police_id',
        header: 'Police ID',
        cell: (info) => (
          <span className="font-mono text-slate-500 font-medium">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Officer Name',
        cell: (info) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'rank',
        header: 'Rank',
        cell: (info) => (
          <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'branch',
        header: 'Branch',
      },
      {
        accessorKey: 'age',
        header: 'Age',
        cell: (info) => (
          <span className="font-mono tabular-nums">{info.getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'number',
        header: 'Contact',
        cell: (info) => (
          <span className="font-mono text-slate-600 dark:text-slate-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Station / Address',
        cell: (info) => (
          <span className="truncate max-w-xs block text-slate-600 dark:text-slate-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'case_count',
        header: 'Active Cases',
        cell: (info) => {
          const val = (info.getValue() as number) || 0;
          return (
            <span
              className={`font-mono px-2 py-0.5 rounded text-xs tabular-nums ${
                val > 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold'
                  : 'text-slate-400'
              }`}
            >
              {val}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/police/${row.original.police_id}`);
              }}
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-fast"
              title="View Officer Dossier"
            >
              <Eye size={13} />
            </button>
            <button
              onClick={(e) => handleOpenEdit(row.original, e)}
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-fast"
              title="Edit Officer"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={(e) => handleOpenDelete(row.original, e)}
              className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-fast"
              title="Delete Officer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Police Officers Roster
          </h2>
          <p className="text-xs text-slate-500">
            Law enforcement roster with rank, branch division, and real-time caseload metrics
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-fast shrink-0"
        >
          <Plus size={14} />
          <span>Add officer</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 mr-1 font-medium">
          <Filter size={13} />
          <span>Filters:</span>
        </div>

        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          className="h-7 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Rank: All</option>
          {distinctRanks.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="h-7 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Branch: All</option>
          {distinctBranches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {(rankFilter || branchFilter) && (
          <button
            onClick={() => {
              setRankFilter('');
              setBranchFilter('');
            }}
            className="h-7 px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition-fast"
            title="Reset Filters"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        data={officers}
        columns={columns}
        isLoading={loading}
        onRowClick={(row) => navigate(`/police/${row.police_id}`)}
        exportFileName="police-roster.csv"
        pageSize={15}
        emptyTitle="No police officers found"
        emptyDescription="Try clearing active filters or register a new police personnel record."
      />

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingOfficer ? `Edit Officer #${editingOfficer.police_id}` : 'Add Police Officer'}
        subtitle={
          editingOfficer
            ? 'Update officer station, branch assignment, or contact details'
            : 'Register a new law enforcement officer in the database'
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* Police ID */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Police Badge ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.police_id}
              disabled={!!editingOfficer}
              onChange={(e) => setFormData({ ...formData, police_id: e.target.value })}
              placeholder="e.g. 106"
              className={`w-full h-8 px-2.5 font-mono bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-75 focus:outline-none focus:ring-1 ${
                formErrors.police_id
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            />
            {formErrors.police_id && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.police_id}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Officer name"
              className={`w-full h-8 px-2.5 bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                formErrors.name
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            />
            {formErrors.name && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.name}</p>
            )}
          </div>

          {/* Rank */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Rank <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.rank}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
              placeholder="e.g. Inspector, Sub Inspector, ACP"
              className={`w-full h-8 px-2.5 bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                formErrors.rank
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            />
            {formErrors.rank && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.rank}</p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Branch / Unit <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="e.g. Crime Branch, Cyber Crime, Traffic Branch"
              className={`w-full h-8 px-2.5 bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                formErrors.branch
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            />
            {formErrors.branch && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.branch}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Age <span className="text-slate-400 font-normal">(21 - 65)</span>{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="e.g. 42"
              className={`w-full h-8 px-2.5 font-mono bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                formErrors.age
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            />
            {formErrors.age && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.age}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="e.g. 9820112345"
              className={`w-full h-8 px-2.5 font-mono bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                formErrors.number
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            />
            {formErrors.number && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.number}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Station / Residence Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Dadar Police Quarters, Mumbai"
              className={`w-full h-8 px-2.5 bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                formErrors.address
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            />
            {formErrors.address && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.address}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingOfficer ? 'Save changes' : 'Add officer'}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Officer Deletion"
        message={
          deleteTarget
            ? `Are you sure you want to delete Officer #${deleteTarget.police_id} (${deleteTarget.name})? Note: officers with active cases cannot be deleted until cases are reassigned.`
            : ''
        }
        confirmText="Delete officer"
        isSubmitting={isDeleting}
      />
    </div>
  );
};
