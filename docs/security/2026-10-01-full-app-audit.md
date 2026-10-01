# 2026-10-01 — Full Application Audit (deep audit, CLAUDE.md §24)

**Branch:** `fixes-v1` (from `feat/settings-subpages-i18n` @ `3b6727c`) ·
**Index:** [security-findings-index.md](./security-findings-index.md)
**Overall status:** `IMPLEMENTED, NOT YET VERIFIED` · **Production ready:** **NO**

Earlier today's database audit is in [2026-10-01-rls-audit.md](./2026-10-01-rls-audit.md);
this report covers the whole app on top of it.

## Answer: why can't the plan be changed in the app?

- In **real mode** (Supabase signed in) the plan switcher is disabled on purpose. The
  `workspaces.plan` column has **no UPDATE grant** for signed-in users (migration
  `15_api-grants`) and CLAUDE.md §8 says paid features must never be unlocked from the
  browser. A plan may only change from verified billing (Stripe, not built yet) or by the
  database owner.
- Your workspace "test workspace" is on **`free`** (read from the database today), so
  Legendary-gated features show the upgrade box.
- **To test Legendary now (safe, server-side):** Supabase Dashboard → SQL Editor →
  `update public.workspaces set plan = 'legendary' where name = 'test workspace';`
  then reload the app. Back to Free: same with `'free'`. Only someone with database
  access can do this; no browser user can.
- **Update (same day, user approved):** an in-app **test plan switch** was added on
  `fixes-v1` — migration `19_test-plan-switch` (`test_set_plan`, Owner-only, server switch,
  audit event). After the user applies migration 19, Settings → Plan & billing → "Switch to
  Legendary (test)" saves to the database. Must be turned off before production (B-13).

## Scope — what was inspected

| Layer | How |
| ----- | --- |
| Database / RLS / functions / storage | Supabase MCP: security + performance advisors, RLS on all tables, policy count, buckets, workspace plan |
| Auth & redirects | `src/app/auth/callback/route.ts`, auth pages, error handling |
| API surface | every route handler (`/api/email`, `/auth/callback`) — live curl tests |
| XSS / content | every `dangerouslySetInnerHTML`, links built from data, rich-text helper |
| Exports | `src/lib/csv.ts` (CSV / formula injection) |
| Headers / framing | `next.config.ts`, live `curl -I` |
| Realtime | channel filters in `src/lib/store.tsx` |
| Secrets | service-role usage, `console.log`, env handling |
| Dependencies | `npm audit --omit=dev` |
| Feature gates / billing | where `can()` / `Gate` are enforced vs. the database |
| i18n / UI | key check, ICU tests, previous screenshots |

## Fixed on this branch

| ID | Severity | Finding | Fix | Verified |
| -- | -------- | ------- | --- | -------- |
| A-01 | Medium | CSV export had no formula-injection guard: a task title like `=HYPERLINK(...)` would run in Excel / Sheets | `safeCell()` in `src/lib/csv.ts` prefixes text cells starting with `= + - @ tab CR` with `'`; numbers untouched | `npm run test:csv` 8/8 |
| A-02 | Medium | No security headers; every page could be framed (clickjacking) | `next.config.ts`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` everywhere; `X-Frame-Options: DENY` + `frame-ancestors 'none'` on all pages except `/embed/*` (meant to be framed) | `curl -I` on `/login` and `/embed/p1` (production build) |
| A-03 | Low | `/api/email` accepted cross-site POSTs (cookie-based; SameSite=Lax mitigated most cases) | Origin must equal the app origin | cross-site POST → `403` |
| A-04 | Low | `/api/email` told signed-out callers whether email is configured and named the env vars | sign-in checked first; generic messages | signed-out POST → `401 Unauthorized` |
| A-05 | Low | `/api/email` body fields were not type-checked | strings with length limits for every field (Zod not installed) | tsc / build; covered by A-04 test path |

## Still open — needs your approval or setup

| ID | Severity | Finding | What it needs |
| -- | -------- | ------- | ------------- |
| B-01 | Medium | **Paid feature gates are enforced in the browser only.** Example: `role_permissions` policy has no plan check, so a Free Owner could edit the Legendary permission matrix through the API. DB enforces only project limit and storage quota. | Migration: plan check in `role_permissions` write policy (and other server-side gates as they get a backend) |
| B-02 | High | No real signed-in role tests (TEST-ROLE-001) | Browser test per role |
| B-03 | High | No two-account cross-workspace test (TEST-XTENANT-001) | Second real account |
| B-04 | Medium | `xlsx@0.18.5`: high-severity advisories (prototype pollution, ReDoS), **no fix**, and not imported anywhere | Approval to uninstall (package change) |
| B-05 | Medium | `/share/[token]` reads the in-memory store; signed-out viewers see nothing in real mode | Approval to enable public links via `get_shared()` (CLAUDE.md §1.3 lists public links) |
| B-06 | Medium | No Zod validation on the API (DEP-ZOD-001) | Package approval |
| B-07 | Medium (perf) | 16 RLS policies re-evaluate `auth.uid()` per row; 14 foreign keys unindexed. No impact at today's data size (0 tasks). | Migration: `(select auth.uid())` + indexes |
| B-08 | Low | No full Content-Security-Policy | Test a CSP with Supabase / fonts / Next scripts |
| B-09 | Low | Only `/api/email` has an app-level rate limit; login / reset rely on Supabase's built-in limits | Decide after backend routes grow |
| B-10 | Setup | Leaked password protection off; "Confirm email" off for dev; no email provider | Supabase dashboard / Resend account |
| B-11 | Medium | No automated test runner (unit / integration / E2E) | Vitest / Playwright approval |
| B-12 | Low | Only the first workspace membership loads (no switcher) | Feature work |
| B-13 | **Must fix before production** | Temporary **test plan switch** (`test_set_plan`, migration 19): the workspace Owner can change the plan from the app with no payment. Guarded by Owner check + server switch + audit event | Turn `app_settings.test_plan_switch` off, drop the function and the UI path when Stripe is connected |

## Verified OK (no change needed)

- RLS on 16 / 16 public tables, 47 policies, `anon` has no table access; storage bucket `task-files` private.
- Security advisors: only intended items (`get_shared` public by design, Supabase's `rls_auto_enable`, RLS helpers for signed-in users) + leaked-password setting.
- `/auth/callback` redirects only to an allowlist (`/reset-password`, `/dashboard`) — no open redirect.
- The only `dangerouslySetInnerHTML` (comments) escapes `& < > " '` first; `rich()` builds React nodes, never HTML.
- Realtime channels filter by workspace / user and RLS applies.
- No service-role key in `src`; no `console.log`; raw DB / provider errors no longer reach the UI.
- No data-driven `href`s rendered without validation (email task links are `http(s)` only).

## Verification run

| Check | Result |
| ----- | ------ |
| `npx tsc --noEmit` / `npx eslint .` / `npm run build` | 0 / 0 / 0 |
| `npm run test:csv` | 8/8 |
| `curl -I` headers, cross-site POST, signed-out POST (production build on :3100) | as in the table above |
| `npm audit --omit=dev` | 1 high (xlsx, unused) — B-04 |
| NOT RUN | signed-in browser tests, two-account tests, real email, automated E2E |
