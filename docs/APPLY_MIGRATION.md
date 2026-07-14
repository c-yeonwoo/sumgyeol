# 마이그레이션 적용

순서대로:

1. `20260714120000_mission_pivot.sql` — 미션 스키마
2. `20260714200000_p0_mission_guards.sql` — 성별·1회·활성풀·만료·티켓
3. `20260715010000_p2_chat_contact.sql` — 채팅 캡·연락처 제안 RPC

```bash
cd ~/dev-private/sumgyeol
npx supabase db push
```

테스트용 티켓:

```sql
update profiles set ticket_balance = 3 where id = '<user-uuid>';
```
