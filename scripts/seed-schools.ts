/**
 * Firestore 학교 데이터 Seed 스크립트
 *
 * 사용법:
 *   1. .env 파일에 Firebase 설정 입력
 *   2. npx tsx scripts/seed-schools.ts
 *
 * 이 스크립트는 scripts/school-data.json 파일의 334개 학교 데이터를
 * Firestore 'schools' 컬렉션에 업로드합니다.
 * 이미 같은 이름의 학교가 있으면 건너뜁니다.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Firebase 설정 - .env 파일 직접 읽기
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = value;
    }
  } catch {
    console.error('❌ .env 파일을 찾을 수 없습니다. 프로젝트 루트에 .env 파일을 생성하세요.');
    process.exit(1);
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error('❌ VITE_FIREBASE_PROJECT_ID가 설정되지 않았습니다.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface SchoolEntry {
  name: string;
  level: string;
  region: string;
}

async function main() {
  console.log(`🏫 학교 데이터 Seed 시작 (프로젝트: ${firebaseConfig.projectId})`);

  // Load school data
  const dataPath = resolve(__dirname, 'school-data.json');
  const schools: SchoolEntry[] = JSON.parse(readFileSync(dataPath, 'utf-8'));
  console.log(`📋 ${schools.length}개 학교 데이터 로드됨`);

  // Get existing schools
  const existingSnap = await getDocs(collection(db, 'schools'));
  const existingNames = new Set(existingSnap.docs.map((d) => d.data().name));
  console.log(`📦 기존 학교 ${existingNames.size}개 확인됨`);

  let added = 0;
  let skipped = 0;

  for (const school of schools) {
    if (existingNames.has(school.name)) {
      skipped++;
      continue;
    }

    await addDoc(collection(db, 'schools'), {
      name: school.name,
      level: school.level,
      region: school.region,
    });
    added++;

    if (added % 50 === 0) {
      console.log(`  ✅ ${added}개 추가됨...`);
    }
  }

  console.log(`\n🎉 완료! 추가: ${added}개, 건너뜀(중복): ${skipped}개`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ 에러:', err);
  process.exit(1);
});
