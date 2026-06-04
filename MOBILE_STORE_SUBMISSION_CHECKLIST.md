# 결 모바일 앱 스토어 제출 체크리스트

프로젝트 기준값:
- 앱명: `결`
- iOS Bundle ID: `app.gyeol.client`
- 플랫폼: iOS / Android
- 현재 작업일: 2026-06-04 (Asia/Seoul)

## 0) 제출 전 공통(둘 다)

- [ ] [ ] `npm run release:preflight` 통과
- [ ] [ ] 최신 코드 `npm run build` 반영 후 커밋/푸시
- [ ] [ ] 기능 QA 완료 (로그인/카메라/사진 업로드/에러 메시지)
- [ ] [ ] 앱 버전 정책 정의 (`versionName`/`versionCode`, `CFBundleShortVersionString`/`CFBundleVersion`)
- [ ] [ ] 개인정보처리방침 URL 공개
- [ ] [ ] 서비스 약관/이용약관 최신 반영
- [ ] [ ] 지원 연락처 및 고객지원 채널 등록
- [ ] [ ] 권한 요청 이유 문구가 실제 사용 플로우와 일치 (`camera`, `photo library`)
- [ ] [ ] `.env` 운영값 정합성 확인 (Supabase URL/ANON 키)

---

## 1) iOS (App Store Connect) 제출 체크리스트

### 1-1. 빌드 및 아카이브
- [ ] [ ] iOS 동기화 실행
  - `npm run release:ios`
- [ ] [ ] `npm run cap:open:ios` 후 Xcode 연결 확인
- [ ] [ ] Xcode > Product > Archive 성공
- [ ] [ ] 아카이브에서 코드서명/프로비저닝 정상
- [ ] [ ] Device/Simulator에서 최소 1회 런칭 테스트

### 1-2. App Store Connect 메타/심사
- [ ] [ ] App 이름/번들 ID 일치 (`app.gyeol.client`)
- [ ] [ ] 카테고리/연령등급 설정
- [ ] [ ] 스크린샷 업로드
  - [ ] 4.7인치
  - [ ] 6.5인치
  - [ ] 6.7인치
- [ ] [ ] 앱 설명/키워드/서포트 URL/개인정보처리방침 URL 입력
- [ ] [ ] 데모 계정(필요 시) 준비
- [ ] [ ] App Privacy 정보 입력(필수 데이터/권한 사용)
- [ ] [ ] TestFlight 내부 테스트 업로드 및 기기 검증

### 1-3. 최종 제출
- [ ] [ ] Archive > Distribute App > App Store Connect 업로드
- [ ] [ ] Build -> 검토 전 선택 후 제출
- [ ] [ ] 제출 전 체크리스트 재확인
  - [ ] 로그인 플로우 정상
  - [ ] 카메라/앨범 접근 동작
  - [ ] 사진 업로드 성공
  - [ ] 크래시 재현 케이스 없음
- [ ] [ ] `Submit for Review` 실행

### 1-4. 제출 후 모니터링
- [ ] [ ] iTunes Connect 상태 추적
- [ ] [ ] 심사 코멘트 확인 및 반영 이슈 대응
- [ ] [ ] 승인 후 단계적 배포(선택)

---

## 2) Android (Google Play) 제출 체크리스트

### 2-1. 빌드 및 서명
- [ ] [ ] Android 동기화 실행
  - `npm run release:android`
- [ ] [ ] `npm run cap:open:android`로 Android Studio 오픈
- [ ] [ ] Signed APK/AAB 생성 (`Generate Signed Bundle`)
- [ ] [ ] keystore/서명 키 재확인
- [ ] [ ] `versionCode` 증가
- [ ] [ ] 최소 릴리스 검증(실기기 실행)

### 2-2. Play Console 메타 데이터
- [ ] [ ] 앱 이름/번들 패키지명 확인
- [ ] [ ] 앱 카테고리/대상국가/언어 설정
- [ ] [ ] 스크린샷 업로드
  - [ ] 휴대폰
  - [ ] 태블릿(필요 시)
- [ ] [ ] 아이콘/그래픽(512x512, feature graphic 등)
- [ ] [ ] 설명/릴리스 노트 작성
- [ ] [ ] Data safety 항목 입력
- [ ] [ ] 개인정보처리방침 URL 입력

### 2-3. 테스트 및 정식 배포
- [ ] [ ] 내부 테스트 트랙 업로드 및 QA
- [ ] [ ] 외부 테스트(필요 시) 진행
- [ ] [ ] 버그 수정 후 재업로드
- [ ] [ ] 정식 트랙(Public) 롤아웃 준비
- [ ] [ ] `Production`으로 프로모트

### 2-4. 출시 후 모니터링
- [ ] [ ] 크래시/ANR 지표 확인
- [ ] [ ] 리뷰 모니터링
- [ ] [ ] 긴급 패치 정책 적용 플로우 준비

---

## 3) iOS/Android 공통 제출 템플릿 (복붙용)

- 빌드 버전:
  - Version: `예: 1.0.0`
  - Build/VersionCode: `예: 1`
- 제출일: `YYYY-MM-DD`
- 제출자: `
`
- 릴리스 노트(간단):
  - `주요 변경사항 1`
  - `주요 변경사항 2`

- 테스트 완료 항목:
  - [ ] 로그인
  - [ ] 카메라 촬영/앨범 선택
  - [ ] 이미지 업로드
  - [ ] 에러 처리/재시도

## 4) 문제 발생 시 즉시 참고

트러블슈팅: [MOBILE_STORE_SUBMISSION_TROUBLESHOOTING.md](/Users/ys.choi/dev-private/sumgyeol/MOBILE_STORE_SUBMISSION_TROUBLESHOOTING.md)
