import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Eye, Filter, RotateCcw, Pin } from 'lucide-react';
import { api } from '../services/api';
import { Criminal, Police } from '../types';
import { DataTable } from '../components/common/DataTable';
import { Drawer } from '../components/common/Drawer';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../components/common/Toast';
import { PhotoUploadField } from '../components/criminals/PhotoUploadField';

export const CriminalsPage: React.FC = () => {
  const { role } = useAuth();
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

  // Photo upload states in drawer
  const [selectedPhotoBlob, setSelectedPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [partialFailure, setPartialFailure] = useState<{ criminalId: number; error: string } | null>(null);

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
    setSelectedPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setPhotoRemoved(false);
    setUploadProgress(null);
    setPartialFailure(null);
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
    setSelectedPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setPhotoRemoved(false);
    setUploadProgress(null);
    setPartialFailure(null);
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
        // Step 1: Update criminal details
        await api.updateCriminal(editingCriminal.criminal_id, {
          name: formData.name.trim(),
          age: parseInt(formData.age, 10),
          crime: formData.crime.trim(),
          investigating_officer: parseInt(formData.investigating_officer, 10),
          investigation_status: formData.investigation_status,
        });

        // Step 2: Handle photo update or removal
        if (selectedPhotoBlob) {
          setUploadProgress(50);
          await api.uploadCriminalPhoto(editingCriminal.criminal_id, selectedPhotoBlob);
          setUploadProgress(100);
        } else if (photoRemoved && editingCriminal.has_photo) {
          await api.deleteCriminalPhoto(editingCriminal.criminal_id);
        }

        showToast('success', 'Criminal record updated successfully');
        setIsDrawerOpen(false);
        loadData();
      } else {
        // Step 1: Create record first
        const newCid = parseInt(formData.criminal_id, 10);
        await api.createCriminal({
          criminal_id: newCid,
          name: formData.name.trim(),
          age: parseInt(formData.age, 10),
          crime: formData.crime.trim(),
          investigating_officer: parseInt(formData.investigating_officer, 10),
          investigation_status: formData.investigation_status,
        });

        // Step 2: If a photo is attached, upload it
        if (selectedPhotoBlob) {
          try {
            setUploadProgress(50);
            await api.uploadCriminalPhoto(newCid, selectedPhotoBlob);
            setUploadProgress(100);
            showToast('success', 'Criminal registered and photo uploaded successfully');
            setIsDrawerOpen(false);
            loadData();
          } catch (photoErr: any) {
            // Partial failure: record saved, photo failed
            setUploadProgress(null);
            loadData(); // Refresh list to show the created record
            setPartialFailure({
              criminalId: newCid,
              error: photoErr.message || 'Failed to upload photo',
            });
            showToast('error', 'Criminal record saved, but photo upload failed. You can retry below.');
            return;
          }
        } else {
          showToast('success', 'New criminal registered successfully');
          setIsDrawerOpen(false);
          loadData();
        }
      }
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryPhoto = async () => {
    if (!partialFailure || !selectedPhotoBlob) return;
    try {
      setIsSubmitting(true);
      setUploadProgress(50);
      await api.uploadCriminalPhoto(partialFailure.criminalId, selectedPhotoBlob);
      setUploadProgress(100);
      showToast('success', 'Criminal photo uploaded successfully on retry');
      setPartialFailure(null);
      setIsDrawerOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Retry photo upload failed');
      setUploadProgress(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.deleteCriminal(deleteTarget.criminal_id);
      showToast('success', `Criminal #${deleteTarget.criminal_id} record purged`);
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

  const distinctCrimes = useMemo(() => {
    const set = new Set<string>();
    criminals.forEach((c) => {
      if (c.crime) set.add(c.crime);
    });
    return Array.from(set);
  }, [criminals]);

  const distinctJails = useMemo(() => {
    const set = new Set<string>();
    criminals.forEach((c) => {
      if (c.jail_location) set.add(c.jail_location);
    });
    return Array.from(set);
  }, [criminals]);

  const columns = useMemo<ColumnDef<Criminal>[]>(
    () => [
      {
        id: 'photo',
        header: '',
        size: 44,
        enableSorting: false,
        cell: (info) => {
          const row = info.row.original;
          const initials = row.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div className="w-8 h-8 rounded-xs overflow-hidden shrink-0 flex items-center justify-center relative">
              {row.has_photo ? (
                <img
                  src={api.getCriminalThumbUrl(row.criminal_id, row.photo_updated_at)}
                  alt={`Photo of ${row.name}`}
                  width={32}
                  height={32}
                  loading="lazy"
                  className="w-8 h-8 rounded-xs object-cover border border-[#D9D0BE] dark:border-[#3A3F4D]"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-8 h-8 rounded-xs bg-[#E6DFCD] dark:bg-[#15171B] border border-[#D9D0BE] dark:border-[#3A3F4D] items-center justify-center font-typewriter font-bold text-[10px] text-[#7A6C58] dark:text-[#A09D95] select-none ${
                  row.has_photo ? 'hidden' : 'flex'
                }`}
              >
                {initials}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'criminal_id',
        header: 'Case ID',
        cell: (info) => (
          <span className="font-mono text-[#B3261E] font-bold">
            #{info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Offender Name',
        cell: (info) => (
          <span className="font-typewriter font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
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
        header: 'Crime Charge',
        cell: (info) => (
          <span className="font-medium text-[#1F1F1F] dark:text-[#E2DFD8]">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'investigation_status',
        header: 'Status Stamp',
        cell: (info) => <StatusBadge status={info.getValue() as string} size="sm" />,
      },
      {
        accessorKey: 'officer_name',
        header: 'Investigating Officer',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <span className="font-semibold">{row.officer_name || 'Unassigned'}</span>
              {row.officer_rank && (
                <span className="text-[11px] text-[#7A7A7A] block font-typewriter">
                  {row.officer_rank} ({row.officer_branch})
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'court_room_number',
        header: 'Court Docket',
        cell: (info) => {
          const room = info.getValue() as number | null;
          return room ? (
            <span className="font-mono font-semibold text-[#854D0E]">
              Room #{room}
            </span>
          ) : (
            <span className="text-[#7A7A7A] italic text-xs">None</span>
          );
        },
      },
      {
        accessorKey: 'jail_location',
        header: 'Incarceration',
        cell: (info) => {
          const row = info.row.original;
          return row.jail_location ? (
            <div>
              <span className="font-medium">{row.jail_location}</span>
              <span className="text-[10px] text-[#7A7A7A] block font-mono">
                {row.barrack_number} • {row.sentence}
              </span>
            </div>
          ) : (
            <span className="text-[#7A7A7A] italic text-xs">None</span>
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
              className="p-1 rounded text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#EFE9DC] dark:hover:bg-[#2E323B] transition-fast"
              title="Open Offender Dossier"
            >
              <Eye size={13} />
            </button>
            {role === 'admin' && (
              <>
                <button
                  onClick={(e) => handleOpenEdit(row.original, e)}
                  className="p-1 rounded text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#EFE9DC] dark:hover:bg-[#2E323B] transition-fast"
                  title="Edit Dossier"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={(e) => handleOpenDelete(row.original, e)}
                  className="p-1 rounded text-[#B3261E] hover:text-[#921E18] hover:bg-red-50 dark:hover:bg-red-950/40 transition-fast"
                  title="Purge Record"
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
      {/* Header with Title, Case Board Shortcut, and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#D9D0BE] dark:border-[#2E323B]">
        <div>
          <h2 className="font-typewriter text-base font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
            CRIMINAL RECORDS REGISTRY & DOSSIERS
          </h2>
          <p className="text-xs text-[#7A7A7A]">
            Archival records linked to investigating officers, courtroom hearings, and correctional sentences (SQL LEFT JOINs)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/board')}
            className="h-8 px-2.5 flex items-center gap-1.5 font-typewriter text-xs font-semibold bg-[#F6F0E0] dark:bg-[#1F2228] text-[#1F1F1F] dark:text-[#E2DFD8] border border-[#B08D3C] rounded-xs hover:bg-[#EFE9DC] transition-fast shadow-paper"
          >
            <Pin size={12} className="text-[#B3261E]" />
            <span>CASE BOARD</span>
          </button>

          {role === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="h-8 px-3 flex items-center gap-1.5 font-typewriter text-xs font-bold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs transition-fast shrink-0 shadow-paper"
            >
              <Plus size={14} />
              <span>FILE NEW CASE</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder flex flex-wrap items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-typewriter font-bold text-[#7A7A7A] mr-1 text-[11px] uppercase">
          <Filter size={12} />
          <span>INDEX FILTERS:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-7 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] font-typewriter text-[11px] focus:outline-none"
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
          className="h-7 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] font-typewriter text-[11px] focus:outline-none"
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
          className="h-7 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] font-typewriter text-[11px] focus:outline-none"
        >
          <option value="">Officer: All</option>
          {officers.map((off) => (
            <option key={off.police_id} value={off.police_id}>
              {off.name} ({off.rank})
            </option>
          ))}
        </select>

        {/* Jail Filter */}
        <select
          value={jailFilter}
          onChange={(e) => setJailFilter(e.target.value)}
          className="h-7 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] font-typewriter text-[11px] focus:outline-none"
        >
          <option value="">Jail: All</option>
          {distinctJails.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>

        {/* Court Record Filter */}
        <select
          value={courtFilter}
          onChange={(e) => setCourtFilter(e.target.value)}
          className="h-7 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] font-typewriter text-[11px] focus:outline-none"
        >
          <option value="">Court Assignment: All</option>
          <option value="true">Has Court Docket</option>
          <option value="false">No Court Docket</option>
        </select>

        {/* Jailed Filter */}
        <select
          value={jailedFilter}
          onChange={(e) => setJailedFilter(e.target.value)}
          className="h-7 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] font-typewriter text-[11px] focus:outline-none"
        >
          <option value="">Incarceration: All</option>
          <option value="true">Incarcerated</option>
          <option value="false">Not Incarcerated</option>
        </select>

        {(statusFilter || crimeFilter || officerFilter || jailFilter || courtFilter || jailedFilter) && (
          <button
            onClick={resetFilters}
            className="h-7 px-2 text-[#7A7A7A] hover:text-[#B3261E] flex items-center gap-1 font-typewriter text-[11px] font-bold transition-fast"
            title="Reset Filters"
          >
            <RotateCcw size={11} />
            <span>RESET</span>
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        data={criminals}
        columns={columns}
        isLoading={loading}
        onRowClick={(row) => navigate(`/criminals/${row.criminal_id}`)}
        exportFileName="criminals-dossier-registry.csv"
        pageSize={15}
        emptyTitle="No records on file"
        emptyDescription="No matching criminal files found in the archive for current criteria."
      />

      {/* Add / Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingCriminal ? `UPDATE FILE #${editingCriminal.criminal_id}` : 'FILE NEW CASE DOSSIER'}
        subtitle="Department record registration form — Form CRB-04"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-typewriter">
          {/* Criminal ID */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Case / Criminal ID <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="number"
              value={formData.criminal_id}
              disabled={!!editingCriminal}
              onChange={(e) => setFormData({ ...formData, criminal_id: e.target.value })}
              placeholder="e.g. 207"
              className={`w-full h-8 px-2.5 font-mono bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] disabled:opacity-60 focus:outline-none ${
                formErrors.criminal_id ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.criminal_id && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.criminal_id}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Legal Offender Name <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full name"
              className={`w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.name ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.name && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.name}</p>
            )}
          </div>

          {/* Age */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Age (18 - 100) <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="e.g. 32"
              className={`w-full h-8 px-2.5 font-mono bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.age ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.age && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.age}</p>
            )}
          </div>

          {/* Crime */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Crime Charge <span className="text-[#B3261E]">*</span>
            </label>
            <input
              type="text"
              value={formData.crime}
              onChange={(e) => setFormData({ ...formData, crime: e.target.value })}
              placeholder="e.g. Robbery, Theft, Cyber Fraud"
              className={`w-full h-8 px-2.5 bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.crime ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            />
            {formErrors.crime && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.crime}</p>
            )}
          </div>

          {/* Investigating Officer */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Investigating Officer <span className="text-[#B3261E]">*</span>
            </label>
            <select
              value={formData.investigating_officer}
              onChange={(e) => setFormData({ ...formData, investigating_officer: e.target.value })}
              className={`w-full h-8 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none ${
                formErrors.investigating_officer ? 'border-[#B3261E]' : 'border-[#D9D0BE] dark:border-[#2E323B]'
              }`}
            >
              <option value="">Select investigating officer</option>
              {officers.map((off) => (
                <option key={off.police_id} value={off.police_id}>
                  Badge #{off.police_id} - {off.rank} {off.name} ({off.branch})
                </option>
              ))}
            </select>
            {formErrors.investigating_officer && (
              <p className="text-[#B3261E] text-[11px] mt-0.5">{formErrors.investigating_officer}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block font-bold text-[#1F1F1F] dark:text-[#E2DFD8] mb-1">
              Investigation Status <span className="text-[#B3261E]">*</span>
            </label>
            <select
              value={formData.investigation_status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  investigation_status: e.target.value as any,
                })
              }
              className="w-full h-8 px-2 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] focus:outline-none"
            >
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Identification Photo Upload Field */}
          <PhotoUploadField
            currentPhotoUrl={
              !photoRemoved && editingCriminal?.has_photo
                ? api.getCriminalPhotoUrl(editingCriminal.criminal_id, editingCriminal.photo_updated_at)
                : null
            }
            selectedBlob={selectedPhotoBlob}
            previewUrl={photoPreviewUrl}
            onPhotoSelected={(blob, preview) => {
              setSelectedPhotoBlob(blob);
              setPhotoPreviewUrl(preview);
              setPhotoRemoved(false);
            }}
            onPhotoRemoved={() => {
              setSelectedPhotoBlob(null);
              setPhotoPreviewUrl(null);
              setPhotoRemoved(true);
            }}
            uploadProgress={uploadProgress}
            disabled={isSubmitting}
          />

          {/* Partial failure retry banner */}
          {partialFailure && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded text-xs space-y-2">
              <div className="font-typewriter font-bold text-amber-800 dark:text-amber-200">
                PARTIAL SAVE NOTICE:
              </div>
              <p className="text-amber-900 dark:text-amber-300">
                Criminal dossier #{partialFailure.criminalId} was saved, but mugshot upload encountered an error: {partialFailure.error}
              </p>
              <button
                type="button"
                onClick={handleRetryPhoto}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-typewriter text-xs font-bold rounded-xs shadow-xs"
              >
                Retry Photo Upload
              </button>
            </div>
          )}

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
              {isSubmitting ? 'Recording...' : editingCriminal ? 'Save Changes' : 'File Case'}
            </button>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Purge Criminal Record"
        message={
          deleteTarget
            ? `Confirm permanent deletion of Case Dossier #${deleteTarget.criminal_id} (${deleteTarget.name}). Linked judicial records and correctional sentences must be unassigned first.`
            : ''
        }
        confirmText="Purge Record"
        isSubmitting={isDeleting}
      />
    </div>
  );
};
