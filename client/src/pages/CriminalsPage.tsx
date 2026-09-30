import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Eye, Filter, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { Criminal, Police } from '../types';
import { DataTable } from '../components/common/DataTable';
import { Drawer } from '../components/common/Drawer';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../components/common/Toast';

export const CriminalsPage: React.FC = () => {
  const [criminals, setCriminals] = useState<Criminal[]>([]);
  const [officers, setOfficers] = useState<Police[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [crimeFilter, setCrimeFilter] = useState('');
  const [officerFilter, setOfficerFilter] = useState('');
  const [jailFilter, setJailFilter] = useState('');
  const [courtFilter, setCourtFilter] = useState('');
  const [jailedFilter, setJailedFilter] = useState('');

  // Drawer state for Add/Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCriminal, setEditingCriminal] = useState<Criminal | null>(null);
  const [formData, setFormData] = useState({
    criminal_id: '',
    name: '',
    age: '',
    crime: '',
    investigating_officer: '',
    investigation_status: 'Open' as 'Open' | 'Under Investigation' | 'Closed',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Criminal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
    loadOfficers();
  }, [statusFilter, crimeFilter, officerFilter, jailFilter, courtFilter, jailedFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (crimeFilter) params.crime = crimeFilter;
      if (officerFilter) params.officer = officerFilter;
      if (jailFilter) params.jail = jailFilter;
      if (courtFilter) params.hasCourtRecord = courtFilter;
      if (jailedFilter) params.isJailed = jailedFilter;

      const res = await api.getCriminals(params);
      setCriminals(res.data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to fetch criminals');
    } finally {
      setLoading(false);
    }
  };

  const loadOfficers = async () => {
    try {
      const res = await api.getPoliceList({ limit: 100 });
      setOfficers(res.data);
    } catch (err) {
      console.error('Failed to load officers dropdown:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditingCriminal(null);
    setFormData({
      criminal_id: '',
      name: '',
      age: '',
      crime: '',
      investigating_officer: officers.length > 0 ? String(officers[0].police_id) : '',
      investigation_status: 'Open',
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (criminal: Criminal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCriminal(criminal);
    setFormData({
      criminal_id: String(criminal.criminal_id),
      name: criminal.name,
      age: String(criminal.age),
      crime: criminal.crime,
      investigating_officer: String(criminal.investigating_officer),
      investigation_status: criminal.investigation_status,
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleOpenDelete = (criminal: Criminal, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(criminal);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const cid = parseInt(formData.criminal_id, 10);
    const age = parseInt(formData.age, 10);

    if (!editingCriminal && (isNaN(cid) || cid <= 0)) {
      errors.criminal_id = 'Valid numeric ID is required';
    }
    if (!formData.name.trim()) {
      errors.name = 'Criminal name is required';
    }
    if (isNaN(age) || age < 18 || age > 100) {
      errors.age = 'Age must be between 18 and 100';
    }
    if (!formData.crime.trim()) {
      errors.crime = 'Crime description is required';
    }
    if (!formData.investigating_officer) {
      errors.investigating_officer = 'Please select an officer';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      if (editingCriminal) {
        await api.updateCriminal(editingCriminal.criminal_id, {
          name: formData.name.trim(),
          age: parseInt(formData.age, 10),
          crime: formData.crime.trim(),
          investigating_officer: parseInt(formData.investigating_officer, 10),
          investigation_status: formData.investigation_status,
        });
        showToast('success', 'Criminal record updated successfully');
      } else {
        await api.createCriminal({
          criminal_id: parseInt(formData.criminal_id, 10),
          name: formData.name.trim(),
          age: parseInt(formData.age, 10),
          crime: formData.crime.trim(),
          investigating_officer: parseInt(formData.investigating_officer, 10),
          investigation_status: formData.investigation_status,
        });
        showToast('success', 'New criminal registered successfully');
      }
      setIsDrawerOpen(false);
      loadData();
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
      await api.deleteCriminal(deleteTarget.criminal_id);
      showToast('success', `Criminal #${deleteTarget.criminal_id} record deleted`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Cannot delete criminal');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setCrimeFilter('');
    setOfficerFilter('');
    setJailFilter('');
    setCourtFilter('');
    setJailedFilter('');
  };

  // Distinct crimes for filter dropdown
  const distinctCrimes = useMemo(() => {
    const set = new Set<string>();
    criminals.forEach((c) => {
      if (c.crime) set.add(c.crime);
    });
    return Array.from(set);
  }, [criminals]);

  // Distinct jail facilities for filter
  const distinctJails = useMemo(() => {
    const set = new Set<string>();
    criminals.forEach((c) => {
      if (c.jail_location) set.add(c.jail_location);
    });
    return Array.from(set);
  }, [criminals]);

  // Table columns definition
  const columns = useMemo<ColumnDef<Criminal>[]>(
    () => [
      {
        accessorKey: 'criminal_id',
        header: 'ID',
        cell: (info) => (
          <span className="font-mono text-slate-500 font-medium">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Criminal Name',
        cell: (info) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'age',
        header: 'Age',
        cell: (info) => (
          <span className="font-mono tabular-nums">{info.getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'crime',
        header: 'Crime',
      },
      {
        accessorKey: 'investigation_status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as string} size="sm" />,
      },
      {
        accessorKey: 'officer_name',
        header: 'Investigating Officer',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="font-medium">{row.officer_name || 'Unassigned'}</span>
              {row.officer_rank && (
                <span className="text-[11px] text-slate-400 block">
                  {row.officer_rank} ({row.officer_branch})
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'court_room_number',
        header: 'Court Room',
        cell: (info) => {
          const room = info.getValue() as number | null;
          return room ? (
            <span className="font-mono text-slate-700 dark:text-slate-300">
              Room #{room}
            </span>
          ) : (
            <span className="text-slate-400 italic">None</span>
          );
        },
      },
      {
        accessorKey: 'jail_location',
        header: 'Jail Facility',
        cell: (info) => {
          const row = info.row.original;
          return row.jail_location ? (
            <div>
              <span>{row.jail_location}</span>
              <span className="text-[11px] text-slate-400 block font-mono">
                {row.barrack_number} • {row.sentence}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic">None</span>
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
                navigate(`/criminals/${row.original.criminal_id}`);
              }}
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-fast"
              title="View Dossier"
            >
              <Eye size={13} />
            </button>
            <button
              onClick={(e) => handleOpenEdit(row.original, e)}
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-fast"
              title="Edit Criminal"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={(e) => handleOpenDelete(row.original, e)}
              className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-fast"
              title="Delete Criminal"
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
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Criminal Records Registry
          </h2>
          <p className="text-xs text-slate-500">
            Comprehensive registry with investigating officers, judicial assignments, and incarceration details (JOINed)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-fast shrink-0"
        >
          <Plus size={14} />
          <span>Add criminal</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 mr-1 font-medium">
          <Filter size={13} />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-7 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Status: All</option>
          <option value="Open">Open</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Closed">Closed</option>
        </select>

        {/* Crime Filter */}
        <select
          value={crimeFilter}
          onChange={(e) => setCrimeFilter(e.target.value)}
          className="h-7 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Crime: All</option>
          {distinctCrimes.map((crime) => (
            <option key={crime} value={crime}>
              {crime}
            </option>
          ))}
        </select>

        {/* Officer Filter */}
        <select
          value={officerFilter}
          onChange={(e) => setOfficerFilter(e.target.value)}
          className="h-7 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Officer: All</option>
          {officers.map((off) => (
            <option key={off.police_id} value={off.police_id}>
              {off.name} ({off.rank})
            </option>
          ))}
        </select>

        {/* Jail Location Filter */}
        <select
          value={jailFilter}
          onChange={(e) => setJailFilter(e.target.value)}
          className="h-7 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Jail: All</option>
          {distinctJails.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>

        {/* Court Record Toggle */}
        <select
          value={courtFilter}
          onChange={(e) => setCourtFilter(e.target.value)}
          className="h-7 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Court Assignment: All</option>
          <option value="true">Has Court Record</option>
          <option value="false">No Court Record</option>
        </select>

        {/* Jailed Toggle */}
        <select
          value={jailedFilter}
          onChange={(e) => setJailedFilter(e.target.value)}
          className="h-7 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="">Incarceration: All</option>
          <option value="true">Is Jailed</option>
          <option value="false">Not Jailed</option>
        </select>

        {(statusFilter || crimeFilter || officerFilter || jailFilter || courtFilter || jailedFilter) && (
          <button
            onClick={resetFilters}
            className="h-7 px-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition-fast"
            title="Reset Filters"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main Data Table */}
      <DataTable
        data={criminals}
        columns={columns}
        isLoading={loading}
        onRowClick={(row) => navigate(`/criminals/${row.criminal_id}`)}
        exportFileName="criminals-registry.csv"
        pageSize={15}
        emptyTitle="No criminals found"
        emptyDescription="Try clearing active filters or register a new criminal into the registry."
      />

      {/* Add / Edit Side Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingCriminal ? `Edit Criminal #${editingCriminal.criminal_id}` : 'Add Criminal'}
        subtitle={
          editingCriminal
            ? 'Update offender profile and case status'
            : 'Register a new criminal record in the department database'
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          {/* Criminal ID */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Criminal ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.criminal_id}
              disabled={!!editingCriminal}
              onChange={(e) => setFormData({ ...formData, criminal_id: e.target.value })}
              placeholder="e.g. 207"
              className={`w-full h-8 px-2.5 font-mono bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-75 focus:outline-none focus:ring-1 ${
                formErrors.criminal_id
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            />
            {formErrors.criminal_id && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.criminal_id}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Offender name"
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

          {/* Age */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Age <span className="text-slate-400 font-normal">(18 - 100)</span>{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="e.g. 32"
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

          {/* Crime */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Crime Allegation <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.crime}
              onChange={(e) => setFormData({ ...formData, crime: e.target.value })}
              placeholder="e.g. Robbery, Cyber Fraud, Theft"
              className={`w-full h-8 px-2.5 bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                formErrors.crime
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            />
            {formErrors.crime && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.crime}</p>
            )}
          </div>

          {/* Investigating Officer */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Investigating Officer <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.investigating_officer}
              onChange={(e) => setFormData({ ...formData, investigating_officer: e.target.value })}
              className={`w-full h-8 px-2 bg-white dark:bg-slate-900 border rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                formErrors.investigating_officer
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-slate-400'
              }`}
            >
              <option value="">Select an officer</option>
              {officers.map((off) => (
                <option key={off.police_id} value={off.police_id}>
                  #{off.police_id} - {off.name} ({off.rank}, {off.branch})
                </option>
              ))}
            </select>
            {formErrors.investigating_officer && (
              <p className="text-rose-500 text-[11px] mt-0.5">{formErrors.investigating_officer}</p>
            )}
          </div>

          {/* Investigation Status */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Investigation Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.investigation_status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  investigation_status: e.target.value as any,
                })
              }
              className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Closed">Closed</option>
            </select>
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
              {isSubmitting ? 'Saving...' : editingCriminal ? 'Save changes' : 'Add criminal'}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Criminal Deletion"
        message={
          deleteTarget
            ? `Are you sure you want to delete criminal #${deleteTarget.criminal_id} (${deleteTarget.name})? This action cannot be undone.`
            : ''
        }
        confirmText="Delete criminal"
        isSubmitting={isDeleting}
      />
    </div>
  );
};
