import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { User, School, JumpRecord, EventType } from '@/types';

// ── Users ──

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data as DocumentData);
}

// ── Schools ──

export async function getSchool(id: string): Promise<School | null> {
  const snap = await getDoc(doc(db, 'schools', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as School) : null;
}

export async function getAllSchools(): Promise<School[]> {
  const snap = await getDocs(collection(db, 'schools'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as School));
}

export async function createSchool(school: Omit<School, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'schools'), school);
  return ref.id;
}

// ── Jump Records ──

export async function saveRecord(
  record: Omit<JumpRecord, 'id' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'records'), {
    ...record,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserRecords(userId: string): Promise<JumpRecord[]> {
  const q = query(
    collection(db, 'records'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JumpRecord));
}

export async function getRecordsByEvent(eventType: EventType): Promise<JumpRecord[]> {
  const q = query(
    collection(db, 'records'),
    where('eventType', '==', eventType),
    orderBy('count', 'desc'),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JumpRecord));
}

export async function getSchoolRecords(
  schoolId: string,
  eventType: EventType,
): Promise<JumpRecord[]> {
  const q = query(
    collection(db, 'records'),
    where('schoolId', '==', schoolId),
    where('eventType', '==', eventType),
    orderBy('count', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as JumpRecord));
}

// ── Rankings (computed client-side for MVP) ──

export interface SchoolRankEntry {
  schoolId: string;
  schoolName: string;
  top3Average: number;
  top3UserIds: string[];
}

export async function computeSchoolRankings(
  eventType: EventType,
): Promise<SchoolRankEntry[]> {
  const records = await getRecordsByEvent(eventType);
  const schools = await getAllSchools();
  const schoolMap = new Map(schools.map((s) => [s.id, s.name]));

  // Group best record per user per school
  const userBest = new Map<string, JumpRecord>();
  for (const r of records) {
    const existing = userBest.get(r.userId);
    if (!existing || r.count > existing.count) {
      userBest.set(r.userId, r);
    }
  }

  // Group by school
  const bySchool = new Map<string, JumpRecord[]>();
  for (const r of userBest.values()) {
    const list = bySchool.get(r.schoolId) ?? [];
    list.push(r);
    bySchool.set(r.schoolId, list);
  }

  const rankings: SchoolRankEntry[] = [];
  for (const [schoolId, recs] of bySchool) {
    const sorted = recs.sort((a, b) => b.count - a.count);
    const top3 = sorted.slice(0, 3);
    if (top3.length === 0) continue;
    const avg = top3.reduce((sum, r) => sum + r.count, 0) / top3.length;
    rankings.push({
      schoolId,
      schoolName: schoolMap.get(schoolId) ?? schoolId,
      top3Average: Math.round(avg * 100) / 100,
      top3UserIds: top3.map((r) => r.userId),
    });
  }

  return rankings.sort((a, b) => b.top3Average - a.top3Average);
}

// ── Set user doc (used by profile) ──
export async function setUser(uid: string, data: User): Promise<void> {
  await setDoc(doc(db, 'users', uid), data);
}
