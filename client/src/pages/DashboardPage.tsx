import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  Clock,
  Lock,
  Gavel,
  ArrowRight,
  TrendingUp,
  FileText,
  Pin,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { FolderCard } from '../components/common/FolderCard';
import { PushPin } from '../components/common/PushPin';
import { Skeleton } from '../components/common/Skeleton';

// Counting number component
const AnimatedNumber: React.FC<{ value: number; decimals?: number }> = ({ value, decimals = 0 }) => {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 500;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOut
      const current = start + (value - start) * (1 - Math.pow(1 - progress, 3));
      setDisplayVal(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [value]);

  return (
    <span className="font-mono tabular-nums">
      {decimals > 0 ? displayVal.toFixed(decimals) : Math.round(displayVal)}
    </span>
  );
};

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded" />
          <Skeleton className="h-64 rounded" />
        </div>
      </div>
    );
  }

  const { stats, criminalsPerJail, criminalsPerOfficer, recentRecords } = data;
  const maxJailCount = Math.max(...criminalsPerJail.map((j) => j.count), 1);

  // Cards animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  };

  return (
    <div className="space-y-6">
      {/* Banner / Board Shortcut Callout */}
      <div className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#B08D3C]/60 rounded-xs p-3 shadow-paper flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <PushPin color="red" size={20} />
          <div>
            <h3 className="font-typewriter text-xs font-bold uppercase tracking-wider text-[#1F1F1F] dark:text-[#E2DFD8]">
              Interactive Investigation Incident Board Available
            </h3>
            <p className="text-[11px] text-[#6B685F] dark:text-[#A09D95]">
              Visualize connected chains between Officers, Convicts, Judicial Dockets, and Detention Facilities.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/board')}
          className="px-3 py-1.5 bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] font-typewriter text-xs font-bold rounded-xs flex items-center gap-1.5 transition-fast shrink-0 shadow-paper"
        >
          <Pin size={12} />
          <span>OPEN CASE BOARD</span>
        </button>
      </div>

      {/* Case Folder Stat Cards with slight rotations (0.5 to 1 degree) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5"
      >
        {/* Card 1: Total Criminals */}
        <motion.div variants={cardVariants}>
          <FolderCard
            tabLabel="REGISTRY"
            tabId="TOT"
            rotationDeg={-0.6}
            onClick={() => navigate('/criminals')}
          >
            <div className="flex items-center justify-between text-[#7A7A7A] mb-1">
              <span className="font-typewriter text-[10px] uppercase font-bold tracking-wider">
                Total Criminals
              </span>
              <Users size={14} className="text-[#B08D3C]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#1F1F1F] dark:text-[#E2DFD8]">
              <AnimatedNumber value={stats.totalCriminals} />
            </div>
            <div className="font-typewriter text-[10px] text-[#7A7A7A] mt-1">
              Registered dossiers
            </div>
          </FolderCard>
        </motion.div>

        {/* Card 2: Total Officers */}
        <motion.div variants={cardVariants}>
          <FolderCard
            tabLabel="ROSTER"
            tabId="OFF"
            rotationDeg={0.8}
            onClick={() => navigate('/police')}
          >
            <div className="flex items-center justify-between text-[#7A7A7A] mb-1">
              <span className="font-typewriter text-[10px] uppercase font-bold tracking-wider">
                Total Officers
              </span>
              <Shield size={14} className="text-[#B08D3C]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#1F1F1F] dark:text-[#E2DFD8]">
              <AnimatedNumber value={stats.totalOfficers} />
            </div>
            <div className="font-typewriter text-[10px] text-[#7A7A7A] mt-1">
              Active personnel
            </div>
          </FolderCard>
        </motion.div>

        {/* Card 3: Average Age */}
        <motion.div variants={cardVariants}>
          <FolderCard
            tabLabel="STATS"
            tabId="AVG"
            rotationDeg={-0.5}
          >
            <div className="flex items-center justify-between text-[#7A7A7A] mb-1">
              <span className="font-typewriter text-[10px] uppercase font-bold tracking-wider">
                Mean Age
              </span>
              <Clock size={14} className="text-[#B08D3C]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#1F1F1F] dark:text-[#E2DFD8]">
              <AnimatedNumber value={stats.averageAge} decimals={2} />
            </div>
            <div className="font-typewriter text-[10px] text-[#7A7A7A] mt-1">
              Arithmetic average
            </div>
          </FolderCard>
        </motion.div>

        {/* Card 4: Incarcerated */}
        <motion.div variants={cardVariants}>
          <FolderCard
            tabLabel="PRISON"
            tabId="JAIL"
            rotationDeg={0.9}
            onClick={() => navigate('/jail')}
          >
            <div className="flex items-center justify-between text-[#7A7A7A] mb-1">
              <span className="font-typewriter text-[10px] uppercase font-bold tracking-wider">
                Incarcerated
              </span>
              <Lock size={14} className="text-[#B3261E]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#B3261E] dark:text-[#F87171]">
              <AnimatedNumber value={stats.criminalsInJail} />
            </div>
            <div className="font-typewriter text-[10px] text-[#7A7A7A] mt-1">
              Serving sentences
            </div>
          </FolderCard>
        </motion.div>

        {/* Card 5: In Court */}
        <motion.div variants={cardVariants}>
          <FolderCard
            tabLabel="DOCKET"
            tabId="CRT"
            rotationDeg={-0.7}
            onClick={() => navigate('/court-records')}
          >
            <div className="flex items-center justify-between text-[#7A7A7A] mb-1">
              <span className="font-typewriter text-[10px] uppercase font-bold tracking-wider">
                In Court
              </span>
              <Gavel size={14} className="text-[#B08D3C]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[#1F1F1F] dark:text-[#E2DFD8]">
              <AnimatedNumber value={stats.criminalsWithCourt} />
            </div>
            <div className="font-typewriter text-[10px] text-[#7A7A7A] mt-1">
              Assigned chambers
            </div>
          </FolderCard>
        </motion.div>

        {/* Card 6: Investigation Statuses */}
        <motion.div variants={cardVariants}>
          <FolderCard
            tabLabel="CASE"
            tabId="STS"
            rotationDeg={0.6}
          >
            <div className="flex items-center justify-between text-[#7A7A7A] mb-1">
              <span className="font-typewriter text-[10px] uppercase font-bold tracking-wider">
                Status Counts
              </span>
              <TrendingUp size={14} className="text-[#B08D3C]" />
            </div>
            <div className="space-y-1 mt-1 text-[11px] font-typewriter">
              <div className="flex items-center justify-between text-[#1E40AF] dark:text-blue-400">
                <span>OPEN:</span>
                <span className="font-mono font-bold">{stats.casesByStatus['Open'] || 0}</span>
              </div>
              <div className="flex items-center justify-between text-[#B45309] dark:text-amber-400">
                <span>ACTIVE:</span>
                <span className="font-mono font-bold">{stats.casesByStatus['Under Investigation'] || 0}</span>
              </div>
              <div className="flex items-center justify-between text-[#B3261E] dark:text-red-400">
                <span>CLOSED:</span>
                <span className="font-mono font-bold">{stats.casesByStatus['Closed'] || 0}</span>
              </div>
            </div>
          </FolderCard>
        </motion.div>
      </motion.div>

      {/* Analytics Section: Bar Chart & Officer Workload Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart: Criminals per Jail Location */}
        <div className="p-4 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9D0BE] dark:border-[#2E323B]">
            <div>
              <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
                Correctional Occupancy by Facility
              </h3>
              <p className="text-[11px] text-[#7A7A7A]">Inmate distribution across state prisons (GROUP BY)</p>
            </div>
            <button
              onClick={() => navigate('/jail')}
              className="font-typewriter text-xs text-[#1F2D3D] dark:text-[#C9D1D9] hover:text-[#B3261E] flex items-center gap-1 font-semibold transition-fast"
            >
              <span>View Jails</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {criminalsPerJail.map((j) => {
              const percentage = Math.round((j.count / maxJailCount) * 100);
              return (
                <div key={j.location} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-typewriter">
                    <span className="font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">{j.location}</span>
                    <span className="font-mono text-[#B3261E] dark:text-red-400 font-bold tabular-nums">
                      {j.count} {j.count === 1 ? 'inmate' : 'inmates'}
                    </span>
                  </div>
                  {/* Manila styled bar growing from zero */}
                  <div className="h-5 w-full bg-[#E6DFCD] dark:bg-[#15171B] rounded-xs border border-[#C5BBA6] dark:border-[#2C303A] overflow-hidden flex items-center p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full bg-[#1F2D3D] dark:bg-[#B08D3C] rounded-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table: Criminals per Officer (including 0 count) */}
        <div className="p-4 bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9D0BE] dark:border-[#2E323B]">
            <div>
              <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
                Investigating Officer Caseload
              </h3>
              <p className="text-[11px] text-[#7A7A7A]">Caseload distribution across personnel (LEFT JOIN + GROUP BY)</p>
            </div>
            <button
              onClick={() => navigate('/police')}
              className="font-typewriter text-xs text-[#1F2D3D] dark:text-[#C9D1D9] hover:text-[#B3261E] flex items-center gap-1 font-semibold transition-fast"
            >
              <span>View Roster</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#D9D0BE] dark:border-[#2E323B] font-typewriter text-[10px] uppercase tracking-wider text-[#7A7A7A]">
                  <th className="py-1.5 font-bold">Badge ID</th>
                  <th className="py-1.5 font-bold">Officer Name</th>
                  <th className="py-1.5 font-bold">Division</th>
                  <th className="py-1.5 font-bold text-right">Active Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFCD] dark:divide-[#2E323B]/60">
                {criminalsPerOfficer.map((off) => (
                  <tr
                    key={off.police_id}
                    onClick={() => navigate(`/police/${off.police_id}`)}
                    className="hover:bg-[#EFE9DC]/80 dark:hover:bg-[#252830] cursor-pointer transition-fast"
                  >
                    <td className="py-2 font-mono text-[#B3261E] font-bold">#{off.police_id}</td>
                    <td className="py-2 font-semibold text-[#1F1F1F] dark:text-[#E2DFD8] font-typewriter">
                      {off.name}
                    </td>
                    <td className="py-2 text-[#6B685F] dark:text-[#A09D95]">
                      {off.rank}, {off.branch}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={`inline-block font-mono font-bold px-2 py-0.5 rounded-xs text-xs ${
                          off.case_count > 0
                            ? 'bg-[#E6DFCD] dark:bg-[#2C303A] text-[#1F1F1F] dark:text-[#E2DFD8]'
                            : 'bg-transparent text-slate-400'
                        }`}
                      >
                        {off.case_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Records List */}
      <div className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9D0BE] dark:border-[#2E323B]">
          <div>
            <h3 className="font-typewriter text-xs font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
              Recent Case Dossiers Synchronized
            </h3>
            <p className="text-[11px] text-[#7A7A7A]">Latest offender records catalogued into the central registry</p>
          </div>
          <button
            onClick={() => navigate('/criminals')}
            className="font-typewriter text-xs text-[#1F2D3D] dark:text-[#C9D1D9] hover:text-[#B3261E] flex items-center gap-1 font-semibold transition-fast"
          >
            <span>All Dossiers</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#D9D0BE] dark:border-[#2E323B] font-typewriter text-[10px] uppercase tracking-wider text-[#7A7A7A]">
                <th className="py-2 font-bold">Case ID</th>
                <th className="py-2 font-bold">Offender Name</th>
                <th className="py-2 font-bold">Crime Charge</th>
                <th className="py-2 font-bold">Age</th>
                <th className="py-2 font-bold">Investigation Status</th>
                <th className="py-2 font-bold">Investigating Officer</th>
                <th className="py-2 font-bold">Court Docket</th>
                <th className="py-2 font-bold">Detention Facility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DFCD] dark:divide-[#2E323B]/60">
              {recentRecords.map((r) => (
                <tr
                  key={r.criminal_id}
                  onClick={() => navigate(`/criminals/${r.criminal_id}`)}
                  className="hover:bg-[#EFE9DC]/80 dark:hover:bg-[#252830] cursor-pointer transition-fast"
                >
                  <td className="py-2.5 font-mono text-[#B3261E] font-bold">#{r.criminal_id}</td>
                  <td className="py-2.5 font-typewriter font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
                    {r.name}
                  </td>
                  <td className="py-2.5 text-[#1F1F1F] dark:text-[#E2DFD8]">{r.crime}</td>
                  <td className="py-2.5 font-mono tabular-nums text-[#6B685F] dark:text-[#A09D95]">
                    {r.age}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge status={r.investigation_status} size="sm" />
                  </td>
                  <td className="py-2.5 text-[#6B685F] dark:text-[#A09D95]">
                    {r.officer_rank} {r.officer_name}
                  </td>
                  <td className="py-2.5 font-mono">
                    {r.court_room_number ? (
                      <span className="text-[#854D0E] font-semibold">Room #{r.court_room_number}</span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-2.5 text-[#6B685F] dark:text-[#A09D95]">
                    {r.jail_location || <span className="text-slate-400 italic">None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
