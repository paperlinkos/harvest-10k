import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { SoulRecord, Batch, SoulWinnerProfile } from '../types';

export class FirebaseSyncService {
  private isAvailable: boolean = true;

  constructor() {
    if (!db) {
      this.isAvailable = false;
    }
  }

  public async syncSoulRecord(record: SoulRecord, isLive: boolean = true): Promise<void> {
    if (!this.isAvailable) return;
    try {
      const colName = 'live_souls';
      const ref = doc(db, colName, record.id);
      // Clean undefined values for Firestore
      const cleanData = JSON.parse(JSON.stringify(record));
      await setDoc(ref, cleanData, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] syncSoulRecord error:', err);
    }
  }

  public async syncBatch(batchItem: Batch, isLive: boolean = true): Promise<void> {
    if (!this.isAvailable) return;
    try {
      const colName = 'live_batches';
      const ref = doc(db, colName, batchItem.id);
      const cleanData = JSON.parse(JSON.stringify(batchItem));
      await setDoc(ref, cleanData, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] syncBatch error:', err);
    }
  }

  public async syncSoulWinner(winner: SoulWinnerProfile): Promise<void> {
    if (!this.isAvailable) return;
    try {
      const ref = doc(db, 'soulWinners', winner.id);
      const cleanData = JSON.parse(JSON.stringify(winner));
      await setDoc(ref, cleanData, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] syncSoulWinner error:', err);
    }
  }

  public async initialBulkSync(souls: SoulRecord[], batches: Batch[]): Promise<void> {
    // Disabled bulk seeding to prevent demo records from syncing to Firestore
    return;
  }

  public subscribeToSouls(callback: (remoteSouls: SoulRecord[]) => void, isLive: boolean = true): () => void {
    if (!this.isAvailable) return () => {};
    try {
      const colName = 'live_souls';
      const q = query(collection(db, colName), limit(1000));
      return onSnapshot(
        q,
        snapshot => {
          const remoteSouls: SoulRecord[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as SoulRecord;
            // Ignore legacy demo records
            if (data.id && !data.id.startsWith('soul-1') && !data.id.startsWith('soul-2') && !data.id.startsWith('soul-3')) {
              remoteSouls.push(data);
            }
          });
          callback(remoteSouls);
        },
        err => {
          console.warn(`[FirebaseSync] subscribeToSouls (${colName}) error:`, err);
        }
      );
    } catch (err) {
      console.warn('[FirebaseSync] Failed to setup subscribeToSouls listener:', err);
      return () => {};
    }
  }

  public subscribeToBatches(callback: (remoteBatches: Batch[]) => void, isLive: boolean = true): () => void {
    if (!this.isAvailable) return () => {};
    try {
      const colName = 'live_batches';
      const q = query(collection(db, colName), limit(500));
      return onSnapshot(
        q,
        snapshot => {
          const remoteBatches: Batch[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Batch;
            if (data.id && !data.id.startsWith('batch-1') && !data.id.startsWith('batch-2') && !data.id.startsWith('batch-3')) {
              remoteBatches.push(data);
            }
          });
          callback(remoteBatches);
        },
        err => {
          console.warn(`[FirebaseSync] subscribeToBatches (${colName}) error:`, err);
        }
      );
    } catch (err) {
      console.warn('[FirebaseSync] Failed to setup subscribeToBatches listener:', err);
      return () => {};
    }
  }

  public subscribeToWinners(callback: (remoteWinners: SoulWinnerProfile[]) => void): () => void {
    if (!this.isAvailable) return () => {};
    try {
      const q = query(collection(db, 'soulWinners'), limit(500));
      return onSnapshot(
        q,
        snapshot => {
          const remoteWinners: SoulWinnerProfile[] = [];
          snapshot.forEach(docSnap => {
            remoteWinners.push(docSnap.data() as SoulWinnerProfile);
          });
          callback(remoteWinners);
        },
        err => {
          console.warn('[FirebaseSync] subscribeToWinners error:', err);
        }
      );
    } catch (err) {
      console.warn('[FirebaseSync] Failed to setup subscribeToWinners listener:', err);
      return () => {};
    }
  }
}

export const firebaseSync = new FirebaseSyncService();
