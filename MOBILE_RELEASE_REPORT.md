# 결 모바일 앱 출시 준비 보고서

- 기준일: 2026-06-04
- 저장소: `/Users/ys.choi/dev-private/sumgyeol`
- 대상 앱: `결`
- Bundle ID: `app.gyeol.client`

## 1) 현재 상태
- [x] 배포 전 스크립트/체크리스트 반영 완료
- [x] `npm run release:preflight` 통과 확인
- [ ] iOS 정식 제출 진행 전: App Store Connect 메타 등록/Archive 업로드 필요
- [ ] Android 정식 제출 진행 전: AAB 업로드/스토어 메타 등록 필요

## 2) 실행 완료된 코드 작업
1. `package.json`에 배포/패키징 스크립트 추가
2. `capacitor.config.ts`의 iOS/Android 기본 설정 정비
3. `scripts/release-preflight.mjs` 추가 (필수 항목 자동 검사)
4. `IOS_BUILD.md` 멀티플랫폼 가이드 정비
5. `MOBILE_RELEASE_TODO.md` 및 `MOBILE_STORE_SUBMISSION_CHECKLIST.md` 추가

## 3) 즉시 실행 체크 (원샷)
```bash
cd /Users/ys.choi/dev-private/sumgyeol
npm run release:ios
npm run release:android
```

## 4) 최종 제출 문서
- iOS/Android 체크리스트: [MOBILE_STORE_SUBMISSION_CHECKLIST.md](/Users/ys.choi/dev-private/sumgyeol/MOBILE_STORE_SUBMISSION_CHECKLIST.md)
- 배포 ToDo: [MOBILE_RELEASE_TODO.md](/Users/ys.choi/dev-private/sumgyeol/MOBILE_RELEASE_TODO.md)

## 5) 다음 액션
1. `npm run release:ios`로 아카이브 업로드
2. `npm run release:android`로 AAB 생성 후 Play Console 업로드
3. 제출 템플릿(릴리스 노트/버전/담당자) 작성
4. 심사 피드백 대응 체계 준비
