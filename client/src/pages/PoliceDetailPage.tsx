import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Phone,
  MapPin,
  Briefcase,
  Users,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { OfficerDetail } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/Toast';

export const PoliceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [officer, setOfficer] = useState<OfficerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      loadOfficer(parseInt(id, 10));
    }
  }, [id]);

  const loadOfficer = async (policeId: number) => {
    try {
      setLoading(true);
      const data = await api.getPoliceDetail(policeId);
      setOfficer(data);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load officer details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!officer) {
    return (
      <div className="p-8 text-center space-y-3">
        <AlertCircle size={32} className="mx-auto text-slate-400" />
        <h3 className="text-sm font-semibold">Officer not found</h3>
        <p className="text-xs text-slate-500">The requested officer profile does not exist.</p>
        <button
          onClick={() => navigate('/police')}
          className="px-3 py-1.5 text-xs bg-slate-900 text-white rounded"
        >
          Return to Roster
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/police')}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-fast"
            title="Back to roster"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">#{officer.police_id}</span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {officer.rank} {officer.name}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {officer.branch}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Age: {officer.age} • Phone: <span className="font-mono">{officer.number}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Officer Bio Card */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          <Shield size={14} className="text-slate-500" />
          <span>Personnel Particulars</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Badge ID</span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
              #{officer.police_id}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Assigned Unit / Branch</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
              {officer.branch}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Official Contact</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone size={12} className="text-slate-400" />
              <span className="font-mono text-slate-800 dark:text-slate-200">{officer.number}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-400 block">Duty Station / Address</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin size={12} className="text-slate-400 shrink-0" />
              <span className="truncate text-slate-800 dark:text-slate-200">{officer.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workload Counts */}
      <div>
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
          Investigation Caseload Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider">Total Assigned</span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 block tabular-nums">
              {officer.workload.total}
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 block uppercase tracking-wider">Open Inquiries</span>
            <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1 block tabular-nums">
              {officer.workload.open}
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
            <span className="text-[11px] text-blue-600 dark:text-blue-400 block uppercase tracking-wider">Under Investigation</span>
            <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1 block tabular-nums">
              {officer.workload.underInvestigation}
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">Closed Cases</span>
            <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1 block tabular-nums">
              {officer.workload.closed}
            </span>
          </div>
        </div>
      </div>

      {/* Criminals Investigated Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Assigned Criminals & Active Cases ({officer.criminals.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              List of suspects and convicts currently investigated by this officer
            </p>
          </div>
        </div>

        {officer.criminals.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No criminal cases currently assigned to this officer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-2 font-semibold">ID</th>
                  <th className="py-2 font-semibold">Criminal Name</th>
                  <th className="py-2 font-semibold">Age</th>
                  <th className="py-2 font-semibold">Crime</th>
                  <th className="py-2 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Court Room</th>
                  <th className="py-2 font-semibold">Jail Location</th>
                  <th className="py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {officer.criminals.map((c) => (
                  <tr
                    key={c.criminal_id}
                    onClick={() => navigate(`/criminals/${c.criminal_id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-fast"
                  >
                    <td className="py-2.5 font-mono text-slate-500">#{c.criminal_id}</td>
                    <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                    <td className="py-2.5 font-mono tabular-nums">{c.age}</td>
                    <td className="py-2.5">{c.crime}</td>
                    <td className="py-2.5">
                      <StatusBadge status={c.investigation_status} size="sm" />
                    </td>
                    <td className="py-2.5 font-mono">
                      {c.court_room_number ? `Room #${c.court_room_number}` : <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="py-2.5">
                      {c.jail_location ? (
                        <span>
                          {c.jail_location} ({c.barrack_number})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/criminals/${c.criminal_id}`);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-fast"
                        title="View Criminal Profile"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
