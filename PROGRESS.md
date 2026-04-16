# 점핑크래쉬 v1.0 - 프로젝트 진행 상황

> 이 파일은 현재까지 완료된 작업을 기록합니다.

## Phase 1: 프로젝트 초기 세팅 (완료)

- Vite 8 + React 19 + TypeScript 6 프로젝트 생성
- MUI v9, react-router-dom v7, Firebase v12 설치
- 커스텀 테마 (오렌지 #FF5722 + 블루)
- Firebase 설정 (Auth + Firestore)
- PWA manifest + Service Worker
- 8개 페이지 스텁 생성

## Phase 2: 페이지 UI 구현 (완료)

- **LoginPage**: 로그인/회원가입 탭 UI, Firebase Auth 연동, 에러 메시지 처리
- **HomePage**: 환영 메시지, Quick Actions (측정/순위/대회), 종목 소개, 최근 기록
- **MeasurePage**: 종목 선택 → 준비 → 측정(탭 카운트) → 결과 다이얼로그, 시상 판정
- **RecordsPage**: 종목별 탭, 최고 기록 카드, 기록 목록 + 시상 메달 표시
- **RankingPage**: 개인 전체 순위, 종목별 탭, 메달 표시
- **SchoolRankingPage**: 학교 대항전 순위, 상위 3명 평균 기록
- **CompetitionPage**: 대회 목록 카드, 참가/순위 보기 버튼
- **ProfilePage**: 기본 정보 + 학교 정보 폼, 로그아웃

## Phase 3: v1.0 기능 구현 (완료)

### ProtectedRoute 컴포넌트
- 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
- 측정, 기록, 프로필 페이지에 적용

### 에러 핸들링 + 로딩 상태
- 모든 페이지에 try/catch + error Alert 추가
- 비동기 데이터 로딩 시 CircularProgress 표시
- HomePage, MeasurePage, RecordsPage, RankingPage, SchoolRankingPage, ProfilePage

### 학교 검색/등록 기능
- ProfilePage에 Autocomplete 기반 학교 검색
- 학교가 목록에 없으면 Dialog로 새 학교 등록 (이름, 학교급, 지역)

### 개인 순위 유저 이름 표시
- RankingPage에서 userId 대신 Firestore에서 유저 이름 조회하여 표시

### 반응형 UI 개선
- MainLayout BottomNav: 좁은 화면에서 라벨 크기 축소, 패딩 조정
- HomePage Quick Actions: flexWrap으로 좁은 화면 대응
- MeasurePage: 측정 카운트 폰트 반응형 (xs: 4rem, sm: 6rem)
- CompetitionPage: 카드 내 Chip/Button flexWrap 처리

### ESLint 에러 수정
- react-hooks/set-state-in-effect: effect 내 동기 setState를 핸들러/useMemo로 리팩터링
- react-hooks/refs: 렌더 중 ref 접근 → state 기반 동기화로 변경
- react-refresh/only-export-components: eslint-disable 주석 추가

## Phase 4: AI 카메라 측정 + 시스템 확장 (완료)

### MediaPipe AI 줄넘기 측정
- `@mediapipe/tasks-vision` 패키지 통합
- **useCamera 훅** (`src/hooks/useCamera.ts`): WebRTC getUserMedia 래핑, 전/후면 카메라 전환, 권한 에러 처리
- **usePoseDetector 훅** (`src/hooks/usePoseDetector.ts`): MediaPipe PoseLandmarker Lite 모델 로딩 (CDN), VIDEO 모드 실시간 감지
- **useJumpCounter 훅** (`src/hooks/useJumpCounter.ts`): 골반/무릎/발목 Y좌표 기반 점프 감지 알고리즘, kneeAngle 정규화, 상태 전환 카운트, 300ms 최소 간격
- **MeasurePage 통합**: AI 카메라 모드 / 수동 카운트 모드 선택, 카메라 미리보기 + 포즈 skeleton 시각화 (canvas 오버레이), 실시간 점프 상태 & 감지 신뢰도 표시

### Firestore 보안 규칙
- `firestore.rules` 생성 (users 본인 쓰기, schools 인증 생성, records 본인 생성, competitions 읽기 전용)

### 대회 시스템 (Firestore 연동)
- `Competition` 타입 추가 (`src/types/index.ts`)
- `getCompetitions()`, `getCompetition()` Firestore 서비스 함수 추가
- CompetitionPage: 하드코딩 → Firestore 실시간 로드, 빈 상태 UI, 대회 상태별 UI 분기

### PWA 아이콘
- `public/icons/icon-192x192.png`, `icon-512x512.png` placeholder 생성

## 빌드/린트 상태
- `npm run build` ✅ 통과
- `npm run lint` ✅ 통과

## 아직 안 된 것
- `.env` 파일 (실제 Firebase 키 입력 필요 - 사용자가 Firebase 프로젝트 생성 후 설정)
- Firestore 보안 규칙 배포 (Firebase CLI로 `firebase deploy --only firestore:rules`)
- 카메라 AI 측정 실기기 튜닝 (점프 감지 임계값 조정, 다양한 환경 테스트 필요)
- 학교 데이터 DB 구축 (전국 학교 목록)
- 사운드 시스템 (카운트 효과음, 타이머 안내음)
- 대회 관리자 기능 (Firebase 콘솔에서만 가능)
