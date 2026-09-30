import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Phone,
  MapPin,
  Eye,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { api } from '../services/api';
import { OfficerDetail } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { PushPin } from '../components/common/PushPin';
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
      <div className="p-8 text-center space-y-3 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded">
        <AlertCircle size={32} className="mx-auto text-[#B3261E]" />
        <h3 className="text-sm font-typewriter font-bold">OFFICER RECORD NOT FOUND</h3>
        <p className="text-xs text-[#7A7A7A]">The requested officer profile does not exist on the roster.</p>
        <button
          onClick={() => navigate('/police')}
          className="px-3 py-1.5 text-xs font-typewriter bg-[#1F2D3D] text-[#EFE9DC] rounded shadow-paper"
        >
          Return to Roster
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D9D0BE] dark:border-[#2E323B]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/police')}
            className="p-1.5 rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] hover:bg-[#EFE9DC] dark:hover:bg-[#1F2228] text-[#1F1F1F] dark:text-[#E2DFD8] transition-fast shadow-paper"
            title="Return to roster"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[#B08D3C] font-bold">
                BADGE #{officer.police_id}
              </span>
              <h2 className="font-typewriter text-base font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">
                {officer.rank} {officer.name}
              </h2>
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-typewriter font-bold bg-[#1F2D3D] text-[#EFE9DC]">
                {officer.branch}
              </span>
            </div>
            <p className="font-typewriter text-xs text-[#7A7A7A] mt-0.5">
              Age: {officer.age} • Phone: <span className="font-mono font-bold">{officer.number}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Officer Bio Card */}
      <div className="p-5 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder relative">
        <div className="absolute -top-3 left-6 pointer-events-none">
          <PushPin color="brass" size={24} />
        </div>

        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#D9D0BE] dark:border-[#2E323B] font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
          <Shield size={14} className="text-[#B08D3C]" />
          <span>PERSONNEL RECORD PARTICULARS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-typewriter">
          <div>
            <span className="text-[#7A7A7A] block text-[10px] uppercase">Official Badge ID</span>
            <span className="font-mono font-bold text-sm text-[#B08D3C] mt-0.5 block">
              #{officer.police_id}
            </span>
          </div>
          <div>
            <span className="text-[#7A7A7A] block text-[10px] uppercase">Assigned Unit / Branch</span>
            <span className="font-bold text-sm text-[#1F1F1F] dark:text-[#E2DFD8] mt-0.5 block">
              {officer.branch}
            </span>
          </div>
          <div>
            <span className="text-[#7A7A7A] block text-[10px] uppercase">Direct Dispatch Phone</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone size={12} className="text-[#B08D3C]" />
              <span className="font-mono font-bold text-[#1F1F1F] dark:text-[#E2DFD8]">{officer.number}</span>
            </div>
          </div>
          <div>
            <span className="text-[#7A7A7A] block text-[10px] uppercase">Duty Station / Quarters</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin size={12} className="text-[#B08D3C] shrink-0" />
              <span className="truncate text-[#1F1F1F] dark:text-[#E2DFD8]">{officer.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Caseload Summary */}
      <div>
        <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider mb-2">
          INVESTIGATION CASELOAD SUMMARY
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder">
            <span className="text-[10px] font-typewriter font-bold text-[#7A7A7A] block uppercase">Total Inquiries</span>
            <span className="text-xl font-bold font-mono text-[#1F1F1F] dark:text-[#E2DFD8] mt-1 block tabular-nums">
              {officer.workload.total}
            </span>
          </div>
          <div className="p-3 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder">
            <span className="text-[10px] font-typewriter font-bold text-[#1E40AF] dark:text-blue-400 block uppercase">Open Inquiries</span>
            <span className="text-xl font-bold font-mono text-[#1E40AF] dark:text-blue-400 mt-1 block tabular-nums">
              {officer.workload.open}
            </span>
          </div>
          <div className="p-3 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder">
            <span className="text-[10px] font-typewriter font-bold text-[#B45309] dark:text-amber-400 block uppercase">Active Investigation</span>
            <span className="text-xl font-bold font-mono text-[#B45309] dark:text-amber-400 mt-1 block tabular-nums">
              {officer.workload.underInvestigation}
            </span>
          </div>
          <div className="p-3 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder">
            <span className="text-[10px] font-typewriter font-bold text-[#B3261E] dark:text-red-400 block uppercase">Closed Cases</span>
            <span className="text-xl font-bold font-mono text-[#B3261E] dark:text-red-400 mt-1 block tabular-nums">
              {officer.workload.closed}
            </span>
          </div>
        </div>
      </div>

      {/* Criminals Investigated Table */}
      <div className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9D0BE] dark:border-[#2E323B]">
          <div>
            <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
              Assigned Criminal Dossiers ({officer.criminals.length})
            </h3>
            <p className="text-[11px] text-[#7A7A7A]">
              Convicts and suspects under primary investigation by this officer
            </p>
          </div>
        </div>

        {officer.criminals.length === 0 ? (
          <div className="py-8 text-center text-[#7A7A7A] font-typewriter text-xs">
            [No active cases assigned to this officer on record]
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#D9D0BE] dark:border-[#2E323B] font-typewriter text-[10px] uppercase tracking-wider text-[#7A7A7A]">
                  <th className="py-2 font-bold">Case ID</th>
                  <th className="py-2 font-bold">Offender Name</th>
                  <th className="py-2 font-bold">Age</th>
                  <th className="py-2 font-bold">Crime Charge</th>
                  <th className="py-2 font-bold">Investigation Status</th>
                  <th className="py-2 font-bold">Court Docket</th>
                  <th className="py-2 font-bold">Incarceration</th>
                  <th className="py-2 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFCD] dark:divide-[#2E323B]/60">
                {officer.criminals.map((c) => (
                  <tr
                    key={c.criminal_id}
                    onClick={() => navigate(`/criminals/${c.criminal_id}`)}
                    className="hover:bg-[#EFE9DC]/80 dark:hover:bg-[#252830] cursor-pointer transition-fast"
                  >
                    <td className="py-2.5 font-mono text-[#B3261E] font-bold">#{c.criminal_id}</td>
                    <td className="py-2.5 font-typewriter font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">{c.name}</td>
                    <td className="py-2.5 font-mono tabular-nums text-[#6B685F] dark:text-[#A09D95]">{c.age}</td>
                    <td className="py-2.5 font-medium">{c.crime}</td>
                    <td className="py-2.5">
                      <StatusBadge status={c.investigation_status} size="sm" />
                    </td>
                    <td className="py-2.5 font-mono">
                      {c.court_room_number ? (
                        <span className="text-[#854D0E] font-semibold">Room #{c.court_room_number}</span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
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
                        className="p-1 rounded text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white transition-fast"
                        title="Open Case Dossier"
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
