import React, { useState, useEffect } from 'react';
import { dataService } from './services/dataService';
import { UserRole } from './types';
import { useTheme } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { LiveTicker } from './components/LiveTicker';
import { ToastContainer, ToastMessage } from './components/Toast';
import { LiveDashboard } from './screens/LiveDashboard';
import { CampaignCountdownWidget } from './components/CampaignCountdownWidget';
import { ProjectorView } from './screens/ProjectorView';
import { AddSoulScreen } from './screens/AddSoulScreen';
import { ApprovalQueueScreen } from './screens/ApprovalQueueScreen';
import { RecordsScreen } from './screens/RecordsScreen';
import { FollowUpScreen } from './screens/FollowUpScreen';
import { AdminScreen } from './screens/AdminScreen';
import { LeaderboardsScreen } from './screens/LeaderboardsScreen';
import { AuditLogScreen } from './screens/AuditLogScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { TallyScreen } from './screens/TallyScreen';
import { ReconcileScreen } from './screens/ReconcileScreen';
import { MilestoneCelebrationOverlay } from './components/MilestoneCelebrationOverlay';
import { OfflineBanner } from './components/OfflineBanner';
import { OfflineQueueModal } from './components/OfflineQueueModal';
import { LiveStreamViewer } from './screens/LiveStreamViewer';
import { MediaTestimonyScreen } from './screens/MediaTestimonyScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { SoulWinnerRegistrationModal } from './components/SoulWinnerRegistrationModal';
import { SoulWinnersScreen } from './screens/SoulWinnersScreen';
import { SoulWinnerProfile } from './types';
import { ScreenName } from './components/Sidebar';
import { useAuth } from './context/AuthContext';

type Screen = ScreenName;

const ALLOWED_SCREENS_BY_ROLE: Record<UserRole, Screen[]> = {
  public: ['dashboard', 'leaderboards'],
  soul_winner: [
    'dashboard',
    'leaderboards',
    'add-soul',
    'records',
    'testimonies',
  ],
  pastor: [
    'dashboard',
    'leaderboards',
    'reports',
    'records',
    'soul-winners',
    'followup',
    'approval',
    'testimonies',
  ],
  group_pastor: [
    'dashboard',
    'leaderboards',
    'reports',
    'records',
    'soul-winners',
    'followup',
    'approval',
    'testimonies',
  ],
  zonal_pastor: [
    'dashboard',
    'leaderboards',
    'reports',
    'records',
    'soul-winners',
    'followup',
    'approval',
    'testimonies',
    'audit-log',
    'admin',
  ],
  coordinator: [
    'dashboard',
    'leaderboards',
    'reports',
    'approval',
    'records',
    'soul-winners',
    'followup',
    'tally',
    'reconcile',
    'add-soul',
    'testimonies',
  ],
  admin: [
    'dashboard',
    'leaderboards',
    'reports',
    'tally',
    'reconcile',
    'add-soul',
    'testimonies',
    'approval',
    'records',
    'soul-winners',
    'followup',
    'audit-log',
    'admin',
  ],
};

const DEFAULT_LANDING_SCREEN: Record<UserRole, Screen> = {
  soul_winner: 'dashboard',
  pastor: 'dashboard',
  group_pastor: 'dashboard',
  zonal_pastor: 'dashboard',
  coordinator: 'dashboard',
  admin: 'dashboard',
  public: 'dashboard',
};

export default function App() {
  const { theme } = useTheme();
  const { user: firebaseUser, isAdmin, logout: firebaseLogout } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('public');

  // Sync role with Firebase Auth: default sign in as soul_winner (Soul Winner), unauthenticated as Observer
  useEffect(() => {
    if (firebaseUser) {
      if (isAdmin) {
        setUserRole('admin');
      } else if (userRole === 'public') {
        setUserRole('soul_winner'); // Default sign in as Soul Winner
      }
    } else {
      setUserRole('public'); // Default not logged in as Observer
    }
  }, [firebaseUser, isAdmin]);

  const handleLogout = async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      console.warn('Firebase logout error:', err);
    }
    setUserRole('public');
    dataService.setCollationMode('live');
    addToast('info', 'Logged Out', 'You have returned to clean public live campaign mode.');
  };
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'stream') {
        return 'live-stream';
      }
    }
    return 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('harvest_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('harvest_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [celebrationMilestone, setCelebrationMilestone] = useState<number | null>(null);

  // Onboarding Guided Tour Modal State (defaults to true if first visit)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('harvest10k_onboarding_completed');
    }
    return false;
  });

  // Offline & Connectivity State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState<boolean>(false);
  const [isSyncingFromBanner, setIsSyncingFromBanner] = useState<boolean>(false);
  const [isSoulWinnerRegOpen, setIsSoulWinnerRegOpen] = useState<boolean>(false);
  const [soulWinnerProfile, setSoulWinnerProfile] = useState<SoulWinnerProfile>(() => dataService.getSoulWinnerProfile());

  // Online / Offline window listeners & auto-sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const queueCount = dataService.getOfflineQueueCount();
      if (queueCount > 0) {
        addToast('info', 'Connection Restored', `Auto-syncing ${queueCount} queued field submission(s)...`);
        const result = await dataService.syncAllOfflineItems();
        if (result.succeeded > 0) {
          addToast(
            'success',
            'Offline Queue Synced',
            `Successfully transmitted ${result.succeeded} offline record(s) to national collation.`
          );
        }
      } else {
        addToast('success', 'Back Online', 'Central collation connection re-established.');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast(
        'info',
        'Field Offline Mode',
        'Network disconnected. Submissions will be stored in IndexedDB and cached totals remain active.'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to dataService updates to trigger re-renders
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setTick(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  // Listen for milestone celebration triggers
  useEffect(() => {
    const unsubMilestone = dataService.subscribeMilestoneCelebration((milestone) => {
      setCelebrationMilestone(milestone);
    });
    return () => unsubMilestone();
  }, []);

  // Ensure projector mode and live stream force dark styling on root if active
  useEffect(() => {
    const root = document.documentElement;
    if (currentScreen === 'projector' || currentScreen === 'live-stream' || theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, currentScreen]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    const allowed = ALLOWED_SCREENS_BY_ROLE[newRole] || ['dashboard'];
    const roleLabel =
      newRole === 'soul_winner'
        ? 'Soul Winner (Field Data Input)'
        : newRole === 'pastor'
        ? 'Pastor (Local Church Goals)'
        : newRole === 'group_pastor'
        ? 'Group Pastor (Multiple Churches)'
        : newRole === 'zonal_pastor'
        ? "Zonal Pastor (God's Eye View)"
        : newRole === 'coordinator'
        ? 'Coordinator'
        : newRole === 'admin'
        ? 'Administrator (Operations & Push)'
        : 'Public Observer (Read-Only)';

    if (!allowed.includes(currentScreen)) {
      const nextScreen = DEFAULT_LANDING_SCREEN[newRole];
      setCurrentScreen(nextScreen);
    }
    addToast('info', 'Role Switched', `Now operating as: ${roleLabel}`);
  };

  const stats = dataService.getStats();
  const tickerItems = dataService.getTickerItems();
  const offlineCount = dataService.getOfflineQueueCount();
  const offlineQueueItems = dataService.getOfflineQueueItems();
  const campaign = dataService.getCampaign();

  const handleSyncOffline = async () => {
    setIsSyncingFromBanner(true);
    try {
      const result = await dataService.syncAllOfflineItems();
      if (result.succeeded > 0) {
        addToast(
          'success',
          'Offline Queue Synced',
          `Successfully pushed ${result.succeeded} offline soul record(s) to national collation.`
        );
      } else if (result.failed > 0) {
        addToast(
          'error',
          'Sync Notice',
          `${result.failed} item(s) could not sync. Check internet connection and try again.`
        );
      }
    } finally {
      setIsSyncingFromBanner(false);
    }
  };

  const handleCheckReconnect = async () => {
    setIsSyncingFromBanner(true);
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(online);
    if (online) {
      addToast('info', 'Connection Verified', 'Checking offline queue for un-synced submissions...');
      await handleSyncOffline();
    } else {
      setTimeout(() => {
        setIsSyncingFromBanner(false);
        addToast('error', 'Still Offline', 'Internet connection is not yet detected. Offline entries remain safe in IndexedDB.');
      }, 600);
    }
  };

  // If in Dedicated Live Stream Broadcast View (for YouTube, OBS Studio, and Public Sharable link)
  if (currentScreen === 'live-stream') {
    return (
      <>
        <LiveStreamViewer
          onExit={() => {
            if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('view');
              window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
            }
            setCurrentScreen('dashboard');
          }}
          onSuccessToast={(title, message) => addToast('success', title, message)}
        />
        {celebrationMilestone !== null && (
          <MilestoneCelebrationOverlay
            milestone={celebrationMilestone}
            verse={campaign.verse}
            campaignName={campaign.name}
            target={campaign.target}
            onDismiss={() => setCelebrationMilestone(null)}
          />
        )}
      </>
    );
  }

  // If in Projector View, render dedicated full-screen presentation mode
  if (currentScreen === 'projector') {
    return (
      <>
        <ProjectorView onExit={() => setCurrentScreen('dashboard')} />
        {celebrationMilestone !== null && (
          <MilestoneCelebrationOverlay
            milestone={celebrationMilestone}
            verse={campaign.verse}
            campaignName={campaign.name}
            target={campaign.target}
            onDismiss={() => setCelebrationMilestone(null)}
          />
        )}
      </>
    );
  }

  return (
    <div
      className={`flex flex-col transition-colors duration-200 contour-bg text-slate-900 dark:text-slate-100 ${
        currentScreen === 'dashboard' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Left Sidebar Navigation */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        userRole={userRole}
        pendingApprovalsCount={stats.pendingApprovalsCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenTour={() => setIsOnboardingOpen(true)}
        onOpenSoulWinnerReg={() => setIsSoulWinnerRegOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onRoleChange={handleRoleChange}
        soulWinnerProfile={soulWinnerProfile}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      {/* Main Right Content Shell (offset by sidebar width on lg screens) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          currentScreen === 'dashboard' ? 'h-full min-h-0 overflow-hidden' : ''
        } ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64 xl:pl-72'}`}
      >
        {/* Global Offline Field Banner */}
        <OfflineBanner
          isOnline={isOnline}
          offlineCount={offlineCount}
          onOpenQueueModal={() => setIsQueueModalOpen(true)}
          onCheckReconnect={handleCheckReconnect}
          isSyncing={isSyncingFromBanner}
        />

        {/* Dynamic Screen View */}
        <main
          className={`w-full max-w-[1750px] mx-auto transition-all ${
            currentScreen === 'dashboard'
              ? 'flex-1 flex flex-col min-h-0 h-full px-3 sm:px-6 lg:px-8 py-1.5 overflow-hidden'
              : 'flex-1 p-4 sm:p-6 lg:p-8'
          }`}
        >
          {currentScreen === 'dashboard' && (
            <LiveDashboard
              theme={theme}
              userRole={userRole}
              onNavigateToAddSoul={() => setCurrentScreen('add-soul')}
              onNavigate={(s) => setCurrentScreen(s)}
              onOpenTour={() => setIsOnboardingOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              onLogout={handleLogout}
              onSuccessToast={(title, message) => addToast('success', title, message)}
            />
          )}

          {currentScreen === 'leaderboards' && (
            <LeaderboardsScreen
              userRole={userRole}
              onSuccessToast={(title, message) => addToast('success', title, message)}
              onNavigate={(s) => setCurrentScreen(s)}
            />
          )}

          {currentScreen === 'reports' && (
            <ReportsScreen
              userRole={userRole}
              onNavigate={(s) => setCurrentScreen(s)}
            />
          )}

          {currentScreen === 'tally' && (
            <TallyScreen
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
              onNavigateToReconcile={() => setCurrentScreen('reconcile')}
            />
          )}

          {currentScreen === 'reconcile' && (
            <ReconcileScreen
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
              onNavigateToTally={() => setCurrentScreen('tally')}
            />
          )}

          {currentScreen === 'add-soul' && (
            <AddSoulScreen
              userRole={userRole}
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
            />
          )}

          {currentScreen === 'approval' && (
            <ApprovalQueueScreen
              userRole={userRole}
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
            />
          )}

          {currentScreen === 'records' && (
            <RecordsScreen
              userRole={userRole}
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
            />
          )}

          {currentScreen === 'soul-winners' && (
            <SoulWinnersScreen
              userRole={userRole}
              onNavigate={(s) => setCurrentScreen(s)}
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
            />
          )}

          {currentScreen === 'followup' && (
            <FollowUpScreen
              userRole={userRole}
              onNavigate={(s) => setCurrentScreen(s)}
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
            />
          )}

          {currentScreen === 'admin' && (
            <AdminScreen
              userRole={userRole}
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
            />
          )}

          {currentScreen === 'audit-log' && (
            <AuditLogScreen
              userRole={userRole}
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
            />
          )}

          {currentScreen === 'testimonies' && (
            <MediaTestimonyScreen
              userRole={userRole}
              theme={theme}
              onSuccessToast={(title, message) => addToast('success', title, message)}
              onNavigateToStream={() => setCurrentScreen('live-stream')}
            />
          )}
        </main>

        {/* Centered Campaign Countdown Widget just above running text */}
        <div className="flex justify-center items-center py-1.5 px-4 z-20 shrink-0 bg-transparent">
          <CampaignCountdownWidget variant="bottom-bar" />
        </div>

        {/* Persistent Bottom Crawling Wire Ticker */}
        <footer className="sticky bottom-0 z-30">
          <LiveTicker
            items={tickerItems}
            announcement={campaign.announcement}
            theme={theme}
          />
        </footer>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Milestone Celebration Full-Screen Overlay */}
      {celebrationMilestone !== null && (
        <MilestoneCelebrationOverlay
          milestone={celebrationMilestone}
          verse={campaign.verse}
          campaignName={campaign.name}
          target={campaign.target}
          onDismiss={() => setCelebrationMilestone(null)}
        />
      )}

      {/* IndexedDB Offline Queue Review & Manual Retry Modal */}
      <OfflineQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        items={offlineQueueItems}
        isOnline={isOnline}
        onSyncSingle={async (id) => {
          const success = await dataService.syncSingleOfflineItem(id);
          return { success };
        }}
        onSyncAll={async () => {
          const res = await dataService.syncAllOfflineItems();
          return { total: res.succeeded + res.failed, succeeded: res.succeeded, failed: res.failed };
        }}
        onDeleteItem={(id) => dataService.deleteOfflineQueueItem(id)}
        onClearAll={() => dataService.clearAllOfflineQueue()}
        onSuccessToast={(title, message) => addToast('success', title, message)}
      />

      {/* 4-Step Interactive Onboarding Guided Tour Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onNavigate={(s) => setCurrentScreen(s)}
      />

      {/* Soul Winner Registration / Profile Modal */}
      <SoulWinnerRegistrationModal
        isOpen={isSoulWinnerRegOpen}
        onClose={() => setIsSoulWinnerRegOpen(false)}
        onSaved={(profile) => {
          setSoulWinnerProfile(profile);
          addToast('success', 'Profile Saved!', `Welcome, ${profile.fullName} — ${profile.cellName} · ${profile.pcfName}`);
        }}
        onLogout={handleLogout}
      />

      {/* Authentication & Role Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUserRole={userRole}
        onRoleChange={(r) => {
          handleRoleChange(r);
        }}
        soulWinnerProfile={soulWinnerProfile}
        onOpenSoulWinnerReg={() => setIsSoulWinnerRegOpen(true)}
        onSoulWinnerProfileChange={(p) => setSoulWinnerProfile(p)}
        onLogout={handleLogout}
        onSuccessToast={(title, message) => addToast('success', title, message)}
      />
    </div>
  );
}
