# PulseBoard — Deep Project, Flow, Data and Security Audit

**Audit date:** 2026-10-02  
**Branch:** `fixes-v1`  
**Audit type:** Source / migration / existing-report review; read-only  
**Overall status:** PARTIAL IMPLEMENTATION  
**Production ready:** NO  
**Live Supabase MCP inspection in this run:** BLOCKED — no Supabase database tool was exposed to this session. No database writes or migration execution were attempted.

## 1. Executive summary

PulseBoard is a Next.js App Router application with a Supabase-backed persistence path and a separate in-memory demo path. The UI is much broader than the verified production behavior. Some core CRUD flows are designed to persist through RLS, but much of the current work depends on unapplied migrations 21–25, unconfigured or unverified providers, and browser behavior that has not been tested with real accounts.

The current source compiles and the existing focused checks pass, but no complete user workflow can honestly be marked 100% verified end-to-end. In particular, role changes, deactivation, notifications, public sharing, billing, provider delivery, and tenant isolation still need fixes or real-account verification.

The highest-priority concerns are:

1. Deactivated accounts are hidden by the client UI but remain authorized by the database helper and API guard.
2. `/api/notify` can send external notifications without proving a state transition or permission; the rate-limit log is written after delivery, and RLS can reject that log for a Viewer.
3. The in-progress role migration contradicts the documented desired role model and is explicitly not approved for application.
4. Paid feature enforcement is not consistently server/database-side; a temporary no-payment test plan switch exists.
5. Public share, embed, and submit pages use client store state instead of public/persisted APIs, so fresh real-mode sessions do not have a working public flow.
6. Persistence errors leave optimistic UI state in place; multi-step writes are not transactional.
7. Duplicate inbox/activity projections exist, trash/undo does not survive refresh, and time-tracking state is not cleared with workspace state.

## 2. Scope, evidence and limits

### Inspected

- Current app store and data repository: [store.tsx](../../src/lib/store.tsx), [repo.ts](../../src/lib/supabase/repo.ts), [permissions.ts](../../src/lib/permissions.ts), [plans.ts](../../src/lib/plans.ts).
- Authentication shell, client page guard, OAuth callback and common server route guard.
- The current API routes for AI, email, notification delivery, Google, calendar, domain checks, webhooks and push.
- Source for migrations 21–25 and relevant earlier migrations for membership, events, notifications, invitations and RLS.
- Existing security reports and progress evidence: [full app audit](./2026-10-01-full-app-audit.md), [RLS audit](./2026-10-01-rls-audit.md), [progress record](../progress/2026-10-02.md), [security findings index](./security-findings-index.md).
- Package scripts and dependency advisory output.

### Not inspected or not verified in this run

- Live Supabase schema, current migration ledger, live RLS policies, current rows, database advisors, or object storage contents. Supabase MCP tools were not available in the tool registry. `.mcp.json` was found but not opened because MCP configuration can contain credentials.
- No real signed-in browser session, second account, second workspace, MFA challenge, public-link click-through, or provider connection/send was run.
- No migration was executed. No package, source, database, or provider configuration was changed.
- The last database snapshot below is copied from the existing same-day progress record; it was not independently refreshed in this run.

### Evidence labels used

- **Source-confirmed:** directly follows from current checked-in/working-tree code or SQL text; still may not be deployed.
- **Previously DB-verified:** the existing audit report says it was inspected/applied through the read-only Supabase MCP on 2026-10-01; not rechecked today.
- **Pending/unverified:** code or migration exists, but no applied/live/browser/provider proof exists in the evidence available here.
- **No evidence:** do not infer implementation from the UI, README, mock state, or a successful build.

## 3. Current runtime flow

### Demo path

1. Missing public Supabase URL/key makes `supabaseConfigured` false.
2. The login/register UI allows demo entry with prefilled sample details; credentials are not authenticated.
3. `StoreProvider` initializes sample projects, tasks, members and notifications from `mock-data.ts`.
4. Writes update React state. There is no server/database persistence; refresh loses changes.

**Truth:** UI PROTOTYPE / DEMO ONLY; sample state is not a real tenant.

### Supabase path

1. Browser Supabase Auth creates/restores the session.
2. The client layout checks session state; `StoreProvider` loads the signed-in user's first workspace membership.
3. `loadWorkspace()` reads that workspace's members, profiles, projects, columns, tasks, comments, notifications, clients, rules, links, attachments and event rows as the authenticated user.
4. Browser mutations update local React state and asynchronous repository calls write rows as that same user; RLS is the intended authorization boundary.
5. Realtime currently subscribes to tasks, comments and the current user's notifications only.
6. A smaller set of server Route Handlers calls providers using server-only configuration.

**Truth:** PARTIAL IMPLEMENTATION. The base data path and older RLS migrations exist, but there is no workspace switcher, writes are not reliably rolled back, and the newest data/provider paths depend on migrations that the progress record says are unapplied.

### Auth and invitation flow

- Email/password uses Supabase Auth when configured. Google/GitHub sign-in depends on Supabase provider setup.
- OAuth callback has an internal redirect allowlist.
- An invite is a pre-approved email and role, not a delivered invitation email. A new signup with the exact invited email joins the invited workspace through the signup trigger; otherwise signup creates a personal workspace.
- MFA UI uses Supabase TOTP. Database enforcement is migration 23 and is not applied according to the progress record.
- Deactivation currently sets a profile timestamp and blocks the client shell only; it does not remove database/API authorization.

### Task and workspace flow

- Task state is first changed in the browser store and then persisted by diffing state against its prior snapshot.
- Deletes use `deleted_at`; archive uses `archived_at`; restore calls database updates.
- Task numbers (`PB-123`) depend on migration 22. UUIDs remain the row identifiers.
- Most workspace data is loaded without pagination. The workspace context is the first matching membership, not a user-selected workspace.
- Custom field definitions are separate rows, while custom values live in a JSON object on each task; no foreign-key validation keeps those definitions and values synchronized.

## 4. Feature truth matrix

| Feature area | Current truth | What is missing / what can fail |
|---|---|---|
| Demo sign-in and sample boards | UI PROTOTYPE / DEMO ONLY | Any credentials enter; sample changes are in-memory and disappear on refresh. |
| Authenticated signup/login | IMPLEMENTED, NOT YET VERIFIED | Real provider settings and real account flow not tested in this audit. |
| Invites | PARTIAL IMPLEMENTATION | Pre-approval only; no invite email/link delivery. Exact-email signup joins through trigger. |
| Roles / permissions | PARTIAL IMPLEMENTATION | Source has Admin/creator model; migration 21 is unapproved and not applied. Client UI checks do not replace DB checks. Client Viewer is not a database role in the recorded state. |
| Workspace switching | NOT IMPLEMENTED | Only first membership loads; no selector or switch lifecycle test. |
| Board/task CRUD | PARTIAL IMPLEMENTATION | Supabase repository/RLS path exists, but live role matrix, cross-tenant, concurrency and failed-write recovery tests are missing. |
| Readable task keys | IMPLEMENTED, NOT YET VERIFIED | Migration 22 required; progress says unapplied. |
| Comments and task activity | PARTIAL IMPLEMENTATION | Comments persist separately; activity summary is appended to `task_events`; realtime comments are deduplicated by client-created comment id. |
| Notifications | PARTIAL IMPLEMENTATION | Inbox rows, local optimistic rows, Realtime and browser push can diverge; duplicate inbox path is documented below. |
| Attachments | PARTIAL IMPLEMENTATION | Private bucket/quota were covered by prior audit; current actual MIME/content, upload size and real browser flow were not reverified. |
| Share links | PARTIAL IMPLEMENTATION | DB `get_shared()` exists in older migrations, but `/share/[token]` does not call it; fresh session has no store data. |
| Embed roadmap | UI PROTOTYPE / DEMO ONLY | Reads client store; no public project authorization/data fetch shown. |
| Public bug/feedback submit | UI PROTOTYPE / DEMO ONLY | Creates local task via store; no public server submission route, abuse controls, or durable insert. |
| Automation rules | PARTIAL IMPLEMENTATION | Browser-triggered rules; no scheduler/worker, durable queue, idempotent retry or guaranteed execution when client is closed. |
| Slack/Discord webhooks | IMPLEMENTED, NOT YET VERIFIED | Migrations 25 and server encryption/provider configuration required; authorization/rate-limit flaw in notify route. |
| GitHub | UI PROTOTYPE / DEMO ONLY | Page explicitly simulates commit/PR matching; no GitHub App/webhook connection. |
| Google/Gmail/calendar | IMPLEMENTED, NOT YET VERIFIED | Migration 25, OAuth client, encryption key, provider approval and real account test required. |
| Gemini | PARTIAL IMPLEMENTATION | Server route and schema validation exist; provider key, opt-in migration and real provider/error/cost tests required. Other AI pages use local heuristics. |
| Billing / plan change | NOT IMPLEMENTED as real billing | No Stripe checkout/webhooks. Existing test switch can change plan without payment and must remain non-production only. |
| Analytics | PARTIAL IMPLEMENTATION | Uses task state and synthetic timestamp fallbacks; no complete event-derived history. |
| Export / backup restore | PARTIAL IMPLEMENTATION | Export omits several data classes; restore is disabled for live workspaces. |
| Custom domain | PARTIAL IMPLEMENTATION | DNS ownership check only; serving PulseBoard on that domain is not implemented. |
| RLS / tenant isolation | Previously DB-verified for migrations 1–20, not rechecked now | Two-account tests remain open; migrations 21–25 add new surfaces that are not verified/applied in the progress record. |

## 4A. Full feature walkthrough

This is the user-visible feature inventory from the current pages/components, not a claim that every feature is production-ready. “Real-mode” means the code has a Supabase path; it does not mean that path has been verified against the live project.

### Dashboard and navigation

| Feature | What the user can do / what the code does | Persistence and limits |
|---|---|---|
| Dashboard greeting and due work | Shows the signed-in/sample name, tasks assigned to “me,” and tasks due soon. | Based on the currently loaded store; real data depends on workspace loading. |
| Project health cards | Computes a score from overdue tasks, blockers, WIP overflow and open bugs; opens each project. | Derived heuristic, not a provider/AI score. Empty project scores default to healthy. |
| Sprint burndown | Plots remaining tasks against an ideal line and labels ahead/behind. | Not a true sprint-history chart: it reconstructs prior counts from task age and inferred completion timestamps. Treat as estimate. |
| “Catch up” activity | Shows sample events on the demo dashboard. | Hidden in real mode; not a live cross-workspace activity digest. |
| Next actions and smart reminders | Rule-based task recommendations and due-soon contextual reminders. | Derived in browser from current task fields; no scheduled reminder job or independent delivery. |
| Dashboard widgets | Six widgets can be hidden/shown. | `localStorage` per browser; not synced to account/workspace, and storage errors are ignored. |
| Sidebar and project links | Main pages, grouped AI/automation/integration/settings links, project shortcuts, unread count, collapse control. | Collapse preference is browser-local. Page hiding is UI-only; authorization still must come from RLS/API. |
| Keyboard shortcuts / command palette | `C` create, `/` search palette, `G` then destination, `F` focus selected task, Delete delete selection, `E` archive selection, `Esc` close/clear, `?` help. | Browser-local keyboard handling; some destinations/commands are not part of the `G` map; no server dependency. |

### Projects, boards and tasks

| Feature | What the user can do / what the code does | Persistence and limits |
|---|---|---|
| Project list/create | View project health and counts; create a board/project when `project.manage` is allowed. | Real mode inserts a project then its default columns as separate calls, not one transaction. |
| Board columns | Add, rename, reorder, set WIP limit, delete an empty column; apply industry templates. | Column edits are persisted by deleting then reinserting the full column set. Failure can leave the board with no columns. DB writes are async. |
| Kanban board | Drag tasks between columns, quick-add in a column, open task drawer, view WIP totals. | Drag/drop and quick-add are client actions followed by async persistence. WIP is a warning, not a hard database limit. |
| Board views | Board, list, timeline, due-date month calendar, workload bars, Eisenhower matrix. | Timeline uses `barStart/lengthDays`; calendar uses task due offsets. Views are not all independent data models. Some are plan-gated UI. |
| Filters/search | “Mine,” high priority, blocked, assignee filters and a parsed text query; saved filters can be created/selected. | Current query and board view are in React state; saved filter rows require migration 24 in real mode. Search/filter scans already-loaded tasks client-side. |
| Multi-select/bulk actions | Select visible/all tasks; change status/priority/assignee, archive or delete; blocked tasks are skipped when moving to Done. | Multiple calls may be issued per task; no single atomic bulk operation or full rollback. |
| Task creation | Create task or bug with title, status, priority, assignee and due date. Bug form gathers steps/expected/actual, adds bug template text and may attach screenshots. | Attachments are image/video only in store. Bug form says vision is not an implemented image-understanding workflow. Suggestion logic is local heuristic. |
| Task card / drawer | See task key, title, labels, due date, assignee, subtasks/checklist progress, blocked state and approval state. Edit task fields; clone/archive/delete/share; open focus mode. | Stored task fields are row/JSON values. Some UI permissions are guarded client-side and still rely on database RLS. |
| Dependencies / blockers | A task can reference `blockedBy`; UI blocks completing a task while blocker is not Done; heuristic can suggest dependency links. | Relationship is a task UUID stored on task; previous RLS report flags that same-workspace target validation is still an open item. |
| Subtasks and checklist | Toggle/add task substeps and checklist items. | Embedded arrays in the task row, not independent child tables; simultaneous edits can overwrite arrays. |
| Labels, custom fields and task metadata | Labels, custom field values, recurrence, estimate, energy, billable flag, module, approval state, started/completed timestamps. | Many fields are optional. Custom field definitions need migration 24; values are JSON and can outlive renamed/deleted definitions. |
| Duplicate detection / task suggestions | Similarity search, auto-priority, module classification, smart assignee, task split, generated tests/docs/prediction. | Rule-based browser utilities in `src/lib/ai.ts`; not machine learning and not a provider call. Some gated interactions spend the local/DB AI action counter; other heuristic panels do not consistently represent provider usage. |
| Board CSV export/import | CSV export includes key/title/status/priority/assignee/due/labels/description; import previews rows and creates tasks. | CSV export has formula-cell protection test coverage. Import is client-parsed, has no demonstrated size/row cap or complete schema validation, and creates tasks individually. |
| Trello JSON import | Reads Trello-like lists/cards JSON, maps a few list names to todo/prog/done and adds imported label. | Not a live Trello integration; minimal input shape validation, no explicit file-size/task-count cap or transaction. |
| Task templates | Built-in task templates and save/apply/remove user templates. | Built-ins ship in app; saved templates need migration 24 in real mode. Applying a template creates each task separately. |
| Board templates | Replace columns with HR/Sales/Dev/Agency-style presets; ask confirmation. | Replaces board columns locally and moves invalid-status tasks to todo; those writes are not atomic. |
| Archive and trash | Archive/unarchive; soft-delete to trash, restore or empty trash (hard delete). | Archive rows are loaded from DB. Trash objects are only in React state and deleted tasks are excluded from `loadWorkspace()`, so trash/undo disappears on refresh; see PB-AUD-17. |

### Timer, time tracking and My Day

There are two different timers. They are not the same feature and are not linked automatically.

| Timer | Exact current behavior | What is not implemented / can go wrong |
|---|---|---|
| Focus/Pomodoro countdown | `timerSeconds` starts at 1,500 seconds (25:00). Start creates a one-second interval; Pause toggles it off; Reset sets it back to 25:00. It is shown on My Day and in Focus Mode. | Not associated with a selected task; no configurable duration, break cycle, completion alert/sound, persisted session, or server record. At zero, seconds clamp to 0 but interval and `timerRunning` do not stop automatically. |
| Focus DND | Starting the countdown sets `dndUntil` to now plus the remaining timer duration (minimum one minute). Focus Mode separately sets DND to 60 minutes on entry if not already set. | Pausing or resetting the countdown does not clear DND. It can continue muting notifications after the user pauses/resets. DND is not persisted. |
| Task time tracker | Task Drawer has Start/Pause/Resume/End for tasks that are In Progress (or already tracked), behind TIME-01 and edit permission. One session tracks one task. Ending or starting a different task adds elapsed seconds to `task.trackedSeconds`; task diff then writes `tracked_seconds`. | Running/paused session (`tracking`) is only React memory. Pause stores elapsed time only in that memory; refresh/logout loses the uncommitted segment. There is no per-session/per-user `time_logs` table, timesheet, audit-grade start/stop history, or reliable billed invoice. |
| Switch tracked task | Starting tracking on another task finalizes the previous in-memory session, then starts the new task. | Session state is not cleared by `clearWorkspace()`; switching accounts/workspaces can leave an old task session in memory until another action. Focus/countdown timers also are not reset there. |
| My Day schedule | Drag “my” open tasks to fixed 9:00–17:00 hourly slots; choose a currently displayed task and start the shared countdown. | Schedule is `daySchedule` React state, not persisted for real mode; it resets on workspace load. It does not create calendar events or time logs. The displayed “current/up next” task is simply the earliest scheduled item, not time-aware. |
| Energy auto-planning / task batching | Locally orders unscheduled tasks by energy, priority and module grouping. | Heuristic only; schedule changes are still browser memory, and “capacity” uses estimates rather than actual calendars in real mode. |
| Standup / focus switching | Standup form holds yesterday/today/blockers; context-switch counter increments when different task drawers open. | Standups and switch counter are local state; they reset and are not shared/persisted. |

### Collaboration, inbox and team

| Feature | What the user can do / what the code does | Persistence and limits |
|---|---|---|
| Inbox notifications | List/mark one or all read; clicking opens a task. | DB rows exist, but local optimistic notification and Realtime can duplicate; index-coupled IDs make mark-read fragile. See PB-AUD-08. |
| Activity feed | Shows audit rows and task activity. | Both arrays are projections of `task_events`; Inbox concatenates them, so persisted task events can appear twice after reload. See PB-AUD-18. |
| In-app notifications | Assignment, mentions and rules can insert rows for workspace members. | Depends on role/RLS and task context; no guaranteed durable delivery/job mechanism. |
| Browser notifications / push | Demo uses browser Notification API while page is open; real path can register `/sw.js`, save Web Push subscription and send a test. | Real push needs migration 25 and VAPID configuration; not tested. DND/digest behavior is client-side and does not gate all server-sent push delivery paths. |
| Team directory and roles | Show profile, role, workload estimate, capacity, org grouping; managers pre-approve email+role, change roles/capacity, revoke pending invites. | Invite is not sent by email. Role source/migration conflict remains. Capacity persisted to membership row where allowed. |
| Workload/capacity | Estimates open work per member and compares to capacity; demo includes sample meeting hours. | Real mode uses zero meeting hours unless separate Google free/busy feature succeeds; task estimates are heuristics, not actual availability. |
| Team pulse | Select a mood/score; migration 24 proposes weekly storage and Admin team visibility. | Real persistence requires unapplied migration 24; demo is local. Not a clinical/HR assessment. |

### Clients and reporting

| Feature | What the user can do / what the code does | Persistence and limits |
|---|---|---|
| Client records/onboarding | Store name/email/project/rate/budget/report-day; “onboard” creates client and copies a board share URL. | Client row may persist, but portal URL points at the nonfunctional fresh-session share page. No client invitation/email is sent. |
| Client approvals | Lists tasks with approval `requested`, allows Admin-like UI user to mark approved/rejected. | These are ordinary task field updates, not authenticated client-viewer decisions; user-facing share view must not expose mutation controls. |
| Budget/billable reporting | Calculates hours from `trackedSeconds`, multiplies by rate, compares to budget; preview/download report. | No invoice, payment, tax, immutable billing record or scheduled report is generated. Time totals inherit timer/tracking limitations. |
| Client feedback form | Copies `/submit/{projectId}` and accepts public title/details/email in UI. | Client-side-only task creation; no server-backed public endpoint, rate limit, spam prevention or persistence. |

### AI and automation

| Feature | What the user can do / what the code does | Persistence and limits |
|---|---|---|
| Sentence-to-task / meeting notes | Parses short text locally; when real mode + workspace AI opt-in, calls Gemini route for schema-validated drafts. User reviews and creates tasks. | Gemini text is provider-bound only in the opted-in route. Real call needs migration 24/provider key. Rule parser is not AI. Provider failure still spends the action under current route order. |
| AI suggestions/dependencies | “Next actions,” likely dependencies, task priority, duplicate, split, test cases, doc, completion prediction, assignee matching. | Mostly local deterministic heuristics. No model training or accuracy guarantee. Suggestions require review, but not every action button has a client permission disable. |
| Sprint plan/auto-schedule | Computes capacity and task timeline suggestion; apply updates timeline fields. | Heuristic over current task estimates and sparse history; not an external AI call or calendar booking. |
| Resource assignment | Suggests an assignee from task history/workload and applies it. | Local heuristic; does not account for real calendars, skills data quality, leave or all project scopes. |
| Meeting scheduler | Checks sample busy hours in demo; in real mode requests Google free/busy for connected members and suggests a slot; “Book” creates a Meeting-labeled task with invitees in description. | It does **not** create a Google Calendar event or send invitations. Google OAuth/migration required for real availability. Unknown attendees are excluded from the busy calculation. |
| Rule builder | Keyword-based sentence parsing or manual trigger/action selector; create/toggle/remove rule; manually check overdue tasks. | Rule rows can persist through migration 09/RLS. Actual local task actions run from browser state; overdue check is manual, not scheduled. Run counters are changed in React state, not persisted. |
| Rule webhooks | Server can POST signed webhook payload after notification route sees a matching task state. | Subject to PB-AUD-02 replay/authorization/logging issues; no durable queue/idempotency. |
| Email templates | Choose HR/client/sales text template, fill variables, copy it. | Copy-only utility; no message send or saved template editing. Real notification email is separate route. |
| Recurring tasks | Setting recurrence on task makes a next task when current task is marked Done in app. | No cron/scheduler; if status is changed outside that client pathway, next occurrence is not guaranteed. Task creation is not transactional with completion. |

### Integrations

| Integration/page | Actual behavior | Truth / missing flow |
|---|---|---|
| Slack slash commands | Local text simulator for `/pulse create/status/assign/mytasks/search`. | UI PROTOTYPE / DEMO ONLY; not a Slack app or slash-command endpoint. |
| Slack/Discord channel webhooks | Real-mode URL encryption, channel management, test send and task-event outbound messages exist in code. | Requires migration 25, server encryption key and webhook URL. Not tested. Notification route flaw PB-AUD-02 applies. |
| Pasted email → task | Parses pasted subject/body and creates a task. | Simulator; does not watch Gmail/inbound email. |
| Gmail send | Assignment email route can use connected Gmail or Resend, subject to provider setup and RLS. | Provider/account/send not tested. No inbound mailbox sync. |
| Google Calendar free/busy | Reads connected teammates' busy blocks through OAuth. | Requires OAuth/migration 25 and teammate consent. Does not create events. |
| Calendar feed / ICS | Can create/revoke private calendar feed URL and locally download one-off ICS. | Public-token feed requires migration 25. One-off export is local. Feed exposes task titles/board/due date to anyone holding token. |
| GitHub commit / PR reviewer | Simulates commit-key parsing/status change and chooses reviewer from heuristics. | UI PROTOTYPE / DEMO ONLY; no GitHub App, webhook signature, repository permission or live PR. |
| Trello import | Imports local JSON export into chosen board. | One-shot parser, not OAuth/sync; limited mapping and validation. |
| Telegram, Drive, Zapier/Make, WhatsApp | Listed in catalog. | NOT IMPLEMENTED or planned; do not interpret catalog status as connected. |

### Settings, account and security

| Page/feature | What it does | Persistence and limits |
|---|---|---|
| Plan/pricing | Shows plan cards, feature comparison, board/member/AI usage; creator can use temporary test switch. | No Stripe billing. Plan switching is not payment. Usage tile omits real storage usage in this current component. |
| Permissions | Shows matrix for Admin/Sub Admin/Member/Viewer, lets Admin preview role and edit lower-role permissions. | Source currently removes Owner; migration 21 conflict. UI preview is not an actual test user. SEC-05 gate is browser-only unless DB protects every write. |
| Security/MFA | Supabase TOTP enroll/verify/disable, list sessions, sign out other sessions, revoke one device, QR to login page; score is a two-check password/2FA rubric. | Sessions require migration 23. Supabase session deletion may not invalidate existing access token immediately. Database MFA enforcement is not applied per progress. Demo session row is current browser metadata, not a stored session. |
| AI settings | Admin opt-in/out, display provider configuration and monthly action count. | Workspace setting/usage depends on migrations 24; provider setup not tested. |
| Custom fields | Add text/number/select field definitions and remove them. | Real persistence depends on migration 24; task field values are separate JSON and can orphan. |
| Branding/task IDs/domain | Set brand name/color; set task prefix; save domain and verify `_pulseboard` TXT. | Branding/domain settings need migration 24; PB-123 needs migration 22. DNS ownership does not configure hosting or serve the app on that domain. |
| Language | Switch enabled locale and show formatting preview. | Saved in browser `localStorage`, not per user/workspace; user-generated content is not translated. Urdu key coverage passed but RTL visual audit was not run. |
| Audit log | Shows recent event rows and exports CSV. | Loads at most 500 events, UI shows first 12. Not a separate immutable compliance audit subsystem for every sensitive action. |
| Data export/backup | JSON export of selected store objects; demo JSON restore. | Export omits some data classes (notifications, settings, audit, attachments/invites); live restore disabled. Deletion/deactivation need migration 23 and are not live-tested. |
| Profile | Change display name, signup details and password; see role/workspace/email. | Profile detail columns depend on migration 21; email changes are not offered here. Password flow reauthenticates with current password. |
| Authentication pages | Email/password signup/login, reset flow, OAuth buttons and TOTP second step. | Demo accepts arbitrary details; production requires Supabase email/provider configuration. OAuth signup/profile/workspace trigger behavior migration-version-sensitive. |

## 5. Findings

### PB-AUD-01 — Deactivated accounts retain server/database access

**Severity:** High  
**Status:** Source-confirmed design gap; live exploit test not run.  
**Locations:** [app layout](../../src/app/%28app%29/layout.tsx), [server guard](../../src/lib/server/guard.ts), [MFA membership helper](../../supabase/migrations/23_account-security/20261002002310_require_mfa_for_workspace_data.sql), [deactivation function](../../supabase/migrations/23_account-security/20261002002320_create_deactivate_and_delete_account.sql).

The UI reads `profiles.deactivated_at` after loading workspace data and renders a deactivated screen. The shared API guard only checks `auth.getUser()`. Migration 23's `member_role_in()` checks membership and MFA assurance, but not `deactivated_at`. Therefore an authenticated deactivated user can bypass the client layout and continue direct Supabase/API requests while their session remains valid. The initial loader also fetches workspace rows before the client-only deactivated screen is shown.

**Needed:** make deactivation part of a shared database authorization predicate and server request guard; block workspace reads/mutations and notification delivery, and test direct REST/RPC/API access after deactivation. Define whether reactivation requires a fresh auth session.

### PB-AUD-02 — Notification endpoint authorizes current state, not the action

**Severity:** High  
**Status:** Source-confirmed; external provider call not run.  
**Locations:** [notify route](../../src/app/api/notify/route.ts), [delivery helper](../../src/lib/server/deliver.ts), [webhook RLS migration](../../supabase/migrations/25_integrations/20261002002500_create_workspace_webhooks.sql).

The route confirms a task currently looks created/done/high/assigned/overdue, but it does not prove the caller made that transition or has the relevant permission. A task that remains high/done/assigned can be replayed repeatedly. Chat delivery happens before inserting the delivery log. The log insert policy requires `can_edit`; a Viewer can read workspace tasks/channels but cannot insert the rate-limit log. The delivery result is ignored, so the outbound side effect may still happen while the limiter sees no recorded delivery.

**Needed:** move event emission behind the authorized mutation or create a server-verifiable event/transition record; require the corresponding action permission; rate-limit before delivery with an atomic server-side counter; make delivery idempotent and record failures. Test Viewer, Member, replay, and concurrent burst cases.

### PB-AUD-03 — Role migration conflicts with stated role decision

**Severity:** High / release blocker  
**Status:** Migration files exist; progress record says not approved and not applied.  
**Locations:** [role migration](../../supabase/migrations/21_simplify-roles/20261002002110_convert_owner_members_to_admin.sql), [role helper migration](../../supabase/migrations/21_simplify-roles/20261002002120_update_role_helper_functions.sql), [client role model](../../src/lib/permissions.ts), [progress decision](../progress/2026-10-02.md).

The migration rewrites every Owner membership/invite to Admin, deletes stored Owner/Admin permission overrides and adds constraints forbidding Owner. The app already removed Owner from its `Role` union and maps an old DB Owner to Admin. Project records the desired direction as Owner, Admin, Member, Viewer, Client Viewer, with Sub Admin later scoped; the migration is marked “do not apply.” This is not a safe “apply later” difference: role names, grants, invite acceptance, default permission behavior and billing/creator semantics differ.

**Needed:** settle and document the role model first. Keep migration 21 unapplied until then. If discarded, review/revert dependent source assumptions and review which non-role parts of 21–25 are still wanted. Run a role/action matrix and invited-user test before any role migration.

### PB-AUD-04 — Plan feature enforcement is not consistently server-side

**Severity:** High  
**Status:** Previously reported as B-01; not live-tested now.  
**Locations:** [browser feature gate](../../src/components/Gate.tsx), [plan map](../../src/lib/plans.ts), [workspace config RLS](../../supabase/migrations/24_workspace-data/20261002002410_enable_rls_workspace_config_tables.sql), [temporary test plan function](../../supabase/migrations/19_test-plan-switch/20261001001910_create_test_set_plan_function.sql).

`Gate` is a client component. Existing audit B-01 states that some paid operations (example: editing `role_permissions`) do not have a DB plan check. Migration 24 adds an AI counter/cap, but this does not establish server-side entitlement enforcement for every gated feature. The test plan function intentionally allows a no-payment plan switch while a server-side switch is enabled; prior DB evidence says the current workspace was Enterprise via this switch.

**Needed:** enumerate paid operations and enforce plan entitlement at their server/RLS boundary; test direct REST/RPC calls on Basic. Disable and remove the test plan path before production billing. Real billing remains NOT IMPLEMENTED.

### PB-AUD-05 — Public routes are disconnected from persisted/public data

**Severity:** High for expected public workflow; also violates “read-only” claim.  
**Status:** Source-confirmed.  
**Locations:** [share page](../../src/app/share/%5Btoken%5D/page.tsx), [embed page](../../src/app/embed/%5Bid%5D/page.tsx), [public submit page](../../src/app/submit/%5Bid%5D/page.tsx), [existing public share function migration](../../supabase/migrations/18_security-hardening/20261001001840_scope_share_links_to_own_workspace.sql).

Share/embed/submit pages read or mutate `StoreProvider` client state. They do not fetch the token-scoped share data through `get_shared()`, nor do they insert public submissions through a server endpoint. A fresh tab has no real workspace store, so a public link/form cannot perform its advertised real workflow. The share page contains approve/request-changes buttons calling `updateTask()` although its page comment says read-only.

**Needed:** for share/embed, implement an explicitly scoped public read API using the hardened database function and expose only intended fields; remove all write controls from read-only links. For public submit, create a separate authenticated-by-token/rate-limited server mutation with strict validation, abuse control and audit. Do not expose workspace IDs as authorization.

### PB-AUD-06 — Optimistic writes lack rollback; related writes are not atomic

**Severity:** Medium/High data-integrity risk  
**Status:** Source-confirmed; DB failure path not exercised.  
**Locations:** [store persistence wrapper and mutation flows](../../src/lib/store.tsx), [repository writes](../../src/lib/supabase/repo.ts).

Most mutations change local state first. `persist()` catches failures and displays a generic toast, but does not restore the prior state or schedule a retry. The state diff ref is advanced before persistence success, so a failed write is not automatically retried by the same change. `insertProject()` inserts project then columns separately; `replaceColumns()` deletes existing columns then inserts replacements separately. Failure between calls can leave partial/empty board configuration.

**Needed:** use explicit mutation results with rollback/reload on failure; make destructive multi-row replacement atomic in a database transaction/RPC or an equivalent safe server operation; test permission-denied and network-failure paths.

### PB-AUD-07 — Analytics may present estimated dates as measured history

**Severity:** Medium (decision-quality/data truth)  
**Status:** Source-confirmed.  
**Location:** [analytics page](../../src/app/%28app%29/analytics/page.tsx), [row mapping](../../src/lib/supabase/repo.ts), [store history behavior](../../src/lib/store.tsx).

Real mode supplies no historical sprint `history`. Analytics also fills missing task start/completion values using derived values based on task creation age. That can make cycle/lead time, SLA and throughput calculations look measured when source timestamps/events are missing. The task event table is append-only and can support real history, but the current analytics flow does not reconstruct the full timeline from it.

**Needed:** calculate metrics from explicit status transition timestamps/events, track unknown sample counts, and render “insufficient history” rather than synthesized results. Keep heuristic forecasts visibly labeled as estimates.

### PB-AUD-08 — Inbox notifications can appear twice until reload

**Severity:** Medium (duplicate UX/data projection)  
**Status:** Source-confirmed race/path; browser reproduction not run.  
**Locations:** [store notification and Realtime handlers](../../src/lib/store.tsx), [notification insert repository](../../src/lib/supabase/repo.ts).

`notify()` prepends a local notification with no database ID, then inserts a database row. It places `undefined` into the parallel ID list. Realtime receives the newly inserted row with a random DB ID, does not recognize the optimistic item as the same notification, and prepends a second item. After reload only the single DB row remains. This makes the inbox count/list differ before and after refresh.

**Needed:** use a client-generated notification UUID and insert/select that ID, or reconcile the optimistic item when the insert returns; do not maintain notification objects and IDs in separate index-coupled arrays.

### PB-AUD-09 — Profile email duplicates Auth email without a sync path

**Severity:** Medium/Low (stale contact and invitation risk)  
**Status:** Source/migration-confirmed; live stale values not inspected.  
**Locations:** [signup trigger](../../supabase/migrations/01_auth-and-workspaces/20260930000140_create_signup_trigger_profile_and_workspace.sql), [profile grants](../../supabase/migrations/15_api-grants/20260930001500_grant_table_access_to_authenticated.sql), [email route](../../src/app/api/email/route.ts).

`profiles.email` copies `auth.users.email` at signup and is later used for teammate display and delivery. The migrations/source inspected contain no auth email update trigger; the browser is explicitly denied permission to update `profiles.email`. If Auth email changes, the profile mirror can be stale and notifications can go to the prior address. Invite lookup uses the Auth signup email, which can diverge from the profile copy.

**Needed:** decide the canonical source. Either query Auth email only in a narrow server path, or implement a trusted sync mechanism and test email change/verification flows. Do not grant clients direct email-column updates.

### PB-AUD-10 — Custom-field values can outlive their definitions

**Severity:** Medium (data consistency)  
**Status:** Source-confirmed model gap; no live rows checked.  
**Locations:** [custom-field persistence](../../src/lib/supabase/repo.ts), [task JSON mapping](../../src/lib/supabase/repo.ts), [workspace config migration](../../supabase/migrations/24_workspace-data/20261002002400_create_workspace_config_tables.sql).

Definitions live in `custom_field_defs`; each task keeps values in a JSON `custom_fields` object. Removing a definition deletes only its definition row. No FK/cascade or cleanup path removes values from tasks; renaming a field can also leave values under the old key. This is not duplicate tables for the same entity, but it is duplicated schema knowledge with no referential integrity.

**Needed:** define stable field IDs as JSON keys, migrate existing name keys, and clean or deliberately retain orphan values when deleting a definition. Validate task custom values against the workspace's active definitions on writes.

### PB-AUD-11 — Workspace data loading and realtime are incomplete for scale/collaboration

**Severity:** Medium (performance and stale data)  
**Status:** Source-confirmed.  
**Locations:** [workspace loader](../../src/lib/supabase/repo.ts), [Realtime subscriptions](../../src/lib/store.tsx), [README claims](../../README.md).

Loader queries have no cursor/limit for tasks, comments or attachments and signs all attachment URLs in a single call. Realtime covers tasks/comments/current-user notifications, not projects, columns, members, permissions or workspace settings. A second collaborator can therefore see stale configuration/team state until reload. README claims cursor pagination and broad realtime not supported by current implementation.

**Needed:** add workspace-scoped pagination and fetch only needed related data; define which entities need realtime and refresh cache/state on those events; test workspace change/logout clears all tenant-bound state.

### PB-AUD-12 — New migrations have unresolved rollout and idempotency risks

**Severity:** High rollout blocker  
**Status:** Existing progress says unapplied; some non-idempotent statements source-confirmed.  
**Locations:** [migration README](../../supabase/migrations/README.md), [migration 21](../../supabase/migrations/21_simplify-roles/20261002002110_convert_owner_members_to_admin.sql), [migration 24 policies](../../supabase/migrations/24_workspace-data/20261002002410_enable_rls_workspace_config_tables.sql), [migration 25 webhooks](../../supabase/migrations/25_integrations/20261002002500_create_workspace_webhooks.sql), [progress record](../progress/2026-10-02.md).

The migrations are stored in subfolders and the repository README says the Supabase CLI does not apply them from this layout; current instructions are manual SQL Editor execution. Progress identifies some migrations as non-idempotent (`CREATE POLICY`/constraints without safe re-run handling) and flags 21 as unapproved. Several routes/pages call RPCs or read tables that do not exist until their migrations run; `soft()` only masks missing config reads in selected loader paths, not all route failures.

**Needed:** do not run 21–25 until role decisions and review are complete. Establish a migration ledger/deployment method, test ordered application on a disposable DB, add rollback plans and verify stored policy expressions after apply. Make migrations deliberately idempotent only where safe; never rerun destructive backfills blindly.

### PB-AUD-13 — Account deletion can cascade workspace data and orphan files

**Severity:** High destructive-action risk  
**Status:** Migration source reviewed; not applied/tested per progress record.  
**Location:** [delete/deactivate migration](../../supabase/migrations/23_account-security/20261002002320_create_deactivate_and_delete_account.sql).

`delete_my_account()` deletes workspaces created by the user when they are the sole member, which cascades workspace business rows. Storage objects are not deleted by SQL and may become orphaned. The project progress notes this function is unreviewed. This must not be treated as a routine “delete account” flow without explicit confirmation, re-authentication, dependency inventory, storage cleanup plan and tested recovery expectations.

**Needed:** review ownership transfer and archive/export behavior first; require recent re-authentication/MFA for deletion; make storage cleanup and audit behavior explicit; test sole-member and multi-member cases on disposable data.

### PB-AUD-14 — No durable job runner for outbound and scheduled work

**Severity:** Medium (reliability/cost)  
**Status:** Source-confirmed architecture gap.  
**Locations:** [notify route](../../src/app/api/notify/route.ts), [delivery helper](../../src/lib/server/deliver.ts), [store automation runner](../../src/lib/store.tsx).

External delivery is performed synchronously in API requests; app event calls are fire-and-forget. There is no durable queue, idempotency key, bounded retry record or scheduled worker. A browser disconnect, request timeout, provider failure or deployment limit can lose a notification/rule run. Replayed requests can repeat sends.

**Needed:** first define event identity and idempotency. Then use a durable outbox/job table and server worker with bounded retries; re-check workspace/permissions at processing time. Do not add a broad service-role worker without a separate security design/approval.

### PB-AUD-15 — Production dependency advisory and package decision

**Severity:** High advisory; medium project decision  
**Status:** `npm audit --omit=dev` returned exit code 1.  
**Location:** [package.json](../../package.json).

The direct `xlsx@0.18.5` dependency has high-severity prototype-pollution and ReDoS advisories; npm reports no fix. Existing app audit says it is unused. `zod`, `web-push`, `qrcode` and type packages are present in the current uncommitted package/lock changes; progress says approval was withdrawn pending review. No dependency was changed in this audit.

**Needed:** decide whether unused `xlsx` can be removed and review the added package/license/runtime footprint under the dependency-approval process. Do not run automatic force fixes.

### PB-AUD-16 — Documentation and handoff state is incomplete/inaccurate

**Severity:** Medium (engineering/control risk)  
**Status:** Source/docs-confirmed.  
**Locations:** [README](../../README.md), [progress record](../progress/2026-10-02.md), [migration README](../../supabase/migrations/README.md).

README describes Express, Redis, TanStack Query, cursor pagination, broad realtime and optimistic rollback, while current package/runtime is Next.js App Router, Supabase JS and React store; those documented capabilities are absent or partial. Required continuity docs (`ENGINEERING_STATUS`, `CURRENT_HANDOFF`, `ISSUE_REGISTER`, `VERIFICATION_LOG`, `SECURITY_DECISIONS`, daily memory) were not found. Existing progress/security reports carry important decisions but do not replace all required current-state documents.

**Needed:** update architecture/feature claims to verified code, and create/update the required continuity docs only with explicit scope approval. Preserve the current report's unverified labels; do not promote written migrations to “live.”

### PB-AUD-17 — Deleted tasks disappear from the trash after refresh

**Severity:** High data-recovery risk  
**Status:** Source-confirmed; browser flow not run.  
**Locations:** [workspace task loader](../../src/lib/supabase/repo.ts), [trash state and delete/restore flow](../../src/lib/store.tsx), [Archive page](../../src/app/%28app%29/archive/page.tsx).

Delete is implemented as a database soft-delete (`deleted_at`) plus a `TrashItem` held in React state. The real workspace loader explicitly selects only tasks whose `deleted_at` is null, and it does not separately query deleted rows to rebuild trash. After reload, the task remains soft-deleted in the database but is absent from both the active task list and the UI trash. The user can no longer restore or purge it through the app.

**Needed:** load deleted rows into a properly scoped/paginated trash dataset, including required task metadata, or make the delete operation reversible through a server-side restore endpoint. Add delete → reload → restore and delete → purge regression tests before calling trash/undo persistent.

### PB-AUD-18 — Inbox activity tab duplicates persisted task events

**Severity:** Medium UX/data presentation  
**Status:** Source-confirmed; browser rendering not run.  
**Locations:** [event projection](../../src/lib/supabase/repo.ts), [Inbox feed composition](../../src/app/%28app%29/inbox/page.tsx).

`loadWorkspace()` maps every `task_events` row into `audit`, and maps task-linked rows from the same result set into `activity`. The Inbox activity feed concatenates both collections. Loaded task activity timestamps are formatted dates, so the filter that only removes “Just now” entries does not remove those duplicates. Task-linked events can therefore be listed once from `audit` and a second time from `activity` after load/reload.

**Needed:** make the activity tab consume one canonical event list, or filter the audit projection by event/task identity. Keep the audit settings view separate if it needs its own presentation, not another copy in the feed.

### PB-AUD-19 — Timer and tracking session survive workspace cleanup

**Severity:** Medium (session integrity / time loss)  
**Status:** Source-confirmed; cross-account reproduction not run.  
**Locations:** [root provider](../../src/app/layout.tsx), [workspace cleanup](../../src/lib/store.tsx), [timer/tracking handlers](../../src/lib/store.tsx).

`StoreProvider` is mounted above route changes in the root layout. Workspace cleanup clears task data but does not clear `tracking`, `timerRunning`, `timerSeconds`, or stop `tickTimer`. Thus logout/account/workspace cleanup can leave the countdown interval running and a task tracking session associated with the previous workspace. A tracking segment paused but not ended is already only in memory; a stale session can later be finalized against an empty/new workspace task list and be lost. The countdown itself is not tenant data, but continuing it through logout is surprising; the task session must not cross workspace context.

**Needed:** stop the interval and explicitly decide whether the user wants a warning/save/discard when logging out or changing workspace. Clear task-scoped tracking state on workspace identity change. Persist time sessions separately if they must survive refresh; never silently attach a prior workspace's duration to another workspace.

## 6. Data duplication and consistency inventory

### Confirmed or likely duplicate representations

| Data | Where it appears | Assessment |
|---|---|---|
| User email | Supabase `auth.users.email` and `public.profiles.email` | Intentional profile mirror, but no sync trigger/path found after Auth email change. Can become stale; see PB-AUD-09. |
| Inbox notification | Local optimistic React state and `notifications` DB row | Same logical notification can show twice until refresh because local item has no DB ID and Realtime prepends the persisted row; see PB-AUD-08. |
| Inbox activity feed | `audit` and `activity` arrays built from the same `task_events` query | Task-linked rows are concatenated twice in the Inbox activity tab after load; see PB-AUD-18. |
| Task history/activity/audit | `task_events` DB rows; `activity` and `audit` client arrays | `activity` and `audit` are projections of the same event rows, not separate database tables. On action, UI arrays are updated locally while one event row is written. This is intentional sharing, but the UI can diverge after write failure. |
| Deleted tasks/trash | `tasks.deleted_at` plus React `trash` objects | Persisted delete flags exist, but deleted rows are not reloaded into trash. They become invisible/inaccessible through the UI after refresh; see PB-AUD-17. |
| Time tracking | Task aggregate `tracked_seconds` plus one React `TrackingSession` | Aggregate is persisted at finalization; individual running/paused session is not stored. No `time_logs` table is in the migration inventory; see PB-AUD-19. |
| Comment and activity summary | `comments` row plus `task_events` “commented/replied” summary | Different purposes (comment content/thread vs audit event), not duplicate comment body. Do not copy full comment text into `task_events`. |
| Custom-field values | `custom_field_defs` table and task `custom_fields` JSON | Definition/value split is reasonable, but no stable-key FK/validation/cleanup; deletion/rename can orphan values. See PB-AUD-10. |
| Notifications vs browser push | `notifications` rows and Web Push subscriptions/deliveries | Different channels, not duplicate tables for the same object. Delivery/idempotency status is incomplete. |
| Workspace member vs profile | `workspace_members` membership/role and `profiles` identity | Correct relational split; avoid copying role/permission state into profile. |
| Task event and task row | `tasks` current state and append-only `task_events` history | Correct current-state/history split. Current analytics does not consistently use history, so it should not fabricate it from task fields. |

### Database objects from migration inventory

The repository schema is organized into modules rather than one oversized table. Base business entities are `profiles`, `workspaces`, `workspace_members`, `projects`, `board_columns`, `tasks`, `comments`, `task_events`, `notifications`, `clients`, `automation_rules`, `webhook_deliveries`, `share_links`, `attachments`, `email_outbox`, `role_permissions`, and `workspace_invites`. Migrations 21–25 propose additional creator/task-key fields, account security functions, custom-field/template/filter/settings/preference data, AI usage/pulse survey, workspace webhooks, calendar feeds, OAuth connections and push subscriptions.

No evidence in the inspected migration model shows two separate persisted tables intentionally storing the same task/comment/member entity. Main duplication risks are replicated profile email, task JSON values versus definitions, duplicate local/persisted notification projections, and duplicate app-level projections of one event table. **Actual duplicate rows or live database contents cannot be confirmed without a live DB query.**

## 7. Database status and requested MCP check

### What the available evidence says

- The 2026-10-01 RLS report says migrations 18 security-hardening files through `…1890` were applied and the database was rechecked read-only. It reports 16/16 public tables RLS-enabled, 47 policies, private `task-files` storage, and no existing rows violating the audited hardening conditions at that time.
- The 2026-10-02 progress record says migrations 21–25 were written but **not applied**; no SQL was executed against a database that day. It records a last read-only snapshot of one user, one workspace, one Owner membership, no projects/tasks/invites/storage objects/MFA factors, and Enterprise plan via test plan switch. This is historical project evidence, not a fresh DB observation by this audit.
- Existing reports still list real-account role tests and two-account cross-workspace tests as open.

### What I could not truthfully verify today

I could not connect to Supabase MCP: this session exposed no Supabase schema/query tool. A local `.mcp.json` path exists, but it was not opened, and no secrets/config values were read. Therefore the audit does not claim current applied migration state, current table/row counts, current RLS policy bodies, indexes/FKs, actual duplicate data, or actual storage objects.

### Read-only DB checks needed when MCP is available

1. Confirm applied migration ledger and compare against folders 00–25; do not apply anything during inspection.
2. Inventory all `public` tables, columns, PK/FK/unique/check constraints, indexes, triggers, grants and RLS policy expressions.
3. Inspect functions and views, especially `member_role_in`, `is_member`, `can_edit`, `is_admin`, `has_permission`, `test_set_plan`, `delete_my_account`, `get_shared`, `use_ai_action`, `freebusy_tokens`, `push_targets`, and `get_calendar_feed`.
4. Confirm whether migration 19's test switch is on and who can call its function; inspect plan values without changing them.
5. Read counts and relationship integrity only: workspace/member/project/task/comment/event/notification rows; tasks whose assignee or blocker is not a member/task of the same workspace; custom-field JSON keys without a definition; profiles whose email differs from Auth email where safely queryable; attachment metadata with missing storage objects; duplicate notification candidates by user/task/message/time.
6. Verify private storage bucket policies and workspace-scoped object paths; do not list or download file contents.
7. Run cross-workspace reads/writes with two controlled accounts only after user approval and test accounts are available. Never mutate live rows for an audit.

## 8. What is verified versus not

### Verified in this audit session

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; 62 app/static/dynamic routes generated.
- `npm run test:csv`: 8/8 passed.
- `npm run test:integrations`: 57/57 passed.
- `npm run i18n:check`: Urdu 1,573/1,573 keys, zero missing/extra/placeholder mismatches.
- `npm run i18n:test`: 10/10 passed.
- `npm audit --omit=dev`: failed with one High `xlsx` advisory, no fix reported.
- `git status`: branch `fixes-v1`; staged, unstaged and untracked changes pre-exist. This audit did not modify them except adding this report.

### No end-to-end feature marked 100%

The checks above verify compilation, build, localization and narrow helper behavior only. They do not prove live auth, server authorization, RLS, data durability, browser UX, provider delivery, cross-tenant isolation or migration compatibility. The prior RLS audit provides useful earlier DB evidence, but no DB MCP check was possible today and migrations 21–25 are not verified live.

## 9. Recommended repair and delivery order

1. **Resolve role model first.** Record whether Owner remains and what Client Viewer means. Keep migration 21 unapplied until the role contract and migration plan are approved.
2. **Close authorization blockers.** Enforce deactivation in DB/API; redesign `/api/notify` around authorized, non-replayable events and atomic limits; enforce paid entitlements server-side; disable test plan switching before production.
3. **Make core persistence trustworthy.** Roll back failed optimistic mutations, atomically create/replace project columns, and add failure/concurrency tests.
4. **Choose one public workflow.** Implement share as strictly read-only public API, or implement the public submit API with abuse controls. Do not mix both behaviors into the current in-memory store page.
5. **Fix consistency.** Reconcile optimistic inbox rows, establish canonical email source/sync, and define custom-field stable keys and deletion behavior.
6. **Make analytics evidence-based.** Build metrics from real task event timestamps; show insufficient history where data is absent.
7. **Prepare DB rollout only after approval.** Test ordered migrations in disposable PostgreSQL/Supabase, review idempotency/data loss/rollback, then apply only explicitly approved files.
8. **Verify with real accounts.** Test owner/admin/member/viewer/client-viewer cases, two workspaces, guessed IDs, deactivated user, provider failures, public routes, and refresh persistence.
9. **Bring docs and dependencies into line.** Correct README, decide on `xlsx` and pending packages, and fill required continuity docs under an explicitly approved documentation scope.

## 10. Final assessment

PulseBoard has a substantial UI and a real Supabase integration foundation, but current behavior still mixes demo, local-only, database-backed, and provider-backed features. Base RLS hardening has prior evidence; the latest architectural changes and provider flows do not have live verification. No feature should be described as “100% correct” or production-ready based on the current checks. First resolve role/migration approval and server authorization, then stabilize persistence and test one complete real-user workflow end to end.