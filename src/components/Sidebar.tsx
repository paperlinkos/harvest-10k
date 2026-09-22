import React, { useState, useEffect } from 'react';
import { UserRole, SoulWinnerProfile } from '../types';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Tv,
  PlusCircle,
  CheckSquare,
  Database,
  Users,
  UserCheck,
  Settings,
  Flame,
  Zap,
  Play,
  Pause,
  X,
  Trophy,
  History,
  FileSpreadsheet,
  Video,
  Camera,
  HelpCircle,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  roles: UserRole[];
  badge?: number;
  isSpecial?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export type ScreenName =
  | 'dashboard'
  | 'projector'
  | 'leaderboards'
  | 'reports'
  | 'soul-winners'
  | 'add-soul'
  | 'tally'
  | 'reconcile'
  | 'approval'
  | 'records'
  | 'followup'
  | 'admin'
  | 'audit-log'
  | 'live-stream'
  | 'testimonies';

interface SidebarProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  userRole: UserRole;
  pendingApprovalsCount: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenTour?: () => void;
  onOpenSoulWinnerReg?: () => void;
  soulWinnerProfile?: SoulWinnerProfile;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  userRole,
  pendingApprovalsCount,
  isOpen,
  onClose,
  onOpenTour,
  onOpenSoulWinnerReg,
  soulWinnerProfile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { theme, toggleTheme, palette } = useTheme();
  const isDark = theme === 'dark';
  const [simStatus, setSimStatus] = useState(() => dataService.getSimulationStatus());
  const stats = dataService.getStats();
  const progressPercent = Math.min(100, Math.round((stats.totalSouls / stats.target) * 1000) / 10);

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setSimStatus(dataService.getSimulationStatus());
    });
    return unsub;
  }, []);

  const navGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Live Dashboard',
          icon: LayoutDashboard,
          roles: ['coordinator', 'admin', 'public', 'field_worker'],
        },
        {
          id: 'leaderboards',
          label: 'Leaderboards',
          icon: Trophy,
          roles: ['coordinator', 'admin', 'public', 'field_worker'],
        },
        {
          id: 'reports',
          label: 'Executive Reports',
          icon: FileSpreadsheet,
          roles: ['coordinator', 'admin'],
        },
        {
          id: 'projector',
          label: 'Projector View',
          icon: Tv,
          roles: ['coordinator', 'admin', 'public', 'field_worker'],
          isSpecial: true,
        },
        {
          id: 'live-stream',
          label: 'Live Stream',
          icon: Video,
          roles: ['coordinator', 'admin', 'public', 'field_worker'],
          isSpecial: true,
        },
      ],
    },
    {
      group: 'Operations',
      items: [
        {
          id: 'tally',
          label: 'Tap to Tally',
          icon: Zap,
          roles: ['coordinator', 'admin', 'field_worker'],
          isSpecial: true,
        },
        {
          id: 'reconcile',
          label: 'Reconcile Souls',
          icon: CheckSquare,
          roles: ['coordinator', 'admin', 'field_worker'],
        },
        {
          id: 'add-soul',
          label: 'Full Form Record',
          icon: PlusCircle,
          roles: ['coordinator', 'admin', 'field_worker'],
        },
        {
          id: 'testimonies',
          label: 'Media & Testimonies',
          icon: Camera,
          roles: ['coordinator', 'admin', 'public', 'field_worker'],
        },
        {
          id: 'approval',
          label: 'Verification Queue',
          icon: UserCheck,
          roles: ['coordinator', 'admin'],
          badge: pendingApprovalsCount,
        },
        {
          id: 'records',
          label: userRole === 'field_worker' ? 'My Won Souls' : 'Soul Directory',
          icon: Database,
          roles: ['coordinator', 'admin', 'field_worker'],
        },
        {
          id: 'soul-winners',
          label: 'Soul Winners Roster',
          icon: Users,
          roles: ['coordinator', 'admin'],
        },
        {
          id: 'followup',
          label: 'Follow-Up Board',
          icon: History,
          roles: ['coordinator', 'admin'],
        },
      ],
    },
    {
      group: 'System',
      items: [
        {
          id: 'admin',
          label: 'Admin Settings',
          icon: Settings,
          roles: ['admin'],
        },
        {
          id: 'audit-log',
          label: 'Security & Audit Log',
          icon: History,
          roles: ['admin'],
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 glass-nav border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-64 xl:w-72'}`}
      >
        {/* Top Section: Brand Header & Navigation */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Header */}
          <div
            className={`h-16 px-4 flex items-center border-b border-slate-100 dark:border-slate-800/80 ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <button
              onClick={() => {
                onNavigate('dashboard');
                onClose();
              }}
              className="flex items-center gap-3 text-left group cursor-pointer min-w-0"
              title="Harvest 10K — Soul Collation Centre"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0"
                style={{ backgroundColor: palette.hex }}
              >
                <Flame className="w-5 h-5 text-white fill-white" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-black text-base xl:text-lg tracking-tight text-slate-900 dark:text-slate-100 truncate">
                      HARVEST 10K
                    </span>
                  </div>
                  <p className="text-[10px] xl:text-[11px] text-slate-400 font-medium truncate">
                    Soul Collation Centre
                  </p>
                </div>
              )}
            </button>

            {/* Desktop Collapse/Expand Button (when expanded) */}
            {!isCollapsed && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Expand Toggle when Collapsed */}
          {isCollapsed && onToggleCollapse && (
            <div className="hidden lg:flex justify-center pt-2.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Expand Sidebar"
                aria-label="Expand Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Groups List */}
          <div className="px-2.5 py-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {navGroups.map(group => {
              const visibleItems = group.items.filter(item => item.roles.includes(userRole));
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.group} className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
                      {group.group}
                    </div>
                  )}

                  <div className="space-y-1">
                    {visibleItems.map(item => {
                      const Icon = item.icon;
                      const isActive = currentScreen === item.id;

                      if (isCollapsed) {
                        return (
                          <div key={item.id} className="relative group flex justify-center">
                            <button
                              onClick={() => {
                                onNavigate(item.id as any);
                                onClose();
                              }}
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md font-bold'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                              }`}
                              title={item.label}
                            >
                              <Icon
                                className={`w-5 h-5 transition-colors ${
                                  isActive
                                    ? 'text-white dark:text-slate-900'
                                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                                }`}
                              />
                            </button>

                            {/* Mini Floating Badge */}
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className="absolute top-0 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center pointer-events-none shadow-xs">
                                {item.badge}
                              </span>
                            )}

                            {/* Tooltip on hover */}
                            <div className="absolute left-14 px-2.5 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity translate-y-1">
                              {item.label}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id as any);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 xl:px-3.5 xl:py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 xl:gap-3 min-w-0">
                            <Icon
                              className={`w-4 h-4 transition-colors shrink-0 ${
                                isActive
                                  ? 'text-white dark:text-slate-900'
                                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono-tabular shrink-0 ${
                                isActive
                                  ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                                  : 'bg-rose-500 text-white'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}

                          {item.isSpecial && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono-tabular shrink-0 ${
                                isActive
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}
                            >
                              Live
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Theme Switcher, Profile & Controls */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 shrink-0">
          {/* 1. LIGHT / DARK MODE TOGGLE (User Request) */}
          {isCollapsed ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs group relative"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                )}
                {/* Tooltip on hover */}
                <div className="absolute left-14 px-2.5 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </div>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 transition-all cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs group"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <div className="flex items-center gap-2.5">
                {isDark ? (
                  <Moon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                )}
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              {/* iOS / Bento Style Toggle Pill */}
              <div
                className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                  isDark ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </div>
            </button>
          )}

          {/* 2. User Profile Card (Jobgio Image 2 style) */}
          {soulWinnerProfile && (
            <button
              type="button"
              onClick={() => {
                if (onOpenSoulWinnerReg) {
                  onOpenSoulWinnerReg();
                  onClose();
                }
              }}
              className={`w-full flex items-center gap-2.5 p-2 rounded-2xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/80 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all text-left group cursor-pointer ${
                isCollapsed ? 'justify-center p-1.5' : ''
              }`}
              title={`Profile: ${soulWinnerProfile.fullName}`}
            >
              <div className="relative shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                  style={{ backgroundColor: palette.hex }}
                >
                  {soulWinnerProfile.fullName
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full text-[8px] font-black flex items-center justify-center border border-white dark:border-slate-900">
                  ★
                </span>
              </div>

              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {soulWinnerProfile.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {soulWinnerProfile.cellName} · {soulWinnerProfile.pcfName}
                  </div>
                </div>
              )}
            </button>
          )}

          {/* 3. Compact Simulation Quick Controls (Expanded only) */}
          {!isCollapsed && (
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    {simStatus.isSimulating && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        simStatus.isSimulating ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </span>
                  Simulation
                </span>

                <button
                  onClick={() => {
                    if (simStatus.isSimulating) dataService.pauseSimulation();
                    else dataService.resumeSimulation();
                  }}
                  className={`p-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    simStatus.isSimulating
                      ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                  }`}
                  title={simStatus.isSimulating ? 'Pause field reports' : 'Resume live feed'}
                >
                  {simStatus.isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{simStatus.isSimulating ? 'Pause' : 'Play'}</span>
                </button>
              </div>

              <button
                onClick={() => dataService.triggerSimulatedSubmission(undefined, Math.floor(12 + Math.random() * 20))}
                className={`w-full py-1.5 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-transform active:scale-98 shadow-xs cursor-pointer ${palette.btnPrimary}`}
              >
                <Zap className="w-3 h-3" />
                <span>Simulate (+15)</span>
              </button>
            </div>
          )}

          {/* 4. Target Progress Card (Expanded only) */}
          {!isCollapsed && (
            <div className="p-3 rounded-2xl bg-slate-900 dark:bg-slate-950 text-slate-100 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Target</span>
                <span className="font-bold font-mono-tabular text-blue-400">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-sky-400 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(2, progressPercent))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-tabular pt-0.5">
                <span>{stats.totalSouls.toLocaleString()} Won</span>
                <span>{stats.remaining.toLocaleString()} Rem.</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
