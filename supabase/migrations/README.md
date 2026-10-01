# Database migrations

One folder per module. Each file is named `<timestamp>_<verb>_<what>.sql`, and
the timestamp is the global run order, across all folders.

## How to run

Supabase Dashboard → **SQL Editor** → paste each file and **Run**. Go folder
by folder, top to bottom, following the file order within each folder. Every
file is meant to run once.

> The Supabase CLI (`supabase db push`) only reads files placed directly in
> `supabase/migrations/`, not in subfolders. To use the CLI later, move the files
> up one level; the timestamps already keep them in the right order.

## Run order

| # | Folder | What it sets up |
| - | ------ | --------------- |
| 00 | `00_foundation` | `pgcrypto` extension, `member_role` and `plan_tier` enums |
| 01 | `01_auth-and-workspaces` | `profiles`, `workspaces`, `workspace_members`, RLS helper functions, sign-up trigger (profile + own workspace as Owner), RLS |
| 02 | `02_projects` | `projects` (boards), Free-plan 1-project limit trigger, RLS |
| 03 | `03_board-columns` | `board_columns` (custom columns, WIP limits, order), RLS |
| 04 | `04_tasks` | `tasks` (all task fields, soft delete, archive), RLS |
| 05 | `05_comments` | `comments` (threaded, likes), RLS |
| 06 | `06_task-events` | `task_events` (history, audit log, activity feed, analytics), RLS |
| 07 | `07_notifications` | `notifications` (inbox), RLS |
| 08 | `08_clients` | `clients` (budgets, rates, report schedule), RLS |
| 09 | `09_automations` | `automation_rules`, `webhook_deliveries`, RLS |
| 10 | `10_sharing` | `share_links`, `get_shared()` public read-only function, RLS |
| 11 | `11_attachments-storage` | `attachments`, private `task-files` bucket, plan storage quota (1 / 5 / 10 GB), RLS on table + bucket |
| 12 | `12_email` | `email_outbox` (sent-email log), RLS |
| 13 | `13_realtime` | Realtime broadcasts for tasks, comments, notifications |
| 14 | `14_role-permissions` | Admin-editable RBAC: `role_permissions` table, `has_permission()` with default matrix, task update trigger (delete / archive / assign / edit checked separately), and replacement policies for tasks, comments, projects, columns, members, clients, automations, share links |
| 15 | `15_api-grants` | Table privileges for the signed-in API role (`authenticated`), limited to the operations each table has policies for; protected columns (`plan`, profile `email`, member ids) get no UPDATE grant. Required on new Supabase projects, which no longer grant these by default |
| 16 | `16_workspace-invites` | `workspace_invites` (pre-approved emails with a role, 7-day expiry), RLS (member.manage; only Owner grants Admin), column-limited grants, and the sign-up trigger now joins an invited workspace instead of creating a personal one. Dev shortcut: no email is sent yet |
| 17 | `17_sub-admin-role` | **Run `..._add_sub_admin_to_member_role.sql` on its own first.** Adds the Sub Admin role and its default permissions; Viewer can only ever be granted pages; Admin controls the Sub Admin / Member / Viewer matrix rows and members, while only the Owner grants, changes or removes Admins |
| 18 | `18_security-hardening` | Closes tenant-isolation gaps found in the 2026-10-01 RLS audit: storage usage/plan functions only answer for the caller's own workspaces; trigger functions removed from the RPC API; RLS helpers not callable by signed-out visitors (`get_shared()` stays public); senders can read their own `email_outbox` rows (fixes the Member rate-limit bypass); share links can only target the same workspace and `get_shared()` re-checks it; no direct inserts into `workspace_members` (join via invites only); only a comment's author edits its body and likes only toggle your own id; child rows (comments, attachments, events, notifications) must reference a task in the same workspace; `workspace_id` / parent columns locked on update. `…1890` fixes a bug in `…1860` that rejected comment replies. Each file ends with its rollback SQL |

## Security model

- Every table has **Row Level Security**. Users only see workspaces they're members of.
- Roles: **Owner / Admin** manage projects, columns, members, clients and rules. **Member** edits tasks. **Viewer** is read-only.
- After folder 14, those defaults become an **editable matrix** (Settings → Roles & permissions). The Owner always has full access; an Admin can only change Member and Viewer. A role without a page permission can't read that page's data either (e.g. clients, automations).
- Plan limits (Free: 1 project; storage 1 / 5 / 10 GB) are enforced by triggers, so they can't be bypassed from the client.
- The `plan` column can only change through billing (service role), never from the browser.
