# ADR 0005 — 스택: Supabase + Capacitor (+ 기존 React 골격)

- Status: Accepted (supersedes bottlenote ADR “Expo + NestJS”)
- Date: 2026-07-14
- Updated: 2026-07-18 (레포/브랜드 floatie 확정)

## Context

익명 미션 앱을 빠르게 DB→모바일 테스트까지 가져가려면 그린필드(Expo+Nest)보다, 이미 있는 **Supabase + React/TanStack + Capacitor** 골격을 쓰는 편이 빠르다.

## Decision

| 층 | 선택 |
|----|------|
| 레포 | `c-yeonwoo/floatie` |
| DB/Auth/Storage | **Supabase** |
| 앱 | **React + TanStack Start + Tailwind** → Sea 미션 루프 |
| 모바일 | **Capacitor** (`app.floatie.app`). WebView → `https://floatie.pages.dev` |
| API | Nest/별도 서버 **없음**. Supabase + Edge Functions |
| 채팅 MVP | Supabase Realtime 또는 폴링 |

**가져갈 것:** auth, blocks/reports, image utils, UI kit, Capacitor·릴리스 스크립트  
**버릴 것:** 피드·팔로우·좋아요·댓글·AI 유사도·레거시 브랜드 카피

## Consequences

- 출시 속도↑, SSR WebView 패턴은 단기 수용
- 장기적으로 SPA 이관은 루프 검증 후 검토
