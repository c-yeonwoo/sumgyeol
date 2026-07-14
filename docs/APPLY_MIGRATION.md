# 마이그레이션 적용

1. `supabase/migrations/20260714120000_mission_pivot.sql` — 미션 스키마
2. `supabase/migrations/20260714200000_p0_mission_guards.sql` — 성별·1회·활성풀·만료·티켓

```bash
cd ~/dev-private/sumgyeol
npx supabase db push
# 또는 대시보드 SQL 에디터에 위 파일들을 순서대로 실행
```

확인:

```sql
select count(*) from mission_presets;
select proname from pg_proc where proname in ('deliver_mission','touch_last_active','expire_stale_deliveries');
```

테스트용 티켓:

```sql
update profiles set ticket_balance = 3 where id = '<user-uuid>';
```

기존 유저는 `gender` / `birth_year` / `last_active_at`가 있어야 매칭됩니다. 앱 접속 시 `touch_last_active`가 갱신됩니다.
