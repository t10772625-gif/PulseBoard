# PulseBoard — Fresh Audit: Live Database + Code + APIs (2026-10-02)

**Branch:** `fixes-v1` (working tree has uncommitted / staged work from another session)
**Method:** Built from scratch. No earlier report was trusted; every finding below was
re-checked in this run against the **live Supabase database (read-only MCP queries)** or
the **current source files**.
**Overall status:** PARTIAL IMPLEMENTATION · **Production ready:** NO
**Changes made by this audit:** none (this file only). No migration, SQL write, package
or source change.

---

## 1. Short answer

| Question | Answer |
| --- | --- |
| Duplicate tables in the database? | **No.** 18 distinct tables, no two store the same thing. There *is* duplicated **logic / data** (see §6). |
| Duplicate JSX / components? | **Small amount.** No large copy-pasted pages. Two near-identical header components, shared menu code in 3 dropdowns, 8 CSS selectors defined twice (§7). |
| Are the APIs broken? | **Yes, against today's database.** 10 of 14 API routes use tables / columns / functions that do not exist yet (migrations 21–25 are not applied). `/api/notify` fails on every task create / update (§3, FA-01). |
| Code bugs? | Yes: trash lost on refresh, duplicate notifications, unassigned tasks shown as "mine", crashes on removed members, no rollback on failed saves (§5). |
| Database security problems? | Yes: invite hijack (Confirm email is OFF — proven from data), storage quota bypass, paid features not enforced in DB, cross-workspace assignee (§4). |

**Count of findings in this report**

| Severity | Count |
| --- | --- |
| High | 7 (FA-01, FA-02, FA-03, FC-01, FC-02, FC-03, FA-API-01) |
| Medium | 14 (FA-04–07, FA-12, FC-04–09, FA-API-02, FA-API-03, migration 23 deactivation) |
| Low | 8 (FA-08–11, FC-10, FC-11, FA-API-04, FA-API-05) |
| Informational | 3 groups (FA-13, FA-API-06, FA-API-07) |

---

## 2. What was checked (evidence)

### Live database (read-only, 2026-10-02 ~11:20 UTC)

| Check | Result |
| --- | --- |
| Public tables | 18: `app_settings, attachments, automation_rules, board_columns, clients, comments, email_outbox, notifications, profiles, projects, role_permissions, share_links, task_events, tasks, webhook_deliveries, workspace_invites, workspace_members, workspaces` |
| RLS enabled | 18 / 18 (none `FORCE`) |
| Policies | 44 public + 3 storage |
| `anon` table SELECT | 0 tables |
| Functions (public) | 16 (13 `SECURITY DEFINER`) |
| Triggers | `on_auth_user_created`, `projects_plan_limit`, `attachments_storage_quota`, `tasks_permission_check`, `comments_update_check` |
| Enums | `member_role` = Owner, Admin, Sub Admin, Member, Viewer · `plan_tier` = basic, pro, enterprise |
| Realtime | tasks, comments, notifications |
| Storage | bucket `task-files` private, 25 MB/file, image/video/pdf allow-list, 0 objects |
| Migration ledger | **`supabase_migrations` schema does not exist** |
| Migrations 21–25 | **Not applied** (no `workspaces.created_by`, no `tasks.number`, no `profiles.deactivated_at`, none of the 11 new tables) |
| Data | 3 users, 3 workspaces (1 Owner each, nobody shares a workspace), 1 project, 4 columns, **0 tasks**, 0 comments, 0 files, 2 events, 1 `role_permissions` row |
| Integrity scans | 0 workspaces without Owner · 0 users without profile · 0 profile/auth email mismatches · 0 duplicate emails · 0 cross-workspace tasks · 0 bad assignees · 0 bad statuses |
| Plans | one workspace `enterprise` (set by the test switch, no payment), two `basic` |
| `test_plan_switch` | `true` |
| Auth confirmation | all 3 users confirmed **0.02–0.07 s after sign-up, no confirmation email sent** → "Confirm email" is OFF |
| Security advisors | `get_shared` + `rls_auto_enable` callable by anon; 10 SECURITY DEFINER functions callable by signed-in users; leaked-password protection off; `app_settings` RLS without policies (intended) |
| Performance advisors | 16 policies re-run `auth.uid()` per row; 26 "multiple permissive policies"; 14 unindexed foreign keys; 8 unused indexes |

### Code and tooling

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | pass |
| `npx eslint .` | pass |
| `npm run test:csv` | 8/8 |
| `npm run test:integrations` | 57/57 |
| `npm run i18n:check` / `i18n:test` | OK (ur 1753/1753) / 10/10 |
| `npm audit --omit=dev` | 1 High: `xlsx` (not imported anywhere, no fix) |
| `next build` | **Not run** — another session is working in the same folder; a build would rewrite `.next` |
| Read in full | all 14 API routes, `src/lib/server/*`, `guard.ts`, `repo.ts` (loader + writes), key parts of `store.tsx`, public pages, `sw.js`, migrations 21–25 |
| Duplicate-code scan | script over `src/` (8+ identical normalised lines across files) |
| Not tested | any browser flow, any second account, any provider (email, Google, Slack, Gemini, push) |

---

## 3. Code ↔ database mismatch (the biggest current problem)

### FA-01 — High — App and APIs use 11 tables, 10 functions and 9 columns that do not exist

**Where:** migrations `21_simplify-roles` … `25_integrations` (written, not applied); code in
`src/lib/supabase/repo.ts`, `src/lib/store.tsx`, `src/app/api/**`.

**Missing in the live DB but used by code:**

- Tables: `workspace_settings, custom_field_defs, task_templates, saved_filters, user_preferences, ai_usage, pulse_survey, workspace_webhooks, calendar_feeds, oauth_connections, push_subscriptions`
- Functions: `use_ai_action, freebusy_tokens, google_connected_members, push_targets, get_calendar_feed, list_my_sessions, revoke_my_session, set_my_account_active, delete_my_account, answer_pulse`
- Columns: `tasks.number`, `workspaces.created_by`, `workspaces.task_prefix`, `profiles.job_title / team_size / use_case / deactivated_at`, `webhook_deliveries.created_by / target`

**What happens today:**

| Path | Result now |
| --- | --- |
| Workspace load | Works — `soft()` in `repo.ts` swallows "does not exist" errors and uses defaults |
| Saving custom fields, templates, saved filters, branding, SLA, AI switch, digest mode, team pulse, task prefix, profile details | Every save fails → "Save failed" toast, change lost on refresh |
| `/api/notify` (called after **every** task create / done / high / assign) | `recentDeliveries()` selects missing `webhook_deliveries.created_by` → **500 on every call** |
| `/api/ai` | `workspace_settings` missing → 404 |
| `/api/integrations/webhooks`, `/test` | insert / select fails → 403 / 404 |
| `/api/integrations/google/callback`, `/disconnect` | `oauth_connections` missing → error |
| `/api/calendar/freebusy`, `/feed/[token]` | RPC missing → empty / 404 |
| `/api/push/test` | RPC missing → 0 sent |
| `/api/domain/verify` | `workspace_settings` missing → 404 |
| Security page (sessions, deactivate, delete account) | RPCs missing → errors |
| Sign-up extra fields (workspace name, job title, team size, use case) | Silently ignored by the live trigger |

**Fix:** decide on migrations 21–25 (see FA-02, FC-01) and either apply the approved ones or
hide those UI paths until they are applied. Do not leave the app calling a 500 route on every task change.

### FA-02 — High — No migration ledger; migrations are not safe to re-run

- `supabase_migrations.schema_migrations` does not exist: the database has **no record** of
  which files were applied. The only way to know is probing for objects, as this audit did.
- `21_…2110` uses `add constraint` with no `if not exists`. `25_…` uses `create policy` with no
  `drop policy if exists`. A partial or repeated run fails half-way.
- `23_…2320` (`delete_my_account`) reads `workspaces.created_by`, which only exists after 21.
  Apply 23 without 21 and the function is created, but it fails the first time someone calls it.

**Fix:** keep a ledger (Supabase CLI or a `schema_migrations` table), test the run order on a
throw-away database, and make each file safe to re-run or clearly one-shot.

---

## 4. Database findings (checked against the live database)

### FA-03 — High — Invite hijack: anyone can sign up with an invited email

**Where:** live `handle_new_user()` trigger + Supabase Auth setting "Confirm email".
**Evidence:** auth data shows each user confirmed 0.02–0.07 s after sign-up with no
confirmation mail, so confirmation is OFF.
**Attack:** an Admin pre-approves `boss@company.com` as Admin. Anyone who learns that address
signs up with it. No inbox proof is needed, so the trigger puts them straight into the
workspace with the invited role.
**Fix:** turn "Confirm email" ON (custom SMTP), or make joining need a single-use token
link that the invited person accepts after their email is verified.

### FA-04 — Medium — Storage quota can be bypassed

**Where:** storage policy `task-files: editors upload`; table `attachments`; functions
`storage_used_bytes`, `enforce_storage_quota`.
**Problem:**
- Usage = `sum(attachments.size_bytes)`, and that value is **typed by the client**. Upload a
  25 MB file and send `size_bytes = 1`.
- The upload policy only checks `used < limit`. It ignores the size of the new file and does
  not need an `attachments` row. Files uploaded directly to storage without a row count as 0.
**Impact:** a Basic workspace (1 GB) can store without limit, 25 MB per object.
**Fix:** compute usage from `storage.objects.metadata->>'size'` (server truth), and include
the new object's size in the check.

### FA-05 — Medium — Any editor can delete anyone's files

**Where:** storage policy `task-files: editors delete` (`can_edit(workspace)`) vs table policy
`attachments: remove` (uploader or Admin only).
**Problem:** a Member can delete the **file** another person uploaded. The `attachments` row
stays and now points at nothing.
**Fix:** same rule on both: only the uploader or an Admin.

### FA-06 — Medium — Paid features are not enforced by the database

**Where:** policy `role_permissions: manage` (no plan check); all other paid features.
**Evidence:** the policy text has role checks only. The database enforces only two plan
rules: the Basic 1-project limit trigger and the storage quota (which FA-04 can bypass).
**Impact:** a Basic Owner can edit the Enterprise-only permission matrix through the REST API.
Every other paid feature is locked only in the browser.
**Also:** `test_plan_switch = true` and `test_set_plan()` let the Owner pick any plan with no
payment. One workspace is on Enterprise this way.
**Fix:** a `plan_allows(ws, feature)` helper used by the policies / RPCs of paid writes.
Turn the test switch off before any real user.

### FA-07 — Medium — `tasks.assignee_id` and `blocked_by` are not checked to be in the same workspace

**Where:** policies `tasks: create` / `tasks: update`, trigger `check_task_update_permissions`.
**Problem:** the foreign keys only say "some user" and "some task". Any member can set the
assignee to a user outside the workspace, or `blocked_by` to another workspace's task.
- Foreign-key checks ignore RLS, so success vs. FK error tells you whether a task UUID exists
  in **another** tenant (an existence check; UUIDs are hard to guess, so Low on its own).
- A foreign assignee crashes teammates' pages (see FC-04).
**Fix:** add both checks to the insert policy and the update trigger.

### FA-08 — Low — Owner can demote or remove themselves

**Where:** `members: change`, `members: remove`.
**Problem:** the Owner passes both policies for their own row and can become Viewer or leave.
The workspace is then left with no Owner (there is no transfer flow). 0 such workspaces today.

### FA-09 — Low — Race conditions in limits

`enforce_project_limit` and `enforce_storage_quota` count, then insert, with no lock. Two
requests at the same moment can both pass. The `/api/email` hourly limit has the same
count-then-insert race.

### FA-10 — Low — Email log can be edited by the sender

`email_outbox: sender updates status` + column grants (`status, provider_id, error`): a sender
can mark their own failed email as `sent`. The log is not trustworthy for audits.

### FA-11 — Low — In-app notification spam

`notifications: teammates create` lets any editor insert a notification with **any text**
for any teammate, with no rate limit.

### FA-12 — Medium (performance) — RLS / index advisors

- 16 policies call `auth.uid()` per row (wrap it as `(select auth.uid())`).
- 26 "multiple permissive policies": each `… : manage` (FOR ALL) overlaps `… : read`, so both
  run on every SELECT.
- 14 foreign keys have no index (e.g. `comments.workspace_id`, `notifications.workspace_id`,
  `tasks.blocked_by`).
- No impact at today's 0 tasks; it matters at scale.

### FA-13 — Informational — Other database notes

- `tasks` has UPDATE rights on **every** column, including `id` and `created_at`. On insert the
  client also sets `created_at` (`repo.insertTask`), so it can backdate tasks, which changes
  analytics.
- All policies target role `public` instead of `authenticated`. Today `anon` is stopped by
  missing grants and helper functions. Defense in depth would name `authenticated`.
- `client_viewer` (listed in CLAUDE.md) does not exist in the `member_role` enum.
- `get_shared()` is callable by `anon` (intended for share links, but no page uses it yet; FC-02).
- `rls_auto_enable()` is a Supabase-provided function, exposed to anon.
- Leaked-password protection is off (dashboard setting).

---

## 5. Code findings (checked in current source)

### FC-01 — High — Role model in code ≠ database ≠ recorded decision

**Where:** `src/lib/permissions.ts` (`ROLES = Admin, Sub Admin, Member, Viewer`),
`repo.ts:219` (DB "Owner" shown as "Admin"), `allowedRoles()`.
**Problem:**
- The database still has **Owner**.
- The progress file records the user's wish: Owner / Admin / Member / Viewer / Client Viewer,
  with migration 21 "do not apply".
- The code has already removed Owner. In the UI, a real Admin and the Owner look identical,
  so the UI offers real Admins actions the database allows **only the Owner**: invite or
  promote Admins, change another Admin, rename the workspace, the test plan switch. Those
  clicks fail with a generic error.
**Fix:** settle the role model first, then make code, migration and policies match.

### FC-02 — High — Public pages don't work and one has write buttons

**Where:** `src/app/share/[token]/page.tsx`, `src/app/embed/[id]/page.tsx`,
`src/app/submit/[id]/page.tsx`.
**Problem:**
- All three read the in-memory `useStore()`, not the database.
- A signed-out visitor (the whole point of a share / embed / feedback link) sees nothing.
  `get_shared()` exists in the database but is never called.
- The "read-only" share page has **Approve / Request changes** buttons that call `updateTask`.
- The feedback form creates the task only in the visitor's own browser state.
**Fix:** a public read route using `get_shared()` with no write controls. A separate,
rate-limited server route for feedback submissions.

### FC-03 — High (data recovery) — Trash disappears after refresh

**Where:** `repo.ts:244` loads tasks `where deleted_at is null`; trash lives only in React
state (`store.tsx`).
**Problem:** after a reload, deleted tasks are in neither the board nor the trash. They can't
be restored or purged from the app, and the rows stay in the database for good.
**Fix:** load `deleted_at is not null` rows into the trash (paged).

### FC-04 — Medium — Pages crash when a person is no longer a member

**Where:** about 20 places such as `members[x].name` with no guard: `TaskDrawer.tsx:61`
(comment author), `team/page.tsx`, `projects/[id]/page.tsx:485,510`, `analytics/page.tsx`,
`ai/*`, `integrations/slack/page.tsx:34`.
**Problem:** when a task assignee or comment author was removed from the workspace (removing
members is allowed), or set to an outsider (FA-07), `members[id]` is `undefined`, so
`.name` throws and the page crashes.
**Fix:** one `memberName(id)` helper with a "Former member" fallback.

### FC-05 — Medium — Unassigned tasks show as "mine" for everyone

**Where:** `repo.ts:18` `fromDbUser = (id) => !id ? "me" : …`.
**Problem:** `assignee_id = null` (unassigned, or the user was deleted, which sets it to null)
becomes `"me"`. So every person sees every unassigned task as assigned to themselves: "Mine"
filter, dashboard, My Day, workload. A comment from a deleted user also shows as written by
the person looking at it.
**Fix:** a real "unassigned" value, and "Former member" for a null author.

### FC-06 — Medium — Duplicate notifications

**Where:** `store.tsx:868` `notify()` + realtime handler `store.tsx:738`.
**Problem:**
- `notify()` adds a local item with no id, then inserts the row.
- Realtime sees the new row, can't match it, and adds a **second** item, so the inbox shows
  two until refresh.
- The id list is kept in a separate array matched by position. Marking the local item read is
  never saved.
**Fix:** create the notification id in the client, insert with that id, and ignore it in realtime.

### FC-07 — Medium — Inbox activity shows each event twice

**Where:** `repo.ts:372–375` builds both `audit` and `activity` from the same `task_events`
rows; `inbox/page.tsx:13–19` concatenates both lists.
**Fix:** use one list.

### FC-08 — Medium — Failed saves are not rolled back; multi-step writes are not atomic

**Where:** `store.tsx:559` `persist()`; `repo.insertProject`, `repo.replaceColumns`.
**Problem:**
- The UI changes first. If the database refuses (RLS, network), only a toast appears, and the
  screen keeps showing data that was never saved until refresh.
- `replaceColumns` **deletes all columns, then inserts**. If the insert fails, the board has
  no columns.
- `insertProject` inserts the project, then the columns. A failure in between leaves a board
  with no columns.
**Fix:** roll back or reload on failure; one RPC (transaction) for project + columns and for
column replacement.

### FC-09 — Medium — Logout / account switch leaves timer and tracking running

**Where:** `store.tsx:611` `clearWorkspace()`.
**Problem:** it does not reset `tracking` (running time on a task), `timerRunning` /
`timerSeconds`, `dndUntil`, `focusTaskId`, `webhookLog` or `standups`. The provider lives in
the root layout, so these survive logout. The next account can end the previous account's
tracking session on a task that isn't theirs.

### FC-10 — Low — Unchecked overdue re-announce

`store.tsx:1632`: every click on "check overdue" sends up to 20 `/api/notify` calls. Once
migration 25 exists, each click posts the same overdue tasks to Slack / Discord again
(see FA-API-01).

### FC-11 — Low — No middleware for session refresh

There is no `middleware.ts` / `proxy.ts`. Server routes depend on the browser client
refreshing the auth cookie. App pages are client-guarded only. Data stays protected by RLS,
but a route called with an expired cookie returns 401 instead of refreshing.

---

## 6. API findings (all 14 route handlers read)

| Route | Auth | Body validation | Notes |
| --- | --- | --- | --- |
| `POST /api/email` | sign-in + Origin | Zod | FA-API-03 |
| `POST /api/notify` | sign-in + Origin | Zod | FA-01 (500 now), FA-API-01 |
| `POST /api/ai` | sign-in + Origin | Zod | FA-01 (404 now), FA-API-04 |
| `POST /api/calendar/freebusy` | sign-in | Zod | FA-01, FA-API-02 |
| `GET /api/calendar/feed/[token]` | token only (by design) | regex | FA-01, FA-API-06 |
| `POST /api/domain/verify` | sign-in + Admin | Zod | OK; FA-01 |
| `GET /api/integrations/status` | sign-in | — | returns booleans only — OK |
| `POST /api/integrations/webhooks` | sign-in | Zod + exact host regex | OK; FA-01 |
| `POST /api/integrations/webhooks/test` | sign-in + permission | Zod | FA-01 |
| `POST /api/push/test` | sign-in | Zod | FA-01 |
| `GET /api/integrations/google/start` | sign-in | — | state + PKCE cookie — OK |
| `GET /api/integrations/google/callback` | sign-in + state + uid match | — | OK design; FA-01 |
| `POST /api/integrations/google/disconnect` | sign-in | — | revoke then delete — OK |
| `GET /auth/callback` | code exchange | allowlisted `next` | no open redirect — OK |

Good: shared `guard.ts` (Origin check, sign-in, Zod, safe error texts); SSRF guard for rule
webhooks (`outbound.ts`, https only, private IPs blocked, no redirects); AES-256-GCM for
stored secrets; no `console.log`; no service-role key anywhere in `src`.

### FA-API-01 — High (once migration 25 is applied) — `/api/notify` can be replayed, and Viewers have no rate limit

- The route checks the task's **current** state ("is it high priority?"), not that the caller
  just changed it. A task that stays high / done / assigned / overdue can be announced again
  and again by direct POST.
- Any member can call it, **including a Viewer**.
- The rate limit counts the caller's `webhook_deliveries` rows. Their insert policy needs
  `can_edit`, so a Viewer's log insert fails. `postToChat` ignores that error, so a Viewer's
  count stays 0. Result: **unlimited Slack / Discord / webhook posts by a Viewer**.
- The log row is written after the post, so delivery happens even when logging fails.
**Fix:** emit events only from the saved change (server-side trigger / outbox), require the
matching action permission, and count before sending, in one atomic step.

### FA-API-02 — Medium (once migration 25 is applied) — Teammates' secrets returned to the browser

`freebusy_tokens()` and `push_targets()` are granted to `authenticated`, so any member can
call them directly over REST:
- `freebusy_tokens()` returns teammates' **encrypted Google refresh tokens**.
- `push_targets()` returns teammates' push endpoints and keys.

The tokens are ciphertext, but this breaks "tokens server-side only" (CLAUDE.md §11.2). If the
server key ever leaks, every token is exposed. **Fix:** return only user ids to clients, and
read secrets in a server-only path.

### FA-API-03 — Medium — `/api/email` is a relay for free text

A Member can send **any subject, any body and any http(s) link** (`taskUrl` is not limited to
the app's own address) to any teammate, 50 per hour. It goes from the app's sending domain,
or the caller's own Gmail. That is a phishing / spam path inside a workspace.
**Fix:** fixed templates with variables, links built server-side from a task id.

### FA-API-04 — Low — `/api/ai` charges before the provider call

`use_ai_action` spends one credit before Gemini is called, so failures still use up the
monthly cap. Team first names are sent to Gemini (stated in the code comment; must be
disclosed in the UI).

### FA-API-05 — Low — Service worker accepts `//host` paths

`public/sw.js` only checks `path.startsWith("/")`, so `//evil.com` would open an external
site. Today the server builds every path, so this can't be triggered; check for `"//"`
anyway.

### FA-API-06 — Informational — Calendar feed tokens never expire

Anyone holding the URL sees task keys, titles, boards and due dates until it is revoked.

### FA-API-07 — Informational — Webhook ciphertext readable by Viewers (migration 25)

`workspace_webhooks: members read` + table SELECT grant returns `url_enc` to every member.

### Migration 23 notes (not applied)

- `member_role_in()` checks MFA but not `deactivated_at`: a deactivated user keeps full
  database access. Deactivation is self-service only, so this is Medium.
- `delete_my_account()` deletes workspaces the user created (cascade) but not their storage
  files, which become orphans.
- `revoke_my_session()` deletes the session row. The access token still works until it
  expires (about 1 hour).

---

## 7. Duplication inventory (tables, data, logic, JSX)

### Database tables

No duplicate tables. Each of the 18 tables stores something different. Overlaps:

| Item | Where | Verdict |
| --- | --- | --- |
| User email | `auth.users.email` + `profiles.email` | Copy made at sign-up, no sync trigger. 0 mismatches today; goes stale if a user changes email. |
| History | `task_events` read into **two** client lists (`audit`, `activity`) | One table; the UI shows rows twice (FC-07). |
| Webhooks (after 25) | rule URL in `automation_rules.param` + `workspace_webhooks` table | Two webhook systems by design (rule = signed POST, chat = Slack / Discord); keep both documented. |
| Custom fields (after 24) | definitions in `custom_field_defs`, values in `tasks.custom_fields` JSON keyed by **name** | Renaming / deleting a field orphans values. |
| Time | `tasks.tracked_seconds` only; the running session is in memory | No time-log table, so the session is lost on refresh. |

### Logic written twice (drift risk)

| Logic | Copy 1 | Copy 2 | In sync today? |
| --- | --- | --- | --- |
| Role default permissions | `src/lib/permissions.ts` `DEFAULT_PERMISSIONS` | DB `default_permission()` | **Yes** (compared line by line) |
| Plan limits (projects, storage, AI cap) | `src/lib/plans.ts` | DB `enforce_project_limit`, `storage_limit_bytes`, `ai_monthly_cap` (mig 24) | Yes |
| Owner handling | DB (Owner exists) | code (Owner removed) | **No** (FC-01) |

### JSX / components / CSS

| Item | Files | Verdict |
| --- | --- | --- |
| Near-identical headers | `components/SettingsHeader.tsx`, `components/SubPageHeader.tsx` | Same markup; only the breadcrumb text differs. Could be one component. |
| Menu open / close / outside-click code | `Dropdown.tsx`, `MultiSelectDropdown.tsx`, `UserMenu.tsx` | 5 identical 8-line blocks. A shared hook would remove them. |
| CSS selectors defined twice | `globals.css` (4010 lines): `button`, `.gate`, `.ghost.on`, `.pr-final`, `.pr-table td`, `.st-strength`, `.wl-bar`, `.wl-bar i` | The later rule silently wins; merge them. |
| Unused files | `public/file.svg, globe.svg, next.svg, vercel.svg, window.svg` | Leftover Next.js template assets. |
| Large copy-pasted pages | none found | — |

---

## 8. Dependencies

| Package | State |
| --- | --- |
| `xlsx@0.18.5` | High advisories (prototype pollution, ReDoS), no fix, **not imported** → remove (needs approval) |
| `zod`, `web-push`, `qrcode`, `@types/*` | Installed in the working tree (uncommitted); used by the new routes / security page. The progress file says approval was withdrawn pending review. |

---

## 9. Priority order to fix

1. **Turn "Confirm email" ON** (FA-03). It is a dashboard setting with no code change, and it
   closes the invite takeover today.
2. **Decide the role model** (FC-01) and **which of migrations 21–25 to apply** (FA-01). Until
   then, stop calling `/api/notify` and hide the UI that writes to missing tables.
3. **Add a migration ledger** and make the files safe to re-run (FA-02).
4. **Storage:** usage from `storage.objects`, same delete rule on both sides (FA-04, FA-05).
5. **Data-loss bugs:** trash reload (FC-03), atomic column replace (FC-08), unassigned ≠ me (FC-05),
   member-name crash (FC-04).
6. **Server-side plan checks;** turn the test plan switch off before real users (FA-06).
7. **Before applying 25:** redesign `/api/notify` (FA-API-01) and stop returning secrets
   from RPCs (FA-API-02).
8. **Public share page** via `get_shared()`, read-only (FC-02).
9. **Cleanup:** duplicate notifications / activity (FC-06, FC-07), logout reset (FC-09),
   RLS performance (FA-12), `xlsx` removal, duplicate components / CSS.
10. **Real tests:** two accounts in two workspaces, each role, a removed member, failed saves.

## 10. Honest conclusion

The live database is small, clean and RLS-protected, but the current code is ahead of it:
most new features and 10 of 14 API routes depend on migrations that are not applied. Combined
with the open invite-takeover setting, this means the app is **not ready for real users**.
