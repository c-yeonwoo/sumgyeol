# 쪽지 (작업 중) — 레포 sumgyeol

익명 미션에 답하고, **서로 OK**하면 프로필이 열리는 라이트 소셜.

## 문서

| 문서 | 설명 |
|------|------|
| [docs/PRD.md](./docs/PRD.md) | 제품 SSOT (v0.3) |
| [docs/IMPLEMENTATION_TODO.md](./docs/IMPLEMENTATION_TODO.md) | 구현 할 일 |
| [docs/APPLY_MIGRATION.md](./docs/APPLY_MIGRATION.md) | DB 적용 |
| [docs/decisions/](./docs/decisions/) | ADR |

## 앱 구조 (현재)

- `/home` 받은 · `/send` 보내기 · `/outbox` 결과 · `/me` 나
- `/delivery/$id` 답장·OK · `/thread/$id` 대화

숨결 피드/탐색/AI 결/팔로우 화면은 제거됨.

## 스택

Supabase · React/TanStack · Capacitor

```bash
npm install
npm run dev
```
