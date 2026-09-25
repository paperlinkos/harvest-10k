import React, { useState, useMemo, useEffect } from 'react';
import { SoulRecord, UserRole } from '../types';
import { useTheme } from '../context/ThemeContext';
import { dataService } from '../services/dataService';
import { formatNigerianPhone } from '../utils/phoneUtils';
import {
  VERIFICATION_TEMPLATES,
  buildPopulatedMessage,
  generateWhatsAppUrl,
  generateSmsDeepLink,
  calculateSmsMetrics,
  MessageTemplate,
} from '../utils/verificationMessaging';
import {
  X,
  MessageSquare,
  Sparkles,
  Send,
  Copy,
  Check,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  BookOpen,
  Home,
  Church,
  ShieldCheck,
  User,
  MapPin,
  RefreshCw,
  PhoneCall,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface VerificationMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: SoulRecord | null;
  userRole?: UserRole;
  currentUserName?: string;
  onSuccessToast?: (title: string, message: string) => void;
  onRecordUpdated?: () => void;
}

export const VerificationMessageModal: React.FC<VerificationMessageModalProps> = ({
  isOpen,
  onClose,
  record,
  userRole = 'soul_winner',
  currentUserName,
  onSuccessToast,
  onRecordUpdated,
}) => {
  const { theme, palette } = useTheme();
  const isDark = theme === 'dark';

  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('salvation_welcome');
  const [editableMessage, setEditableMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [autoVerifyOnSend, setAutoVerifyOnSend] = useState<boolean>(true);

  const centre = record ? dataService.getCentreById(record.centreId) : undefined;
  const churchName = centre?.name || record?.followUpChurch || 'Christ Embassy Abuja';
  const soulWinnerName = record?.wonByName || currentUserName || 'Evangelist';

  // Populate message when record or template changes
  useEffect(() => {
    if (!record) return;

    setIsVerified(record.status === 'verified');

    const templateObj = VERIFICATION_TEMPLATES.find(t => t.id === selectedTemplateId) || VERIFICATION_TEMPLATES[0];
    const initialText = buildPopulatedMessage(templateObj.template, {
      firstName: record.firstName,
      lastName: record.lastName,
      decisionType: record.decisionType,
      church: churchName,
      winnerName: soulWinnerName,
      cellName: record.winnerCell || 'Grace Cell',
      pcfName: record.winnerPcf || 'Haven PCF',
      outreachSpot: record.outreachSpot || record.community || 'Abuja Outreach Field',
      residentialDistrict: record.residentialDistrict || record.community || 'Abuja Central',
      phone: record.phone,
    });

    setEditableMessage(initialText);
  }, [record, selectedTemplateId, churchName, soulWinnerName]);

  const smsMetrics = useMemo(() => {
    return calculateSmsMetrics(editableMessage);
  }, [editableMessage]);

  if (!isOpen || !record) return null;

  const handleSelectTemplate = (tmpl: MessageTemplate) => {
    setSelectedTemplateId(tmpl.id);
    const text = buildPopulatedMessage(tmpl.template, {
      firstName: record.firstName,
      lastName: record.lastName,
      decisionType: record.decisionType,
      church: churchName,
      winnerName: soulWinnerName,
      cellName: record.winnerCell || 'Grace Cell',
      pcfName: record.winnerPcf || 'Haven PCF',
      outreachSpot: record.outreachSpot || record.community || 'Abuja Outreach Field',
      residentialDistrict: record.residentialDistrict || record.community || 'Abuja Central',
      phone: record.phone,
    });
    setEditableMessage(text);
  };

  const insertVariable = (variableToken: string) => {
    let insertion = '';
    if (variableToken === 'name') insertion = record.firstName;
    else if (variableToken === 'church') insertion = churchName;
    else if (variableToken === 'winner') insertion = soulWinnerName;
    else if (variableToken === 'spot') insertion = record.outreachSpot || record.community || 'Abuja';
    else if (variableToken === 'cell') insertion = record.winnerCell || 'Grace Cell';

    setEditableMessage(prev => prev + ' ' + insertion);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(editableMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (onSuccessToast) {
        onSuccessToast('Message Copied', 'Paste directly into WhatsApp or SMS chat.');
      }
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleLaunchWhatsApp = () => {
    const url = generateWhatsAppUrl(record.phone, editableMessage);
    window.open(url, '_blank', 'noopener,noreferrer');

    // Log the message and optionally mark verified
    dataService.logVerificationMessage(
      record.id,
      'whatsapp',
      editableMessage,
      soulWinnerName,
      autoVerifyOnSend,
      userRole
    );

    if (autoVerifyOnSend) {
      setIsVerified(true);
    }

    if (onSuccessToast) {
      onSuccessToast(
        'WhatsApp Launched',
        `Opened chat with ${record.firstName} (${formatNigerianPhone(record.phone)})${autoVerifyOnSend ? ' & marked record verified' : ''}.`
      );
    }

    if (onRecordUpdated) onRecordUpdated();
  };

  const handleLaunchSms = () => {
    const smsUrl = generateSmsDeepLink(record.phone, editableMessage);
    window.location.href = smsUrl;

    // Log the message and optionally mark verified
    dataService.logVerificationMessage(
      record.id,
      'sms',
      editableMessage,
      soulWinnerName,
      autoVerifyOnSend,
      userRole
    );

    if (autoVerifyOnSend) {
      setIsVerified(true);
    }

    if (onSuccessToast) {
      onSuccessToast(
        'SMS App Opened',
        `Ready to dispatch to ${record.firstName} (${formatNigerianPhone(record.phone)})${autoVerifyOnSend ? ' & marked record verified' : ''}.`
      );
    }

    if (onRecordUpdated) onRecordUpdated();
  };

  const handleToggleVerified = () => {
    if (!isVerified) {
      dataService.approveSoulRecord(record.id, soulWinnerName, userRole);
      setIsVerified(true);
      if (onSuccessToast) {
        onSuccessToast('Verified', `${record.firstName} ${record.lastName} is now verified in central tally.`);
      }
    }
    if (onRecordUpdated) onRecordUpdated();
  };

  const renderTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      case 'BookOpen':
        return <BookOpen className="w-3.5 h-3.5 text-blue-500" />;
      case 'Home':
        return <Home className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Church':
        return <Church className="w-3.5 h-3.5 text-purple-500" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div
        className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-indigo-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg leading-tight">
                  Instant Verification & Welcome Dispatch
                </h3>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    <AlertCircle className="w-3 h-3" /> Pending Verification
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Send personalized welcome text or WhatsApp verification to confirm phone deliverability.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Convert Info Banner */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              {record.firstName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                {record.firstName} {record.lastName}
              </div>
              <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{formatNigerianPhone(record.phone)}</span>
                <span>•</span>
                <span className="capitalize">{record.decisionType.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <div className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm">
              <Church className="w-3.5 h-3.5 text-indigo-500" />
              <span>{churchName}</span>
            </div>
            {record.residentialDistrict && (
              <div className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-sm hidden sm:flex">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>{record.residentialDistrict}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[68vh] overflow-y-auto">
          {/* Channel Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Select Delivery Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveChannel('whatsapp')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border font-medium text-sm transition-all ${
                  activeChannel === 'whatsapp'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm ring-1 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-semibold">WhatsApp Link</div>
                  <div className="text-[11px] opacity-75">Web & Mobile direct chat</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveChannel('sms')}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border font-medium text-sm transition-all ${
                  activeChannel === 'sms'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-semibold">Direct SMS</div>
                  <div className="text-[11px] opacity-75">Native phone text app</div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Template Selector Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Quick Message Templates
              </label>
              <span className="text-[11px] text-slate-400">Click any chip to swap</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VERIFICATION_TEMPLATES.map(tmpl => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-700 dark:border-white shadow-sm scale-100 font-semibold'
                        : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {renderTemplateIcon(tmpl.iconName)}
                    <span>{tmpl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Chat Message Composer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Editable Message Content</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (You can modify text directly below)
                </span>
              </label>
              {activeChannel === 'sms' ? (
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {smsMetrics.charCount} chars • {smsMetrics.segments}{' '}
                  {smsMetrics.segments === 1 ? 'SMS page' : 'SMS pages'}
                </div>
              ) : (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {editableMessage.length} characters (WhatsApp format)
                </div>
              )}
            </div>

            {/* Quick Variable Insertion Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-[11px] text-slate-400 shrink-0">Insert tags:</span>
              <button
                type="button"
                onClick={() => insertVariable('name')}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 shrink-0"
              >
                + {record.firstName}
              </button>
              <button
                type="button"
                onClick={() => insertVariable('church')}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 shrink-0"
              >
                + Church Name
              </button>
              <button
                type="button"
                onClick={() => insertVariable('winner')}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 shrink-0"
              >
                + Soul Winner
              </button>
              {record.winnerCell && (
                <button
                  type="button"
                  onClick={() => insertVariable('cell')}
                  className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400 shrink-0"
                >
                  + Cell ({record.winnerCell})
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                rows={5}
                value={editableMessage}
                onChange={e => setEditableMessage(e.target.value)}
                placeholder="Type or customize your verification message here..."
                className={`w-full p-3 text-sm rounded-xl border font-sans focus:outline-none focus:ring-2 transition-all ${
                  activeChannel === 'whatsapp'
                    ? 'focus:ring-emerald-500/50 border-emerald-500/40'
                    : 'focus:ring-indigo-500/50 border-indigo-500/40'
                } ${
                  isDark
                    ? 'bg-slate-800/90 text-white placeholder-slate-500 border-slate-700'
                    : 'bg-white text-slate-900 placeholder-slate-400 border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Live Chat Bubble Preview */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Preview in {activeChannel === 'whatsapp' ? 'WhatsApp' : 'SMS Message'}</span>
              <span className="text-[11px] font-normal text-slate-500">Recipient: {record.firstName}</span>
            </div>
            <div
              className={`p-3.5 rounded-xl border ${
                activeChannel === 'whatsapp'
                  ? 'bg-emerald-950/20 dark:bg-emerald-950/40 border-emerald-500/20'
                  : 'bg-indigo-950/20 dark:bg-indigo-950/40 border-indigo-500/20'
              }`}
            >
              <div
                className={`max-w-[92%] ml-auto p-3 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-sm ${
                  activeChannel === 'whatsapp'
                    ? 'bg-[#dcf8c6] text-[#075e54] dark:bg-[#056162] dark:text-[#dcf8c6]'
                    : 'bg-indigo-600 text-white dark:bg-indigo-700'
                }`}
              >
                <div className="whitespace-pre-wrap">{editableMessage}</div>
                <div className="text-[10px] text-right mt-1 opacity-70 flex items-center justify-end gap-1">
                  <span>Just now</span>
                  {activeChannel === 'whatsapp' && <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />}
                </div>
              </div>
            </div>
          </div>

          {/* Auto-verify Checkbox Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Auto-mark Soul as Verified upon dispatch
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Updates record from Pending to Verified in central collation metrics.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoVerifyOnSend}
                onChange={e => setAutoVerifyOnSend(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            {!isVerified && (
              <button
                type="button"
                onClick={handleToggleVerified}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Verified</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Skip / Next Soul
            </button>

            {activeChannel === 'whatsapp' ? (
              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all transform active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Launch WhatsApp Web / App</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunchSms}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all transform active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Open SMS App & Dispatch</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
