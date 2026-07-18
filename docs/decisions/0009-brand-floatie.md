# ADR 0009 — Brand name: 플로티 (Floatie)

- Status: Accepted
- Date: 2026-07-15
- Updated: 2026-07-18

## Context

Working names included bottlenote, 쪽지, 표류. Product needs a light, cute tone (not serious Korean literary words), 2–3 syllables, aligned with sea-drift waiting UX.

## Decision

- **KR display name:** 플로티
- **EN / mascot / store secondary:** Floatie
- **App ID:** `app.floatie.app`
- **Repo:** `c-yeonwoo/floatie`
- **Rejected:** bottlenote, 표류, 둥실-only, 숨결, 결, sumgyeol/gyeol (user-facing)

## Consequences

- UI, manifest, Capacitor `appName`, store copy use 플로티
- Code SSOT: `src/lib/brand.ts`
- Native targets/products named Floatie — no legacy brand strings in repo
