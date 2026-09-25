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
  Volume2,
  VolumeX,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Lock,
  LogIn,
  LogOut,
} from 'lucide-react';
import { getSoundEnabled, setSoundEnabled, playDingSound } from '../utils/audioUtils';
import { PWAInstallButton } from './PWAInstallButton';
import { useAuth } from '../context/AuthContext';

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
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onRoleChange?: (role: UserRole) => void;
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
  onOpenAuthModal,
  onLogout,
  onRoleChange,
  soulWinnerProfile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { theme, toggleTheme, palette } = useTheme();
  const isDark = theme === 'dark';
  const { user: firebaseUser, logout: firebaseLogout } = useAuth();
  const [simStatus, setSimStatus] = useState(() => dataService.getSimulationStatus());
  const [isSoundOn, setIsSoundOn] = useState(() => getSoundEnabled());
  const stats = dataService.getStats();
  const progressPercent = Math.min(100, Math.round((stats.totalSouls / stats.target) * 1000) / 10);

  const handleLogoutClick = async () => {
    if (onLogout) {
      onLogout();
    } else {
      try {
        await firebaseLogout();
      } catch (err) {
        console.warn('Logout error:', err);
      }
      if (onRoleChange) onRoleChange('public');
    }
    onClose();
  };

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setSimStatus(dataService.getSimulationStatus());
    });
    const handleSoundChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsSoundOn(customEvent.detail);
    };
    window.addEventListener('harvest10k_sound_change', handleSoundChange);
    return () => {
      unsub();
      window.removeEventListener('harvest10k_sound_change', handleSoundChange);
    };
  }, []);

  const handleToggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playDingSound();
    }
  };

  const navGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        {
          id: 'dashboard',
          label: 'Live Dashboard',
          icon: LayoutDashboard,
          roles: ['coordinator', 'admin', 'public', 'soul_winner', 'pastor', 'group_pastor', 'zonal_pastor'],
        },
        {
          id: 'leaderboards',
          label: 'Leaderboards',
          icon: Trophy,
          roles: ['coordinator', 'admin', 'public', 'soul_winner', 'pastor', 'group_pastor', 'zonal_pastor'],
        },
        {
          id: 'reports',
          label: userRole === 'pastor' ? 'Church Goals Report' : userRole === 'group_pastor' ? 'Group Performance' : 'Executive Reports',
          icon: FileSpreadsheet,
          roles: ['coordinator', 'admin', 'pastor', 'group_pastor', 'zonal_pastor'],
        },
      ],
    },
    {
      group: 'Operations',
      items: [
        {
          id: 'add-soul',
          label: userRole === 'soul_winner' ? 'Record Soul' : 'Full Form Record',
          icon: PlusCircle,
          roles: ['coordinator', 'admin', 'soul_winner', 'pastor', 'group_pastor', 'zonal_pastor'],
          isSpecial: userRole === 'soul_winner',
        },
        {
          id: 'records',
          label:
            userRole === 'soul_winner'
              ? 'My Won Souls'
              : userRole === 'pastor'
              ? 'Church Soul Records'
              : userRole === 'group_pastor'
              ? 'Group Soul Directory'
              : userRole === 'zonal_pastor'
              ? 'Zonal Master Registry'
              : 'Soul Directory',
          icon: Database,
          roles: ['coordinator', 'admin', 'soul_winner', 'pastor', 'group_pastor', 'zonal_pastor'],
        },
        {
          id: 'testimonies',
          label: 'Media & Testimonies',
          icon: Camera,
          roles: ['coordinator', 'admin', 'soul_winner', 'pastor', 'group_pastor', 'zonal_pastor'],
        },
        {
          id: 'approval',
          label: 'Manual Verification Queue',
          icon: UserCheck,
          roles: ['coordinator', 'admin', 'pastor', 'group_pastor', 'zonal_pastor'],
          badge: pendingApprovalsCount,
        },
        {
          id: 'soul-winners',
          label: userRole === 'pastor' ? 'Church Soul Winners' : userRole === 'group_pastor' ? 'Group Soul Winners' : 'Soul Winners Roster',
          icon: Users,
          roles: ['coordinator', 'admin', 'pastor', 'group_pastor', 'zonal_pastor'],
        },
        {
          id: 'followup',
          label: 'Follow-Up Board',
          icon: History,
          roles: ['coordinator', 'admin', 'pastor', 'group_pastor', 'zonal_pastor'],
        },
      ],
    },
    {
      group: 'System',
      items: [
        {
          id: 'admin',
          label: userRole === 'zonal_pastor' ? 'Zone Governance' : 'Admin Settings',
          icon: Settings,
          roles: ['admin', 'zonal_pastor'],
        },
        {
          id: 'audit-log',
          label: 'Security & Audit Log',
          icon: History,
          roles: ['admin', 'zonal_pastor'],
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

          {/* Active Role Indicator Pill */}
          {!isCollapsed && (
            <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Role</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {userRole === 'public'
                  ? 'Observer'
                  : userRole === 'soul_winner'
                  ? 'Soul Winner'
                  : userRole === 'pastor'
                  ? 'Pastor'
                  : userRole === 'group_pastor'
                  ? (soulWinnerProfile?.assignedGroup ? `${soulWinnerProfile.assignedGroup.replace(' Group', '')} Pastor` : 'Group Pastor')
                  : userRole === 'zonal_pastor'
                  ? 'Zonal Pastor'
                  : userRole === 'admin'
                  ? 'Admin'
                  : 'Coordinator'}
              </span>
            </div>
          )}

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

        {/* Bottom Section: Theme Switcher, Audio Toggle, Profile & Controls */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 shrink-0">
          {/* 1. LIGHT / DARK MODE TOGGLE */}
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
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

              <button
                type="button"
                onClick={handleToggleSound}
                className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs group relative"
                title={isSoundOn ? 'Audio Chimes Enabled' : 'Audio Chimes Muted'}
                aria-label="Toggle Audio Chimes"
              >
                {isSoundOn ? (
                  <Volume2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                )}
                {/* Tooltip on hover */}
                <div className="absolute left-14 px-2.5 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {isSoundOn ? 'Audio Chimes: ON' : 'Audio Chimes: MUTED'}
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-2 rounded-2xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 transition-all cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs group"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <div className="flex items-center gap-2">
                  {isDark ? (
                    <Moon className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  )}
                  <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                {/* iOS / Bento Style Toggle Pill */}
                <div
                  className={`w-8 h-4.5 rounded-full transition-colors flex items-center p-0.5 ${
                    isDark ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                </div>
              </button>

              {/* Audio Chime Toggle Button */}
              <button
                type="button"
                onClick={handleToggleSound}
                className="w-full flex items-center justify-between p-2 rounded-2xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/70 transition-all cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs group"
                title={isSoundOn ? 'Mute Harvest Sound Chimes' : 'Enable Harvest Sound Chimes'}
              >
                <div className="flex items-center gap-2">
                  {isSoundOn ? (
                    <Volume2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                  )}
                  <span>Audio Chimes</span>
                </div>
                {/* iOS / Bento Style Toggle Pill */}
                <div
                  className={`w-8 h-4.5 rounded-full transition-colors flex items-center p-0.5 ${
                    isSoundOn ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                </div>
              </button>
            </div>
          )}

          {/* 2. User Profile Card & Logout Button */}
          {userRole !== 'public' && (
            <div className="space-y-1.5">
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
                title={`Profile: ${
                  soulWinnerProfile?.fullName ||
                  (userRole === 'admin'
                    ? 'Campaign Admin'
                    : userRole === 'zonal_pastor'
                    ? 'Zonal Pastor'
                    : userRole === 'group_pastor'
                    ? 'Group Pastor'
                    : userRole === 'pastor'
                    ? 'Pastor'
                    : 'Soul Winner')
                } — Click to edit profile`}
              >
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                    style={{ backgroundColor: palette.hex }}
                  >
                    {(soulWinnerProfile?.fullName || userRole.toUpperCase())
                      .split(' ')
                      .filter(Boolean)
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                </div>

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {soulWinnerProfile?.fullName ||
                        (userRole === 'admin'
                          ? 'Campaign Administrator'
                          : userRole === 'zonal_pastor'
                          ? 'Zonal Pastor'
                          : userRole === 'group_pastor'
                          ? 'Group Pastor'
                          : userRole === 'pastor'
                          ? 'Pastor'
                          : 'Soul Winner')}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {soulWinnerProfile
                        ? (soulWinnerProfile.assignedGroup
                          ? `${soulWinnerProfile.assignedGroup} Oversight`
                          : `${soulWinnerProfile.cellName} · ${soulWinnerProfile.pcfName}`)
                        : 'Christ Embassy Abuja Zone 1'}
                    </div>
                  </div>
                )}
              </button>

              {/* Explicit Logout Button (Visible when logged in) */}
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="w-full h-9 rounded-2xl flex items-center justify-center text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950/60 transition-colors cursor-pointer border border-rose-200/60 dark:border-rose-900/50"
                  title="Log Out (Switch to Observer mode)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-rose-50/90 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 border border-rose-200/70 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all cursor-pointer shadow-2xs group"
                  title="Log out of current session and return to Observer mode"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Log Out</span>
                  </div>
                  <span className="text-[10px] text-rose-500/80 dark:text-rose-400/80 font-normal">Switch to Observer</span>
                </button>
              )}
            </div>
          )}

          {/* PWA Install Button (Field Offline Access) */}
          <div className="w-full">
            <PWAInstallButton variant={isCollapsed ? 'compact' : 'button'} className="w-full" />
          </div>

          {/* 3. Observer Sign In CTA or Simulation Controls (Expanded only) */}
          {!isCollapsed && (
            userRole === 'public' ? (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Observer Mode</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  You are viewing the live public stream. Sign in to log souls from the field.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAuthModal) {
                      onOpenAuthModal();
                      onClose();
                    } else {
                      const btn = document.getElementById('header-login-btn');
                      if (btn) btn.click();
                    }
                  }}
                  className="w-full py-1.5 px-2.5 rounded-xl font-bold text-[11px] bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            ) : (
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
            )
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
