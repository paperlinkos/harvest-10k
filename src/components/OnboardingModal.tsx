import React, { useState } from 'react';
import {
  Zap,
  Camera,
  Radio,
  Users,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  Tv,
  ArrowRight,
} from 'lucide-react';
import { ScreenName } from './Sidebar';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: ScreenName) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Harvest 10K',
      subtitle: 'Abuja FCT Soul Winning Collation Command Centre',
      badge: 'Step 1 of 4 • The Mission',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-600',
      description:
        'Harvest 10K is an operational command centre engineered for Abuja Federal Capital Territory. We are tracking 10,000 souls won across 6 Area Councils (AMAC, Bwari, Gwagwalada, Kuje, Kwali, Abaji) and 14 Collation Centres in real time.',
      highlights: [
        'Live soul tallies updated from street evangelists in real time',
        'Automatic velocity & hourly trends across all 6 Area Councils',
        'Built-in offline resilience with IndexedDB background sync',
      ],
      actionLabel: 'Explore Dashboard',
      actionScreen: 'dashboard' as ScreenName,
    },
    {
      title: 'Fast Field Capture & Tap to Tally',
      subtitle: 'Effortless counting for high-volume street rallies',
      badge: 'Step 2 of 4 • Street Evangelism',
      icon: Zap,
      color: 'from-indigo-500 to-blue-600',
      description:
        'When preaching on the streets or at busy bus stops, speed is everything. Tap to Tally allows field workers to record individual souls or quick batches with a single touch, even when mobile data drops.',
      highlights: [
        'One-touch counter calibrated for rapid street evangelism',
        'Full soul registration forms for detailed convert contact details',
        'Automatic offline storage when internet connection is patchy',
      ],
      actionLabel: 'Try Tap to Tally',
      actionScreen: 'tally' as ScreenName,
    },
    {
      title: 'Field Media & Testimonies Hub',
      subtitle: 'Photos, voice notes & 1-minute video testimonies',
      badge: 'Step 3 of 4 • Live Media',
      icon: Camera,
      color: 'from-purple-500 to-pink-600',
      description:
        'Capture the tangible joy of salvation directly from the crusade grounds! Evangelists can upload outreach photos, record voice clips using their phone microphone, or submit 1-minute video testimonies.',
      highlights: [
        'In-browser voice recorder with live duration timer',
        'Short 1-minute video uploader with automatic duration validation',
        'Featured media instantly appears on church projectors & live streams',
      ],
      actionLabel: 'Open Media Hub',
      actionScreen: 'testimonies' as ScreenName,
    },
    {
      title: 'YouTube Live Stream & WhatsApp Outreach',
      subtitle: 'OBS broadcast overlay and 1-click discipleship',
      badge: 'Step 4 of 4 • Broadcast & Follow-Up',
      icon: Radio,
      color: 'from-emerald-500 to-teal-600',
      description:
        'Broadcast live numbers to your congregation and YouTube viewers! Use OBS Mode to overlay the live tally directly over your camera video feed, and disciple new converts with 1-click WhatsApp messaging.',
      highlights: [
        '16:9 dedicated YouTube Live Stream layout and OBS Lower-Third mode',
        '1-Click WhatsApp links with pre-filled scriptures and church welcomes',
        'Retention pipeline: Not Started → Contacted → Visited → Integrated',
      ],
      actionLabel: 'View Live Stream',
      actionScreen: 'live-stream' as ScreenName,
    },
  ];

  const step = steps[currentStep];
  const Icon = step.icon;

  const handleFinish = () => {
    localStorage.setItem('harvest10k_onboarding_completed', 'true');
    onClose();
  };

  const handleAction = (screen: ScreenName) => {
    handleFinish();
    onNavigate(screen);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-white">
        {/* Top Gradient Banner */}
        <div className={`p-6 sm:p-8 bg-gradient-to-br ${step.color} text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-black/20 backdrop-blur-md mb-3">
            {step.badge}
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {step.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/85 font-medium mt-0.5">
                {step.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-5">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* Highlights List */}
          <div className="space-y-2.5">
            {step.highlights.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{h}</span>
              </div>
            ))}
          </div>

          {/* Step Quick Jump Action */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => handleAction(step.actionScreen)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <span>{step.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStep
                      ? 'w-6 bg-indigo-600'
                      : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Navigation */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enter Command Centre</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
