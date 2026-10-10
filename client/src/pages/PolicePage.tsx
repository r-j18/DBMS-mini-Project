import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Eye, Filter, RotateCcw, Shield } from 'lucide-react';
import { api } from '../services/api';
import { Police } from '../types';
import { DataTable } from '../components/common/DataTable';
import { Drawer } from '../components/common/Drawer';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';

export const PolicePage: React.FC = () => {
  const { role } = useAuth();
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
      number: officer.number || '',
      address: officer.address || '',
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
        showToast('success', 'Officer record updated');
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
        showToast('success', 'New officer appointed to bureau roster');
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

  const columns = useMemo<ColumnDef<Police>[]>(
    () => [
      {
        accessorKey: 'police_id',
        header: 'Badge ID',
        cell: (info) => (
          <span className="font-mono text-[#B08D3C] font-bold">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Officer Name',
        cell: (info) => (
          <span className="font-typewriter font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'rank',
        header: 'Rank',
        cell: (info) => (
          <span className="px-1.5 py-0.5 rounded-xs text-[11px] font-typewriter font-bold bg-[#E6DFCD] dark:bg-[#2C303A] text-[#1F1F1F] dark:text-[#E2DFD8]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'branch',
        header: 'Division / Unit',
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
        header: 'Contact Line',
        cell: (info) => (
          <span className="font-mono text-[#4B4B4B] dark:text-[#A09D95]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Station / Address',
        cell: (info) => (
          <span className="truncate max-w-xs block text-[#6B685F] dark:text-[#A09D95]">
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
              className={`font-mono px-2 py-0.5 rounded-xs text-xs font-bold tabular-nums ${
                val > 0
                  ? 'bg-[#E6DFCD] dark:bg-[#2C303A] text-[#1F1F1F] dark:text-[#E2DFD8]'
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
              className="p-1 rounded text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#EFE9DC] dark:hover:bg-[#2E323B] transition-fast"
              title="View Officer Dossier"
            >
              <Eye size={13} />
            </button>
            {role === 'admin' && (
              <>
<button
              onClick={(e) => handleOpenEdit(row.original, e)}
              className="p-1 rounded text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#EFE9DC] dark:hover:bg-[#2E323B] transition-fast"
              title="Edit Officer"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={(e) => handleOpenDelete(row.original, e)}
              className="p-1 rounded text-[#B3261E] hover:text-[#921E18] hover:bg-red-50 dark:hover:bg-red-950/40 transition-fast"
              title="Delete Officer"
            >
              <Trash2 size={13} />
            </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D9D0BE] dark:border-[#2E323B]">
        <div>
          <h2 className="font-typewriter text-base font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
            INVESTIGATING OFFICERS SERVICE ROSTER
          </h2>
          <p className="text-xs text-[#7A7A7A]">
            Bureau personnel index with rank seniority, divisional postings, and active criminal investigation loads
          </p>
        </div>

        {role === 'admin' && (
<button
          onClick={handleOpenAdd}
          className="h-8 px-3 flex items-center gap-1.5 font-typewriter text-xs font-bold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs transition-fast shrink-0 shadow-paper"
        >
          <Plus size={14} />
          <span>APPOINT OFFICER</span>
        </button>
)}
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-typewriter font-bold text-[#7A7A7A] mr-1 text-[11px] uppercase">
          <Filter size={12} />
          <span>ROSTER FILTERS:</span>
        </div>

        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          className="h-7 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] font-typewriter text-[11px] focus:outline-none"
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
          className="h-7 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] font-typewriter text-[11px] focus:outline-none"
        >
          <option value="">Division: All</option>
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
            className="h-7 px-2 text-[#7A7A7A] hover:text-[#B3261E] flex items-center gap-1 font-typewriter text-[11px] font-bold transition-fast"
            title="Reset Filters"
          >
            <RotateCcw size={11} />
            <span>RESET</span>
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        data={officers}
        columns={columns}
        isLoading={loading}
        onRowClick={(row) => navigate(`/police/${row.police_id}`)}
        exportFileName="police-service-roster.csv"
        pageSize={15}
        emptyTitle="No officers on file"
        emptyDescription="No registered personnel found matching filter criteria."
      />

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingOfficer ? `UPDATE OFFICER #${editingOfficer.police_id}` : 'APPOINT BUREAU OFFICER'}
        subtitle="Department service record filing — Form CRB-02"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-typewriter">
          {/* Badge ID */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Badge / Personnel ID <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="number"
              value={formData.police_id}
              disabled={!!editingOfficer}
              onChange={(e) => setFormData({ ...formData, police_id: e.target.value })}
              placeholder="e.g. 106"
              className={`w-full h-8 px-2.5 font-mono bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] disabled:opacity-60 focus:outline-none ${
                formErrors.police_id ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.police_id && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.police_id}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Full Legal Name <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Officer name"
              className={`w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.name ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.name && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.name}</p>
            )}
          </div>

          {/* Rank */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Rank <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={formData.rank}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
              placeholder="e.g. Inspector, Sub Inspector, ACP"
              className={`w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.rank ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.rank && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.rank}</p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Division / Unit <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="e.g. Crime Branch, Cyber Crime, Traffic Branch"
              className={`w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.branch ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.branch && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.branch}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Age (21 - 65) <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="e.g. 42"
              className={`w-full h-8 px-2.5 font-mono bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.age ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.age && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.age}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Official Contact Phone <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="e.g. 9820112345"
              className={`w-full h-8 px-2.5 font-mono bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.number ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.number && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.number}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Station / Quarters Address <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Dadar Police Quarters, Mumbai"
              className={`w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.address ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.address && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.address}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#D9D0BE] dark:border-[#2E323B]">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs font-bold disabled:opacity-50 shadow-paper"
            >
              {isSubmitting ? 'Recording...' : editingOfficer ? 'Save Changes' : 'Appoint Officer'}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Officer From Roster"
        message={
          deleteTarget
            ? `Confirm removal of Officer #${deleteTarget.police_id} (${deleteTarget.name}). Officers with open assigned criminal cases cannot be purged until cases are reassigned.`
            : ''
        }
        confirmText="Remove Officer"
        isSubmitting={isDeleting}
      />
    </div>
  );
};
