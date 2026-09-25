import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../services/dataService';
import { UserRole } from '../types';
import { ScreenName } from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import {
  Trophy,
  Medal,
  Award,
  Building2,
  Users,
  MapPin,
  TrendingUp,
  Sparkles,
  Flame,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface LeaderboardsScreenProps {
  userRole: UserRole;
  onSuccessToast: (title: string, message: string) => void;
  onNavigate: (screen: ScreenName) => void;
}

export const LeaderboardsScreen: React.FC<LeaderboardsScreenProps> = ({
  userRole,
  onNavigate,
}) => {
  const { palette } = useTheme();
  const [activeTab, setActiveTab] = useState<'groups' | 'churches' | 'winners'>('groups');
  const [centreStandings, setCentreStandings] = useState(dataService.getCentreStandings());
  const [soulWinners, setSoulWinners] = useState(dataService.getRegisteredSoulWinners());

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setCentreStandings(dataService.getCentreStandings());
      setSoulWinners(dataService.getRegisteredSoulWinners());
    });
    return unsub;
  }, []);

  const sortedWinners = [...soulWinners].sort((a, b) => b.totalSoulsWon - a.totalSoulsWon);

  // Group / Sub-Group Standings aggregation
  const groupStandings = useMemo(() => {
    const map = new Map<string, { groupName: string; target: number; soulsWon: number; centresCount: number }>();
    for (const s of centreStandings) {
      const gName = s.centre.groupName || 'General Group';
      if (!map.has(gName)) {
        map.set(gName, { groupName: gName, target: 0, soulsWon: 0, centresCount: 0 });
      }
      const entry = map.get(gName)!;
      entry.target += s.centre.target || 0;
      entry.soulsWon += s.soulsWon || 0;
      entry.centresCount += 1;
    }
    return Array.from(map.values()).map(g => ({
      ...g,
      percentage: g.target > 0 ? Math.min(100, Math.round((g.soulsWon / g.target) * 100)) : 0,
    })).sort((a, b) => b.soulsWon - a.soulsWon);
  }, [centreStandings]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              RON 2026 CEAZ1 Leaderboards
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Categorized performance rankings across Groups & Sub-Groups, Churches, and Individual Soul Winners.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Groups & Sub-Groups
          </button>
          <button
            onClick={() => setActiveTab('churches')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'churches'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Churches / Hubs
          </button>
          <button
            onClick={() => setActiveTab('winners')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'winners'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Individual Soul Winners
          </button>
        </div>
      </div>

      {/* GROUPS & SUB-GROUPS TAB */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {groupStandings.slice(0, 3).map((g, idx) => (
              <div
                key={g.groupName}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                    idx === 0
                      ? 'bg-amber-500 text-white shadow-md'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-white'
                      : 'bg-amber-700/80 text-white'
                  }`}
                >
                  #{idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {g.groupName}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {g.centresCount} Churches Reporting
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {g.soulsWon.toLocaleString()} Souls
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {g.percentage}% of target
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-6 w-16">Rank</th>
                  <th className="p-3.5">Group / Sub-Group Category</th>
                  <th className="p-3.5">Churches</th>
                  <th className="p-3.5 text-right">Target</th>
                  <th className="p-3.5 text-right">Souls Won</th>
                  <th className="p-3.5 pr-6 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {groupStandings.map((g, idx) => (
                  <tr key={g.groupName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 pl-6 font-bold font-mono text-slate-500">#{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      {g.groupName}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">{g.centresCount} churches</td>
                    <td className="p-3.5 text-right font-mono text-slate-500">{g.target.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {g.soulsWon.toLocaleString()}
                    </td>
                    <td className="p-3.5 pr-6 text-right font-bold font-mono text-slate-900 dark:text-white">
                      {g.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHURCHES / HUBS TAB */}
      {activeTab === 'churches' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-6 w-16">Rank</th>
                  <th className="p-3.5">Church Centre</th>
                  <th className="p-3.5">Group Category</th>
                  <th className="p-3.5">Coordinator</th>
                  <th className="p-3.5 text-right">Target</th>
                  <th className="p-3.5 text-right">Souls Won</th>
                  <th className="p-3.5 pr-6 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {centreStandings.map((s, idx) => (
                  <tr key={s.centre.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 pl-6 font-bold font-mono text-slate-500">#{idx + 1}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {s.centre.name}
                    </td>
                    <td className="p-3.5 text-indigo-600 dark:text-indigo-400 font-semibold">{s.centre.groupName || 'General Group'}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {s.centre.coordinatorName}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-500">{s.centre.target.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {s.soulsWon.toLocaleString()}
                    </td>
                    <td className="p-3.5 pr-6 text-right font-bold font-mono text-slate-900 dark:text-white">
                      {Math.round(s.percentageOfTarget)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INDIVIDUAL SOUL WINNERS TAB */}
      {activeTab === 'winners' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-6 w-16">Rank</th>
                  <th className="p-3.5">Evangelist / Soul Winner</th>
                  <th className="p-3.5">Cell / Fellowship</th>
                  <th className="p-3.5">Church Centre</th>
                  <th className="p-3.5 text-right">Individual Souls</th>
                  <th className="p-3.5 pr-6 text-right">Total Souls Won</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {sortedWinners.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 pl-6 font-bold font-mono text-slate-500">
                      #{idx + 1}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {w.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400">{w.roleTitle || 'Soul Winner'}</span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {w.cellName || w.pcfName || 'Field Team'}
                    </td>
                    <td className="p-3.5 text-slate-500">{w.churchName || 'Christ Embassy Abuja'}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600 dark:text-slate-400">
                      {w.recordSoulsCount}
                    </td>
                    <td className="p-3.5 pr-6 text-right font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      {w.totalSoulsWon}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
