import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { LeaderboardPeriod, LeaderboardEntry, UserRole, PcfLeaderboardEntry, CellLeaderboardEntry } from '../types';
import { useTheme } from '../context/ThemeContext';
import { CountUpNumber } from '../components/CountUpNumber';
import {
  Trophy,
  Building2,
  MapPin,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Share2,
  Copy,
  Check,
  Calendar,
  Layers,
  Crown,
  Medal,
  Flame,
  Clock,
  ArrowUpRight,
  EyeOff,
} from 'lucide-react';

interface LeaderboardsScreenProps {
  userRole?: UserRole;
  onSuccessToast?: (title: string, message: string) => void;
  onNavigate?: (screen: any) => void;
}

type TabType = 'centres' | 'regions' | 'winners' | 'localities' | 'pcfs' | 'cells';

export const LeaderboardsScreen: React.FC<LeaderboardsScreenProps> = ({
  userRole = 'coordinator',
  onSuccessToast,
  onNavigate,
}) => {
  const { palette } = useTheme();
  const campaign = dataService.getCampaign();
  const [period, setPeriod] = useState<LeaderboardPeriod>('today');
  const [activeTab, setActiveTab] = useState<TabType>('centres');
  const [hasCopiedWhatsApp, setHasCopiedWhatsApp] = useState(false);

  const hideIndividuals = campaign.hideIndividualLeaderboard || false;

  // If individuals are hidden and active tab is winners, fallback to centres
  const currentTab: TabType = (activeTab === 'winners' && hideIndividuals) ? 'centres' : activeTab;

  // Retrieve ranked entries based on active tab and period
  let entries: LeaderboardEntry[] = [];
  let pcfEntries: PcfLeaderboardEntry[] = [];
  let cellEntries: CellLeaderboardEntry[] = [];
  if (currentTab === 'centres') {
    entries = dataService.getCentresLeaderboard(period);
  } else if (currentTab === 'regions') {
    entries = dataService.getRegionsLeaderboard(period);
  } else if (currentTab === 'winners') {
    entries = dataService.getSoulWinnersLeaderboard(period);
  } else if (currentTab === 'pcfs') {
    pcfEntries = dataService.getPcfsLeaderboard(period);
  } else if (currentTab === 'cells') {
    cellEntries = dataService.getCellsLeaderboard(period);
  }

  const topLocalities = dataService.getTopLocalities(15);

  const periodLabels: Record<LeaderboardPeriod, string> = {
    today: 'Today (Last 24h)',
    session: 'Active Session (4h)',
    campaign: 'Whole Campaign (Cumulative)',
  };

  const tabTitles: Record<TabType, string> = {
    centres: 'Top Collation Centres',
    regions: 'Top Area Councils',
    winners: 'Top Soul Winners',
    localities: 'Top FCT Localities',
    pcfs: 'Top PCFs / Church Groups',
    cells: 'Top Cells',
  };

  // WhatsApp Share Formatter
  const handleCopyWhatsApp = () => {
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let text = `🔥 *${campaign.name.toUpperCase()}* 🔥\n`;
    text += `🏆 *LEADERBOARD: ${tabTitles[currentTab].toUpperCase()}*\n`;
    text += `⏱️ *Period:* ${periodLabels[period]} | ${dateStr} ${timeStr}\n\n`;

    if (currentTab === 'localities') {
      const topLocs = topLocalities.slice(0, 10);
      topLocs.forEach(item => {
        const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `*#${item.rank}*`;
        text += `${medal} *${item.localityName}* (${item.areaCouncil}) — *${item.count.toLocaleString()} souls*\n`;
      });
    } else {
      const topEntries = entries.slice(0, 10);
      topEntries.forEach(item => {
        const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `*#${item.rank}*`;
        let rankTrend = '';
        if (item.rankChange > 0) rankTrend = ` (▲ +${item.rankChange})`;
        else if (item.rankChange < 0) rankTrend = ` (▼ ${item.rankChange})`;
        else if (item.isNewEntry) rankTrend = ` (✨ NEW)`;

        text += `${medal} *${item.name}* — *${item.soulsWon.toLocaleString()} souls*${rankTrend}\n`;
        if (item.subtitle) text += `   _${item.subtitle}_\n`;
      });
    }

    text += `\n📖 _"${campaign.verse}"_\n`;
    text += `📊 _Live Collation Directorate & Discipleship Registry_`;

    navigator.clipboard.writeText(text);
    setHasCopiedWhatsApp(true);
    if (onSuccessToast) {
      onSuccessToast('WhatsApp Format Copied', 'Leaderboard rankings copied to clipboard ready for WhatsApp broadcast!');
    }
    setTimeout(() => setHasCopiedWhatsApp(false), 3000);
  };

  const top3 = currentTab === 'localities' ? topLocalities.slice(0, 3)
    : currentTab === 'pcfs' ? pcfEntries.slice(0, 3)
    : currentTab === 'cells' ? cellEntries.slice(0, 3)
    : entries.slice(0, 3);
  const remainingEntries = entries.slice(3);

  return (
    <div className="space-y-6 pb-14">
      {/* Top Header & Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: palette.hex }}
            >
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Harvest Leaderboards
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {entries.length} Ranked
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track dynamic soul-winning performance, momentum rank changes, and hub standings.
              </p>
            </div>
          </div>
        </div>

        {/* Period Filter Tabs & WhatsApp Copy */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Pill Group */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/80">
            {(['today', 'session', 'campaign'] as LeaderboardPeriod[]).map(p => {
              const active = period === p;
              const labels: Record<LeaderboardPeriod, string> = {
                today: 'Today',
                session: 'This Session',
                campaign: 'Whole Campaign',
              };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {/* Copy to WhatsApp Button */}
          <button
            onClick={handleCopyWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Copy formatted text to paste in church WhatsApp groups"
          >
            {hasCopiedWhatsApp ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('centres')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === 'centres'
                ? `${palette.btnPrimary} shadow-xs`
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Top Centres</span>
          </button>

          <button
            onClick={() => setActiveTab('regions')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === 'regions'
                ? `${palette.btnPrimary} shadow-xs`
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Top Area Councils</span>
          </button>

          <button
            onClick={() => setActiveTab('localities')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === 'localities'
                ? `${palette.btnPrimary} shadow-xs`
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Top Localities</span>
          </button>

          {!hideIndividuals && (
            <button
              onClick={() => setActiveTab('winners')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                currentTab === 'winners'
                  ? `${palette.btnPrimary} shadow-xs`
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Top Soul Winners</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('pcfs')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === 'pcfs'
                ? `${palette.btnPrimary} shadow-xs`
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Top PCFs</span>
          </button>

          <button
            onClick={() => setActiveTab('cells')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              currentTab === 'cells'
                ? `${palette.btnPrimary} shadow-xs`
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Top Cells</span>
          </button>
        </div>

        {hideIndividuals && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 italic">
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span>Individual ranking hidden per Campaign Settings</span>
          </div>
        )}
      </div>

      {/* Screenshot-Friendly Card Layout Container */}
      <div
        id="leaderboard-share-card"
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden transition-colors"
      >
        {/* Share Card Watermark Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/90 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: palette.hex }}
            >
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">
                {campaign.name}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Official Collation Registry · {tabTitles[currentTab]}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{periodLabels[period]}</span>
            </span>
          </div>
        </div>

        {/* Shortcut Banner to Soul Winners Roster */}
        {currentTab === 'winners' && onNavigate && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border border-amber-300/40 dark:border-amber-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Looking for Individual Convert Names & Addresses?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Access the full Soul Winners Roster to see the exact names, WhatsApp contacts, and living locations of souls won by each registered winner.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('soul-winners')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              style={{ backgroundColor: palette.hex }}
            >
              Open Soul Winners Roster →
            </button>
          </div>
        )}

        {/* PODIUM TOP 3 HIGHLIGHTS */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {currentTab === 'localities' ? (
              topLocalities.slice(0, 3).map((item, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                let podiumBg = 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800';
                let badgeColor = 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                let crownColor = 'text-slate-400';

                if (isFirst) {
                  podiumBg = 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/40 shadow-sm';
                  badgeColor = 'bg-amber-500 text-slate-950 font-black shadow-xs';
                  crownColor = 'text-amber-500';
                } else if (isSecond) {
                  podiumBg = 'bg-gradient-to-b from-slate-300/10 to-transparent border-slate-300/80 dark:border-slate-700';
                  badgeColor = 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-200 font-black';
                  crownColor = 'text-slate-400';
                } else if (isThird) {
                  podiumBg = 'bg-gradient-to-b from-amber-700/10 to-transparent border-amber-700/30 dark:border-amber-900/40';
                  badgeColor = 'bg-amber-700 text-white font-black';
                  crownColor = 'text-amber-700';
                }

                return (
                  <div
                    key={item.localityName}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${podiumBg}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${badgeColor}`}>
                          #{item.rank}
                        </div>
                        {isFirst && <Crown className={`w-5 h-5 ${crownColor}`} />}
                        {(isSecond || isThird) && <Medal className={`w-4 h-4 ${crownColor}`} />}
                      </div>
                    </div>

                    <div className="my-3 space-y-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.localityName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.areaCouncil}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-baseline justify-between">
                      <div>
                        <div className="text-2xl font-black font-mono-tabular text-slate-900 dark:text-slate-100">
                          <CountUpNumber value={item.count} />
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Souls Won
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : currentTab === 'pcfs' ? (
              pcfEntries.slice(0, 3).map((pcf, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                let podiumBg = 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800';
                let badgeColor = 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                let crownColor = 'text-slate-400';

                if (isFirst) {
                  podiumBg = 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/40 shadow-sm';
                  badgeColor = 'bg-amber-500 text-slate-950 font-black shadow-xs';
                  crownColor = 'text-amber-500';
                } else if (isSecond) {
                  podiumBg = 'bg-gradient-to-b from-slate-300/10 to-transparent border-slate-300/80 dark:border-slate-700';
                  badgeColor = 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-200 font-black';
                  crownColor = 'text-slate-400';
                } else if (isThird) {
                  podiumBg = 'bg-gradient-to-b from-amber-700/10 to-transparent border-amber-700/30 dark:border-amber-900/40';
                  badgeColor = 'bg-amber-700 text-white font-black';
                  crownColor = 'text-amber-700';
                }

                return (
                  <div
                    key={pcf.pcfName}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${podiumBg}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${badgeColor}`}>
                          #{pcf.rank}
                        </div>
                        {isFirst && <Crown className={`w-5 h-5 ${crownColor}`} />}
                        {(isSecond || isThird) && <Medal className={`w-4 h-4 ${crownColor}`} />}
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {pcf.activeWinnersCount} Winners
                      </span>
                    </div>

                    <div className="my-3 space-y-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                        {pcf.pcfName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1">
                        <span>{pcf.newConvertsCount} New Converts · {pcf.percentageOfTotal}% share</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-baseline justify-between">
                      <div>
                        <div className="text-2xl font-black font-mono-tabular text-slate-900 dark:text-slate-100">
                          <CountUpNumber value={pcf.soulsWon} />
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Souls Won
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : currentTab === 'cells' ? (
              cellEntries.slice(0, 3).map((cell, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;

                let podiumBg = 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800';
                let badgeColor = 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                let crownColor = 'text-slate-400';

                if (isFirst) {
                  podiumBg = 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/40 shadow-sm';
                  badgeColor = 'bg-amber-500 text-slate-950 font-black shadow-xs';
                  crownColor = 'text-amber-500';
                } else if (isSecond) {
                  podiumBg = 'bg-gradient-to-b from-slate-300/10 to-transparent border-slate-300/80 dark:border-slate-700';
                  badgeColor = 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-200 font-black';
                  crownColor = 'text-slate-400';
                } else if (isThird) {
                  podiumBg = 'bg-gradient-to-b from-amber-700/10 to-transparent border-amber-700/30 dark:border-amber-900/40';
                  badgeColor = 'bg-amber-700 text-white font-black';
                  crownColor = 'text-amber-700';
                }

                return (
                  <div
                    key={cell.cellName}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${podiumBg}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${badgeColor}`}>
                          #{cell.rank}
                        </div>
                        {isFirst && <Crown className={`w-5 h-5 ${crownColor}`} />}
                        {(isSecond || isThird) && <Medal className={`w-4 h-4 ${crownColor}`} />}
                      </div>
                      {cell.pcfName && (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          {cell.pcfName}
                        </span>
                      )}
                    </div>

                    <div className="my-3 space-y-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                        {cell.cellName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1">
                        <span>{cell.newConvertsCount} New Converts · {cell.percentageOfTotal}% share</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-baseline justify-between">
                      <div>
                        <div className="text-2xl font-black font-mono-tabular text-slate-900 dark:text-slate-100">
                          <CountUpNumber value={cell.soulsWon} />
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          Souls Won
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              entries.slice(0, 3).map((entry, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              let podiumBg = 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800';
              let badgeColor = 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
              let crownColor = 'text-slate-400';

              if (isFirst) {
                podiumBg = 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/40 shadow-sm';
                badgeColor = 'bg-amber-500 text-slate-950 font-black shadow-xs';
                crownColor = 'text-amber-500';
              } else if (isSecond) {
                podiumBg = 'bg-gradient-to-b from-slate-300/10 to-transparent border-slate-300/80 dark:border-slate-700';
                badgeColor = 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-200 font-black';
                crownColor = 'text-slate-400';
              } else if (isThird) {
                podiumBg = 'bg-gradient-to-b from-amber-700/10 to-transparent border-amber-700/30 dark:border-amber-900/40';
                badgeColor = 'bg-amber-700 text-white font-black';
                crownColor = 'text-amber-700';
              }

              return (
                <div
                  key={entry.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${podiumBg}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${badgeColor}`}>
                        #{entry.rank}
                      </div>
                      {isFirst && <Crown className={`w-5 h-5 ${crownColor}`} />}
                      {(isSecond || isThird) && <Medal className={`w-4 h-4 ${crownColor}`} />}
                    </div>

                    {/* Rank Trend Indicator */}
                    <RankTrendBadge change={entry.rankChange} isNew={entry.isNewEntry} />
                  </div>

                  <div className="my-3 space-y-1">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                      {entry.name}
                    </h3>
                    {entry.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {entry.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/80 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black font-mono-tabular text-slate-900 dark:text-slate-100">
                        <CountUpNumber value={entry.soulsWon} />
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Souls Won
                      </div>
                    </div>

                    {entry.percentageOfTarget !== undefined && entry.target && (
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono-tabular">
                          {entry.percentageOfTarget}%
                        </span>
                        <div className="text-[10px] text-slate-400">
                          of {entry.target?.toLocaleString?.() || entry.target} goal
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
            )}
          </div>
        )}

        {/* FULL RANKINGS LIST */}
        <div className="space-y-2.5 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Complete Standings List
          </div>

          <div className="space-y-2">
            {currentTab === 'localities' ? (
              topLocalities.map((item) => {
                const isTop3 = item.rank <= 3;
                return (
                  <div
                    key={item.localityName}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isTop3
                        ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs font-mono-tabular shrink-0 ${
                          item.rank === 1
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : item.rank === 2
                            ? 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-200'
                            : item.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        #{item.rank}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {item.localityName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.areaCouncil}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right min-w-[70px] pl-12 sm:pl-0">
                      <div className="text-lg font-black font-mono-tabular text-slate-900 dark:text-slate-100">
                        {item.count.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Souls Won
                      </div>
                    </div>
                  </div>
                );
              })
            ) : currentTab === 'pcfs' ? (
              pcfEntries.map((pcf) => {
                const isTop3 = pcf.rank <= 3;
                return (
                  <div
                    key={pcf.pcfName}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isTop3
                        ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs font-mono-tabular shrink-0 ${
                          pcf.rank === 1
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : pcf.rank === 2
                            ? 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-200'
                            : pcf.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        #{pcf.rank}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>🟣 {pcf.pcfName}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>{pcf.activeWinnersCount} soul winner{pcf.activeWinnersCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 pl-12 sm:pl-0">
                      <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium">
                        {pcf.newConvertsCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {pcf.newConvertsCount} Converts
                          </span>
                        )}
                        {pcf.rededicationsCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            {pcf.rededicationsCount} Reded.
                          </span>
                        )}
                      </div>

                      <div className="text-right min-w-[70px]">
                        <div className="text-lg font-black font-mono-tabular text-slate-900 dark:text-slate-100">
                          {pcf.soulsWon.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Souls
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : currentTab === 'cells' ? (
              cellEntries.map((cell) => {
                const isTop3 = cell.rank <= 3;
                return (
                  <div
                    key={cell.cellName}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isTop3
                        ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs font-mono-tabular shrink-0 ${
                          cell.rank === 1
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : cell.rank === 2
                            ? 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-200'
                            : cell.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        #{cell.rank}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>🔵 {cell.cellName}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>{cell.activeWinnersCount} soul winner{cell.activeWinnersCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 pl-12 sm:pl-0">
                      <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium">
                        {cell.newConvertsCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {cell.newConvertsCount} Converts
                          </span>
                        )}
                        {cell.rededicationsCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            {cell.rededicationsCount} Reded.
                          </span>
                        )}
                      </div>

                      <div className="text-right min-w-[70px]">
                        <div className="text-lg font-black font-mono-tabular text-slate-900 dark:text-slate-100">
                          {cell.soulsWon.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Souls
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              entries.map((entry) => {
              const isTop3 = entry.rank <= 3;
              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isTop3
                      ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs font-mono-tabular shrink-0 ${
                        entry.rank === 1
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : entry.rank === 2
                          ? 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-slate-200'
                          : entry.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      #{entry.rank}
                    </div>

                    {/* Rank Change Momentum Pill */}
                    <RankTrendBadge change={entry.rankChange} isNew={entry.isNewEntry} />

                    {/* Name & Subtitle */}
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{entry.name}</span>
                        {entry.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-normal">
                            {entry.code}
                          </span>
                        )}
                      </div>
                      {entry.subtitle && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {entry.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Numbers and breakdown */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 pl-12 sm:pl-0">
                    {/* Decision Breakdown chips */}
                    <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium">
                      {entry.newConvertsCount !== undefined && entry.newConvertsCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {entry.newConvertsCount} Converts
                        </span>
                      )}
                      {entry.rededicationsCount !== undefined && entry.rededicationsCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          {entry.rededicationsCount} Reded.
                        </span>
                      )}
                    </div>

                    {/* Progress Bar (if target available) */}
                    {entry.target && (
                      <div className="hidden sm:block w-28 space-y-1 text-right">
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono-tabular">
                          {entry.percentageOfTarget}% target
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, entry.percentageOfTarget || 0)}%`,
                              backgroundColor: palette.hex,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Big Souls Won Number */}
                    <div className="text-right min-w-[70px]">
                      <div className="text-lg font-black font-mono-tabular text-slate-900 dark:text-slate-100">
                        {entry.soulsWon.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Souls
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>

        {/* Card Footer Banner with Theme Scripture */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
          <div className="italic font-serif text-center sm:text-left">
            "{campaign.verse}"
          </div>
          <div className="font-mono text-[11px] shrink-0">
            Harvest 10K Live Collation System
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for clean rank trend indicator
const RankTrendBadge: React.FC<{ change: number; isNew?: boolean }> = ({ change, isNew }) => {
  if (isNew) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <Sparkles className="w-3 h-3" />
        <span>NEW</span>
      </span>
    );
  }

  if (change > 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
        title={`Moved up ${change} rank(s) since previous period`}
      >
        <TrendingUp className="w-3 h-3" />
        <span>+{change}</span>
      </span>
    );
  }

  if (change < 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
        title={`Moved down ${Math.abs(change)} rank(s) since previous period`}
      >
        <TrendingDown className="w-3 h-3" />
        <span>{change}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
      title="No change in rank"
    >
      <Minus className="w-3 h-3" />
      <span>0</span>
    </span>
  );
};
