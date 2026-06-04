# 결 모바일 배포 아키텍처 요약 (iOS / Android)

기준일: 2026-06-04

## 1) 배포 아키텍처 개요

`sumgyeol`은 Vite + TanStack Start 웹 앱을 Capacitor(WebView 래퍼)로 감싸서 iOS/Android 네이티브 앱을 빌드합니다.

- 소스 코드: `src/`
- 웹 빌드: `npm run build`
  - 결과물: `dist/client/` (정적 에셋)
  - 웹뷰 시작 파일: `dist/client/index.html`(빌드 후 자동 생성)
- 공통 Native 동기화: `npx cap sync {ios|android}`

## 2) 핵심 배포 경로

### 2.1 공통 배포 파이프라인

1. 코드 반영 확인 (`commit` 기준)
2. 환경변수/설정 확인 (`.env` 또는 CI Secret)
3. 웹 빌드:
   - `npm run build`
4. 플랫폼 동기화:
   - iOS: `npm run cap:build:ios` (`npm run build` + `npx cap sync ios`)
   - Android: `npm run cap:build:android` (`npm run build` + `npx cap sync android`)
5. 네이티브 앱 열기 및 빌드/서명/심사 업로드

## 3) iOS 배포 플로우

1. 최초 1회:
   - `npm run cap:add:ios`
2. 릴리스용 동기화:
   - `npm run release:ios`
   - 내부적으로 `release:preflight` + `cap:build:ios`
3. 네이티브 확인:
   - `npm run cap:open:ios`
   - Xcode에서 Version/Build/권한/팀/서명 확인
4. 업로드:
   - Xcode > Product > Archive
   - Organizer > Distribute App > App Store Connect

### 체크포인트(문제 징후)

- `dist/client/index.html` 부재 시: `npm run build` 재실행
- 카메라/사진 접근 불가: Info.plist 권한 문구/설정 재확인
- 런타임 하얀 화면: 빌드 산출물 경로(`webDir`) 일치 여부 확인

## 4) Android 배포 플로우

1. 최초 1회:
   - `npm run cap:add:android`
2. 릴리스용 동기화:
   - `npm run release:android`
   - 내부적으로 `release:preflight` + `cap:build:android`
3. 네이티브 확인:
   - `npm run cap:open:android`
   - Gradle sync, `versionCode`/`versionName` 확인, 권한(카메라/저장소) 확인
4. 업로드:
   - Android Studio에서 signed AAB 생성
   - Play Console 업로드(내부 테스트 → 공개 트랙)

### 체크포인트(문제 징후)

- `dist/client/index.html` 부재: `npm run build` 재실행
- 서명 키/keystore mismatch: `gradle.properties` 및 `build.gradle` signing 설정 점검
- AAB 빌드 실패: `android/app/build.gradle` 플러그인/버전 호환 확인

## 5) 운영 규칙(추천)

- 운영 빌드는 `release:preflight` 통과 후 진행
- 빌드 번호는 릴리스마다 일괄 증가 (`iOS Build / Android versionCode`)
- 주요 환경변수는 CI Secret 관리 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
- 배포 완료 후 즉시 내부 테스트 트랙 배포 후 실기기 QA

## 6) 관련 문서

- [IOS_BUILD.md](/Users/ys.choi/dev-private/sumgyeol/IOS_BUILD.md)
- [MOBILE_RELEASE_TODO.md](/Users/ys.choi/dev-private/sumgyeol/MOBILE_RELEASE_TODO.md)
- [MOBILE_STORE_SUBMISSION_CHECKLIST.md](/Users/ys.choi/dev-private/sumgyeol/MOBILE_STORE_SUBMISSION_CHECKLIST.md)
