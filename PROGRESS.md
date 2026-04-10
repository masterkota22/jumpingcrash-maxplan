# 점핑크래쉬 v1.0 - 프로젝트 세팅 진행 상황

> 이 파일은 현재까지 완료된 작업을 기록합니다. 작업 완료 후 삭제해도 됩니다.

## 완료된 작업

### 1. Vite + React + TypeScript 초기화
- Vite 8 + React 19 + TypeScript 6 프로젝트 생성 완료
- 불필요한 보일러플레이트(App.css, index.css, assets/) 삭제 완료

### 2. 의존성 설치 완료
- `@mui/material` v9 + `@emotion/react` + `@emotion/styled` + `@mui/icons-material`
- `react-router-dom` v7
- `firebase` v12
- ⚠️ `vite-plugin-pwa`는 Vite 8 미지원으로 설치하지 않음 → PWA 수동 설정

### 3. 설정 파일
- `vite.config.ts` - React 플러그인 + `@/*` → `src/*` path alias
- `tsconfig.app.json` - baseUrl/paths 설정 + ignoreDeprecations
- `.gitignore` - .env, .env.local 추가
- `.env.example` - Firebase 환경변수 템플릿
- `index.html` - lang="ko", Noto Sans KR 폰트, PWA manifest 링크

### 4. 소스 코드 구조
```
src/
├── main.tsx              ✅ ThemeProvider + CssBaseline + SW 등록
├── App.tsx               ✅ BrowserRouter + AppRoutes
├── vite-env.d.ts         ✅
├── theme/index.ts        ✅ MUI 커스텀 테마 (오렌지 #FF5722 + 블루)
├── routes/index.tsx      ✅ 8개 라우트 정의
├── layouts/MainLayout.tsx ✅ AppBar + BottomNavigation 5탭
├── pages/
│   ├── HomePage.tsx           ✅ 스텁
│   ├── MeasurePage.tsx        ✅ 스텁
│   ├── RecordsPage.tsx        ✅ 스텁
│   ├── SchoolRankingPage.tsx  ✅ 스텁
│   ├── RankingPage.tsx        ✅ 스텁
│   ├── CompetitionPage.tsx    ✅ 스텁
│   ├── LoginPage.tsx          ✅ 스텁
│   └── ProfilePage.tsx        ✅ 스텁
├── firebase/config.ts    ✅ initializeApp + getAuth + getFirestore
├── types/index.ts        ✅ User, School, JumpRecord, SchoolRanking 등
└── constants/awards.ts   ✅ 시상 기준표 데이터
```

### 5. PWA
- `public/manifest.json` ✅
- `public/sw.js` ✅ (기본 캐시 전략)
- `public/favicon.svg` ✅
- `public/icons/` - 디렉토리만 생성, PNG 아이콘 미생성

### 6. 빌드 검증
- `tsc -b` ✅ 에러 없음
- `npm run build` ✅ 프로덕션 빌드 성공 (dist에 manifest.json, sw.js 포함)

## 아직 안 된 것
- `public/icons/icon-192x192.png`, `icon-512x512.png` placeholder 이미지 미생성
- `.env` 파일 (실제 Firebase 키 입력 필요)
- 각 페이지의 실제 기능 구현 (현재는 스텁만 존재)
