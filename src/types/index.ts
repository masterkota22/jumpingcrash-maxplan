import type { Timestamp } from 'firebase/firestore';

export type SchoolLevel = 'elementary' | 'middle' | 'high' | 'university';

export type EventType = 'moah' | 'alternate' | 'double';

export type AwardGrade = 'gold' | 'silver' | 'bronze' | 'none';

export type AgeGroup = 'preschool' | 'elementaryLow' | 'elementaryHigh' | 'middleHigh';

export interface User {
  uid: string;
  name: string;
  schoolId: string;
  schoolLevel: SchoolLevel;
  grade: number;
  classNumber?: number;
}

export interface School {
  id: string;
  name: string;
  level: SchoolLevel;
  region: string;
}

export interface JumpRecord {
  id: string;
  userId: string;
  schoolId: string;
  eventType: EventType;
  count: number;
  duration: 30;
  createdAt: Timestamp;
  videoUrl?: string;
}

export interface SchoolRanking {
  schoolId: string;
  eventType: EventType;
  grade: number;
  top3Average: number;
  top3UserIds: string[];
}

export interface AwardCriteria {
  gold: number;
  silver: [number, number];
  bronze: [number, number];
}

export type CompetitionStatus = 'upcoming' | 'active' | 'ended';

export interface Competition {
  id: string;
  title: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  events: EventType[];
  status: CompetitionStatus;
}
