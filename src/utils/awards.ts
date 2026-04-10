import type { EventType, AgeGroup, AwardGrade, SchoolLevel } from '@/types';
import { AWARD_CRITERIA } from '@/constants/awards';

/**
 * 학교급 + 학년 → AgeGroup 변환
 */
export function getAgeGroup(schoolLevel: SchoolLevel, grade: number): AgeGroup | null {
  switch (schoolLevel) {
    case 'elementary':
      return grade <= 3 ? 'elementaryLow' : 'elementaryHigh';
    case 'middle':
    case 'high':
    case 'university':
      return 'middleHigh';
    default:
      return null;
  }
}

/**
 * 기록 횟수에 대해 시상 등급(금/은/동) 판정
 */
export function judgeAward(
  eventType: EventType,
  ageGroup: AgeGroup,
  count: number,
): AwardGrade {
  const criteria = AWARD_CRITERIA[eventType]?.[ageGroup];
  if (!criteria) return 'none';

  if (count >= criteria.gold) return 'gold';
  if (count >= criteria.silver[1] && count <= criteria.silver[0]) return 'silver';
  if (count >= criteria.bronze[1] && count <= criteria.bronze[0]) return 'bronze';
  return 'none';
}

/**
 * 등급 한글 라벨
 */
export function getAwardLabel(grade: AwardGrade): string {
  switch (grade) {
    case 'gold': return '금';
    case 'silver': return '은';
    case 'bronze': return '동';
    default: return '-';
  }
}

/**
 * 등급 색상
 */
export function getAwardColor(grade: AwardGrade): string {
  switch (grade) {
    case 'gold': return '#FFD700';
    case 'silver': return '#C0C0C0';
    case 'bronze': return '#CD7F32';
    default: return '#9E9E9E';
  }
}
