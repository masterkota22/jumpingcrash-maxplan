  
**JUMPING CLASH**

**점핑클래쉬**

AI 줄넘기 웹앱 개발 로드맵 / 기획서

한국생활체육 줄넘기협회 (KLRA)

k-rope.web.app  |  React \+ Firebase 플랫폼

버전 1.0  |  2026년 4월

*CONFIDENTIAL*

# **프로젝트 개요**

## **1.1 프로젝트 배경**

점핑클래쉬(Jumping Clash)는 AI 포즈 감지 기술을 활용한 웹 기반 줄넘기 훈련 및 온라인 대회 플랫폼입니다. Google MediaPipe Pose Landmarker를 활용하여 스마트폰/PC 카메라로 실시간 줄넘기 동작을 감지하고 카운트합니다.

기존 구글 플레이스토어 앱 '줄넘기 카운터 AI (FormMarker\_Dev)'의 핵심 기술을 분석하여, 웹 환경에서 동일한 기능을 구현하되 한국생활체육 줄넘기협회(KLRA)의 온라인 대회 시스템과 통합합니다.

## **1.2 핵심 목표**

| 목표 | 설명 |
| ----- | ----- |
| 실시간 AI 줄넘기 카운터 | MediaPipe Pose Landmarker로 33개 포즈 포인트 감지, 점프 동작 자동 카운트 |
| 온라인 대회 통합 | k-rope.web.app 협회 사이트와 통합하여 대회 운영 지원 |
| 모바일 퍼스트 | 스마트폰 카메라로 즉시 참여 가능한 모바일 최적화 UX |
| 리더보드 & 경쟁 | 리얼타임 순위 시스템으로 참가자 동기부여 |

## **1.3 개발 환경 (기존 PHP → 새 환경)**

기존 k-rope.com은 카페 24 호스팅 \+ 그누보드 \+ 영카트 환경이지만, 새로운 협회 사이트(k-rope.web.app)와 동일한 환경으로 개발합니다.

| 구분 | 기존 (k-rope.com) | 새 환경 (k-rope.web.app) |
| ----- | ----- | ----- |
| 프론트엔드 | PHP \+ jQuery | React \+ TypeScript |
| 빌드 도구 | 없음 | Vite |
| UI 프레임워크 | 커스텀 CSS | MUI (Material UI) |
| 백엔드 | MySQL \+ PHP | Firebase (Auth, Firestore, Storage, Hosting) |
| 배포 | Cafe24 FTP | GitHub \+ Firebase Hosting |
| AI/ML | 없음 | MediaPipe Tasks Vision (WebAssembly) |
| 도메인 | k-rope.com | k-rope.web.app (쯤슠 도메인 씨울 예정) |

## **1.4 원본 앱 분석 요약**

구글 플레이스토어 '줄넘기 카운터 AI (FormMarker\_Dev)' v2.60 분석 결과:

| 항목 | 원본 앱 (Android) | 점핑클래쉬 (Web) |
| ----- | ----- | ----- |
| 개발 언어 | Kotlin 2.2.10 | TypeScript |
| UI | Jetpack Compose \+ Material 3 | React \+ MUI |
| AI 엔진 | MediaPipe Tasks Vision JNI (9.9MB) | MediaPipe Tasks Vision JS (CDN) |
| 포즈 모델 | Lite 5.5MB / Full 9.4MB (.task) | Lite 5.5MB / Full 9.4MB (CDN \+ IndexedDB 캐시) |
| 카메라 | CameraX 1.5.1 | WebRTC getUserMedia |
| 인증 | Firebase Auth \+ Google Sign-In | Firebase Auth (Google, 이메일) |
| 데이터 저장 | Room DB (SQLite) | Firestore |
| 결제 | Google Play Billing 7.1.1 | 향후 확장 |
| 광고 | AdMob 23.6.0 | 향후 확장 |

# **기술 아키텍처**

## **2.1 시스템 구성도**

점핑클래쉬는 완전한 프론트엔드 중심 아키텍처로, AI 포즈 감지는 브라우저에서 처리하고 결과만 Firebase에 저장합니다.

| 레이어 | 기술 스택 | 역할 |
| ----- | ----- | ----- |
| 프론트엔드 | React 18 \+ TypeScript \+ Vite | 앱 UI, 상태 관리, 라우팅 |
| UI 컴포넌트 | MUI (Material UI) v5+ | 디자인 시스템, 반응형 레이아웃 |
| AI 포즈 감지 | MediaPipe Tasks Vision (WASM) | 33개 포즈 포인트 실시간 감지 |
| 카메라 | WebRTC getUserMedia | 전면/후면 카메라 접근 |
| 인증 | Firebase Authentication | Google, 이메일 로그인 |
| 데이터베이스 | Cloud Firestore | 훈련 기록, 리더보드, 사용자 설정 |
| 파일 저장 | Firebase Storage | 프로필 이미지, 대회 컴텐츠 |
| 호스팅 | Firebase Hosting | SPA 배포, HTTPS 자동, CDN |
| 버전 관리 | GitHub | 코드 관리, CI/CD |
| 모델 캐싱 | IndexedDB | MediaPipe 모델 로컬 캐싱 (\<100ms 로딩) |

## **2.2 프로젝트 폴더 구조**

jumping-clash/ 프로젝트 루트 구조:

| 경로 | 주요 파일 | 설명 |
| ----- | ----- | ----- |
| src/ |  | 소스 코드 루트 |
|   components/ |  | React 컴포넌트 |
|     camera/ | CameraView.tsx, CameraOverlay.tsx | 카메라 UI |
|     pose/ | PoseCanvas.tsx, SkeletonRenderer.tsx | 포즈 시각화 |
|     training/ | TrainingScreen.tsx, Timer.tsx, Counter.tsx | 훈련 화면 |
|     competition/ | CompetitionLobby.tsx, LiveMatch.tsx | 대회 모드 |
|     leaderboard/ | Leaderboard.tsx, RankCard.tsx | 순위표 |
|     common/ | Layout.tsx, Navbar.tsx, LoadingScreen.tsx | 공통 UI |
|   hooks/ | useCamera.ts, usePoseDetection.ts, useJumpCounter.ts | 커스텀 훅 |
|   services/ |  | 비즈니스 로직 |
|     firebase/ | auth.ts, firestore.ts, storage.ts | Firebase 연동 |
|     mediapipe/ | PoseDetector.ts, ModelLoader.ts, JumpAnalyzer.ts | AI 포즈 감지 |
|   types/ | pose.ts, training.ts, competition.ts, user.ts | TypeScript 타입 정의 |
|   utils/ | math.ts, audio.ts, timer.ts | 유틸리티 |
|   pages/ | Home.tsx, Training.tsx, Competition.tsx, Profile.tsx | 페이지 컴포넌트 |
|   App.tsx |  | 앱 진입점 |
|   main.tsx |  | Vite 엔트리포인트 |
| public/ | models/, audio/, icons/ | 정적 애셋 |
| firebase.json |  | Firebase 설정 |
| vite.config.ts |  | Vite 설정 |
| tsconfig.json |  | TypeScript 설정 |

## **2.3 데이터 모델 (Firestore 컬렉션)**

Firebase Firestore의 NoSQL 구조로 설계합니다. 기존 분석자료의 MySQL 테이블 6개를 Firestore 컬렉션으로 변환합니다.

| Firestore 컬렉션 | 문서 구조 | 설명 |
| ----- | ----- | ----- |
| users/{uid} | displayName, email, photoURL, level, totalJumps, totalScore, settings{} | 사용자 프로필 \+ 설정 |
| trainings/{id} | uid, type, duration, jumpCount, successCount, failCount, score, calories, startedAt, endedAt, deviceInfo | 훈련 기록 |
| leaderboard/{period}\_{uid} | uid, displayName, score, totalJumps, totalTime, rank, period(daily/weekly/monthly/all) | 리더보드 |
| competitions/{id} | title, status, startAt, endAt, rules{}, participants\[\], createdBy | 대회 정보 |
| competitions/{id}/entries/{uid} | uid, jumpCount, score, videoUrl, submittedAt, verified | 대회 참가 기록 |
| appConfig/{key} | 전역 설정값 | 앱 설정 |

# **핵심 기능 설계**

## **3.1 AI 줄넘기 감지 알고리즘**

원본 앱의 핵심 로직을 분석한 결과, 점프 감지는 다음 방식으로 작동합니다:

| 단계 | 로직 | 세부사항 |
| ----- | ----- | ----- |
| 1\. 포즈 감지 | MediaPipe PoseLandmarker로 매 프레임 33개 포인트 추출 | Lite 모델 기본, 30 FPS 처리 |
| 2\. 관절 추출 | 골반(23,24), 무릎(25,26), 발목(27,28) Y좌표 추출 | 좌우 평균값 사용 |
| 3\. 무릎 각도 계산 | kneeAngle \= hipKneeDistance / totalLegLength | 다리 길이 대비 비율로 정규화 |
| 4\. 상태 판별 | kneeAngle \< 0.3 → jumping / \< 0.45 → squatting / else → standing | 임계값 조정 가능 (설정) |
| 5\. 카운트 | jumping → standing 전환 시 1회 카운트 | 최소 간격 300ms (minJumpInterval) |
| 6\. 점수 계산 | base \= 성공 × 10, 성공률 80%이상 시 보너스 × 5 | 리더보드 반영 |

## **3.2 카메라 모듈 (WebRTC)**

| 기능 | 구현 방법 | 비고 |
| ----- | ----- | ----- |
| 카메라 시작 | navigator.mediaDevices.getUserMedia() | HTTPS 필수 |
| 전/후면 전환 | facingMode: 'user' / 'environment' | 모바일 지원 |
| 해상도 | 640×480 기본 (조정 가능) | 성능/품질 밸런스 |
| 거울 효과 | CSS transform: scaleX(-1) | 전면 카메라 시 |
| 프레임 루프 | requestAnimationFrame 기반 | 30 FPS 제한 권장 |

## **3.3 모델 로딩 및 캐싱**

| 항목 | Lite 모델 | Full 모델 |
| ----- | ----- | ----- |
| 파일 크기 | 5.5 MB | 9.4 MB |
| 용도 | 모바일 / 저사양 기기 | 데스크톱 / 고정밀도 필요 시 |
| CDN 주소 | storage.googleapis.com/mediapipe-models/.../lite | storage.googleapis.com/mediapipe-models/.../full |
| 캐싱 | IndexedDB에 저장 (2회차부터 \<100ms) | IndexedDB에 저장 |
| 첫 로드 | 5\~15초 (네트워크에 따라) | 10\~25초 |

## **3.4 훈련 모드**

| 모드 | 설명 | 타이머 옵션 |
| ----- | ----- | ----- |
| 자유 모드 (Free) | 시간 제한 없이 연습 | 수동 정지 |
| 타이머 모드 (Timed) | 설정된 시간 동안 운동 | 30초, 60초, 90초, 120초, 180초 |
| 목표 모드 (Count) | 목표 횟수 달성 시 종료 | 50회, 100회, 200회, 500회 |
| 대회 모드 (Competition) | 대회 규칙에 따른 공식 모드 | 대회별 설정 |

## **3.5 사운드 시스템**

원본 앱의 20개 오디오 파일을 Web Audio API로 구현합니다.

| 사운드 종류 | 파일 | 용도 |
| ----- | ----- | ----- |
| 효과음 | beep.mp3, detect.mp3, start.wav | 카운트 감지음, 시작음 |
| 타이머 안내 | time\_10s \~ time\_2min.mp3 | 남은 시간 음성 안내 |
| 배경음악 | jr\_bj\_10/15/30\_ready.mp3 | 10분/15분/30분 모드 배경음 |
| 사운드 이펙트 | jr\_se\_60/90/120/180\_ready.mp3 | 시간별 효과음 |
| 카운트다운 | jr\_ss\_10/15/30\_ready.mp3 | 시작 카운트다운 |

# **화면 구성 및 UX 플로우**

## **4.1 화면 목록**

| 화면 | 경로 | 주요 기능 |
| ----- | ----- | ----- |
| 홈 | / | 앱 소개, 빠른 시작 버튼, 최근 기록 |
| 훈련 | /training | 카메라 \+ AI 감지 \+ 타이머 \+ 카운터 |
| 훈련 결과 | /training/result | 횟수, 시간, 칼로리, 점수, 순위 |
| 기록 | /history | 훈련 기록 목록, 차트 통계 |
| 리더보드 | /leaderboard | 일간/주간/월간/전체 순위 |
| 대회 | /competition | 대회 목록, 참가, 결과 |
| 대회 라이브 | /competition/:id/live | 실시간 대회 참여 화면 |
| 프로필 | /profile | 사용자 정보, 설정 |
| 로그인 | /login | Firebase Auth 로그인 |

## **4.2 훈련 화면 UX 플로우**

핵심 훈련 화면의 사용자 흐름:

| 단계 | 화면 상태 | 사용자 액션 |
| ----- | ----- | ----- |
| 1\. 진입 | 모드 선택 \+ 타이머 설정 | 모드/시간 선택 후 '시작' 탭 |
| 2\. 카메라 초기화 | 카메라 권한 요청 \+ 모델 로딩 프로그레스 바 | 카메라 허용 탭 |
| 3\. 준비 | 카메라 프리뷰 \+ 포즈 감지 확인 \+ 3초 카운트다운 | 자세 잡고 대기 |
| 4\. 훈련 중 | 실시간 스켈레톤 \+ 카운터 \+ 타이머 | 줄넘기 동작 수행 |
| 5\. 종료 | 결과 모달: 횟수, 시간, 칼로리, 점수 | 결과 확인, 공유, 다시하기 |

# **개발 로드맵**

총 5단계, 예상 기간 8\~10주로 계획합니다. 각 단계는 독립적으로 배포/테스트 가능하도록 설계합니다.

| Phase 1  프로젝트 기반 구축 (1\~2주차) |  |  |
| ----- | ----- | ----- |
| **작업** | **세부 내용** | **산출물** |
| 프로젝트 세팅 | Vite \+ React \+ TS 초기화, MUI 설정, ESLint/Prettier | jumping-clash 프로젝트 스캐폴딩 |
| Firebase 연동 | Firebase 프로젝트 생성, Auth/Firestore/Hosting 설정 | firebase.json, 환경변수 |
| 인증 구현 | Firebase Auth (Google 로그인), 보호 라우트 | 로그인/로그아웃 흐름 |
| GitHub 세팅 | Repository 생성, Branch 전략 (main/dev/feature) | CI/CD 기본 파이프라인 |
| 기본 라우팅 | React Router 설정, 페이지 스켈레톤 | 모든 화면 네비게이션 |

| Phase 2  AI 포즈 감지 핵심 개발 (3\~4주차) |  |  |
| ----- | ----- | ----- |
| **작업** | **세부 내용** | **산출물** |
| MediaPipe 연동 | MediaPipe Tasks Vision JS 통합, 모델 로더 구현 | PoseDetector.ts 서비스 |
| 카메라 모듈 | useCamera 훅, 전/후면 전환, 권한 처리 | CameraView 컴포넌트 |
| 점프 감지 | JumpAnalyzer 구현: 무릎 각도 계산, 상태 전환, 카운트 | useJumpCounter 훅 |
| 스켈레톤 렌더링 | 캔버스 오버레이에 33개 포인트 \+ 연결선 시각화 | PoseCanvas 컴포넌트 |
| IndexedDB 캐싱 | 모델 파일 로컬 캐싱 구현 | ModelLoader.ts (캐시 후 \<100ms 로딩) |

| Phase 3  훈련 시스템 완성 (5\~6주차) |  |  |
| ----- | ----- | ----- |
| **작업** | **세부 내용** | **산출물** |
| 훈련 UI | 훈련 화면 전체: 모드 선택, 타이머, 카운터, 결과 | TrainingScreen 컴포넌트 |
| 타이머 시스템 | 카운트다운, 경고음, 자동 종료 | Timer 컴포넌트 |
| 사운드 | Web Audio API로 20개 오디오 파일 재생 | AudioManager 서비스 |
| 결과 저장 | Firestore에 훈련 기록 저장 | 훈련 CRUD API |
| 결과 화면 | 횟수, 시간, 칼로리, 점수, 공유 기능 | ResultScreen 컴포넌트 |

| Phase 4  대회 & 리더보드 (7\~8주차) |  |  |
| ----- | ----- | ----- |
| **작업** | **세부 내용** | **산출물** |
| 리더보드 | 일/주/월/전체 순위, 실시간 갱신 | Leaderboard 페이지 |
| 훈련 기록 | 개인 훈련 이력, 차트/그래프 통계 | History \+ Statistics 페이지 |
| 대회 시스템 | 대회 생성/참가/기록 제출/결과 확인 | Competition 페이지 |
| 관리자 기능 | 대회 관리, 참가자 관리, 결과 검증 | Admin 페이지 |
| k-rope.web.app 통합 | 협회 사이트와 네비게이션/인증 통합 | 통합 라우팅 |

| Phase 5  테스트 & 배포 (9\~10주차) |  |  |
| ----- | ----- | ----- |
| **작업** | **세부 내용** | **산출물** |
| 모바일 최적화 | PWA 설정, 터치 제스처, 반응형 레이아웃 | PWA manifest \+ 반응형 UI |
| 성능 최적화 | 코드 스플리팅, 레이지 로딩, 메모리 관리 | 빌드 최적화 |
| 크로스 브라우저 테스트 | Chrome, Safari, Firefox, Edge 테스트 | 테스트 보고서 |
| Firebase Hosting 배포 | GitHub Actions CI/CD, 쯤스 도메인 연결 | 프로덕션 배포 |
| 베타 테스트 | KLRA 회원 대상 베타 운영 | 피드백 반영 |

# **온라인 대회 통합 설계**

## **6.1 대회 운영 플로우**

KLRA 온라인 줄넘기 대회(4월 18일 본대회, 5월 5일 어린이날 이벤트)와 연동합니다.

| 단계 | 참가자 | 관리자 |
| ----- | ----- | ----- |
| 대회 공고 | 대회 목록에서 확인 및 참가 신청 | 대회 생성 (제목, 규칙, 기간) |
| 예선 | AI 카운터로 예선 기록 제출 | 예선 결과 모니터링 |
| 본선 | 지정 시간에 라이브 참여 | 실시간 모니터링, 부정 감지 |
| 결과 발표 | 순위 확인, 인증서 다운로드 | 결과 검증 및 확정 |

## **6.2 부정행위 방지**

| 방식 | 설명 |
| ----- | ----- |
| AI 신뢰도 검증 | 포즈 감지 신뢰도(poseScore)  일정 수준 미달 시 경고 |
| 비디오 녕화 (향후) | 훈련 영상 녹화 후 관리자 검토 가능 |
| 비정상 패턴 감지 | 비정상적으로 높은 횟수/속도 감지 시 플래그 |
| 기기 검증 | User Agent \+ 화면 정보로 중복 참가 방지 |

# **기술적 제약 및 고려사항**

| 항목 | 제약사항 | 대응 방안 |
| ----- | ----- | ----- |
| HTTPS 필수 | getUserMedia API는 HTTPS에서만 작동 | Firebase Hosting 자동 SSL |
| 브라우저 호환 | Safari의 MediaPipe WASM 성능 제한 | Chrome/Edge 권장, Safari 펴백 UI |
| 모바일 성능 | 저사양 모바일에서 FPS 저하 가능 | Lite 모델 기본, FPS 자동 조절 |
| 모델 크기 | Lite 5.5MB 첫 로드 시 다운로드 필요 | IndexedDB 캐싱, 프로그레스 바 표시 |
| 메모리 | MediaPipe \+ 카메라로 최소 200MB RAM 필요 | 미사용 시 dispose(), 메모리 모니터링 |
| 카메라 권한 | 사용자 거부 시 핵심 기능 불가 | 우아한 권한 요청 UX, 실패 시 가이드 |

# **마일스톤 및 일정**

| 마일스톤 | 예상 완료 | 주요 성과 |
| ----- | ----- | ----- |
| **M1: 프로젝트 기반** | 2주차 말 | React+Firebase 프로젝트, 인증, 라우팅 완료 |
| **M2: AI 포즈 감지 동작** | 4주차 말 | 카메라 \+ MediaPipe \+ 점프 감지 작동 확인 |
| **M3: 훈련 시스템 완성** | 6주차 말 | 전체 훈련 플로우 \+ 기록 저장 \+ 결과 화면 |
| **M4: 대회 시스템** | 8주차 말 | 대회 \+ 리더보드 \+ k-rope.web.app 통합 |
| **M5: 프로덕션 배포** | 10주차 말 | Firebase Hosting 배포, 베타 테스트 완료 |

# **향후 확장 계획**

| 확장 기능 | 설명 | 우선순위 |
| ----- | ----- | ----- |
| 이중 줄넘기 감지 | Double Under 등 고급 기술 감지 | 높음 |
| 음악 연동 훈련 | BPM에 맞춰 줄넘기 리듬 훈련 | 중간 |
| 컨텐츠 녹화 | 훈련 영상 녹화 및 SNS 공유 | 중간 |
| 단체 대회 | 학교/팀 단위 대회 운영 | 높음 |
| 칼로리 추적 | 체중 입력 \+ 정밀 칼로리 계산 | 낮음 |
| PWA 오프라인 | 오프라인 상태에서 기본 훈련 가능 | 중간 |
| TaePlay 통합 | 태플 플랫폼과 통합 (AllPlay 비전) | 장기 |

# **요약**

점핑클래쉬(Jumping Clash)는 기존 Android 네이티브 앱의 MediaPipe AI 포즈 감지 기술을 React \+ Firebase 웹 환경으로 전환하여, KLRA 협회 사이트(k-rope.web.app)와 통합된 온라인 줄넘기 대회 플랫폼을 구축합니다.

**개발 환경:** React \+ Vite \+ TypeScript \+ MUI \+ Firebase \+ GitHub

**AI 엔진:** MediaPipe Tasks Vision (33개 포즈 포인트, 무릎 각도 기반 점프 감지)

**예상 기간:** 8\~10주 (5단계 점진적 개발)

**통합 목표:** k-rope.web.app 협회 사이트와 인증/네비게이션 통합, 온라인 대회 운영