import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
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
  const { role } = useAuth();
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
      showToast('error', 'Failed to load candidate defendants');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const room = parseInt(newRoomNumber, 10);
    const cid = parseInt(selectedCriminalId, 10);

    if (isNaN(room) || room <= 0) {
      showToast('error', 'Enter a valid court room number');
      return;
    }
    if (isNaN(cid) || cid <= 0) {
      showToast('error', 'Please select a defendant');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createCourtRecord({
        court_room_number: room,
        criminal_id: cid,
      });
      showToast('success', `Assigned Offender #${cid} to Chamber #${room}`);
      setIsAssignModalOpen(false);
      loadCourtRecords();
    } catch (err: any) {
      showToast('error', err.message || 'Docket assignment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTarget) return;

    const cid = parseInt(reassignCriminalId, 10);
    if (isNaN(cid)) {
      showToast('error', 'Please select a defendant');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.updateCourtRecord(reassignTarget.court_room_number, {
        criminal_id: cid,
      });
      showToast(
        'success',
        `Reassigned Chamber #${reassignTarget.court_room_number} to Offender #${cid}`
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
      showToast('success', `Docket for Chamber #${deleteTarget.court_room_number} cleared`);
      setDeleteTarget(null);
      loadCourtRecords();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove docket record');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<CourtRecord>[]>(
    () => [
      {
        accessorKey: 'court_room_number',
        header: 'Chamber Room',
        cell: (info) => (
          <div className="flex items-center gap-1.5 font-typewriter font-bold text-[#854D0E] dark:text-amber-400">
            <Gavel size={13} className="text-[#B08D3C]" />
            <span>Room #{info.getValue() as number}</span>
          </div>
        ),
      },
      {
        accessorKey: 'criminal_id',
        header: 'Offender ID',
        cell: (info) => (
          <span className="font-mono text-[#B3261E] font-bold">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'criminal_name',
        header: 'Assigned Defendant',
        cell: (info) => (
          <span className="font-typewriter font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'crime',
        header: 'Alleged Charge',
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
            <span className="font-typewriter text-xs">
              {row.officer_rank} {row.officer_name}
            </span>
          ) : (
            <span className="text-[#7A7A7A] italic text-xs">None</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {role === 'admin' && (
<button
              onClick={() => handleOpenReassign(row.original)}
              className="px-2 py-0.5 text-xs font-typewriter border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] dark:hover:bg-[#2E323B] flex items-center gap-1 transition-fast"
              title="Reassign Chamber"
            >
              <RefreshCw size={11} />
              <span>Reassign</span>
            </button>
)}
            {role === 'admin' && (
<button
              onClick={() => setDeleteTarget(row.original)}
              className="p-1 rounded text-[#B3261E] hover:text-[#921E18] hover:bg-red-50 dark:hover:bg-red-950/40 transition-fast"
              title="Clear Docket Assignment"
            >
              <Trash2 size={13} />
            </button>
)}
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
            JUDICIAL COURT ROOM DOCKET
          </h2>
          <p className="text-xs text-[#7A7A7A]">
            Active trial chamber listings mapping court room numbers to unassigned defendants
          </p>
        </div>

        {role === 'admin' && (
<button
          onClick={handleOpenAssign}
          className="h-8 px-3 flex items-center gap-1.5 font-typewriter text-xs font-bold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs transition-fast shrink-0 shadow-paper"
        >
          <Plus size={14} />
          <span>ASSIGN TO CHAMBER</span>
        </button>
)}
      </div>

      {/* Main Table */}
      <DataTable
        data={courtRecords}
        columns={columns}
        isLoading={loading}
        exportFileName="court-docket-records.csv"
        pageSize={15}
        emptyTitle="No court records on file"
        emptyDescription="No court room assignments currently active in the judicial docket."
      />

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="ASSIGN DEFENDANT TO COURT ROOM"
        subtitle="Only defendants without a current hearing chamber are listed"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs font-typewriter">
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Court Room Number <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="number"
              value={newRoomNumber}
              onChange={(e) => setNewRoomNumber(e.target.value)}
              placeholder="e.g. 6"
              className="w-full h-8 px-2.5 font-mono bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Select Defendant <span className="text-[#B3261E]">*</span>
            </label>
            {unassignedCriminals.length === 0 ? (
              <div className="p-3 bg-[#EFE9DC] dark:bg-[#16181C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] text-[#7A7A7A] text-[11px]">
                All registered defendants currently have an assigned court room.
              </div>
            ) : (
              <select
                value={selectedCriminalId}
                onChange={(e) => setSelectedCriminalId(e.target.value)}
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
              {isSubmitting ? 'Assigning...' : 'Assign Chamber'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reassign Modal */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title={`REASSIGN CHAMBER #${reassignTarget?.court_room_number}`}
        subtitle="Select a new or current unassigned defendant for this hearing room"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4 text-xs font-typewriter">
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Select Defendant
            </label>
            <select
              value={reassignCriminalId}
              onChange={(e) => setReassignCriminalId(e.target.value)}
              className="w-full h-8 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
            >
              {unassignedCriminals.map((c) => (
                <option key={c.criminal_id} value={c.criminal_id}>
                  #{c.criminal_id} - {c.name} ({c.crime})
                  {c.criminal_id === reassignTarget?.criminal_id ? ' (Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9D0BE] dark:border-[#2E323B]">
            <button
              type="button"
              onClick={() => setIsReassignModalOpen(false)}
              className="px-3 py-1.5 border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs font-bold disabled:opacity-50 shadow-paper"
            >
              {isSubmitting ? 'Updating...' : 'Save Reassignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Clear Court Docket Record"
        message={
          deleteTarget
            ? `Confirm removal of Chamber #${deleteTarget.court_room_number} judicial assignment (Defendant #${deleteTarget.criminal_id} - ${deleteTarget.criminal_name}).`
            : ''
        }
        confirmText="Remove Docket"
        isSubmitting={isDeleting}
      />
    </div>
  );
};
