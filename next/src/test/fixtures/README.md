# Test fixtures

Former `src/lib/mock` seed data was retired in Phase 13.

- Runtime UI must use `/api/app/v1` and `/api/admins/v1`.
- Server integration tests plant their own rows (see `src/server/modules/**/*.integration.test.ts`).
- Do not reintroduce `@/lib/mock` under `app/`, `components/`, `hooks/`, or `stores/`.
