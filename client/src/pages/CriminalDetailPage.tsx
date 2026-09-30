import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { api } from '../services/api';
import { CriminalProfile } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/Toast';

export const CriminalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CriminalProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load criminal profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle size={32} className="mx-auto text-slate-400" />
        <h3 className="text-sm font-semibold">Criminal record not found</h3>
        <p className="text-xs text-slate-500">The requested profile does not exist.</p>
        <button
          onClick={() => navigate('/criminals')}
          className="px-3 py-1.5 text-xs bg-slate-900 text-white rounded"
        >
          Return to Criminals
        </button>
      </div>
    );
  }

  const { criminal, officer, courtRecord, jailRecord, timeline } = profile;

  return (
    <div className="space-y-5">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/criminals')}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-fast"
            title="Back to registry"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">#{criminal.criminal_id}</span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {criminal.name}
              </h2>
              <StatusBadge status={criminal.investigation_status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Crime: <span className="font-medium text-slate-700 dark:text-slate-300">{criminal.crime}</span> • Age: {criminal.age}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Personal Particulars */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <User size={14} className="text-slate-500" />
            <span>Personal Information</span>
          </div>

          <dl className="grid grid-cols-2 gap-y-3 text-xs">
            <div>
              <dt className="text-slate-400">System ID</dt>
              <dd className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                #{criminal.criminal_id}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Full Legal Name</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{criminal.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Age</dt>
              <dd className="font-mono tabular-nums text-slate-800 dark:text-slate-200 mt-0.5">
                {criminal.age} years old
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Alleged Crime</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{criminal.crime}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-400">Current Status</dt>
              <dd className="mt-1">
                <StatusBadge status={criminal.investigation_status} />
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 2: Investigating Officer Card */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Shield size={14} className="text-slate-500" />
              <span>Investigating Officer</span>
            </div>
            {officer && (
              <button
                onClick={() => navigate(`/police/${officer.police_id}`)}
                className="text-xs text-blue-700 dark:text-blue-400 hover:underline"
              >
                Officer profile
              </button>
            )}
          </div>

          {officer ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">{officer.name}</h4>
                  <p className="text-slate-500">{officer.rank} • {officer.branch}</p>
                </div>
                <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                  ID #{officer.police_id}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-slate-400" />
                  <span className="font-mono">{officer.number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{officer.address}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs italic">
              No investigating officer assigned to this case.
            </div>
          )}
        </div>

        {/* Card 3: Judicial / Court Record */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Gavel size={14} className="text-slate-500" />
              <span>Court Assignment</span>
            </div>
            <button
              onClick={() => navigate('/court-records')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              View court registry
            </button>
          </div>

          {courtRecord ? (
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[11px]">Assigned Chamber</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm font-mono">
                    Court Room #{courtRecord.court_room_number}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900">
                  Hearing Scheduled
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Proceedings are documented under judicial room docket #{courtRecord.court_room_number}.
              </p>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs italic">
              No judicial court room record assigned to this criminal.
            </div>
          )}
        </div>

        {/* Card 4: Incarceration / Jail Record */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Lock size={14} className="text-slate-500" />
              <span>Incarceration Record</span>
            </div>
            <button
              onClick={() => navigate('/jail')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              View jail registry
            </button>
          </div>

          {jailRecord ? (
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {jailRecord.location}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[11px] bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900 font-mono">
                    Barrack {jailRecord.barrack_number}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500">Sentence Duration</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                    {jailRecord.sentence}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs italic">
              Criminal is not currently committed to any correctional facility.
            </div>
          )}
        </div>
      </div>

      {/* Case Timeline: rendered ONLY if timeline data exists; otherwise completely omitted! */}
      {timeline && timeline.length > 0 && (
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <Calendar size={14} className="text-slate-500" />
            <span>Case Progression Timeline</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {timeline.map((step, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-700 dark:bg-slate-300 ring-4 ring-white dark:ring-slate-900" />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{step.title}</span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {step.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
