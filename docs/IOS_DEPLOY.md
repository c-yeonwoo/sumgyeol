# iOS 배포 — TestFlight → App Store

> 웹 SSR을 Capacitor 셸이 로드: `server.url = https://floatie.pages.dev`  
> Bundle ID: **`app.floatie.app`** · 표시명: **플로티**

---

## 0. 로컬 준비 (에이전트/개발자)

```bash
npm ci
npm run icons:generate          # assets → public + assets/icon.png
npx capacitor-assets generate --ios   # AppIcon / Splash
npm run release:ios             # preflight + build + cap sync ios
npm run cap:open:ios            # Xcode
```

확인:

| 항목 | 기대값 |
|------|--------|
| Xcode → Target → Bundle Identifier | `app.floatie.app` |
| Display Name | 플로티 |
| `ios/.../capacitor.config.json` → `server.url` | `https://floatie.pages.dev` |
| Signing Team | 본인 Apple Developer Team |

---

## 1. Apple Developer / App Store Connect (당신)

1. [developer.apple.com](https://developer.apple.com) → Identifiers → **App ID** `app.floatie.app`  
   - Capabilities: **Push Notifications** (나중에 켤 거면 지금 예약), Associated Domains(선택)
2. [App Store Connect](https://appstoreconnect.apple.com) → 새 앱  
   - 이름: 플로티 · Bundle ID: `app.floatie.app` · SKU: `floatie-ios`
3. Xcode → Signing & Capabilities  
   - Team 선택 · Automatically manage signing  
   - (+ Capability) **Push Notifications** (TestFlight 전 권장, 필수는 아님)
4. 실기기 또는 Generic iOS Device → **Product → Archive** → Distribute → **TestFlight**

---

## 2. Supabase Auth (인앱 WebView)

Site URL / Redirect에 이미 `https://floatie.pages.dev` 있으면 기본 로그인 OK.  
추가로 넣으면 좋은 것:

- `capacitor://localhost` (로컬 번들 모드 쓸 때)
- 커스텀 스킴 쓰면 `app.floatie.app://**` (Universal/URL open)

---

## 3. App Store Connect 메타 (제출 시)

카피 SSOT: [`store/APP_STORE_COPY.md`](./store/APP_STORE_COPY.md)

| 필드 | 값 |
|------|-----|
| 카테고리 | Social Networking |
| 연령 | **17+** (채팅·만남 성격) |
| 암호화 | ITSAppUsesNonExemptEncryption = NO (수출 질문: 없음) |
| 개인정보 | 이메일·사진·대략 위치(지역) · 채팅 내용 — Privacy Nutrition Labels 작성 |
| 리뷰 계정 | 여/남 QA + `dev_otp` 안내를 Notes에 |

필수 스크린샷: 6.7" / 6.5" 등 (Sea · 답장 · unlock · 채팅)

---

## 4. 리뷰 리스크 (알아둘 것)

| 이슈 | 대응 |
|------|------|
| **4.2** 웹뷰만 | 카메라·햅틱·(푸시) 네이티브 플러그인 유지 · 심사 Notes에 “네이티브 카메라/알림” 명시 |
| **1.2** UGC | 신고·차단·탈퇴 경로 스크린샷/Notes |
| **5.1.1** 계정삭제 | `/me` 탈퇴 있음 — Notes에 경로 적기 |

---

## 5. 출시 직전 스모크 (실기기)

1. 콜드 스타트 → 로그인  
2. 여: 플로티 띄우기  
3. 남: 발견 · 카메라 답장(권한)  
4. unlock → 매칭 → 메시지  
5. 신고 / 탈퇴 진입만 확인  

---

## Android

이 문서 다음 라운드. `app.floatie.app` 패키지 동일 계열로 맞출 예정.
