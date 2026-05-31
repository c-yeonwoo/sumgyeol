# 결(gyeol) MVP 빌드 계획

매일 던져지는 가벼운 질문에 사진 한 장 + 한 줄 반말 캡션으로 답하고, 답이 쌓이면 AI가 "너는 이런 결의 사람이야"를 읽어주는 chill한 기록형 SNS.

---

## 1. 디자인 시스템

**무드**: Serene gallery — 따뜻한 베이지 페이퍼 톤, Nanum Myeongjo 세리프 + Inter sans, 사진이 주인공인 정적인 갤러리 감각. 모바일 우선(`max-w-md` 중앙 정렬).

`src/styles.css`에 토큰 정의:
- `--background` (#F9F8F6 페이퍼 베이지)
- `--surface` (#FFFFFF)
- `--foreground` (#2D2926 잉크)
- `--muted-foreground` (#8C8885)
- `--accent` (#8C927D 세이지)
- Nanum Myeongjo (제목/질문), Inter (본문/UI)

모든 컴포넌트는 시맨틱 토큰만 사용, 하드코딩 색상 금지.

---

## 2. 백엔드 (Lovable Cloud)

Lovable Cloud를 활성화하고 다음을 셋업:

**Auth**: Email/Password + Google 소셜 로그인.

**Storage**: `answers` 버킷 (비공개). 사진 ≤5MB, jpg/png/webp. 본인만 업로드, 공개 답변은 사이닝 URL 또는 public 버킷 + RLS로 노출 제어.

**DB 스키마** (PRD 그대로):
- `profiles` (id, handle, display_name, avatar_url, bio)
- `questions` (text, category, tone, answer_style, season, source, is_active, sort_order) — 시드 40개 인서트
- `daily_questions` (date PK, question_id) — 운영자 수동 또는 날짜 모듈로 순환
- `answers` (user_id, question_id, photo_url, caption, visibility, unique(user_id, question_id))
- `persona_reads` (user_id, summary, keywords, based_on_count, generated_at)

**RLS 핵심**:
- `answers`: 본인 SELECT/INSERT/UPDATE/DELETE 전부, 타인은 `visibility='public'`만 SELECT.
- `persona_reads`: 본인만 SELECT/INSERT.
- `profiles`: 본인 UPDATE, 모두 SELECT(공개 답변에 핸들 노출용).
- `questions`, `daily_questions`: 누구나 SELECT.

신규 가입 시 트리거로 `profiles` 자동 생성.

기본 공개범위는 `public`(사용자 확정 — 그리드 콜드스타트 회피).

---

## 3. AI 성향 리드백

Lovable AI Gateway(`google/gemini-3-flash-preview`)를 TanStack server function에서 호출. `LOVABLE_API_KEY`는 서버에서만.

- Input: 사용자 답변(질문 text + 캡션) N개를 텍스트로 묶음.
- Output: zod 스키마로 `{ summary: string(3~4문장), keywords: string[] }` 구조화 출력.
- 톤 가이드: 따뜻한 해석체, 단정/평가 금지, "이런 결이 느껴져" 어조.
- 캐싱: `persona_reads`에 저장, 답변 수가 마지막 생성 시점 +5 이상 늘었을 때만 재생성 버튼 활성화.

---

## 4. 라우트 구성 (TanStack Start)

```
src/routes/
├── __root.tsx              (전역 레이아웃, QueryClient, auth 리스너)
├── index.tsx               (랜딩 → 미인증이면 /login, 인증이면 /home)
├── login.tsx               (이메일/비번 + Google)
├── _authenticated.tsx      (인증 가드 레이아웃)
├── _authenticated.onboarding.tsx  (질문 5~10개 연타 답변)
├── _authenticated.home.tsx        (오늘의 질문 + 답변 CTA)
├── _authenticated.grid.tsx        (오늘의 그리드)
├── _authenticated.me.tsx          (내 결 + AI 리드백)
├── _authenticated.backlog.tsx     (미답변 질문 목록)
├── _authenticated.answer.$questionId.tsx  (답변 작성)
└── _authenticated.answer-detail.$answerId.tsx  (답변 상세)
```

하단 탭바는 `_authenticated.tsx` 레이아웃에서 렌더 (홈/탐색/나).

---

## 5. 핵심 플로우 & 화면

**가입 → 온보딩**: 백로그에서 5개 질문 카드를 스와이프/연타. 사진 업로드(카메라롤) + 캡션 ≤60자. 3개 이상 답하면 "내 결 보기" 활성화.

**홈**: 오늘의 질문 카드(세리프 큰 타이포), 내가 답했으면 내 사진 미리보기, 안 했으면 "사진으로 답하기" CTA. 스킵 1회 허용.

**오늘의 그리드**: 같은 질문에 대한 public 답변을 2열 그리드, 핸들 + 캡션. 최신순.

**내 결**: 프로필 헤더 + 3열 정사각 그리드. 상단에 AI 리드백 카드(생성 전이면 "X개 답하면 너의 결을 읽어줄게", 생성 후엔 요약 + 키워드 태그 + 재생성 버튼).

**답변 작성**: 질문 헤더 + 사진 업로드 + 캡션 입력 + 공개범위 토글(기본 공개) + 제출.

---

## 6. 기술 디테일 / 보안

- 모든 폼 입력 zod 검증(캡션 ≤60자, 파일 타입/크기).
- 사진 업로드: 클라이언트에서 Supabase Storage 직접 업로드, 반환 URL을 `answers.photo_url`에 저장.
- 서버 함수에서 사용자 컨텍스트가 필요한 모든 DB 호출은 `requireSupabaseAuth` 미들웨어 사용.
- `attachSupabaseAuth`가 `src/start.ts`에 등록되어 있는지 확인.
- 한국어 UI, 반말 톤 카피.

---

## 7. 스코프 외 (확인용)

NOT in MVP: 팔로우/좋아요/댓글, 푸시 알림, 모더레이션/신고, 결제, 영상, DM, 검색, 재출제(시간축).

---

## 8. 빌드 순서

1. Lovable Cloud 활성화 + `LOVABLE_API_KEY` 확보
2. DB 마이그레이션(테이블 + RLS + GRANT + 신규유저 트리거) + Storage 버킷 + 시드 질문 40개 인서트 + 첫 주 `daily_questions` 인서트
3. 디자인 토큰(`styles.css`) + 폰트 + 공통 UI(탭바, 질문 카드, 사진 그리드 컴포넌트)
4. Auth: login 페이지 + `_authenticated` 가드 + root onAuthStateChange
5. 라우트별 화면 구현(홈 → 답변 작성 → 그리드 → 내 결 → 온보딩 → 백로그 순)
6. AI 리드백 server function + `me` 화면 통합
7. 시각/플로우 QA, 빈 상태/에러 처리 다듬기

---

확인할 점이 두 가지 있어:
1. 시드 데이터로 `daily_questions`는 **첫 7일치만 운영자 매핑** → 이후 날짜는 `questions.sort_order` 기반으로 자동 순환하는 헬퍼로 처리할게(MVP는 cron 없이 read-time 결정). 괜찮을까?
2. 온보딩에서 답해야 하는 최소 답변 수는 **3개**로 잡을게(가입 마찰 최소화 → 첫 magic moment 빠르게). PRD엔 5~10개라고 적혀있는데 3개부터 그리드/리드백 접근 허용하고 "5개 더 답하면 리드백 정확도↑" 식 너지로 추가 답변 유도하는 방향. 이대로 갈지?
