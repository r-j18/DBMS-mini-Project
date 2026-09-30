import React, { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Lock, Building, ListFilter, Users } from 'lucide-react';
import { api } from '../services/api';
import { JailRecord, JailLocationGroup } from '../types';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';

export const JailPage: React.FC = () => {
  const [jailRecords, setJailRecords] = useState<JailRecord[]>([]);
  const [locations, setLocations] = useState<JailLocationGroup[]>([]);
  const [unassignedCriminals, setUnassignedCriminals] = useState<
    Array<{ criminal_id: number; name: string; crime: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'table' vs 'groupByLocation'
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    location: 'Arthur Road Jail',
    criminal_id: '',
    barrack_number: '',
    sentence: '',
  });

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJail, setEditingJail] = useState<JailRecord | null>(null);
  const [editForm, setEditForm] = useState({
    location: '',
    barrack_number: '',
    sentence: '',
  });

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<JailRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tableRes, groupRes] = await Promise.all([
        api.getJailRecords({ limit: 100 }),
        api.getJailLocations(),
      ]);
      setJailRecords(tableRes.data);
      setLocations(groupRes);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load jail records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = async () => {
    try {
      const data = await api.getUnassignedCriminalsForJail();
      setUnassignedCriminals(data);
      setAssignForm({
        location: 'Arthur Road Jail',
        criminal_id: data.length > 0 ? String(data[0].criminal_id) : '',
        barrack_number: '',
        sentence: '',
      });
      setIsAssignModalOpen(true);
    } catch (err: any) {
      showToast('error', 'Failed to load candidate criminals');
    }
  };

  const handleOpenEdit = (record: JailRecord) => {
    setEditingJail(record);
    setEditForm({
      location: record.location,
      barrack_number: record.barrack_number,
      sentence: record.sentence,
    });
    setIsEditModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cid = parseInt(assignForm.criminal_id, 10);

    if (!assignForm.location.trim()) {
      showToast('error', 'Jail location is required');
      return;
    }
    if (isNaN(cid) || cid <= 0) {
      showToast('error', 'Please select a criminal to incarcerate');
      return;
    }
    if (!assignForm.barrack_number.trim()) {
      showToast('error', 'Barrack number is required');
      return;
    }
    if (!assignForm.sentence.trim()) {
      showToast('error', 'Sentence duration is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createJailRecord({
        location: assignForm.location.trim(),
        criminal_id: cid,
        barrack_number: assignForm.barrack_number.trim(),
        sentence: assignForm.sentence.trim(),
      });
      showToast('success', `Assigned Criminal #${cid} to ${assignForm.location}`);
      setIsAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Assignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJail) return;

    if (!editForm.location.trim() || !editForm.barrack_number.trim() || !editForm.sentence.trim()) {
      showToast('error', 'All fields are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.updateJailRecord(editingJail.criminal_id, {
        location: editForm.location.trim(),
        barrack_number: editForm.barrack_number.trim(),
        sentence: editForm.sentence.trim(),
      });
      showToast('success', `Jail record for Criminal #${editingJail.criminal_id} updated`);
      setIsEditModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deleteJailRecord(deleteTarget.criminal_id);
      showToast('success', `Incarceration record for Criminal #${deleteTarget.criminal_id} removed`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove jail record');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<JailRecord>[]>(
    () => [
      {
        accessorKey: 'location',
        header: 'Correctional Facility',
        cell: (info) => (
          <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
            <Building size={12} className="text-slate-400" />
            <span>{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'criminal_id',
        header: 'Criminal ID',
        cell: (info) => (
          <span className="font-mono text-slate-500 font-medium">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'criminal_name',
        header: 'Inmate Name',
        cell: (info) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'crime',
        header: 'Convicted Crime',
      },
      {
        accessorKey: 'barrack_number',
        header: 'Barrack #',
        cell: (info) => (
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'sentence',
        header: 'Sentence Term',
        cell: (info) => (
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'officer_name',
        header: 'Arresting / Officer',
        cell: (info) => (
          <span className="text-slate-600 dark:text-slate-400">
            {(info.getValue() as string) || <span className="italic text-slate-400">None</span>}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-fast"
              title="Edit Inmate Record"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => setDeleteTarget(row.original)}
              className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-fast"
              title="Remove Incarceration Record"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Jail Incarceration & Sentencing
          </h2>
          <p className="text-xs text-slate-500">
            Prisons, barrack assignments, and judicial sentence tracking across state facilities
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Mode */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded transition-fast font-medium ${
                viewMode === 'table'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All Inmates
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 rounded transition-fast font-medium ${
                viewMode === 'grouped'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Group by Facility
            </button>
          </div>

          <button
            onClick={handleOpenAssign}
            className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-fast shrink-0"
          >
            <Plus size={14} />
            <span>Assign to jail</span>
          </button>
        </div>
      </div>

      {/* Main View: Table Mode */}
      {viewMode === 'table' && (
        <DataTable
          data={jailRecords}
          columns={columns}
          isLoading={loading}
          exportFileName="jail-records.csv"
          pageSize={15}
          emptyTitle="No jail records"
          emptyDescription="No convicts are currently assigned to any correctional facility."
        />
      )}

      {/* Grouped View Mode: Group by Location */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <div
                key={loc.location}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      <Building size={14} className="text-slate-400" />
                      <span>{loc.location}</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {loc.inmate_count} {loc.inmate_count === 1 ? 'Inmate' : 'Inmates'}
                    </span>
                  </div>

                  <div className="space-y-2 mt-3">
                    {loc.inmates.map((inmate) => (
                      <div
                        key={inmate.criminal_id}
                        className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                            <span className="font-mono text-slate-400">#{inmate.criminal_id}</span>
                            <span>{inmate.criminal_name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {inmate.crime}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[11px] font-semibold block text-slate-700 dark:text-slate-300">
                            Barrack {inmate.barrack_number}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 block">
                            {inmate.sentence}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Inmate to Correctional Facility"
        subtitle="Only criminals currently not serving a sentence are available"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Jail Facility Location <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={assignForm.location}
              onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })}
              placeholder="e.g. Arthur Road Jail, Taloja Jail, Yerwada Jail"
              className="w-full h-8 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Criminal <span className="text-rose-500">*</span>
            </label>
            {unassignedCriminals.length === 0 ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-500 text-[11px]">
                All registered criminals currently have active jail records.
              </div>
            ) : (
              <select
                value={assignForm.criminal_id}
                onChange={(e) => setAssignForm({ ...assignForm, criminal_id: e.target.value })}
                className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {unassignedCriminals.map((c) => (
                  <option key={c.criminal_id} value={c.criminal_id}>
                    #{c.criminal_id} - {c.name} ({c.crime})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Barrack Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={assignForm.barrack_number}
              onChange={(e) => setAssignForm({ ...assignForm, barrack_number: e.target.value })}
              placeholder="e.g. b10, b12"
              className="w-full h-8 px-2.5 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sentencing Term <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={assignForm.sentence}
              onChange={(e) => setAssignForm({ ...assignForm, sentence: e.target.value })}
              placeholder="e.g. 5 Years, 3 Years, Life"
              className="w-full h-8 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={unassignedCriminals.length === 0 || isSubmitting}
              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Assigning...' : 'Assign to jail'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Inmate #${editingJail?.criminal_id} Record`}
        subtitle="Modify facility assignment, barrack, or sentencing term"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Jail Facility Location
            </label>
            <input
              type="text"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              className="w-full h-8 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Barrack Number
            </label>
            <input
              type="text"
              value={editForm.barrack_number}
              onChange={(e) => setEditForm({ ...editForm, barrack_number: e.target.value })}
              className="w-full h-8 px-2.5 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sentence Term
            </label>
            <input
              type="text"
              value={editForm.sentence}
              onChange={(e) => setEditForm({ ...editForm, sentence: e.target.value })}
              className="w-full h-8 px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Incarceration Record"
        message={
          deleteTarget
            ? `Are you sure you want to remove the jail sentence record for Criminal #${deleteTarget.criminal_id} (${deleteTarget.criminal_name}) at ${deleteTarget.location}?`
            : ''
        }
        confirmText="Remove record"
        isSubmitting={isDeleting}
      />
    </div>
  );
};
