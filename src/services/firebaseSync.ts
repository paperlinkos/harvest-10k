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

  public async syncSoulRecord(record: SoulRecord, isLive: boolean = false): Promise<void> {
    if (!this.isAvailable) return;
    try {
      const colName = isLive ? 'live_souls' : 'souls';
      const ref = doc(db, colName, record.id);
      // Clean undefined values for Firestore
      const cleanData = JSON.parse(JSON.stringify(record));
      await setDoc(ref, cleanData, { merge: true });
    } catch (err) {
      console.warn('[FirebaseSync] syncSoulRecord error:', err);
    }
  }

  public async syncBatch(batchItem: Batch, isLive: boolean = false): Promise<void> {
    if (!this.isAvailable) return;
    try {
      const colName = isLive ? 'live_batches' : 'batches';
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
    if (!this.isAvailable) return;
    try {
      // Sync initial records in batches of up to 500
      const chunk = souls.slice(0, 100);
      const batchOp = writeBatch(db);
      chunk.forEach(s => {
        const ref = doc(db, 'souls', s.id);
        batchOp.set(ref, JSON.parse(JSON.stringify(s)), { merge: true });
      });
      batches.slice(0, 50).forEach(b => {
        const ref = doc(db, 'batches', b.id);
        batchOp.set(ref, JSON.parse(JSON.stringify(b)), { merge: true });
      });
      await batchOp.commit();
    } catch (err) {
      console.warn('[FirebaseSync] initialBulkSync deferred:', err);
    }
  }

  public subscribeToSouls(callback: (remoteSouls: SoulRecord[]) => void, isLive: boolean = false): () => void {
    if (!this.isAvailable) return () => {};
    try {
      const colName = isLive ? 'live_souls' : 'souls';
      const q = query(collection(db, colName), limit(1000));
      return onSnapshot(
        q,
        snapshot => {
          const remoteSouls: SoulRecord[] = [];
          snapshot.forEach(docSnap => {
            remoteSouls.push(docSnap.data() as SoulRecord);
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

  public subscribeToBatches(callback: (remoteBatches: Batch[]) => void, isLive: boolean = false): () => void {
    if (!this.isAvailable) return () => {};
    try {
      const colName = isLive ? 'live_batches' : 'batches';
      const q = query(collection(db, colName), limit(500));
      return onSnapshot(
        q,
        snapshot => {
          const remoteBatches: Batch[] = [];
          snapshot.forEach(docSnap => {
            remoteBatches.push(docSnap.data() as Batch);
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
