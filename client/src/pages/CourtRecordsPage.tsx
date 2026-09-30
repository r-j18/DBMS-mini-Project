import React, { useEffect, useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, RefreshCw, Gavel, User } from 'lucide-react';
import { api } from '../services/api';
import { CourtRecord } from '../types';
import { DataTable } from '../components/common/DataTable';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../components/common/Toast';

export const CourtRecordsPage: React.FC = () => {
  const [courtRecords, setCourtRecords] = useState<CourtRecord[]>([]);
  const [unassignedCriminals, setUnassignedCriminals] = useState<
    Array<{ criminal_id: number; name: string; crime: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [selectedCriminalId, setSelectedCriminalId] = useState('');

  // Reassign Modal
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<CourtRecord | null>(null);
  const [reassignCriminalId, setReassignCriminalId] = useState('');

  // Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState<CourtRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadCourtRecords();
  }, []);

  const loadCourtRecords = async () => {
    try {
      setLoading(true);
      const res = await api.getCourtRecords({ limit: 100 });
      setCourtRecords(res.data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load court records');
    } finally {
      setLoading(false);
    }
  };

  const loadUnassignedForNew = async () => {
    try {
      const data = await api.getUnassignedCriminalsForCourt();
      setUnassignedCriminals(data);
      if (data.length > 0) {
        setSelectedCriminalId(String(data[0].criminal_id));
      } else {
        setSelectedCriminalId('');
      }
    } catch (err: any) {
      console.error('Failed to load unassigned criminals:', err);
    }
  };

  const handleOpenAssign = async () => {
    await loadUnassignedForNew();
    setNewRoomNumber('');
    setIsAssignModalOpen(true);
  };

  const handleOpenReassign = async (record: CourtRecord) => {
    setReassignTarget(record);
    try {
      const data = await api.getUnassignedCriminalsForCourt(record.criminal_id);
      setUnassignedCriminals(data);
      setReassignCriminalId(String(record.criminal_id));
      setIsReassignModalOpen(true);
    } catch (err: any) {
      showToast('error', 'Failed to load candidate criminals');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const room = parseInt(newRoomNumber, 10);
    const cid = parseInt(selectedCriminalId, 10);

    if (isNaN(room) || room <= 0) {
      showToast('error', 'Please enter a valid court room number');
      return;
    }
    if (isNaN(cid) || cid <= 0) {
      showToast('error', 'Please select a criminal to assign');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createCourtRecord({
        court_room_number: room,
        criminal_id: cid,
      });
      showToast('success', `Assigned Criminal #${cid} to Court Room #${room}`);
      setIsAssignModalOpen(false);
      loadCourtRecords();
    } catch (err: any) {
      showToast('error', err.message || 'Assignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTarget) return;

    const cid = parseInt(reassignCriminalId, 10);
    if (isNaN(cid)) {
      showToast('error', 'Please select a criminal');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.updateCourtRecord(reassignTarget.court_room_number, {
        criminal_id: cid,
      });
      showToast(
        'success',
        `Reassigned Court Room #${reassignTarget.court_room_number} to Criminal #${cid}`
      );
      setIsReassignModalOpen(false);
      loadCourtRecords();
    } catch (err: any) {
      showToast('error', err.message || 'Reassignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deleteCourtRecord(deleteTarget.court_room_number);
      showToast('success', `Court Room #${deleteTarget.court_room_number} assignment removed`);
      setDeleteTarget(null);
      loadCourtRecords();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove court record');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<CourtRecord>[]>(
    () => [
      {
        accessorKey: 'court_room_number',
        header: 'Court Room #',
        cell: (info) => (
          <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
            <Gavel size={12} className="text-slate-400" />
            <span>Room #{info.getValue() as number}</span>
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
        header: 'Assigned Criminal',
        cell: (info) => (
          <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
            <User size={12} className="text-slate-400" />
            <span>{info.getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'crime',
        header: 'Alleged Crime',
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
          return row.officer_name ? (
            <span>
              {row.officer_rank} {row.officer_name}
            </span>
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
              onClick={() => handleOpenReassign(row.original)}
              className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-fast"
              title="Reassign Criminal"
            >
              <RefreshCw size={11} />
              <span>Reassign</span>
            </button>
            <button
              onClick={() => setDeleteTarget(row.original)}
              className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-fast"
              title="Remove Court Assignment"
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
            Court Room Records & Docket
          </h2>
          <p className="text-xs text-slate-500">
            Judicial docket linking courtroom chambers to defendants awaiting or under trial
          </p>
        </div>

        <button
          onClick={handleOpenAssign}
          className="h-8 px-3 flex items-center gap-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-fast shrink-0"
        >
          <Plus size={14} />
          <span>Assign to court room</span>
        </button>
      </div>

      {/* Main Table */}
      <DataTable
        data={courtRecords}
        columns={columns}
        isLoading={loading}
        exportFileName="court-records.csv"
        pageSize={15}
        emptyTitle="No court records"
        emptyDescription="No court room assignments recorded. Assign a defendant to a judicial room."
      />

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Criminal to Court Room"
        subtitle="Only defendants currently without a courtroom assignment are listed"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Court Room Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={newRoomNumber}
              onChange={(e) => setNewRoomNumber(e.target.value)}
              placeholder="e.g. 6"
              className="w-full h-8 px-2.5 font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Criminal <span className="text-rose-500">*</span>
            </label>
            {unassignedCriminals.length === 0 ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-500 text-[11px]">
                All criminals currently have a court room assigned.
              </div>
            ) : (
              <select
                value={selectedCriminalId}
                onChange={(e) => setSelectedCriminalId(e.target.value)}
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
              {isSubmitting ? 'Assigning...' : 'Assign criminal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reassign Modal */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title={`Reassign Court Room #${reassignTarget?.court_room_number}`}
        subtitle="Select a new or existing unassigned criminal for this courtroom"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Criminal
            </label>
            <select
              value={reassignCriminalId}
              onChange={(e) => setReassignCriminalId(e.target.value)}
              className="w-full h-8 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {unassignedCriminals.map((c) => (
                <option key={c.criminal_id} value={c.criminal_id}>
                  #{c.criminal_id} - {c.name} ({c.crime})
                  {c.criminal_id === reassignTarget?.criminal_id ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReassignModalOpen(false)}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Court Room Assignment"
        message={
          deleteTarget
            ? `Are you sure you want to remove the docket assignment for Court Room #${deleteTarget.court_room_number} (Criminal #${deleteTarget.criminal_id} - ${deleteTarget.criminal_name})?`
            : ''
        }
        confirmText="Remove assignment"
        isSubmitting={isDeleting}
      />
    </div>
  );
};
