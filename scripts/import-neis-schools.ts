/**
 * 나이스(NEIS) Open API를 통한 전국 학교 데이터 Import 스크립트
 *
 * 사전 준비:
 *   1. https://open.neis.go.kr 에서 회원가입 후 인증키 발급
 *   2. .env 파일에 다음 추가:
 *      NEIS_API_KEY=발급받은_인증키
 *   3. .env 파일에 Firebase 설정도 입력되어 있어야 함
 *
 * 사용법:
 *   npx tsx scripts/import-neis-schools.ts
 *
 * API 엔드포인트: https://open.neis.go.kr/hub/schoolInfo
 * 파라미터:
 *   - KEY: 인증키
 *   - Type: json
 *   - pIndex: 페이지 번호
 *   - pSize: 페이지당 결과 수 (최대 1000)
 *   - SCHUL_KND_SC_NM: 학교급 (초등학교/중학교/고등학교)
 *
 * 응답 필드:
 *   - SCHUL_NM: 학교명
 *   - SCHUL_KND_SC_NM: 학교종류명
 *   - LCTN_SC_NM: 소재지명 (시도)
 *   - ORG_RDNMA: 도로명주소
 *   - ATPT_OFCDC_SC_NM: 시도교육청명
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env 로딩
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  } catch {
    console.error('❌ .env 파일을 찾을 수 없습니다.');
    process.exit(1);
  }
}

loadEnv();

const NEIS_API_KEY = process.env.NEIS_API_KEY;
if (!NEIS_API_KEY) {
  console.error('❌ NEIS_API_KEY가 .env에 설정되지 않았습니다.');
  console.error('   https://open.neis.go.kr 에서 인증키를 발급받으세요.');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error('❌ Firebase 설정이 .env에 없습니다.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const NEIS_BASE_URL = 'https://open.neis.go.kr/hub/schoolInfo';

// 학교급 → 우리 level 매핑
const LEVEL_MAP: Record<string, string> = {
  '초등학교': 'elementary',
  '중학교': 'middle',
  '고등학교': 'high',
  '특수학교': 'elementary', // fallback
};

// 시도교육청명 → 시도 매핑
const REGION_MAP: Record<string, string> = {
  '서울특별시교육청': '서울',
  '부산광역시교육청': '부산',
  '대구광역시교육청': '대구',
  '인천광역시교육청': '인천',
  '광주광역시교육청': '광주',
  '대전광역시교육청': '대전',
  '울산광역시교육청': '울산',
  '세종특별자치시교육청': '세종',
  '경기도교육청': '경기',
  '강원특별자치도교육청': '강원',
  '충청북도교육청': '충북',
  '충청남도교육청': '충남',
  '전북특별자치도교육청': '전북',
  '전라남도교육청': '전남',
  '경상북도교육청': '경북',
  '경상남도교육청': '경남',
  '제주특별자치도교육청': '제주',
};

interface NeisSchool {
  SCHUL_NM: string;
  SCHUL_KND_SC_NM: string;
  ATPT_OFCDC_SC_NM: string;
  LCTN_SC_NM: string;
  ORG_RDNMA: string;
}

async function fetchPage(pageIndex: number, pageSize: number): Promise<{ schools: NeisSchool[]; totalCount: number }> {
  const url = `${NEIS_BASE_URL}?KEY=${NEIS_API_KEY}&Type=json&pIndex=${pageIndex}&pSize=${pageSize}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.RESULT) {
    // Error response
    console.error(`  API 에러: ${data.RESULT.MESSAGE}`);
    return { schools: [], totalCount: 0 };
  }

  const schoolInfo = data.schoolInfo;
  if (!schoolInfo || schoolInfo.length < 2) {
    return { schools: [], totalCount: 0 };
  }

  const totalCount = schoolInfo[0].head[0].list_total_count;
  const rows: NeisSchool[] = schoolInfo[1].row;

  return { schools: rows, totalCount };
}

async function main() {
  console.log('🏫 나이스 API → Firestore 전국 학교 Import 시작');
  console.log(`   프로젝트: ${firebaseConfig.projectId}`);

  // Get existing schools
  const existingSnap = await getDocs(collection(db, 'schools'));
  const existingNames = new Set(existingSnap.docs.map((d) => d.data().name));
  console.log(`📦 기존 학교 ${existingNames.size}개 확인됨\n`);

  const PAGE_SIZE = 1000;
  const pageIndex = 1;
  let totalCount = 0;
  let fetched = 0;
  let added = 0;
  let skipped = 0;

  // First page to get total count
  const firstPage = await fetchPage(pageIndex, PAGE_SIZE);
  totalCount = firstPage.totalCount;
  console.log(`📊 전체 학교 수: ${totalCount}개\n`);

  if (totalCount === 0) {
    console.log('데이터가 없습니다. API 키를 확인하세요.');
    process.exit(1);
  }

  let allSchools = firstPage.schools;

  // Fetch remaining pages
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  for (let page = 2; page <= totalPages; page++) {
    console.log(`  📄 페이지 ${page}/${totalPages} 가져오는 중...`);
    const result = await fetchPage(page, PAGE_SIZE);
    allSchools = allSchools.concat(result.schools);
    // Rate limiting - avoid hammering the API
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n📥 총 ${allSchools.length}개 학교 데이터 수신\n`);

  // Upload to Firestore
  for (const school of allSchools) {
    fetched++;

    if (existingNames.has(school.SCHUL_NM)) {
      skipped++;
      continue;
    }

    const level = LEVEL_MAP[school.SCHUL_KND_SC_NM];
    if (!level) {
      skipped++;
      continue;
    }

    const region = REGION_MAP[school.ATPT_OFCDC_SC_NM] || school.LCTN_SC_NM || '기타';

    await addDoc(collection(db, 'schools'), {
      name: school.SCHUL_NM,
      level,
      region,
    });
    added++;
    existingNames.add(school.SCHUL_NM);

    if (added % 200 === 0) {
      console.log(`  ✅ ${added}개 추가됨 (${fetched}/${allSchools.length})...`);
    }
  }

  console.log(`\n🎉 완료!`);
  console.log(`   총 처리: ${fetched}개`);
  console.log(`   추가: ${added}개`);
  console.log(`   건너뜀(중복/제외): ${skipped}개`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ 에러:', err);
  process.exit(1);
});
