import React, { useState, useEffect, useMemo } from 'react';
import { dataService } from '../services/dataService';
import { UserRole, SoulWinnerSummary } from '../types';
import { ScreenName } from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { resolveGroupJurisdiction, getCentresForJurisdiction } from '../services/groupJurisdictionService';
import {
  Users,
  Search,
  Building2,
  Phone,
  Flame,
  UserPlus,
  Trophy,
  Filter,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface SoulWinnersScreenProps {
  userRole: UserRole;
  onNavigate: (screen: ScreenName) => void;
  theme?: 'dark' | 'light';
  onSuccessToast: (title: string, message: string) => void;
}

export const SoulWinnersScreen: React.FC<SoulWinnersScreenProps> = ({
  userRole,
  onNavigate,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('all');
  const [winners, setWinners] = useState<SoulWinnerSummary[]>(
    dataService.getRegisteredSoulWinners()
  );
  const [selectedWinner, setSelectedWinner] = useState<SoulWinnerSummary | null>(null);

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setWinners(dataService.getRegisteredSoulWinners());
    });
    return unsub;
  }, []);

  const centres = dataService.getCentres();
  const activeProfile = dataService.getSoulWinnerProfile();

  const roleAllowedCentres = useMemo(() => {
    if (userRole === 'group_pastor') {
      const jurisdiction = resolveGroupJurisdiction(activeProfile, centres);
      return getCentresForJurisdiction(jurisdiction, centres);
    }
    if (userRole === 'pastor') {
      const pId = activeProfile?.churchCentreId || centres[0]?.id;
      const found = centres.filter(c => c.id === pId || c.name === activeProfile?.churchName);
      return found.length > 0 ? found : (centres[0] ? [centres[0]] : []);
    }
    return centres;
  }, [userRole, centres, activeProfile]);

  const roleAllowedCentreIds = useMemo(() => new Set(roleAllowedCentres.map(c => c.id)), [roleAllowedCentres]);

  const filteredWinners = winners.filter(w => {
    const matchesRoleJurisdiction =
      userRole === 'admin' || userRole === 'zonal_pastor' || userRole === 'coordinator' || userRole === 'public'
        ? true
        : !w.churchCentreId || roleAllowedCentreIds.has(w.churchCentreId);

    const matchesSearch =
      w.fullName.toLowerCase().includes(search.toLowerCase()) ||
      w.cellName.toLowerCase().includes(search.toLowerCase()) ||
      w.phone.includes(search);

    const matchesCentre =
      selectedCentre === 'all' || w.churchCentreId === selectedCentre;

    return matchesRoleJurisdiction && matchesSearch && matchesCentre;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Soul Winners & Evangelists Directory
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registered soul winning ministers, cell leaders, and PCF fellowship champions across Abuja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('add-soul')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Record Soul for Winner</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, cell or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCentre}
            onChange={e => setSelectedCentre(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs cursor-pointer"
          >
            <option value="all">All Collation Centres</option>
            {centres.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Soul Winners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWinners.map(w => (
          <div
            key={w.id}
            onClick={() => setSelectedWinner(w)}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {w.fullName}
                </h4>
                <span className="text-[10px] text-slate-400">{w.roleTitle || 'Soul Winner'}</span>
              </div>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {w.totalSoulsWon} Souls
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 truncate">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{w.cellName || 'Cell Not Specified'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-mono">{w.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{w.churchName || 'Abuja Hub'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">
                {w.recordSoulsCount} Individual • {w.batchSoulsCount} Batch
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">View Details</span>
            </div>
          </div>
        ))}
      </div>

      {/* Winner Detail Modal */}
      {selectedWinner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedWinner.fullName}
                </h3>
                <p className="text-xs text-slate-400">{selectedWinner.roleTitle || 'Soul Winner'} • {selectedWinner.cellName}</p>
              </div>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {selectedWinner.totalSoulsWon} Souls
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Phone Number</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{selectedWinner.phone}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Collation Hub</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedWinner.churchName || 'Abuja Hub'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">New Converts</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedWinner.newConvertsCount || 0}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Rededications</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedWinner.rededicationsCount || 0}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedWinner(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
