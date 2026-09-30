import React, { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Lock, Building } from 'lucide-react';
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
      showToast('error', err.message || 'Failed to load detention records');
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
      showToast('error', 'Failed to load candidate offenders');
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
      showToast('error', 'Correctional facility location is required');
      return;
    }
    if (isNaN(cid) || cid <= 0) {
      showToast('error', 'Please select a convict to incarcerate');
      return;
    }
    if (!assignForm.barrack_number.trim()) {
      showToast('error', 'Barrack number is required');
      return;
    }
    if (!assignForm.sentence.trim()) {
      showToast('error', 'Mandated sentence duration is required');
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
      showToast('success', `Committed Offender #${cid} to ${assignForm.location}`);
      setIsAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Commitment failed');
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
      showToast('success', `Detention record for Offender #${editingJail.criminal_id} updated`);
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
      showToast('success', `Incarceration log for Offender #${deleteTarget.criminal_id} removed`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to release inmate record');
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
          <div className="flex items-center gap-1.5 font-typewriter font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
            <Building size={13} className="text-[#B08D3C]" />
            <span>{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'criminal_id',
        header: 'Inmate ID',
        cell: (info) => (
          <span className="font-mono text-[#B3261E] font-bold">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'criminal_name',
        header: 'Inmate Name',
        cell: (info) => (
          <span className="font-typewriter font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
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
        header: 'Barrack Cell',
        cell: (info) => (
          <span className="font-mono font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'sentence',
        header: 'Mandated Term',
        cell: (info) => (
          <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-[#E6DFCD] dark:bg-[#2C303A] text-[#B3261E] dark:text-red-400 font-bold">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'officer_name',
        header: 'Arresting Officer',
        cell: (info) => (
          <span className="text-[#6B685F] dark:text-[#A09D95]">
            {(info.getValue() as string) || <span className="italic text-slate-400">None</span>}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 rounded text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#EFE9DC] dark:hover:bg-[#2E323B] transition-fast"
              title="Edit Incarceration Particulars"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => setDeleteTarget(row.original)}
              className="p-1 rounded text-[#B3261E] hover:text-[#921E18] hover:bg-red-50 dark:hover:bg-red-950/40 transition-fast"
              title="Remove Sentence Log"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D9D0BE] dark:border-[#2E323B]">
        <div>
          <h2 className="font-typewriter text-base font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
            CORRECTIONAL DETENTION & SENTENCING LOG
          </h2>
          <p className="text-xs text-[#7A7A7A]">
            Prison cell allocations, barrack rosters, and court-mandated sentence tracking across state institutions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Mode */}
          <div className="flex items-center border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs bg-[#F6F0E0] dark:bg-[#1F2228] p-0.5 text-xs font-typewriter">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-xs transition-fast font-bold ${
                viewMode === 'table'
                  ? 'bg-[#1F2D3D] text-[#EFE9DC]'
                  : 'text-[#7A7A7A] hover:text-[#1F1F1F]'
              }`}
            >
              ALL INMATES
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 rounded-xs transition-fast font-bold ${
                viewMode === 'grouped'
                  ? 'bg-[#1F2D3D] text-[#EFE9DC]'
                  : 'text-[#7A7A7A] hover:text-[#1F1F1F]'
              }`}
            >
              BY FACILITY
            </button>
          </div>

          <button
            onClick={handleOpenAssign}
            className="h-8 px-3 flex items-center gap-1.5 font-typewriter text-xs font-bold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs transition-fast shrink-0 shadow-paper"
          >
            <Plus size={14} />
            <span>COMMITT TO PRISON</span>
          </button>
        </div>
      </div>

      {/* Main View: Table Mode */}
      {viewMode === 'table' && (
        <DataTable
          data={jailRecords}
          columns={columns}
          isLoading={loading}
          exportFileName="jail-incarceration-log.csv"
          pageSize={15}
          emptyTitle="No detention records on file"
          emptyDescription="No convicts currently committed to state facilities in the central registry."
        />
      )}

      {/* Grouped View Mode: Group by Location */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <div
                key={loc.location}
                className="p-4 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D9D0BE] dark:border-[#2E323B]">
                    <div className="flex items-center gap-1.5 font-typewriter font-bold text-[#1F1F1F] dark:text-[#E2DFD8] text-xs">
                      <Building size={14} className="text-[#B08D3C]" />
                      <span>{loc.location}</span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-[#E6DFCD] dark:bg-[#2C303A] font-bold text-[#B3261E] dark:text-red-400 tabular-nums">
                      {loc.inmate_count} {loc.inmate_count === 1 ? 'Inmate' : 'Inmates'}
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 font-typewriter">
                    {loc.inmates.map((inmate) => (
                      <div
                        key={inmate.criminal_id}
                        className="p-2.5 rounded-xs bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] text-xs flex items-center justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
                            <span className="font-mono text-[#B3261E]">#{inmate.criminal_id}</span>
                            <span>{inmate.criminal_name}</span>
                          </div>
                          <span className="text-[11px] text-[#7A7A7A] block mt-0.5">
                            {inmate.crime}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[11px] font-bold block text-[#1F1F1F] dark:text-[#E2DFD8]">
                            Barrack {inmate.barrack_number}
                          </span>
                          <span className="font-mono text-[10px] text-[#B3261E] dark:text-red-400 block font-bold">
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
        title="COMMITT INMATE TO FACILITY"
        subtitle="Only convicts not currently serving a sentence are available"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs font-typewriter">
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Correctional Institution Location <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={assignForm.location}
              onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })}
              placeholder="e.g. Arthur Road Jail, Taloja Jail, Yerwada Jail"
              className="w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Select Offender <span className="text-[#B3261E]">*</span>
            </label>
            {unassignedCriminals.length === 0 ? (
              <div className="p-3 bg-[#EFE9DC] dark:bg-[#16181C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] text-[#7A7A7A] text-[11px]">
                All registered criminals currently have active jail sentences.
              </div>
            ) : (
              <select
                value={assignForm.criminal_id}
                onChange={(e) => setAssignForm({ ...assignForm, criminal_id: e.target.value })}
                className="w-full h-8 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
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
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Barrack / Cell Number <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={assignForm.barrack_number}
              onChange={(e) => setAssignForm({ ...assignForm, barrack_number: e.target.value })}
              placeholder="e.g. b10, b12"
              className="w-full h-8 px-2.5 font-mono bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Mandated Sentence Duration <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={assignForm.sentence}
              onChange={(e) => setAssignForm({ ...assignForm, sentence: e.target.value })}
              placeholder="e.g. 5 Years, 3 Years, Life"
              className="w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9D0BE] dark:border-[#2E323B]">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-3 py-1.5 border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={unassignedCriminals.length === 0 || isSubmitting}
              className="px-3 py-1.5 bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs font-bold disabled:opacity-50 shadow-paper"
            >
              {isSubmitting ? 'Committing...' : 'Committ Inmate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`UPDATE INMATE #${editingJail?.criminal_id} LOG`}
        subtitle="Modify facility assignment, barrack cell, or sentencing duration"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-typewriter">
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Correctional Institution Location
            </label>
            <input
              type="text"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              className="w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Barrack / Cell Number
            </label>
            <input
              type="text"
              value={editForm.barrack_number}
              onChange={(e) => setEditForm({ ...editForm, barrack_number: e.target.value })}
              className="w-full h-8 px-2.5 font-mono bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Sentence Term
            </label>
            <input
              type="text"
              value={editForm.sentence}
              onChange={(e) => setEditForm({ ...editForm, sentence: e.target.value })}
              className="w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9D0BE] dark:border-[#2E323B]">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-3 py-1.5 border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs font-bold disabled:opacity-50 shadow-paper"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Incarceration Record"
        message={
          deleteTarget
            ? `Confirm release/removal of incarceration sentence for Inmate #${deleteTarget.criminal_id} (${deleteTarget.criminal_name}) at ${deleteTarget.location}.`
            : ''
        }
        confirmText="Remove Record"
        isSubmitting={isDeleting}
      />
    </div>
  );
};
