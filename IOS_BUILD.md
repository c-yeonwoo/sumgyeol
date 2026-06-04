# 결 모바일 패키징 & 출시 가이드 (iOS + Android)

현재 레포는 Vite + TanStack Start + Capacitor 기반 앱(WebView 포장형)입니다.
이번 가이드는 **iOS/Android 두 플랫폼 동시 출시** 기준으로 정리했습니다.

> 참고: 실제 스토어 배포(심사 제출)는 macOS + Xcode + Apple 계정, Android Studio + Google Play Console 계정이 필요합니다.

---

## 0) 현재 상태 점검

- `npm run build`로 정적 웹 번들(`dist/client/`) 생성
- `dist/client/index.html` 기준으로 Capacitor 웹뷰에 로드
- 프로젝트는 이미 `@capacitor/camera` 사용 시 네이티브 경로 분기(`src/lib/native-photo.ts`)가 반영됨
- 앱 ID: `app.gyeol.client`
- 앱명: `결`

### 환경변수 예시

```bash
cp .env.example .env.local
```

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `.env.local`은 로컬에서만 사용하고, 릴리스 빌드는 CI Secret 또는 `.env.production`로 분리하세요.

---

## 1) 패키징 사전 준비

- Node.js 20+ 또는 Bun(선택)
- Apple Developer Program (iOS 빌드/업로드용)
- Google Play Developer 계정 (Android 배포용)
- macOS + Xcode (iOS), Android Studio (Android)
- CocoaPods 설치 (iOS): `sudo gem install cocoapods`

```bash
cd /path/to/sumgyeol
npm install
```

---

## 2) 공통 스크립트(추가됨)

`package.json`에 다음 스크립트를 추가했습니다.

- `npm run cap:add:ios`
- `npm run cap:add:android`
- `npm run cap:sync`
- `npm run cap:sync:ios`
- `npm run cap:sync:android`
- `npm run cap:build:ios`
- `npm run cap:build:android`
- `npm run cap:open:ios`
- `npm run cap:open:android`

```bash
npm run build              # 웹 빌드
npm run cap:sync:ios        # iOS 네이티브 프로젝트 동기화
npm run cap:sync:android    # Android 네이티브 프로젝트 동기화
npm run cap:build:ios       # 빌드 + iOS sync
npm run cap:build:android   # 빌드 + Android sync
npm run release:ios         # 릴리스 전 점검 + iOS sync
npm run release:android    # 릴리스 전 점검 + Android sync
```

---

## 3) iOS 최초 플랫폼 생성

```bash
npm run build
npm run cap:add:ios
npm run cap:sync:ios
npm run cap:open:ios
```

### 확인 체크포인트

- `ios/App/App/Info.plist`에 카메라/앨범 권한 문자열이 반영되어 있는지 확인
- Bundle ID: `app.gyeol.client` (필요 시 변경)
- 팀/서명(Team) 설정 및 디바이스 프로비저닝

---

## 4) Android 최초 플랫폼 생성

```bash
npm run build
npm run cap:add:android
npm run cap:sync:android
npm run cap:open:android
```

### 확인 체크포인트

- `android/app/src/main/AndroidManifest.xml`에 카메라/미디어 권한 반영
- 앱 아이콘/스플래시 미리보기(필요 시 앱 아이콘 스펙 검토)
- Gradle 동기화 완료

---

## 5) 앱 스토어 등록 공통 준비

- 버전/빌드 번호 관리
  - iOS: Xcode 타겟에서 `Version` / `Build`
  - Android: `versionCode` / `versionName`
- 권한 안내문 명확성
  - `camera`, `photo library` 용도 문구 정확성
- 스크린샷 규격
  - iOS: 4.7/6.5/6.7 인치
  - Android: 권장 기본 및 태블릿(필요 시)
- 개인정보/콘텐츠 가이드 문구 정합성(회원약관, 이용약관, 개인정보처리방침)

---

## 6) 출시 파이프라인(권장)

- 기능 개발 → `npm run build` → 해당 플랫폼 `cap:build`로 sync → 네이티브 앱 실행 테스트 → 버그 수정
- 릴리스 브랜치 분기
- 앱스토어/플레이스토어 업로드용 빌드 아카이브 생성

### iOS 제출

1. Xcode > Product > Archive
2. Organizer > Distribute App > App Store Connect > Upload
3. App Store Connect에서 메타/스크린샷/심사 항목 등록

### Android 제출

1. Android Studio 또는 Gradle로 signed AAB 생성
2. Play Console의 테스트 트랙(내부 테스트/폐쇄 테스트) 업로드
3. 심사 제출

---

## 7) 릴리스 트러블슈팅

- 화면 하얗게 보임
- `npm run build` 후 `dist/client/index.html` 존재 확인
  - `npm run cap:sync:{ios|android}` 재실행
- 카메라 동작 안 됨
  - iOS Info.plist 권한, Android 권한 상태 확인
  - 웹/네이티브 경로 분기(`src/lib/native-photo.ts`) 정상 동작 확인
- 인증 콜백/딥링크 실패
  - 웹 URL과 앱 URL 핸들링 정책(`Capacitor` 앱 scheme) 정합성 점검

---

## 8) 남은 작업(계속 체크)

- 실제 앱스토어 계정 정보(apple.teamId, 패키지명, 서명키) 반영
- 스플래시/앱 아이콘 규격 최적화
- Play Store / App Store 정책 문구 점검
- 크래시 로깅(선택): Sentry, Firebase Crashlytics 연동

## 9) 배포 아키텍처 설계 문서(요약본)

- iOS/Android 배포 흐름을 한 번에 확인하려면 아래 설계 문서를 참고하세요.
  - [MOBILE_DEPLOYMENT_ARCHITECTURE.md](/Users/ys.choi/dev-private/sumgyeol/MOBILE_DEPLOYMENT_ARCHITECTURE.md)
