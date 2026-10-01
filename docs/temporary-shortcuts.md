# Temporary Shortcuts — Remove or Replace Before Production

Things built or configured **only to keep development moving**. Each one must be replaced
by the real solution (or consciously accepted) before launch. Add a row the moment a new
shortcut is introduced; move it to "Done" with the commit that removed it.

**Last updated:** 2026-10-01 · **Production ready:** NO — every row in "Open" blocks launch
unless marked *Accept*.

Status: 🔴 must replace before launch · 🟠 replace before paid / public use · 🟡 nice to replace

## Open

### 1. 🔴 Test plan switch (instead of Stripe billing)

| | |
| - | - |
| **What it is now** | Settings → Plan & billing → "Switch to … (test)". The workspace Owner changes the plan for free; saved to the DB. |
| **Where** | DB: `app_settings` row `test_plan_switch`, function `test_set_plan(ws, plan)` (migration `19_test-plan-switch`). Code: `repo.setPlan` (`src/lib/supabase/repo.ts`), `changePlan` (`src/lib/store.tsx`), `switchPlan` (`src/app/(app)/settings/plan/page.tsx`), `testMode` in `PlanCards.tsx`, keys `planPage.testSwitchNote`, `pricing.switchTest`, `planPage.switch*`. |
| **Why now** | No billing provider yet; the user needs to try Pro / Legendary features. |
| **Risk if left** | Anyone who owns a workspace gets paid plans for free (breaks CLAUDE.md §8). |
| **Replace with** | Stripe: Checkout / Customer Portal from a **server route**; plan set **only** by a verified Stripe webhook (signature check, idempotent event IDs stored, service role used only inside that route); define cancel / failed payment / downgrade / seat rules; Plan page buttons open Checkout. |
| **Remove steps** | 1) SQL now-or-at-launch: `update public.app_settings set value = 'false', updated_at = now() where key = 'test_plan_switch';` 2) After Stripe works: new migration `drop function public.test_set_plan(uuid, public.plan_tier);` (keep or drop `app_settings`). 3) Delete `repo.setPlan`, `changePlan`'s real-mode branch, `testMode` prop and the test keys. 4) Re-run audit item B-13 and close it. |

### 2. 🔴 Email: Supabase default SMTP + "Confirm email" OFF

| | |
| - | - |
| **What it is now** | Supabase Auth sends with its built-in SMTP (≈2 emails / hour). "Confirm email" was turned OFF for development (reported by the user on 2026-09-30, not visible to Claude). |
| **Where** | Supabase Dashboard → Authentication → Providers / Email, SMTP settings. Redirect URL `http://localhost:3000/auth/callback`. |
| **Why now** | Fake test addresses bounced and hit the rate limit; sign-up had to work. |
| **Risk if left** | Anyone can sign up with someone else's email; password-reset mail is unreliable; no sender branding. |
| **Replace with** | Custom SMTP (e.g. Resend) on a verified domain; Confirm email **ON**; production Site URL + redirect URLs; branded templates. |
| **Remove steps** | Configure SMTP in the dashboard → turn Confirm email ON → test sign-up, confirm and reset with a real inbox → record in the progress file. |

### 3. 🟠 App emails not sent (`/api/email` not configured)

| | |
| - | - |
| **What it is now** | Assignment / mention emails return 503 and are skipped; only in-app notifications work. |
| **Where** | `src/app/api/email/route.ts`; env (server-only) `RESEND_API_KEY`, `EMAIL_FROM`. |
| **Replace with** | Resend account + verified sender; set the two env vars; test delivery; per-user email preferences / opt-out. |

### 4. 🟠 Invites without an email

| | |
| - | - |
| **What it is now** | Admin pre-approves an email + role; the person must be told to sign up with that exact email. No email, no link. Demo mode shows a fake invite link. |
| **Where** | Migration `16_workspace-invites`, `InviteModal.tsx`, Team page "Pending access". |
| **Replace with** | Email invite with a single-use, expiring, hashed token link (`/invite/[token]`), accept-flow for existing accounts, audit events. Needs items 2–3 first. |

### 5. 🟠 Two-factor auth and session list are UI demos

| | |
| - | - |
| **Where** | `src/app/(app)/settings/security/page.tsx` (fixed setup code, local state, sample devices). |
| **Replace with** | Supabase Auth MFA (TOTP enrol / verify / unenrol) and real session list / sign-out-others. |

### 6. 🔴 Leaked password protection OFF

| | |
| - | - |
| **Where** | Supabase Dashboard → Authentication → password security (advisor `auth_leaked_password_protection`). |
| **Replace with** | Turn it ON (may need a paid Supabase plan). |

### 7. 🟠 Paid features locked only in the browser

| | |
| - | - |
| **What it is now** | `can()` / `<Gate>` hide paid features in the UI; the DB enforces only the Free project limit and storage quota. E.g. the permission matrix (Legendary) can be written by a Free Owner through the API. |
| **Replace with** | Server / RLS checks per paid feature (start with `role_permissions`), plan read from the DB. Audit B-01. |

### 8. 🟠 Data kept only in the browser session

| Feature | Where | Replace with |
| ------- | ----- | ------------ |
| Branding (name, colour, domain) | `branding` state in `store.tsx` | `workspace_settings` table + RLS |
| Custom field definitions | `customFields` state | table per workspace |
| Audit log page | `audit` state ("this session") | read `task_events` |
| Assistant monthly cap | `aiUses` counter | server-side quota per plan |
| Language choice | `localStorage` `pb_lang` | `profiles.language` + `workspaces.default_language` (migration) |
| Backup / restore | client-side JSON | server export / restore with audit + confirmation |

### 9. 🟠 Public share links don't open for signed-out visitors

| | |
| - | - |
| **Where** | `src/app/share/[token]/page.tsx` reads the in-memory store. DB side `get_shared()` is ready and workspace-checked. |
| **Replace with** | Call `get_shared()` for anonymous visitors (needs approval: public links, CLAUDE.md §1.3). |

### 10. 🟡 Simulated integrations and webhooks

| | |
| - | - |
| **Where** | `/integrations` (GitHub, Slack, Gmail… simulators, "Connected (demo)"), webhook rules only logged, custom-domain "Verify" UI only. |
| **Replace with** | Real OAuth per provider (minimum scopes, tokens server-side), signed + retried webhook delivery, domain verification after deploy. |

### 11. 🟡 Dev-only database bundle

| | |
| - | - |
| **What** | `supabase/run-all-migrations.sql` was a generated bundle (should already be deleted; not in git). Migrations are run by hand in the SQL editor. |
| **Replace with** | Supabase CLI migrations (`db push`) in CI before launch (files would need flattening — see `supabase/migrations/README.md`). |

## Accepted (not shortcuts, but keep honest)

- "AI" features are rule-based (`src/lib/ai.ts`), no external model — labelled as such in the UI.
- Demo mode with sample data when Supabase env vars are missing — keep for demos; never shown in real mode.

## Done

| Shortcut | Removed in | Notes |
| -------- | ---------- | ----- |
| — | — | — |
