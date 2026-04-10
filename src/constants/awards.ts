import type { EventType, AgeGroup, AwardCriteria } from '@/types';

/**
 * 시상 기준표 (제5회 한국체육대학교총장기전국줄넘기대회 2025 기준)
 * gold: N회 이상
 * silver: [상한, 하한]
 * bronze: [상한, 하한]
 */
export const AWARD_CRITERIA: Record<EventType, Partial<Record<AgeGroup, AwardCriteria>>> = {
  moah: {
    preschool:      { gold: 60, silver: [59, 51], bronze: [50, 41] },
    elementaryLow:  { gold: 70, silver: [69, 60], bronze: [59, 50] },
    elementaryHigh: { gold: 80, silver: [79, 71], bronze: [70, 61] },
    middleHigh:     { gold: 100, silver: [99, 81], bronze: [80, 61] },
  },
  alternate: {
    preschool:      { gold: 60, silver: [59, 51], bronze: [50, 41] },
    elementaryLow:  { gold: 80, silver: [79, 65], bronze: [64, 50] },
    elementaryHigh: { gold: 100, silver: [99, 71], bronze: [70, 51] },
    middleHigh:     { gold: 100, silver: [99, 71], bronze: [70, 51] },
  },
  double: {
    elementaryLow:  { gold: 30, silver: [29, 20], bronze: [19, 10] },
    elementaryHigh: { gold: 50, silver: [49, 35], bronze: [34, 25] },
    middleHigh:     { gold: 60, silver: [59, 46], bronze: [45, 30] },
  },
};

export const EVENT_LABELS: Record<EventType, string> = {
  moah: '모아뛰기',
  alternate: '번갈아뛰기',
  double: '이중뛰기',
};

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  preschool: '유아부',
  elementaryLow: '초등 저학년',
  elementaryHigh: '초등 고학년',
  middleHigh: '중/고등부',
};
