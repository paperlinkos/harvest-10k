import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { UserRole, SoulRecord, Batch, SmsGatewayTelemetry } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Clock,
  User,
  Phone,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  MessageSquare,
  RefreshCw,
  Send,
  Radio,
  Activity,
  Check,
  Zap,
  Filter,
  Search,
} from 'lucide-react';
import { VerificationMessageModal } from '../components/VerificationMessageModal';
import { formatNigerianPhone } from '../utils/phoneUtils';

interface ApprovalQueueScreenProps {
  userRole: UserRole;
  theme?: 'dark' | 'light';
  onSuccessToast: (title: string, message: string) => void;
}

export const ApprovalQueueScreen: React.FC<ApprovalQueueScreenProps> = ({
  userRole,
  onSuccessToast,
}) => {
  const { palette } = useTheme();
  const [activeTab, setActiveTab] = useState<'undelivered' | 'delivered' | 'batches' | 'telemetry'>('undelivered');
  const [undeliveredRecords, setUndeliveredRecords] = useState<SoulRecord[]>(
    dataService.getUndeliveredSmsRecords()
  );
  const [deliveredRecords, setDeliveredRecords] = useState<SoulRecord[]>(
    dataService.getAutoConfirmedSmsRecords()
  );
  const [pendingBatches, setPendingBatches] = useState<Batch[]>(
    dataService.getPendingBatches()
  );
  const [telemetry, setTelemetry] = useState<SmsGatewayTelemetry>(
    dataService.getSmsGatewayTelemetry()
  );
  const [smsLogs, setSmsLogs] = useState(dataService.getSmsLogs());

  const [search, setSearch] = useState<string>('');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isBulkRetrying, setIsBulkRetrying] = useState<boolean>(false);

  const [rejectModalItem, setRejectModalItem] = useState<{
    id: string;
    type: 'record' | 'batch';
    name: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedRecordForMessage, setSelectedRecordForMessage] = useState<SoulRecord | null>(null);

  const refreshData = () => {
    setUndeliveredRecords(dataService.getUndeliveredSmsRecords());
    setDeliveredRecords(dataService.getAutoConfirmedSmsRecords());
    setPendingBatches(dataService.getPendingBatches());
    setTelemetry(dataService.getSmsGatewayTelemetry());
    setSmsLogs(dataService.getSmsLogs());
  };

  useEffect(() => {
    const unsub = dataService.subscribe(refreshData);
    return unsub;
  }, []);

  const handleApproveRecord = (id: string, name: string) => {
    const ok = dataService.approveSoulRecord(id, 'Coordinator Manual Review', userRole);
    if (ok) {
      onSuccessToast('Manually Verified', `${name} approved and committed to official harvest total.`);
      refreshData();
    }
  };

  const handleRetrySms = async (record: SoulRecord) => {
    setRetryingId(record.id);
    try {
      const res = await dataService.dispatchSmsGatewayVerification(record.id, { isRetry: true });
      if (res.success) {
        onSuccessToast('SMS Delivered & Confirmed', `${record.firstName}'s phone received the message (${res.carrier}). Auto-confirmed!`);
      } else {
        onSuccessToast('Retry Dispatched', `Carrier response: ${res.failureReason || 'Still unconfirmed'}.`);
      }
    } finally {
      setRetryingId(null);
      refreshData();
    }
  };

  const handleBulkRetry = async () => {
    if (undeliveredRecords.length === 0) return;
    setIsBulkRetrying(true);
    let deliveredCount = 0;

    for (const record of undeliveredRecords.slice(0, 15)) {
      const res = await dataService.dispatchSmsGatewayVerification(record.id, { isRetry: true });
      if (res.success) deliveredCount++;
    }

    setIsBulkRetrying(false);
    onSuccessToast(
      'Bulk SMS Retry Complete',
      `Re-sent gateway messages. ${deliveredCount} confirmed delivered & auto-verified into zone total.`
    );
    refreshData();
  };

  const handleApproveAllUndelivered = () => {
    let count = 0;
    undeliveredRecords.forEach(r => {
      if (dataService.approveSoulRecord(r.id, 'Coordinator Manual Override', userRole)) count++;
    });
    onSuccessToast('Bulk Manual Verification', `Manually confirmed and verified ${count} records.`);
    refreshData();
  };

  const handleApproveBatch = (id: string, label: string) => {
    const ok = dataService.approveBatch(id, 'Coordinator', userRole);
    if (ok) {
      onSuccessToast('Batch Approved', `${label} verified and committed to central tally.`);
      refreshData();
    }
  };

  const handleConfirmReject = () => {
    if (!rejectModalItem || !rejectReason.trim()) return;
    if (rejectModalItem.type === 'record') {
      dataService.rejectSoulRecord(rejectModalItem.id, rejectReason.trim(), 'Coordinator', userRole);
      onSuccessToast('Record Invalidate', `${rejectModalItem.name} marked as invalid.`);
    } else {
      dataService.rejectBatch(rejectModalItem.id, rejectReason.trim(), 'Coordinator', userRole);
      onSuccessToast('Batch Rejected', `${rejectModalItem.name} marked as rejected.`);
    }
    setRejectModalItem(null);
    setRejectReason('');
    refreshData();
  };

  const centres = dataService.getCentres();
  const centreMap = new Map(centres.map(c => [c.id, c.name]));

  // Filtering for Undelivered tab
  const filteredUndelivered = undeliveredRecords.filter(r => {
    if (carrierFilter !== 'all' && r.smsCarrier && !r.smsCarrier.toLowerCase().includes(carrierFilter.toLowerCase())) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.wonByName.toLowerCase().includes(q) ||
        (r.smsFailureReason && r.smsFailureReason.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Filtering for Delivered tab
  const filteredDelivered = deliveredRecords.filter(r => {
    if (carrierFilter !== 'all' && r.smsCarrier && !r.smsCarrier.toLowerCase().includes(carrierFilter.toLowerCase())) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.wonByName.toLowerCase().includes(q) ||
        (r.smsDeliveryReceiptId && r.smsDeliveryReceiptId.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Bulk SMS Gateway & Verification Audit
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Automated carrier verification engine. Souls with confirmed SMS delivery receipts are <strong>auto-confirmed</strong> into zone statistics. Undelivered messages and network carrier timeouts are isolated for manual review.
          </p>
        </div>

        {/* Live Gateway Telemetry Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Gateway: Active ({telemetry.senderId})</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold">
            Delivery Rate: {telemetry.deliveryRate}%
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('undelivered')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'undelivered'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>Undelivered / Manual Review</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'undelivered' ? 'bg-white text-rose-700' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
            }`}>
              {undeliveredRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('delivered')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'delivered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Auto-Confirmed via SMS</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'delivered' ? 'bg-white text-emerald-700' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
            }`}>
              {deliveredRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'batches'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Crusade Batches ({pendingBatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Gateway Telemetry</span>
          </button>
        </div>

        {/* Bulk Action Controls */}
        {activeTab === 'undelivered' && undeliveredRecords.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkRetry}
              disabled={isBulkRetrying}
              className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBulkRetrying ? 'animate-spin' : ''}`} />
              <span>Retry All Gateway SMS</span>
            </button>
            <button
              onClick={handleApproveAllUndelivered}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Manually Verify All</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter / Search Bar (for Undelivered & Delivered tabs) */}
      {(activeTab === 'undelivered' || activeTab === 'delivered') && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search convert, phone, soul winner..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Carrier:
            </span>
            <select
              value={carrierFilter}
              onChange={e => setCarrierFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Carriers</option>
              <option value="mtn">MTN Nigeria</option>
              <option value="airtel">Airtel Nigeria</option>
              <option value="glo">Glo Mobile</option>
              <option value="9mobile">9mobile</option>
            </select>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: UNDELIVERED SMS / MANUAL REVIEW QUEUE                              */}
      {/* ========================================================================= */}
      {activeTab === 'undelivered' && (
        filteredUndelivered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              No Undelivered Records!
            </h3>
            <p className="text-xs text-slate-400">
              All submitted converts were successfully delivered by telecom carriers and auto-confirmed into official statistics.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUndelivered.map(r => {
              const isRetrying = retryingId === r.id;
              const carrier = r.smsCarrier || 'MTN Nigeria';
              const reason = r.smsFailureReason || 'Carrier Network Timeout / Out of Coverage';

              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-2.5">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                          {r.firstName} {r.lastName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {r.decisionType.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            {carrier}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(r.wonAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Carrier Delivery Warning Pill */}
                    <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
                          Carrier Delivery Unconfirmed
                        </div>
                        <div className="text-[10.5px] text-rose-700/90 dark:text-rose-400 mt-0.5">
                          {reason}
                        </div>
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{formatNigerianPhone(r.phone) || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{centreMap.get(r.centreId) || 'Abuja Hub'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate col-span-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Soul Winner: {r.wonByName}</span>
                      </div>
                    </div>

                    {r.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl italic">
                        "{r.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleRetrySms(r)}
                      disabled={isRetrying}
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Retry Bulk SMS Dispatch"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                      <span>{isRetrying ? 'Retrying...' : 'Retry SMS'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedRecordForMessage(r)}
                      className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Send WhatsApp Backup"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Backup</span>
                    </button>

                    <button
                      onClick={() =>
                        setRejectModalItem({
                          id: r.id,
                          type: 'record',
                          name: `${r.firstName} ${r.lastName}`,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Invalidate
                    </button>

                    <button
                      onClick={() => handleApproveRecord(r.id, `${r.firstName} ${r.lastName}`)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      title="Manually confirm and count soul"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Manually Confirm</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUTO-CONFIRMED VIA SMS DELIVERY RECEIPTS                           */}
      {/* ========================================================================= */}
      {activeTab === 'delivered' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Showing {filteredDelivered.length} converts auto-confirmed via telecom carrier DLR
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" /> 100% Carrier Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 pl-6">Convert Name</th>
                  <th className="p-3.5">Phone & Carrier</th>
                  <th className="p-3.5">Delivery Receipt (DLR)</th>
                  <th className="p-3.5">Church Centre</th>
                  <th className="p-3.5">Soul Winner</th>
                  <th className="p-3.5">Delivered At</th>
                  <th className="p-3.5 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredDelivered.slice(0, 50).map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 pl-6 font-bold text-slate-900 dark:text-white">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                      <div>{formatNigerianPhone(r.phone)}</div>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-sans font-semibold">
                        {r.smsCarrier || 'MTN Nigeria'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                      {r.smsDeliveryReceiptId || `DLR-CEAZ1-${r.id.slice(-6)}`}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {centreMap.get(r.centreId) || 'Abuja Hub'}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {r.wonByName}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {r.smsDeliveredAt ? new Date(r.smsDeliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Confirmed'}
                    </td>
                    <td className="p-3.5 pr-6 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        <Check className="w-3 h-3" /> Auto-Confirmed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CRUSADE BATCHES                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'batches' && (
        pendingBatches.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              No Pending Crusade Batches
            </h3>
            <p className="text-xs text-slate-400">All field crusade batches have been processed and tallied.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingBatches.map(b => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {b.sessionLabel}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {b.count} Souls Reported
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(b.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {b.newConverts}
                      </span>
                      <div className="text-[9px] text-slate-400 uppercase font-bold">New Converts</div>
                    </div>
                    <div>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                        {b.rededications}
                      </span>
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Rededications</div>
                    </div>
                    <div>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                        {b.returnees}
                      </span>
                      <div className="text-[9px] text-slate-400 uppercase font-bold">Returnees</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 pt-1">
                    Submitted by: <strong>{b.submittedByName}</strong> ({centreMap.get(b.centreId) || 'Hub'})
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() =>
                      setRejectModalItem({
                        id: b.id,
                        type: 'batch',
                        name: b.sessionLabel,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveBatch(b.id, b.sessionLabel)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Batch</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GATEWAY TELEMETRY & CARRIER METRICS                                */}
      {/* ========================================================================= */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Top Telemetry KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatched</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {telemetry.totalDispatched.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">All Telecom Networks</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Delivered (Auto-Confirmed)</span>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {telemetry.totalDelivered.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">DLR Verified Receipts</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">DND Blocked</span>
              <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                {telemetry.totalDndBlocked.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400">Do-Not-Disturb Active</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Delivery Rate</span>
              <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {telemetry.deliveryRate}%
              </div>
              <span className="text-[10px] text-slate-400">Carrier Verification Index</span>
            </div>
          </div>

          {/* Carrier Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {telemetry.carrierBreakdown.map(c => (
              <div
                key={c.carrier}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.carrier}</h4>
                  <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {c.rate}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${c.rate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Sent: {c.sent}</span>
                  <span>Delivered: {c.delivered}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Gateway Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Recent Bulk SMS Gateway Dispatches
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {smsLogs.slice(0, 10).map(log => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {log.message}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Target: {log.coordinatorPhone} • {log.centreName}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    log.status === 'sent'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}>
                    {log.status === 'sent' ? 'Delivered' : 'Undelivered'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Invalidate {rejectModalItem.name}
            </h3>
            <p className="text-xs text-slate-500">
              Please enter the audit reason for invalidating this record:
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid phone digits, uncontactable convert..."
              className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setRejectModalItem(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer disabled:opacity-50"
              >
                Confirm Invalidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Message Modal (WhatsApp / Custom SMS Backup) */}
      {selectedRecordForMessage && (
        <VerificationMessageModal
          isOpen={!!selectedRecordForMessage}
          onClose={() => setSelectedRecordForMessage(null)}
          record={selectedRecordForMessage}
          userRole={userRole}
          onSuccessToast={onSuccessToast}
          onRecordUpdated={refreshData}
        />
      )}
    </div>
  );
};
