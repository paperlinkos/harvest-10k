import React, { useState } from 'react';
import {
  Zap,
  Camera,
  Radio,
  Users,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { ScreenName } from './Sidebar';

interface OnboardingFlowCardsProps {
  onNavigate: (screen: ScreenName) => void;
  onOpenTour: () => void;
}

export const OnboardingFlowCards: React.FC<OnboardingFlowCardsProps> = ({
  onNavigate,
  onOpenTour,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const workflowCards = [
    {
      step: '01',
      title: 'Tap to Tally',
      description: 'Single-touch counter for street evangelism, rally counts & offline sync.',
      icon: Zap,
      screen: 'tally' as ScreenName,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    },
    {
      step: '02',
      title: 'Media & Testimonies',
      description: 'Upload field photos, voice recordings & 1-minute video testimonies.',
      icon: Camera,
      screen: 'testimonies' as ScreenName,
      iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      step: '03',
      title: 'YouTube / OBS Stream',
      description: '16:9 live broadcast screen with OBS lower-third transparent overlay.',
      icon: Radio,
      screen: 'live-stream' as ScreenName,
      iconBg: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
    },
    {
      step: '04',
      title: 'Follow-Up & WhatsApp',
      description: '1-Click WhatsApp discipleship messages & convert retention tracking.',
      icon: Users,
      screen: 'followup' as ScreenName,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
  ];

  return (
    <div className="clay-card p-5 sm:p-6 transition-all">
      {/* Header Bar */}
      <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center shadow-sm shrink-0 border border-slate-800 dark:border-slate-200">
            <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500 fill-amber-400 dark:fill-amber-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
              Harvest 10K Field Onboarding Flow
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              4-step operational pipeline from street evangelism to broadcast collation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenTour}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Guided Tour</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Onboarding Cards' : 'Collapse Cards'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4 Cards Grid */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
          {workflowCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.step}
                onClick={() => onNavigate(card.screen)}
                className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400">
                      Phase {card.step}
                    </span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-2xs ${card.iconBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs font-bold">
                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span>Launch</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
