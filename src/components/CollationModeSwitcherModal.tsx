import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { CollationMode } from '../types';
import { playDingSound, playCelebrationSound } from '../utils/audioUtils';
import {
  Sparkles,
  Radio,
  CheckCircle2,
  Database,
  Cloud,
  RefreshCw,
  Trash2,
  X,
  ShieldCheck,
  Zap,
  Info,
  Layers,
} from 'lucide-react';

interface CollationModeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (title: string, message: string) => void;
}

export const CollationModeSwitcherModal: React.FC<CollationModeSwitcherModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [currentMode, setCurrentMode] = useState<CollationMode>(dataService.getCollationMode());
  const [liveCount, setLiveCount] = useState<number>(dataService.getLiveRecordsCount());
  const [demoCount, setDemoCount] = useState<number>(dataService.getDemoRecordsCount());
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [isClearingLive, setIsClearingLive] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      setCurrentMode(dataService.getCollationMode());
      setLiveCount(dataService.getLiveRecordsCount());
      setDemoCount(dataService.getDemoRecordsCount());
    };
    update();
    const unsub = dataService.subscribe(update);
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSwitchMode = (mode: CollationMode) => {
    if (mode === currentMode) return;
    playDingSound();
    dataService.setCollationMode(mode);
    setCurrentMode(mode);
    if (onSuccessToast) {
      if (mode === 'live') {
        playCelebrationSound();
        onSuccessToast(
          'Live Collation Active',
          'Switched to Official Live Crusade Collation. Real field entries are now saving directly to Cloud Firestore.'
        );
      } else {
        onSuccessToast(
          'Demo Sandbox Active',
          'Switched to Training Sandbox. Simulated data active for testing and practice.'
        );
      }
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset Demo Sandbox to initial 21,798 sample records? Any test edits will be refreshed.')) {
      setIsResettingDemo(true);
      playDingSound();
      setTimeout(() => {
        dataService.resetDemoData();
        setIsResettingDemo(false);
        if (onSuccessToast) {
          onSuccessToast('Demo Sandbox Reset', 'Simulated records restored to 21,798 records across all 96 churches.');
        }
      }, 400);
    }
  };

  const handleClearLive = () => {
    if (
      window.confirm(
        'Are you sure you want to start a CLEAN LIVE CRUSADE? This will reset the live field souls count to 0 ready for official launch.'
      )
    ) {
      setIsClearingLive(true);
      playDingSound();
      setTimeout(() => {
        dataService.clearLiveData();
        setIsClearingLive(false);
        if (onSuccessToast) {
          onSuccessToast('Clean Live Session Ready', 'Live collation reset to 0 souls. Ready for today\'s crusade launch!');
        }
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Collation Environment & Mode Manager
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Toggle between the <strong>Training & Demo Sandbox</strong> (for testing) and <strong>Official Live Collation</strong> (for real crusade outreach).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Cloud Connection Telemetry Strip */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Cloud Firestore Database:
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                ai-studio-harvest10k
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Online & Connected
            </span>
          </div>

          {/* Cards Grid: Demo Mode vs Live Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Demo Sandbox */}
            <div
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                currentMode === 'demo'
                  ? 'border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">
                        Demo / Test Sandbox
                      </h3>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                        Simulated Field Data
                      </span>
                    </div>
                  </div>
                  {currentMode === 'demo' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                      ACTIVE
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pre-populated with <strong>21,798 test records</strong> across all 96 churches in Abuja Zone 1. Safe to record test souls, test +1 tap tallies, audit crusade batches, and explore Group Pastor jurisdictions without affecting real campaign stats.
                </p>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] font-mono text-amber-900 dark:text-amber-300">
                  Includes Kubwa, Wuye, Zonal Church & Central Hubs simulation
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                {currentMode === 'demo' ? (
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    disabled={isResettingDemo}
                    className="w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResettingDemo ? 'animate-spin' : ''}`} />
                    <span>Reset Demo Sandbox to Default</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('demo')}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>Switch to Demo Sandbox</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Live Campaign Mode */}
            <div
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                currentMode === 'live'
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Radio className="w-4 h-4 animate-pulse" />
                    </span>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">
                        Live Collation Mode
                      </h3>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Official Campaign Records
                      </span>
                    </div>
                  </div>
                  {currentMode === 'live' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                      ACTIVE
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  The official production environment for live outreach. Souls recorded here are saved directly to <strong>Cloud Firestore</strong> and synchronized live across all phones and tablets in the field.
                </p>

                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-[11px] font-mono text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                  <span>Current Live Souls:</span>
                  <span className="font-black text-sm">{liveCount.toLocaleString()} converts</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                {currentMode === 'live' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearLive}
                      disabled={isClearingLive}
                      className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Start Fresh Live Session (0)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('live')}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Switch to Live Collation</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-3 text-xs text-indigo-950 dark:text-indigo-200">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">How Data Isolation Works:</strong>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                When you switch modes, the system swaps between the <strong>simulated training dataset</strong> and the <strong>live cloud database</strong>. You can freely practice in the Demo Sandbox without fear of inflating the official crusade totals!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
