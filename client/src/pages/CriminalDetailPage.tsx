import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Shield,
  Gavel,
  Lock,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  FileCheck2,
  UploadCloud,
  Trash2,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { CriminalProfile } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Stamp } from '../components/common/Stamp';
import { PushPin } from '../components/common/PushPin';
import { EvidenceTag } from '../components/common/EvidenceTag';
import { Redacted } from '../components/common/Redacted';
import { Skeleton } from '../components/common/Skeleton';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import { compressClientImage } from '../utils/imageCompression';

export const CriminalDetailPage: React.FC = () => {
  const { role } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CriminalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Photo management state
  const [isConfirmDeletePhotoOpen, setIsConfirmDeletePhotoOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Typewriter effect state for header
  const [displayedTitle, setDisplayedTitle] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      loadProfile(parseInt(id, 10));
    }
  }, [id]);

  const loadProfile = async (criminalId: number) => {
    try {
      setLoading(true);
      const data = await api.getCriminalProfile(criminalId);
      setProfile(data);
      setImgError(false);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load criminal dossier');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      setIsUploadingPhoto(true);
      const compressed = await compressClientImage(file);
      await api.uploadCriminalPhoto(profile.criminal.criminal_id, compressed.blob);
      showToast('success', 'Mugshot photo updated successfully');
      setImgError(false);
      loadProfile(profile.criminal.criminal_id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmDeletePhoto = async () => {
    if (!profile) return;
    try {
      setIsDeletingPhoto(true);
      await api.deleteCriminalPhoto(profile.criminal.criminal_id);
      showToast('success', 'Mugshot photo removed successfully');
      setIsConfirmDeletePhotoOpen(false);
      setImgError(false);
      loadProfile(profile.criminal.criminal_id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove photo');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  // Run typewriter effect once when profile loads
  useEffect(() => {
    if (!profile) return;
    const fullText = `CASE DOSSIER: ${profile.criminal.name.toUpperCase()} [REF #${profile.criminal.criminal_id}]`;
    let i = 0;
    setDisplayedTitle('');
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedTitle(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 28);
    return () => clearInterval(timer);
  }, [profile]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center space-y-3 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded">
        <AlertCircle size={32} className="mx-auto text-[#B3261E]" />
        <h3 className="text-sm font-typewriter font-bold">CASE DOSSIER NOT FOUND</h3>
        <p className="text-xs text-[#7A7A7A]">No archival record exists for file ID #{id}.</p>
        <button
          onClick={() => navigate('/criminals')}
          className="px-3 py-1.5 text-xs font-typewriter bg-[#1F2D3D] text-[#EFE9DC] rounded shadow-paper"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const { criminal, officer, courtRecord, jailRecord, timeline } = profile;

  // Offender Initials for silhouette
  const initials = criminal.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-5">
      {/* Dossier Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9D0BE] dark:border-[#2E323B]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/criminals')}
            className="p-1.5 rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] hover:bg-[#EFE9DC] dark:hover:bg-[#1F2228] text-[#1F1F1F] dark:text-[#E2DFD8] transition-fast shadow-paper"
            title="Return to registry"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#B3261E] font-bold">
                FILE #{criminal.criminal_id}
              </span>
              <h2 className="font-typewriter text-base font-bold text-[#1F1F1F] dark:text-[#E2DFD8] min-h-[24px]">
                {displayedTitle || criminal.name}
              </h2>
            </div>
            <p className="font-typewriter text-[11px] text-[#7A7A7A] mt-0.5">
              OFFENDER DOSSIER • CENTRAL CRIMINAL RECORDS BUREAU ARCHIVE
            </p>
          </div>
        </div>

        {/* Rubber Stamps: Status + CONFIDENTIAL */}
        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={criminal.investigation_status} size="md" animateSlam={true} />
          <Stamp text="CONFIDENTIAL" variant="confidential" size="md" rotateDeg={2.5} animateSlam={true} />
        </div>
      </div>

      {/* Main Dossier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Official Mugshot Silhouette Frame (4 cols) */}
        <div className="lg:col-span-4 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-4 flex flex-col items-center justify-between relative">
          <div className="absolute -top-3 left-6 pointer-events-none">
            <PushPin color="brass" size={24} />
          </div>

          <div className="w-full text-center pb-2 border-b border-[#D9D0BE] dark:border-[#2E323B] font-typewriter text-[11px] font-bold tracking-wider text-[#7A7A7A] uppercase">
            IDENTIFICATION RECORD
          </div>

          {/* Mugshot frame with height ruler graphic & silhouette / real photo */}
          <div className="my-4 w-52 h-64 bg-[#E6DFCD] dark:bg-[#15171B] border-2 border-[#1F1F1F] dark:border-[#3A3F4D] rounded-xs relative flex items-end justify-center shadow-inner overflow-hidden">
            {/* Height-chart ruler graphic behind silhouette/photo */}
            <div className="absolute inset-y-0 left-0 w-12 border-r border-[#C5BBA6] dark:border-[#2C303A] flex flex-col justify-between py-2 text-[9px] font-mono text-[#7A6C58] select-none pl-1.5 z-0">
              <span className="border-b border-[#C5BBA6] pr-1">6'3" ──</span>
              <span className="border-b border-[#C5BBA6] pr-1">6'0" ──</span>
              <span className="border-b border-[#C5BBA6] pr-1">5'9" ──</span>
              <span className="border-b border-[#C5BBA6] pr-1">5'6" ──</span>
              <span className="border-b border-[#C5BBA6] pr-1">5'3" ──</span>
              <span className="border-b border-[#C5BBA6] pr-1">5'0" ──</span>
              <span>4'9" ──</span>
            </div>

            {/* Real photo or silhouette graphic */}
            {criminal.has_photo && !imgError ? (
              <img
                src={api.getCriminalPhotoUrl(criminal.criminal_id, criminal.photo_updated_at)}
                alt={`Photo of ${criminal.name}`}
                width={208}
                height={256}
                loading="lazy"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover z-10 relative"
              />
            ) : (
              <div className="relative z-10 flex flex-col items-center justify-end w-full h-full pb-8">
                <svg width="140" height="180" viewBox="0 0 100 120" fill="#2E2C28" className="select-none">
                  <circle cx="50" cy="40" r="26" />
                  <path d="M15 115 C15 75 32 68 50 68 C68 68 85 75 85 115 Z" />
                </svg>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-typewriter font-bold text-lg text-[#EFE9DC]/70 pointer-events-none">
                  {initials}
                </span>
              </div>
            )}

            {/* Mugshot Chalkboard Plaque */}
            <div className="absolute bottom-2 inset-x-3 bg-[#1F1F1F] text-[#EFE9DC] text-center py-1 rounded-xs border border-white/20 font-typewriter z-20 shadow-md">
              <div className="text-[10px] tracking-widest text-[#B08D3C] font-bold">
                CRB • #{criminal.criminal_id}
              </div>
              <div className="text-xs font-bold truncate px-1">
                {criminal.name}
              </div>
            </div>

            {/* Uploading Spinner Overlay */}
            {isUploadingPhoto && (
              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white text-xs font-typewriter z-30">
                <Loader2 size={24} className="animate-spin mb-2" />
                <span>Processing Photo...</span>
              </div>
            )}
          </div>

          {/* Admin-only Photo Controls on the Frame */}
          {role === 'admin' && (
            <div className="w-full flex items-center justify-center gap-2 mb-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto || isDeletingPhoto}
                className="hidden"
                aria-label="Upload mugshot photo"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto || isDeletingPhoto}
                className="px-2.5 py-1 text-[11px] font-typewriter font-semibold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] rounded-xs transition-fast flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <UploadCloud size={13} />
                <span>{criminal.has_photo ? 'Change photo' : 'Upload photo'}</span>
              </button>
              {criminal.has_photo && (
                <button
                  type="button"
                  onClick={() => setIsConfirmDeletePhotoOpen(true)}
                  disabled={isUploadingPhoto || isDeletingPhoto}
                  className="px-2.5 py-1 text-[11px] font-typewriter text-[#B3261E] hover:text-[#921E18] hover:bg-red-50 dark:hover:bg-red-950/30 border border-[#B3261E]/30 rounded-xs transition-fast flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  <span>Remove photo</span>
                </button>
              )}
            </div>
          )}

          {/* Evidence Tags for quick lookup */}
          <div className="w-full space-y-2 pt-2 border-t border-[#D9D0BE] dark:border-[#2E323B]">
            <EvidenceTag label="CRIME CHARGE" value={criminal.crime} tagId="01" className="w-full" />
            <EvidenceTag label="AGE AT FILING" value={`${criminal.age} YEARS`} tagId="02" className="w-full" />
          </div>
        </div>

        {/* Right Column: Paper-Clipped Record Sheets (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Sheet 1: Personal Particulars & Allegation Details */}
          <div className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-5 relative ruled-paper">
            {/* SVG Paperclip on top edge */}
            <div className="absolute -top-3 right-8 pointer-events-none drop-shadow-sm">
              <svg width="22" height="34" viewBox="0 0 16 28" fill="none">
                <path
                  d="M 5 20 L 5 7 C 5 4.5 7 2.5 9 2.5 C 11 2.5 13 4.5 13 7 L 13 22 C 13 25.5 10 27.5 7 27.5 C 4 27.5 1.5 25 1.5 22 L 1.5 9 C 1.5 7 2.5 5 4 5"
                  stroke="#B08D3C"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#D9D0BE] dark:border-[#2E323B]">
              <FileCheck2 size={16} className="text-[#B08D3C]" />
              <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
                RECORD SHEET 01 • CASE PARTICULARS
              </h3>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 text-xs font-typewriter">
              <div>
                <dt className="text-[#7A7A7A] uppercase text-[10px]">Record Identifier</dt>
                <dd className="font-mono font-bold text-sm text-[#B3261E] mt-0.5">
                  CRIMINAL ID #{criminal.criminal_id}
                </dd>
              </div>

              <div>
                <dt className="text-[#7A7A7A] uppercase text-[10px]">Full Legal Offender Name</dt>
                <dd className="font-bold text-sm text-[#1F1F1F] dark:text-[#E2DFD8] mt-0.5">
                  {criminal.name}
                </dd>
              </div>

              <div>
                <dt className="text-[#7A7A7A] uppercase text-[10px]">Offender Age</dt>
                <dd className="font-mono font-bold text-sm text-[#1F1F1F] dark:text-[#E2DFD8] mt-0.5">
                  {criminal.age} years old
                </dd>
              </div>

              <div>
                <dt className="text-[#7A7A7A] uppercase text-[10px]">Classified Crime Charge</dt>
                <dd className="font-bold text-sm text-[#B3261E] dark:text-red-400 mt-0.5">
                  {criminal.crime}
                </dd>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-[#D9D0BE] dark:border-[#2E323B]">
                <dt className="text-[#7A7A7A] uppercase text-[10px]">Investigation Status</dt>
                <dd className="mt-1">
                  <StatusBadge status={criminal.investigation_status} />
                </dd>
              </div>
            </dl>
          </div>

          {/* Sheet 2: Investigating Officer Card with REDACTED Bars */}
          <div className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-5 relative">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#D9D0BE] dark:border-[#2E323B]">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[#B08D3C]" />
                <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
                  INVESTIGATING OFFICER CARD
                </h3>
              </div>
              {officer && (
                <button
                  onClick={() => navigate(`/police/${officer.police_id}`)}
                  className="font-typewriter text-xs text-[#1E40AF] dark:text-blue-400 hover:underline"
                >
                  Officer File #{officer.police_id}
                </button>
              )}
            </div>

            {officer ? (
              <div className="space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className="font-typewriter font-bold text-sm text-[#1F1F1F] dark:text-[#E2DFD8]">
                      {officer.rank} {officer.name}
                    </h4>
                    <span className="font-typewriter text-[#7A7A7A] text-[11px]">
                      {officer.branch} Division • Badge ID #{officer.police_id}
                    </span>
                  </div>

                  <span className="font-typewriter text-[10px] px-2 py-0.5 rounded-xs bg-[#1F2D3D] text-[#EFE9DC] uppercase font-bold">
                    Primary Investigator
                  </span>
                </div>

                {/* Confidential Contact with REDACTED black bars (reveal on hover/focus!) */}
                <div className="pt-3 border-t border-[#D9D0BE] dark:border-[#2E323B] space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#B08D3C] shrink-0" />
                    <span className="font-typewriter text-[11px] text-[#7A7A7A]">Direct Line:</span>
                    <Redacted permanent={role !== 'admin'}>
                      <span className="font-mono font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
                        {officer.number}
                      </span>
                    </Redacted>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-[#B08D3C] shrink-0" />
                    <span className="font-typewriter text-[11px] text-[#7A7A7A]">Station / Address:</span>
                    <Redacted permanent={role !== 'admin'}>
                      <span className="font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
                        {officer.address}
                      </span>
                    </Redacted>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-[#7A7A7A] font-typewriter text-xs italic">
                No investigating officer currently assigned to this dossier.
              </div>
            )}
          </div>

          {/* Sheet 3: Judicial Court & Detention Particulars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Court Record */}
            <div className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D9D0BE] dark:border-[#2E323B]">
                <div className="flex items-center gap-1.5 font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
                  <Gavel size={14} className="text-[#B08D3C]" />
                  <span>COURT DOCKET</span>
                </div>
                <button
                  onClick={() => navigate('/court-records')}
                  className="font-typewriter text-[10px] text-[#7A7A7A] hover:text-[#1F1F1F]"
                >
                  Docket Log
                </button>
              </div>

              {courtRecord ? (
                <div className="p-2.5 bg-[#FEF08A] text-[#713F12] border border-[#FACC15] rounded-xs font-typewriter text-xs space-y-1">
                  <div className="font-bold text-sm">
                    Court Room #{courtRecord.court_room_number}
                  </div>
                  <div className="text-[10px] font-mono text-[#854D0E]">
                    Formal hearing scheduled under chamber #{courtRecord.court_room_number}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[#7A7A7A] font-typewriter text-xs italic">
                  [No court room assigned]
                </div>
              )}
            </div>

            {/* Jail Record */}
            <div className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D9D0BE] dark:border-[#2E323B]">
                <div className="flex items-center gap-1.5 font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
                  <Lock size={14} className="text-[#B3261E]" />
                  <span>INCARCERATION</span>
                </div>
                <button
                  onClick={() => navigate('/jail')}
                  className="font-typewriter text-[10px] text-[#7A7A7A] hover:text-[#1F1F1F]"
                >
                  Jail Log
                </button>
              </div>

              {jailRecord ? (
                <div className="p-2.5 bg-[#F3F4F6] text-[#1F2937] border border-[#D1D5DB] rounded-xs font-typewriter text-xs space-y-1">
                  <div className="font-bold">{jailRecord.location}</div>
                  <div className="text-[11px] font-mono text-[#4B5563]">
                    Barrack {jailRecord.barrack_number} • Sentence: {jailRecord.sentence}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-[#7A7A7A] font-typewriter text-xs italic">
                  [Not incarcerated]
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Case Timeline: rendered ONLY if timeline data exists; otherwise completely omitted! */}
      {timeline && timeline.length > 0 && (
        <div className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-5 relative">
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#D9D0BE] dark:border-[#2E323B]">
            <Calendar size={16} className="text-[#B08D3C]" />
            <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
              INVESTIGATION CHRONOLOGY • CASE TIMELINE
            </h3>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D9D0BE] dark:before:bg-[#2E323B]">
            {timeline.map((step, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#B3261E] ring-4 ring-[#F6F0E0] dark:ring-[#1F2228]" />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-typewriter font-bold text-sm text-[#1F1F1F] dark:text-[#E2DFD8]">
                      {step.title}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-typewriter font-bold rounded-xs bg-[#1F2D3D] text-[#EFE9DC] uppercase">
                      {step.status}
                    </span>
                  </div>
                  <p className="font-typewriter text-xs text-[#4B4B4B] dark:text-[#A09D95] mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remove Photo ConfirmDialog */}
      <ConfirmDialog
        isOpen={isConfirmDeletePhotoOpen}
        onClose={() => setIsConfirmDeletePhotoOpen(false)}
        onConfirm={handleConfirmDeletePhoto}
        title="Remove Mugshot Photo"
        message={
          profile
            ? `Are you sure you want to permanently remove the identification photo for ${profile.criminal.name} (File #${profile.criminal.criminal_id})? The record will revert to the official outline silhouette.`
            : ''
        }
        confirmText="Remove Photo"
        isSubmitting={isDeletingPhoto}
      />
    </div>
  );
};

