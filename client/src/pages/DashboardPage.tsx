import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Clock,
  Lock,
  Gavel,
  Calendar,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Skeleton } from '../components/common/Skeleton';

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
            <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
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

  // Maximum count for jail bar chart scale
  const maxJailCount = Math.max(...criminalsPerJail.map((j) => j.count), 1);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Criminals */}
        <div
          onClick={() => navigate('/criminals')}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded hover:border-slate-400 dark:hover:border-slate-600 transition-fast cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Criminals</span>
            <Users size={14} />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.totalCriminals}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Registry records</div>
        </div>

        {/* Card 2: Total Officers */}
        <div
          onClick={() => navigate('/police')}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded hover:border-slate-400 dark:hover:border-slate-600 transition-fast cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Officers</span>
            <Shield size={14} />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.totalOfficers}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Active personnel</div>
        </div>

        {/* Card 3: Average Age */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Average Age</span>
            <Clock size={14} />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.averageAge.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Mean convict age</div>
        </div>

        {/* Card 4: Criminals in Jail */}
        <div
          onClick={() => navigate('/jail')}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded hover:border-slate-400 dark:hover:border-slate-600 transition-fast cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Incarcerated</span>
            <Lock size={14} />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.criminalsInJail}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Serving jail sentence</div>
        </div>

        {/* Card 5: Court Records */}
        <div
          onClick={() => navigate('/court-records')}
          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded hover:border-slate-400 dark:hover:border-slate-600 transition-fast cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Court</span>
            <Gavel size={14} />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {stats.criminalsWithCourt}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Court room assigned</div>
        </div>

        {/* Card 6: Case Status Breakdown */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Investigation Status</span>
            <TrendingUp size={14} />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-1.5 py-0.5 rounded text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-mono font-medium">
              {stats.casesByStatus['Open'] || 0} Open
            </span>
            <span className="px-1.5 py-0.5 rounded text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-mono font-medium">
              {stats.casesByStatus['Under Investigation'] || 0} Active
            </span>
            <span className="px-1.5 py-0.5 rounded text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono font-medium">
              {stats.casesByStatus['Closed'] || 0} Done
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Section: Bar Chart & Officer Workload Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart: Criminals per Jail Location */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Inmates per Jail Facility
              </h3>
              <p className="text-[11px] text-slate-500">Distribution across correctional centers</p>
            </div>
            <button
              onClick={() => navigate('/jail')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition-fast"
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
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{j.location}</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {j.count} {j.count === 1 ? 'inmate' : 'inmates'}
                    </span>
                  </div>
                  {/* Clean utilitarian bar */}
                  <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex items-center">
                    <div
                      className="h-full bg-slate-700 dark:bg-slate-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table: Criminals per Officer (including 0 count) */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Investigating Officer Workload
              </h3>
              <p className="text-[11px] text-slate-500">Active caseload count per officer (LEFT JOIN + GROUP BY)</p>
            </div>
            <button
              onClick={() => navigate('/police')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition-fast"
            >
              <span>View Police</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="py-1.5 font-semibold">ID</th>
                  <th className="py-1.5 font-semibold">Officer Name</th>
                  <th className="py-1.5 font-semibold">Rank & Branch</th>
                  <th className="py-1.5 font-semibold text-right">Assigned Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {criminalsPerOfficer.map((off) => (
                  <tr
                    key={off.police_id}
                    onClick={() => navigate(`/police/${off.police_id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-fast"
                  >
                    <td className="py-2 font-mono text-slate-500">#{off.police_id}</td>
                    <td className="py-2 font-medium text-slate-900 dark:text-slate-100">{off.name}</td>
                    <td className="py-2 text-slate-500">
                      {off.rank}, {off.branch}
                    </td>
                    <td className="py-2 text-right">
                      <span
                        className={`inline-block font-mono font-medium px-2 py-0.5 rounded text-xs ${
                          off.case_count > 0
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-400'
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

      {/* Recent Records List backed by real aggregate queries */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Recent Criminal Records
            </h3>
            <p className="text-[11px] text-slate-500">Latest entries synchronized from the database registry</p>
          </div>
          <button
            onClick={() => navigate('/criminals')}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-medium transition-fast"
          >
            <span>View All Criminals</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2 font-semibold">ID</th>
                <th className="py-2 font-semibold">Criminal Name</th>
                <th className="py-2 font-semibold">Crime</th>
                <th className="py-2 font-semibold">Age</th>
                <th className="py-2 font-semibold">Status</th>
                <th className="py-2 font-semibold">Investigating Officer</th>
                <th className="py-2 font-semibold">Court Room</th>
                <th className="py-2 font-semibold">Jail Facility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentRecords.map((r) => (
                <tr
                  key={r.criminal_id}
                  onClick={() => navigate(`/criminals/${r.criminal_id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-fast"
                >
                  <td className="py-2.5 font-mono text-slate-500">#{r.criminal_id}</td>
                  <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">{r.name}</td>
                  <td className="py-2.5 text-slate-700 dark:text-slate-300">{r.crime}</td>
                  <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400 tabular-nums">{r.age}</td>
                  <td className="py-2.5">
                    <StatusBadge status={r.investigation_status} size="sm" />
                  </td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">
                    {r.officer_rank} {r.officer_name}
                  </td>
                  <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                    {r.court_room_number ? `Room #${r.court_room_number}` : <span className="text-slate-400 italic">None</span>}
                  </td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400">
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
