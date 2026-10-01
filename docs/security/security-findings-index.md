# PulseBoard Security Findings Index

Security findings, bugs and errors found in PulseBoard: what was wrong, why it
mattered, how it was fixed, and how the fix was verified. One file per audit or
fix batch, newest first. Technical detail (exact SQL, rollback) stays in the
migration or source files; these docs link to them instead of copying them.

## Reports

| Date | Report | Scope | Status |
| ---- | ------ | ----- | ------ |
| 2026-10-01 | [DB security hardening (RLS audit)](./2026-10-01-rls-audit.md) | Supabase RLS, grants and functions on all 16 public tables + storage; `/api/email` | IMPLEMENTED, NOT YET VERIFIED — `…1800`–`…1890` applied and DB-verified (incl. regression fix F-14); browser / two-account tests pending |

## Open items (across reports)

Things found but deliberately not fixed yet. Move a row into a report when it is fixed.

| ID | Severity | Item | Found in |
| -- | -------- | ---- | -------- |
| F-2026-10-01-10 | Informational | An Owner can demote themselves, leaving a workspace with no Owner. Needs an ownership-transfer flow | [2026-10-01](./2026-10-01-rls-audit.md#not-changed-on-purpose) |
| F-2026-10-01-11 | Low | A sender can mark their own `email_outbox` row as `sent` (log only; no email is sent) | [2026-10-01](./2026-10-01-rls-audit.md#not-changed-on-purpose) |
| F-2026-10-01-12 | Low | `tasks.assignee_id` / `blocked_by` are not checked to be members / tasks of the same workspace | [2026-10-01](./2026-10-01-rls-audit.md#not-changed-on-purpose) |
| F-2026-10-01-13 | Low | Supabase Auth "Leaked password protection" is off (dashboard setting) | [2026-10-01](./2026-10-01-rls-audit.md#required-setup) |

## How to write a report

File name: `YYYY-MM-DD-<topic>-audit.md` (or `-fix.md` for a single bug / error fix). Each finding gets an ID
`F-<date>-<nn>` and these fields:

- **Severity:** Critical / High / Medium / Low / Informational
- **Location:** file, route, table, policy, function or bucket
- **Problem** and **attack / failure scenario**
- **Impact**
- **Fix** (with links to the changed files)
- **Status:** use the labels from `CLAUDE.md` (IMPLEMENTED + VERIFIED, IMPLEMENTED, NOT YET VERIFIED, …)
- **Verification:** what was actually run, and what could not be tested

Never mark a finding fixed or verified unless that was actually done.
