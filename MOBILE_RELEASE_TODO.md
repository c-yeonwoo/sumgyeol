# 결 — 배포 직전 ToDo (코드 기준)

## 배포 직전까지 진행한 코드 작업

최종 제출 체크리스트: [MOBILE_STORE_SUBMISSION_CHECKLIST.md](/Users/ys.choi/dev-private/sumgyeol/MOBILE_STORE_SUBMISSION_CHECKLIST.md)

1. [x] 모바일 플랫폼 빌드 스크립트 정리
   - `package.json`에 `cap:add`, `cap:sync`, `cap:build`, `release:ios`, `release:android`, `release:preflight` 추가
2. [x] 앱 번들/네이티브 설정 정비
   - `capacitor.config.ts`에 iOS/Android 기본 동작 값과 iOS 권한 문구 반영
3. [x] 배포 전 점검 자동화 스크립트 추가
   - `scripts/release-preflight.mjs` 추가
4. [x] iOS/Android 통합 패키징 가이드 업데이트
   - `IOS_BUILD.md`를 iOS/Android 런칭 가이드로 통합

## 배포 전 최종 검증 ToDo (실행형)

1. [ ] 환경변수 확인
   - `.env` 또는 CI Secret에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 등록
2. [ ] 웹 빌드 검증
   - `npm run build` 실행 후 오류 없음
3. [ ] 프리플라이트 실행
   - `npm run release:preflight`
4. [ ] iOS/Android 플랫폼 추가(최초 1회)
   - `npm run cap:add:ios`
   - `npm run cap:add:android`
5. [ ] iOS 릴리스 동기화
   - `npm run cap:build:ios`
6. [ ] Android 릴리스 동기화
   - `npm run cap:build:android`
7. [ ] 네이티브 권한/앱 정보 최종 점검
   - iOS `Info.plist` 카메라/사진 권한 문구 확인
   - Android `AndroidManifest` 권한 적용 여부 확인
8. [ ] 스토어 제출 전 최종 체크
   - 버전/빌드 번호, 앱명/번들아이디, 스크린샷, 개인정보/이용약관 링크

## 배포 직후 해야 할 일

1. [ ] 앱스토어 빌드 검증
   - TestFlight 내부 테스트 또는 Google Play 내부 테스트 업로드
2. [ ] 실제 기기 QA
   - 로그인, 사진 업로드, 알림, 결제/외부 링크(있는 경우) 동작 체크
3. [ ] 모니터링/크래시 수집
   - Crashlytics, Sentry, 앱스토어 리뷰 대응 룰 생성
4. [ ] 정식 출시
   - iOS: App Store Connect 승인 후 출시
   - Android: 출시 트랙(Public) 배포
