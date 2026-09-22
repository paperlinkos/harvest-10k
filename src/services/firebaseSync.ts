import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { SoulRecord, Batch, SoulWinnerProfile } from '../types';

export class FirebaseSyncService {
  private isConnected: boolean = false;
  private unsubscribeSouls: (() => void) | null = null;
  private unsubscribeBatches: (() => void) | null = null;
  private unsubscribeWinners: (() => void) | null = null;

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  // Real-time listener for remote Soul Records
  public subscribeToSouls(onUpdate: (remoteRecords: SoulRecord[]) => void): () => void {
    try {
      const soulsRef = collection(db, 'harvest_souls');
      const q = query(soulsRef, orderBy('wonAt', 'desc'), limit(500));

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          this.isConnected = true;
          const records: SoulRecord[] = [];
          snapshot.forEach((docSnap) => {
            records.push(docSnap.data() as SoulRecord);
          });
          onUpdate(records);
        },
        (error) => {
          console.warn('[FirebaseSync] Souls subscription warning:', error.message);
        }
      );

      this.unsubscribeSouls = unsub;
      return unsub;
    } catch (e) {
      console.warn('[FirebaseSync] Unable to subscribe to souls:', e);
      return () => {};
    }
  }

  // Real-time listener for remote Batches
  public subscribeToBatches(onUpdate: (remoteBatches: Batch[]) => void): () => void {
    try {
      const batchesRef = collection(db, 'harvest_batches');
      const q = query(batchesRef, orderBy('submittedAt', 'desc'), limit(200));

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          this.isConnected = true;
          const batches: Batch[] = [];
          snapshot.forEach((docSnap) => {
            batches.push(docSnap.data() as Batch);
          });
          onUpdate(batches);
        },
        (error) => {
          console.warn('[FirebaseSync] Batches subscription warning:', error.message);
        }
      );

      this.unsubscribeBatches = unsub;
      return unsub;
    } catch (e) {
      console.warn('[FirebaseSync] Unable to subscribe to batches:', e);
      return () => {};
    }
  }

  // Real-time listener for Soul Winner Profiles
  public subscribeToWinners(onUpdate: (remoteWinners: SoulWinnerProfile[]) => void): () => void {
    try {
      const winnersRef = collection(db, 'harvest_winners');
      const q = query(winnersRef, limit(200));

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          this.isConnected = true;
          const winners: SoulWinnerProfile[] = [];
          snapshot.forEach((docSnap) => {
            winners.push(docSnap.data() as SoulWinnerProfile);
          });
          onUpdate(winners);
        },
        (error) => {
          console.warn('[FirebaseSync] Winners subscription warning:', error.message);
        }
      );

      this.unsubscribeWinners = unsub;
      return unsub;
    } catch (e) {
      console.warn('[FirebaseSync] Unable to subscribe to winners:', e);
      return () => {};
    }
  }

  // Push single soul record to Firestore
  public async syncSoulRecord(record: SoulRecord): Promise<boolean> {
    try {
      const ref = doc(db, 'harvest_souls', record.id);
      await setDoc(ref, { ...record }, { merge: true });
      this.isConnected = true;
      return true;
    } catch (err) {
      console.warn('[FirebaseSync] Error syncing record to Firestore:', err);
      return false;
    }
  }

  // Push batch report to Firestore
  public async syncBatch(batch: Batch): Promise<boolean> {
    try {
      const ref = doc(db, 'harvest_batches', batch.id);
      await setDoc(ref, { ...batch }, { merge: true });
      this.isConnected = true;
      return true;
    } catch (err) {
      console.warn('[FirebaseSync] Error syncing batch to Firestore:', err);
      return false;
    }
  }

  // Push soul winner profile
  public async syncSoulWinner(profile: SoulWinnerProfile): Promise<boolean> {
    try {
      const ref = doc(db, 'harvest_winners', profile.id);
      await setDoc(ref, { ...profile }, { merge: true });
      this.isConnected = true;
      return true;
    } catch (err) {
      console.warn('[FirebaseSync] Error syncing winner to Firestore:', err);
      return false;
    }
  }

  // Bulk push initial records if database is empty
  public async initialBulkSync(records: SoulRecord[], batches: Batch[]): Promise<void> {
    try {
      const checkSnap = await getDocs(query(collection(db, 'harvest_souls'), limit(1)));
      if (checkSnap.empty && records.length > 0) {
        console.log('[FirebaseSync] Seeding remote Firestore with baseline harvest data...');
        // Write top 50 in batches to avoid quotas
        const firestoreBatch = writeBatch(db);
        records.slice(0, 40).forEach((rec) => {
          const recRef = doc(db, 'harvest_souls', rec.id);
          firestoreBatch.set(recRef, rec);
        });
        batches.slice(0, 20).forEach((b) => {
          const bRef = doc(db, 'harvest_batches', b.id);
          firestoreBatch.set(bRef, b);
        });
        await firestoreBatch.commit();
        console.log('[FirebaseSync] Baseline sync committed to Firestore.');
      }
    } catch (err) {
      console.warn('[FirebaseSync] Initial bulk sync skipped:', err);
    }
  }
}

export const firebaseSync = new FirebaseSyncService();
