import React, { useState, useRef, useEffect } from 'react';
import { UserRole, SoulWinnerProfile, CollationMode } from '../types';
import { useTheme } from '../context/ThemeContext';
import { COLOR_PALETTES, ColorPaletteKey } from '../lib/theme';
import { ThemeCustomizerModal } from './ThemeCustomizerModal';
import { CollationModeSwitcherModal } from './CollationModeSwitcherModal';
import { dataService } from '../services/dataService';
import {
  Plus,
  Palette,
  Check,
  Database,
  WifiOff,
  Sliders,
  HelpCircle,
  Search,
  Cloud,
  Sparkles,
  Radio,
} from 'lucide-react';
import { ScreenName } from './Sidebar';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  offlineCount: number;
  onSyncOffline: () => void;
  onOpenSidebar: () => void;
  isOnline?: boolean;
  onOpenQueueModal?: () => void;
  onOpenTour?: () => void;
  onOpenSoulWinnerReg?: () => void;
  soulWinnerProfile?: SoulWinnerProfile;
  onSoulWinnerProfileChange?: (profile: SoulWinnerProfile) => void;
  onSuccessToast?: (title: string, message: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  userRole,
  onRoleChange,
  offlineCount,
  onSyncOffline,
  isOnline = true,
  onOpenQueueModal,
  onOpenTour,
  onOpenSoulWinnerReg,
  soulWinnerProfile,
  onSoulWinnerProfileChange,
  onSuccessToast,
}) => {
  const { colorTheme, setColorTheme, palette } = useTheme();
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [collationMode, setCollationModeState] = useState<CollationMode>(dataService.getCollationMode());
  const colorMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMode = () => {
      setCollationModeState(dataService.getCollationMode());
    };
    const unsub = dataService.subscribe(updateMode);
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target as Node)) {
        setColorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const screenTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Live Dashboard', subtitle: 'Real-time Abuja FCT soul-winning collation & progress' },
    leaderboards: { title: 'Harvest Leaderboards', subtitle: 'Performance rankings across centres, Area Councils, and soul winners' },
    reports: { title: 'Executive Reports & Exports', subtitle: 'Statistical summaries, demographic filters, and multi-format reports' },
    projector: { title: 'Projector View', subtitle: 'Full-screen hall presentation mode' },
    'live-stream': { title: 'Live Stream Broadcast', subtitle: 'Public 16:9 sharable live stream view for YouTube, OBS & media teams' },
    testimonies: { title: 'Media & Field Testimonies', subtitle: 'Evangelism photos, audio voice notes & short 1-minute video clips' },
    tally: { title: 'Tap to Tally', subtitle: 'Fast field counter for street campaigns' },
    reconcile: { title: 'Reconcile Souls', subtitle: 'Convert quick taps to detailed soul records' },
    'add-soul': { title: 'Field Soul Capture', subtitle: 'Submit individual converts or session batches' },
    approval: { title: 'Verification Queue', subtitle: 'Audit and approve incoming field submissions' },
    records: { title: 'Soul Records Directory', subtitle: 'Search, filter, and export Abuja FCT soul data' },
    followup: { title: 'Follow-Up Board', subtitle: 'Track and disciple converts through integration stages' },
    'audit-log': { title: 'Audit Log & History', subtitle: 'Immutable ledger of all additions, edits, approvals, and deletions' },
    admin: { title: 'Collation Settings', subtitle: 'Manage campaign parameters, target, and hubs' },
  };

  const currentMeta = screenTitles[currentScreen] || { title: 'Harvest 10K', subtitle: 'Collation Dashboard' };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#12151B]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Brand & screen title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {currentMeta.title}
            </span>
            <span className="text-[10px] text-slate-400 truncate">{currentMeta.subtitle}</span>
          </div>
        </div>

        {/* Center: Search Bar Pill (Image 1 style) */}
        <div className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
          <div className="w-full relative">
            <input
              type="text"
              placeholder="Search records, centres, soul winners..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onNavigate('records');
                }
              }}
              className="w-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 transition-all shadow-inner"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Right Side: Soul Winner Badge, Quick Actions, Role Switcher, Color Palette, Offline Sync & Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Collation Environment Mode Pill Button (Demo vs Live) */}
          <button
            type="button"
            id="header-collation-mode-btn"
            onClick={() => setIsModeModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs border ${
              collationMode === 'live'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
            }`}
            title="Switch between Demo/Testing Sandbox and Official Live Collation"
          >
            {collationMode === 'live' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="tracking-wide">LIVE Campaign</span>
                <span className="hidden sm:inline text-[10px] font-mono opacity-80">(Clean 0)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="tracking-wide">Test Sandbox</span>
                <span className="hidden sm:inline text-[10px] font-mono opacity-80">(Demo Data)</span>
              </>
            )}
          </button>

          {/* Persistent Offline Queue Badge & Modal Trigger */}
          {offlineCount > 0 ? (
            <button
              id="header-offline-queue-badge"
              onClick={onOpenQueueModal || onSyncOffline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 dark:bg-amber-950/60 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/25 dark:hover:bg-amber-900/60 transition-all cursor-pointer shadow-xs animate-in fade-in"
              title="Tap to review and manually retry IndexedDB offline submissions"
            >
              <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span className="font-mono-tabular">{offlineCount} Queued</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </button>
          ) : !isOnline ? (
            <button
              id="header-offline-pill"
              onClick={onOpenQueueModal || onSyncOffline}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold cursor-pointer"
              title="Offline Mode Active — 0 items queued"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Offline</span>
            </button>
          ) : (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold"
              title="Connected to Firebase Cloud Firestore. Real-time collation active across all devices."
            >
              <Cloud className="w-3 h-3 text-emerald-500" />
              <span>Cloud Sync</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}

          {/* Quick Record Soul Action Button (Wide screens) */}
          {currentScreen !== 'add-soul' && (
            <button
              onClick={() => onNavigate('add-soul')}
              className={`hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-transform active:scale-98 cursor-pointer ${palette.btnPrimary}`}
            >
              <Plus className="w-4 h-4" />
              <span>Record Souls</span>
            </button>
          )}

          {/* Guided Onboarding Tour Button */}
          {onOpenTour && (
            <button
              id="header-tour-btn"
              onClick={onOpenTour}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Launch Harvest 10K Guided Tour & Onboarding Flow"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Tour</span>
            </button>
          )}

          {/* COLOR SCHEME PALETTE PICKER */}
          <div className="relative" ref={colorMenuRef}>
            <button
              onClick={() => setColorMenuOpen(prev => !prev)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title={`Theme Color: ${palette.name}`}
              aria-label="Select Theme Color Scheme"
            >
              <span
                className="w-4 h-4 rounded-full shadow-xs ring-1 ring-white dark:ring-slate-900 inline-block shrink-0"
                style={{ backgroundColor: palette.hex }}
              />
              <Palette className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {colorMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-display">
                  Color Scheme
                </div>
                <div className="space-y-1 mt-1">
                  {(Object.keys(COLOR_PALETTES) as ColorPaletteKey[]).map(key => {
                    const p = COLOR_PALETTES[key];
                    const isSelected = colorTheme === key;

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setColorTheme(key);
                          setColorMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-xs"
                            style={{ backgroundColor: p.hex }}
                          />
                          <span>{p.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" style={{ color: p.hex }} />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1.5">
                  <button
                    onClick={() => {
                      setColorMenuOpen(false);
                      setIsThemeCustomizerOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" style={{ color: palette.hex }} />
                    <span>Advanced Theme Customizer...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Customizer Modal */}
          <ThemeCustomizerModal
            isOpen={isThemeCustomizerOpen}
            onClose={() => setIsThemeCustomizerOpen(false)}
            onSuccessToast={onSuccessToast || (() => {})}
          />

          {/* Authentication & Sign-Up Modal */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            currentUserRole={userRole}
            onRoleChange={onRoleChange}
            soulWinnerProfile={soulWinnerProfile}
            onOpenSoulWinnerReg={onOpenSoulWinnerReg}
            onSoulWinnerProfileChange={onSoulWinnerProfileChange}
            onSuccessToast={onSuccessToast || (() => {})}
          />

          {/* Collation Environment Mode Switcher Modal */}
          <CollationModeSwitcherModal
            isOpen={isModeModalOpen}
            onClose={() => setIsModeModalOpen(false)}
            onSuccessToast={onSuccessToast}
          />
        </div>
      </div>
    </header>
  );
};
