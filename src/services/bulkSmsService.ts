import { SoulRecord, SmsDeliveryStatus } from '../types';

export interface SmsDispatchResult {
  success: boolean;
  status: SmsDeliveryStatus;
  deliveryReceiptId: string;
  carrier: string;
  dispatchedAt: string;
  deliveredAt?: string;
  failureReason?: string;
  messageText: string;
}

export interface GatewayConfig {
  provider: 'Termii' | 'Infobip' | 'Twilio' | 'Standard_Telecom';
  senderId: string;
  apiKeySet: boolean;
  autoVerifyOnDelivered: boolean;
  dndBypassRoute: boolean; // Priority corporate route
}

// Carrier detection for Nigerian telephone networks
export function detectNigerianCarrier(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  let prefix = '';

  if (clean.startsWith('234') && clean.length >= 6) {
    prefix = '0' + clean.substring(3, 6);
  } else if (clean.startsWith('0') && clean.length >= 4) {
    prefix = clean.substring(0, 4);
  } else if (clean.length === 10) {
    prefix = '0' + clean.substring(0, 3);
  }

  const mtnPrefixes = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'];
  const airtelPrefixes = ['0802', '0808', '0708', '0701', '0812', '0901', '0902', '0904', '0907', '0912'];
  const gloPrefixes = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
  const nineMobilePrefixes = ['0809', '0817', '0818', '0908', '0909'];

  if (mtnPrefixes.includes(prefix)) return 'MTN Nigeria';
  if (airtelPrefixes.includes(prefix)) return 'Airtel Nigeria';
  if (gloPrefixes.includes(prefix)) return 'Glo Mobile';
  if (nineMobilePrefixes.includes(prefix)) return '9mobile';

  return 'MTN Nigeria'; // Default FCT majority carrier
}

class BulkSmsService {
  private config: GatewayConfig = {
    provider: 'Termii',
    senderId: 'CE-ABUJA1',
    apiKeySet: true,
    autoVerifyOnDelivered: true,
    dndBypassRoute: true,
  };

  public getConfig(): GatewayConfig {
    return { ...this.config };
  }

  public setConfig(updates: Partial<GatewayConfig>) {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Dispatches automated verification and welcome SMS via the Bulk SMS Gateway
   */
  public async dispatchVerificationSms(
    record: SoulRecord,
    options?: { isRetry?: boolean; forceDelivered?: boolean }
  ): Promise<SmsDispatchResult> {
    const carrier = detectNigerianCarrier(record.phone || '');
    const dispatchedAt = new Date().toISOString();
    const church = record.followUpChurch || 'Christ Embassy Abuja Zone 1';
    const soulWinner = record.wonByName || 'Evangelist';

    // Standard gospel welcome message from CEAZ1
    const messageText = `Dear ${record.firstName}, welcome to God's family at Christ Embassy Abuja Zone 1! You are born again and full of glory. Led to Christ by ${soulWinner}. Worship with us at ${church}. God bless you!`;

    // Realistic delivery simulation based on Nigerian telecom infrastructure
    // Retries or forceDelivered have higher probability of delivery
    const randomSeed = Math.random();
    let isDelivered = false;
    let failureReason: string | undefined = undefined;
    let status: SmsDeliveryStatus = 'delivered';

    if (options?.forceDelivered) {
      isDelivered = true;
    } else if (options?.isRetry) {
      // 90% success on retry through high-priority bypass route
      isDelivered = randomSeed < 0.90;
      if (!isDelivered) {
        failureReason = 'Carrier Routing Timeout (Retry Again Shortly)';
        status = 'failed';
      }
    } else {
      // 82% normal delivery rate on first submission
      if (randomSeed < 0.82) {
        isDelivered = true;
      } else if (randomSeed < 0.92) {
        // Active DND (Do-Not-Disturb) on network
        status = 'dnd_blocked';
        failureReason = `Active DND on ${carrier} Network (Requires Manual Confirmation or WhatsApp)`;
      } else {
        // Network timeout / unreachable
        status = 'undelivered';
        failureReason = `Network Carrier Timeout / Subscriber Out of Coverage (${carrier})`;
      }
    }

    const carrierCode = carrier.split(' ')[0].toUpperCase();
    const deliveryReceiptId = `DLR-${carrierCode}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    return {
      success: isDelivered,
      status: isDelivered ? 'delivered' : status,
      deliveryReceiptId,
      carrier,
      dispatchedAt,
      deliveredAt: isDelivered ? new Date().toISOString() : undefined,
      failureReason,
      messageText,
    };
  }
}

export const bulkSmsService = new BulkSmsService();
