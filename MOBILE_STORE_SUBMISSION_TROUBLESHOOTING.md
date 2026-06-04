# 결 앱 스토어 제출 트러블슈팅 가이드

## iOS (Xcode / App Store Connect)

### A) Archive 실패 (General)
1. `npm run release:ios` 다시 실행 후 재시도
2. Xcode에서 `Product > Clean Build Folder` 실행
3. iOS 플랫폼 폴더 재동기화
   - `rm -rf ios`
   - `npm run cap:add:ios`
   - `npm run cap:sync:ios`
4. `npm run cap:open:ios` 후 다음 확인
   - Bundle ID = `app.gyeol.client`(혹은 앱 스토어에 등록된 번들ID와 동일)
   - Team / Signing identity 선택 확인
   - Provisioning profile 유효성 확인

### B) "No devices found" / 실행 불가
1. Xcode 메뉴 `Window > Devices and Simulators`에서 시뮬레이터/기기 연결 상태 확인
2. 기기 빌드시 `iOS Deployment Target`이 기기 버전보다 높지 않은지 확인

### C) 업로드 실패 (Distribution)
1. `Product > Archive` 후 Organizer에서 `Distribute App` 실행 중 에러 시
   - `Derived Data` 삭제 후 재실행
   - `rm -rf ~/Library/Developer/Xcode/DerivedData`
2. `App Store Connect` 로그인의 계정 권한/팀 권한 확인
3. `bundle`/`version` 충돌 시 앱버전 업그레이드
   - `Version`/`Build` 증가

### D) 앱이 실행 안 되거나 하얗게 나오는 경우
1. `npm run release:ios` 완료 여부 확인
2. `npm run cap:sync:ios`
3. `npm run build` 후 `dist/client/index.html` 존재 확인
4. `npm run cap:open:ios`에서 로그 확인 (초기 화면/네비게이션 라우트)

### E) 카메라/앨범 권한 이슈
1. `capacitor.config.ts`의 iOS `infoPlist` 문구 확인
2. iOS에서 앱 설정 > Privacy > Camera/Photos 권한 허용
3. `src/lib/native-photo.ts`의 `Capacitor.isNativePlatform()` 분기 정상 동작 확인

### F) TestFlight 관련
1. TestFlight 등록 후 내부 테스트에서 최소 1인 이상 빌드 설치 확인
2. 로그인/알림/카메라 기능 최소 1건 이상 수동 테스트

---

## Android (Android Studio / Play Console)

### A) Signed AAB 빌드 실패
1. `npm run release:android`
2. Android Studio에서 `Sync Project with Gradle Files`
3. `File > Invalidate Caches / Restart` 후 재시도
4. `android/gradle/wrapper/gradle-wrapper.properties`와 Gradle 버전 정합성 확인

### B) 서명(keystore) 실패
1. 서명 정보(`keystore`, `alias`, `password`) 재입력 확인
2. `gradle.properties`/`build.gradle`의 `signingConfigs` 값 확인
3. 이전 릴리스 키와 다른 키 사용 여부 확인(키 회전 규칙 준수)

### C) Play Console 업로드 실패
1. 버전 코드 중복 확인
   - 새로운 릴리스는 `versionCode` 증가 필수
2. 지원되는 ABI/리소스 누락 점검
3. `targetSdkVersion` 정책 준수 확인
4. AAB 업로드 후 앱 서명(Play App Signing) 메시지 확인

### D) 앱 설치 후 즉시 크래시
1. Firebase Crashlytics 또는 logcat 로그 수집
2. `dist` 동기화 확인: `npm run cap:sync:android`
3. 권한이 필요한 기능(카메라/스토리지)에서 런타임 권한 요청 흐름 재검증

### E) 이미지/웹뷰 깨짐, 라우팅 문제
1. `vite build` 산출물 정상 여부 확인
2. `manifest.webmanifest` `start_url`/`scope`와 실제 URL 정합성 점검
3. 네이티브 환경에서 외부 링크 허용 정책 확인

---

## 공통 빠른 복구 순서 (권장)
1. 환경 변수 재확인: `npm run release:preflight`
2. 웹 빌드 재생성: `npm run build`
3. 네이티브 sync:
   - iOS: `npm run cap:sync:ios`
   - Android: `npm run cap:sync:android`
4. 새 릴리스 노트/버전 갱신 후 재업로드
5. 테스트 트랙 1회 재배포 후 정식 트랙 진행
