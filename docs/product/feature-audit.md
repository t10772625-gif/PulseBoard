# Feature Audit

The single, deduplicated list of every PulseBoard feature idea. Each feature
appears **once**, with its merged description, estimates, market notes,
reality checks, and the original source numbers it came from.

This file replaces four earlier docs, which were merged here and then removed:

| Former doc                 | Short code | Entries |
| -------------------------- | ---------- | ------- |
| `features-to-implement.md` | **FTI**    | 28      |
| `feature-catalog.md`       | **CAT**    | 55      |
| `platform-features.md`     | **PLT**    | 50      |
| `game-changer-features.md` | **GC**     | 20      |

Every source number is mapped to its new ID in the [Source Index](#source-index),
so any point from the old docs can be traced.

Stays separate (different purpose, not duplicated here):

- [future-features.md](./future-features.md): **technical specs** (data model, API, frontend) for 30 features. Referred to as **SPEC #n**.
- [free-features.md](./free-features.md): free-tier **integrations and libraries** with cost reality checks. Referred to as **FREE #n**.
- [feasibility-analysis.md](./feasibility-analysis.md): build/skip verdicts for SPEC #1–20.
- [github-integration.md](./github-integration.md): GitHub App technical design.
- [pricing.md](./pricing.md): tiers and **which tier gets which feature** (by the IDs below).

> **Status:** Planning. Effort and cost figures are rough estimates from the
> original proposals. Reality checks are added where the original assumption
> didn't hold.

## Contents

1. [ID Scheme](#id-scheme)
2. [Core Task Management (CORE)](#core-task-management-core)
3. [Views & Visualization (VIEW)](#views--visualization-view)
4. [AI & Automation (AI)](#ai--automation-ai)
5. [Email & Notifications (NOTIF)](#email--notifications-notif)
6. [Time & Productivity (TIME)](#time--productivity-time)
7. [Analytics & Insights (ANL)](#analytics--insights-anl)
8. [Collaboration (COL)](#collaboration-col)
9. [Security & Permissions (SEC)](#security--permissions-sec)
10. [Mobile & Offline (MOB)](#mobile--offline-mob)
11. [Advanced & Platform (ADV)](#advanced--platform-adv)
12. [Client & Agency (CLI)](#client--agency-cli)
13. [Developer Experience (DEV)](#developer-experience-dev)
14. [Integrations (INT)](#integrations-int)
15. [Market Comparison](#market-comparison)
16. [USP Claims & Uniqueness](#usp-claims--uniqueness)
17. [Business Impact](#business-impact)
18. [Privacy & Trust Review](#privacy--trust-review)
19. [Cross-Cutting Implementation Notes](#cross-cutting-implementation-notes)
20. [All MVP / Roadmap Proposals](#all-mvp--roadmap-proposals)
21. [Totals: Claims vs Reality](#totals-claims-vs-reality)
22. [Open Questions](#open-questions)
23. [Source Index](#source-index)

---

## ID Scheme

`CATEGORY-NN`, e.g. `CORE-04`, `AI-03`. IDs are stable. Use them in
[pricing.md](./pricing.md), roadmaps, and issues instead of per-doc numbers
(which clash: "#9" meant four different features across the old docs).

Legend: **Effort** = developer-days · **Cost** = monthly running cost ·
**Impact** = ⭐ 1–5 as originally proposed.

---

## Core Task Management (CORE)

| ID      | Feature                         | Effort | Cost        | Impact     | Sources            |
| ------- | ------------------------------- | ------ | ----------- | ---------- | ------------------ |
| CORE-01 | Custom Boards                   | —      | $0          | High       | FTI 1 · SPEC 1     |
| CORE-02 | Custom Columns                  | —      | $0          | High       | FTI 2 · SPEC 2     |
| CORE-03 | Smart Board Templates           | 4 days | $0          | ⭐⭐⭐⭐⭐ | CAT 42             |
| CORE-04 | Bulk Delete                     | 1 day  | $0          | ⭐⭐⭐⭐⭐ | CAT 1              |
| CORE-05 | Bulk Status Change              | 1 day  | $0          | ⭐⭐⭐⭐⭐ | CAT 2              |
| CORE-06 | Bulk Assign                     | 1 day  | $0          | ⭐⭐⭐⭐⭐ | CAT 3              |
| CORE-07 | Keyboard Shortcuts              | 2 days | $0          | ⭐⭐⭐⭐⭐ | CAT 4              |
| CORE-08 | CSV Import                      | 3 days | $0          | ⭐⭐⭐⭐⭐ | CAT 5 · FREE 12    |
| CORE-09 | CSV Export                      | 2 days | $0          | ⭐⭐⭐⭐   | CAT 6              |
| CORE-10 | Save as Template                | 3 days | $0          | ⭐⭐⭐⭐⭐ | CAT 7 · FREE 41–42 |
| CORE-11 | Recurring Tasks                 | 3 days | $0          | ⭐⭐⭐⭐⭐ | CAT 8              |
| CORE-12 | Task Dependencies (manual)      | 3 days | $0          | ⭐⭐⭐⭐⭐ | CAT 9              |
| CORE-13 | Subtasks                        | 3 days | $0          | ⭐⭐⭐⭐⭐ | CAT 10             |
| CORE-14 | Checklists                      | 2 days | $0          | ⭐⭐⭐⭐   | CAT 11             |
| CORE-15 | Task Comments                   | 2 days | $0          | ⭐⭐⭐⭐⭐ | CAT 12             |
| CORE-16 | File Attachments                | 2 days | $0–10/month | ⭐⭐⭐⭐   | CAT 13             |
| CORE-17 | Task History / Audit Log        | 2–3 days | $0        | ⭐⭐⭐⭐   | CAT 14 · PLT 46    |
| CORE-18 | Quick Add                       | 2 days | $0          | ⭐⭐⭐⭐⭐ | CAT 15             |
| CORE-19 | Custom Fields                   | 3 days | $0          | ⭐⭐⭐⭐   | CAT 18             |
| CORE-20 | Task Cloning                    | 2 days | $0          | ⭐⭐⭐⭐   | CAT 28             |
| CORE-21 | Task Archiving (Soft Delete)    | 2 days | $0          | ⭐⭐⭐⭐   | CAT 29             |
| CORE-22 | Undo Delete                     | 2 days | $0          | ⭐⭐⭐⭐⭐ | CAT 30 · FREE 50   |

### CORE-01 · Custom Boards

- **What:** The Owner/Admin purchases the plan; Sub-Admins (HR, Sales, Dev) create their own boards.
- **Spec:** full data model, API, and permissions in [SPEC #1](./future-features.md#1-custom-boards).
- **Market:** ✅ available in ClickUp, Monday. Uniqueness ❌. Priority High.

### CORE-02 · Custom Columns

- **What:** Per-team workflows, e.g. HR: Pending / Review / Rejected; Sales: Lead / Calls / On Hold / Completed.
- **Spec:** [SPEC #2](./future-features.md#2-custom-columns) (includes default HR/Sales/Dev templates).
- **Market:** ✅ available in ClickUp, Monday. Uniqueness ❌. Priority High.

### CORE-03 · Smart Board Templates

- **Problem:** Building boards from scratch for each industry.
- **Solution:** Pre-built templates:

```text
HR:      Pending → Interview → Shortlisted → Rejected
Sales:   Lead → Call → Demo → Negotiation → Closed
Dev:     Backlog → Todo → In Progress → Review → Done
Agency:  Brief → Design → Dev → QA → Client Review → Live
```

- **Note:** extends the default templates in CORE-02 / [SPEC #2](./future-features.md#2-custom-columns).

### CORE-04 · Bulk Delete

- **Problem:** Deleting 50 tasks one at a time.
- **Solution:** Select with checkboxes → press Delete → all removed.
- **Note:** build on the soft-delete model (see CORE-21/22).

### CORE-05 · Bulk Status Change

- **Problem:** Marking 20 tasks as Done individually.
- **Solution:** Multi-select → status dropdown → "Done" → all updated.

### CORE-06 · Bulk Assign

- **Problem:** Assigning 15 tasks to one developer.
- **Solution:** Multi-select → assignee dropdown → Mehroze → all assigned.
- **Note:** CORE-04/05/06 share one multi-select UI ([FREE #49](./free-features.md#category-3--free-productivity-3650)).

### CORE-07 · Keyboard Shortcuts

Power-user shortcuts, as proposed:

| Shortcut | Action                  |
| -------- | ----------------------- |
| `Ctrl+A` | Select all tasks        |
| `Delete` | Delete selected tasks   |
| `Ctrl+D` | Duplicate task          |
| `Ctrl+E` | Edit task               |
| `Ctrl+F` | Search                  |
| `Ctrl+N` | New task                |
| `Esc`    | Close modal             |
| `?`      | Show all shortcuts      |

> ⚠️ **Reality check:** several collide with browser shortcuts. `Ctrl+N` (new
> window) can't be overridden in most browsers, `Ctrl+D` is bookmark, `Ctrl+F`
> is page find, and `Ctrl+A` breaks text selection inside inputs. Use single-key
> shortcuts active only outside text fields (e.g. `C` create, `/` search,
> `E` edit), as Linear and GitHub do.

### CORE-08 · CSV Import

- **Problem:** Creating 100 tasks manually.
- **Solution:** Upload a CSV (title, description, assignee, priority) → map columns → tasks created.
- **Note:** Excel import and the `xlsx` security advisory are covered in [FREE #12](./free-features.md#12-csv--excel-import).

### CORE-09 · CSV Export

- **Problem:** Need a data backup or an Excel report.
- **Solution:** One-click CSV export.

### CORE-10 · Save as Template

- **Problem:** Recreating the same tasks for every new client.
- **Solution:** "Save as Template" → "Load Template" for the next client → tasks created.
- **Note:** covers both task templates and board templates (board export/import as JSON) from [FREE #41–42](./free-features.md#category-3--free-productivity-3650).

### CORE-11 · Recurring Tasks

- **Problem:** The same daily / weekly / monthly tasks (standup, report, review).
- **Solution:** A recurrence rule:

```text
Task:     Weekly Standup
Repeat:   Every Monday, 10 AM
Assignee: All developers
```

### CORE-12 · Task Dependencies (manual)

- **Problem:** Not knowing that Task B depends on Task A.
- **Solution:** Manual dependency links with auto-unblock:

```text
Task B → blocked by → Task A
Task A completed → Task B automatically unblocked
```

- **Note:** the AI version is AI-13.

### CORE-13 · Subtasks

- **Problem:** Breaking a large task into smaller parts.
- **Solution:** Parent task with subtasks:

```text
Parent:    Build login feature
Subtask 1: Design UI
Subtask 2: Write API
Subtask 3: Testing
```

- **Note:** AI-28 proposes subtasks automatically.

### CORE-14 · Checklists

- **Problem:** A task has several steps.
- **Solution:** An in-task checklist:

```text
Task: Deploy to production
  ☐ Code review complete
  ☐ Tests pass
  ☐ Staging deploy
  ☐ Production deploy
```

### CORE-15 · Task Comments

- **Problem:** Task discussion is scattered across Slack.
- **Solution:** A comment thread on each task:

```text
Mehroze: API is fixed
Nikhil:  Testing is pending
Owner:   Please complete by tomorrow
```

- **Note:** @mentions and emoji reactions are [FREE #39–40](./free-features.md#category-3--free-productivity-3650).

### CORE-16 · File Attachments

- **Problem:** Screenshots, docs, and specs aren't linked to tasks.
- **Solution:** Drag-and-drop attachments. Storage: Supabase Storage or AWS S3.

### CORE-17 · Task History / Audit Log

- **Problem:** No record of who changed what; needed for compliance and debugging.
- **Solution:** Per-task history, plus a workspace-wide audit log:

```text
Sep 30, 10 AM  Mehroze changed status to "In Progress"
Sep 30, 11 AM  Nikhil added a comment
Sep 30, 12 PM  Owner changed priority from P1 to P0
```

- **Merged:** CAT 14 (Task History, 2 days) and PLT 46 (Audit Log, 3 days, audit log table) are the same data.
- **Note:** build **one** event table that serves task history, the audit log, the activity feed (COL-07), and the status-history needs of analytics (ANL). See [Cross-Cutting Notes](#cross-cutting-implementation-notes).
- **Note:** GDPR deletion (SEC-10) should anonymize entries here, not delete them.

### CORE-18 · Quick Add

- **Problem:** Opening a modal to create a task is slow.
- **Solution:** "+ Add task" at the end of a column → type → Enter.
- **Related:** inline edit on the card ([FREE #48](./free-features.md#category-3--free-productivity-3650)).

### CORE-19 · Custom Fields

- **Problem:** Tasks need extra data (e.g. client name, budget).
- **Solution:** Typed custom fields:

```text
Client Name  (text)
Budget       (number)
Priority     (dropdown: High / Medium / Low)
```

### CORE-20 · Task Cloning

- **Problem:** Recreating the same task repeatedly.
- **Solution:** "Duplicate" button → copy opens for editing → save.

### CORE-21 · Task Archiving (Soft Delete)

- **Problem:** Deleting loses data permanently.
- **Solution:** "Archive" hides the task; it can be restored later.

### CORE-22 · Undo Delete

- **Problem:** Accidental deletion.
- **Solution:** A 5-second "Undo" toast that restores the task.
- **Note:** build CORE-04 (Bulk Delete), CORE-21 (Archiving), and Undo on the same soft-delete model (a `deleted_at` column) from the start; undo is then just clearing that column. General undo/redo is [FREE #50](./free-features.md#category-3--free-productivity-3650).

---

## Views & Visualization (VIEW)

| ID      | Feature                        | Effort   | Cost | Library / Notes     | Impact     | Sources              |
| ------- | ------------------------------ | -------- | ---- | ------------------- | ---------- | -------------------- |
| VIEW-01 | Board (Kanban) view            | —        | $0   | ✅ exists in app    | —          | Audit list           |
| VIEW-02 | List view                      | —        | $0   | ⚠️ not specified    | —          | Audit list           |
| VIEW-03 | Gantt Chart                    | 5 days   | $0*  | License note        | ⭐⭐⭐⭐⭐ | CAT 19               |
| VIEW-04 | Calendar View                  | 4 days   | $0   | FullCalendar        | ⭐⭐⭐⭐   | CAT 20               |
| VIEW-05 | Timeline View (Roadmap)        | 5 days   | $0   |                     | ⭐⭐⭐⭐   | CAT 21               |
| VIEW-06 | Workload View                  | 4 days   | $0   |                     | ⭐⭐⭐⭐⭐ | CAT 22               |
| VIEW-07 | Burndown Chart                 | 4 days   | $0   | Chart.js / Recharts | ⭐⭐⭐⭐   | CAT 23               |
| VIEW-08 | Velocity Chart / Trends        | 3–4 days | $0   | Chart.js / Recharts | ⭐⭐⭐⭐   | CAT 24 · PLT 13      |
| VIEW-09 | Dashboard (Custom Widgets)     | 3–5 days | $0   | Chart.js / Recharts | ⭐⭐⭐⭐⭐ | CAT 25 · PLT 11      |
| VIEW-10 | Saved Filters                  | 3 days   | $0   |                     | ⭐⭐⭐⭐   | CAT 26 · FREE 43–44  |
| VIEW-11 | Advanced Search                | 4 days   | $0   |                     | ⭐⭐⭐⭐   | CAT 27               |

### VIEW-01 · Board (Kanban) View

Listed in the final audit. Already implemented, including task drag-and-drop
(native HTML5 drag events).

### VIEW-02 · List View

Listed in the final audit but **not specified in any doc**. Needs a spec: sortable
columns, grouping, inline edit.

### VIEW-03 · Gantt Chart

- **Problem:** No timeline view of tasks.
- **Solution:**

```text
Task A: [====]           (Sep 1–5)
Task B:     [====]       (Sep 3–7)
Task C:         [====]   (Sep 6–10)
```

> ⚠️ **License:** the original proposal named dhtmlxGantt ("open-source"). Its free
> edition is **GPL**; a closed-source SaaS needs a commercial license. MIT
> alternatives: Frappe Gantt, or a custom build.

### VIEW-04 · Calendar View

- **Problem:** Need to see due dates on a calendar.
- **Solution:** Calendar view (FullCalendar; core is MIT, some premium plugins are paid).

```text
Sep 30: [Task A] [Task B]
Oct 1:  [Task C]
Oct 2:  [Task D] [Task E]
```

### VIEW-05 · Timeline View (Roadmap)

- **Problem:** Need a long-term (month / quarter) roadmap.
- **Solution:**

```text
Q1: [Feature A] [Feature B]
Q2:     [Feature C] [Feature D]
Q3:         [Feature E]
```

### VIEW-06 · Workload View

- **Problem:** Who is overloaded, who is free?
- **Solution:**

```text
Mehroze: [████████░░] 12/15 tasks
Nikhil:  [████░░░░░░]  5/15 tasks
Ali:     [███████░░░] 10/15 tasks
```

- **Note:** UI for AI-02 Workload Balancing ([SPEC #12](./future-features.md#12-developer-workload-balancing)).

### VIEW-07 · Burndown Chart

- **Problem:** Is the sprint on track?
- **Solution:** Remaining work per day vs the ideal line:

```text
Day 1: 50 tasks
Day 2: 40 tasks
Day 3: 30 tasks
Target: 0 tasks by Day 5
```

### VIEW-08 · Velocity Chart / Trends

- **Problem:** How much does the team complete per sprint?
- **Solution:** Sprint-over-sprint velocity:

```text
Sprint 1: 40 tasks
Sprint 2: 45 tasks
Sprint 3: 50 tasks
Average:  45 tasks/sprint
```

- **Merged:** CAT 24 (Velocity Chart, 4 days) and PLT 13 (Velocity Trends, 3 days, aggregate history).
- **Note:** feeds [SPEC #27 Sprint Auto-Planning](./future-features.md#27-sprint-auto-planning).

### VIEW-09 · Dashboard (Custom Widgets)

- **Problem:** Data is spread across pages; need a quick overview.
- **Solution:** A configurable dashboard:

```text
Widget 1: Tasks by status     (pie chart)
Widget 2: Tasks by assignee   (bar chart)
Widget 3: Overdue tasks       (list)
Widget 4: Recent activity     (feed)
```

- **Merged:** CAT 25 (Dashboard, 5 days) and PLT 11 (Task Analytics Dashboard: tasks by status / assignee / priority, Chart.js or Recharts, 3 days).

### VIEW-10 · Saved Filters

- **Problem:** Re-entering the same filters every day.
- **Solution:**

```text
My Tasks       assignee = me
Overdue        due_date < today
High Priority  priority IN (P0, P1)
```

- **Related:** quick filter buttons and saved views (filters + sort + columns) in [FREE #43–44](./free-features.md#category-3--free-productivity-3650); usage-based filter suggestions in [FREE #35](./free-features.md#35-smart-filter-suggestions).

### VIEW-11 · Advanced Search

- **Problem:** Complex queries, e.g. *"my P0 tasks due tomorrow"*.
- **Solution:** A query syntax:

```text
assignee = me AND priority = P0 AND due_date = tomorrow
```

- **Fixed:** the original example used `due_date < tomorrow` for "due tomorrow".
- **Related:** natural-language version is AI-21; full-text/fuzzy engine is [FREE #28](./free-features.md#28-smart-search) (Postgres FTS + `pg_trgm`).

---

## AI & Automation (AI)

| ID    | Feature                                   | Effort    | Cost           | Impact     | Sources                          |
| ----- | ----------------------------------------- | --------- | -------------- | ---------- | -------------------------------- |
| AI-01 | Smart Matching (auto-assign)              | 3–4 days  | $0             | ⭐⭐⭐⭐⭐ | FTI 6 · SPEC 6 · FREE 31         |
| AI-02 | Developer Workload Balancing              | 2–3 days  | $0             | ⭐⭐⭐⭐⭐ | FTI 12 · SPEC 12                 |
| AI-03 | Duplicate Detection & Smart Merge         | 4–5 days  | $0–20/month    | ⭐⭐⭐⭐⭐ | FTI 9 · CAT 31 · SPEC 9 · FREE 29 |
| AI-04 | Auto-Prioritization, Severity & Re-scoring| 2–5 days  | $0–50/month    | ⭐⭐⭐⭐⭐ | FTI 10 · FTI 20 · CAT 37 · SPEC 10 · SPEC 20 · FREE 30 |
| AI-05 | AI Bug Report (Image)                     | 4–5 days  | $10–300/month  | High       | FTI 3 · SPEC 3                   |
| AI-06 | AI Fix Suggestion                         | 15–20 days| $50–200/month  | High       | FTI 18 · SPEC 18                 |
| AI-07 | Voice Activation / Voice Input            | 3–7 days  | $0             | ⭐⭐⭐⭐   | FTI 4 · PLT 38 · SPEC 4          |
| AI-08 | Voice Notes → Task                        | 10–15 days| $50–100/month  | Low        | FTI 15 · SPEC 15                 |
| AI-09 | Smart Email Threading                     | 10–12 days| $20–50/month   | Medium     | FTI 13 · SPEC 13                 |
| AI-10 | AI Standup Summary                        | 5–7 days  | $10–30/month   | Medium     | FTI 14 · SPEC 14                 |
| AI-11 | Predictive Bug Forecasting                | 15–20 days| $0             | Low        | FTI 16 · SPEC 16                 |
| AI-12 | AI Meeting → Action Items                 | 10–15 days| $30–100/month  | Medium     | FTI 19 · SPEC 19                 |
| AI-13 | Dependency Auto-Detection                 | 5–7 days  | $0–100/month   | ⭐⭐⭐⭐⭐ | FTI 21 · CAT 51 · SPEC 29        |
| AI-14 | AI Test Case Generator                    | —         | —              | Low        | FTI 25                           |
| AI-15 | Competitor Bug Tracker                    | —         | —              | Low        | FTI 28                           |
| AI-16 | Auto-Tagging                              | 1–4 days  | $0–50/month    | ⭐⭐⭐⭐   | CAT 32 · FREE 34                 |
| AI-17 | Auto-Scheduling                           | 6 days    | $30–80/month   | ⭐⭐⭐⭐⭐ | CAT 34                           |
| AI-18 | Predictive Task Completion / Risk / Failure | 5–8 days | $0–150/month  | ⭐⭐⭐⭐⭐ | CAT 35 · CAT 53 · GC 19          |
| AI-19 | Smart Suggestions (Next Action)           | 6 days    | $30–80/month   | ⭐⭐⭐⭐⭐ | CAT 38                           |
| AI-20 | Auto-Documentation                        | 6 days    | $30–80/month   | ⭐⭐⭐⭐   | CAT 41                           |
| AI-21 | Smart Search (Natural Language)           | 5 days    | $20–50/month   | ⭐⭐⭐⭐⭐ | CAT 33                           |
| AI-22 | AI Meeting Scheduler                      | 7 days    | $50–100/month  | ⭐⭐⭐⭐⭐ | CAT 46                           |
| AI-23 | Smart Task Splitting                      | 7 days    | $50–100/month  | ⭐⭐⭐⭐⭐ | CAT 48                           |
| AI-24 | Eisenhower Priority Matrix                | 6 days    | $30–80/month   | ⭐⭐⭐⭐⭐ | CAT 49                           |
| AI-25 | Context-Aware Task Creation               | 7 days    | $50–100/month  | ⭐⭐⭐⭐⭐ | CAT 50                           |
| AI-26 | Auto-Resource Allocation                  | 8 days    | $80–150/month  | ⭐⭐⭐⭐⭐ | CAT 52                           |
| AI-27 | Smart Board Insights                      | 8 days    | $80–150/month  | ⭐⭐⭐⭐⭐ | CAT 54                           |
| AI-28 | Auto-Process Improvement                  | 9 days    | $100–200/month | ⭐⭐⭐⭐⭐ | CAT 55                           |

Effort/cost for AI-01…AI-12 come from [feasibility-analysis.md](./feasibility-analysis.md) where the original list didn't give them.

### AI-01 · Smart Matching (auto-assign)

- **What:** Use assignment history to route work. E.g. if Mehroze resolved similar incidents before, assign it to Mehroze.
- **Spec:** algorithm, tables, API in [SPEC #6](./future-features.md#6-smart-matching). Rule-based v0 (fixed module → expert map) is [FREE #31](./free-features.md#31-smart-assignee-suggestion-rule-based). Real module expertise from commits via [github-integration.md](./github-integration.md).
- **Market:** ❌ not available. Uniqueness ✅✅✅. Priority **Critical**. **Primary USP.**
- **Feasibility:** ✅ Build: $0 (SQL query, no AI API), 3–4 days.

### AI-02 · Developer Workload Balancing

- **What:** AI suggests reassignment when someone is overloaded (e.g. Mehroze → Nikhil).
- **Spec:** [SPEC #12](./future-features.md#12-developer-workload-balancing). UI is VIEW-06.
- **Market:** ❌ not available. Uniqueness ✅✅✅. Priority **Critical**. **Second USP.**
- **Feasibility:** ✅ Build: $0, 2–3 days.

### AI-03 · Duplicate Detection & Smart Merge

- **What:** AI detects similar bugs so the same issue isn't filed repeatedly; when two people report the same bug, a "Merge" button combines them.
- **Merged:** FTI 9 (Duplicate Bug Detection) and CAT 31 (Smart Merge: "AI detects the duplicate → Merge → tasks combined", 5 days, $0–20/month).
- **Spec:** [SPEC #9](./future-features.md#9-duplicate-bug-detection); open-source embedding notes (Node vs Python, pgvector, multilingual model for Roman Urdu) in [FREE #29](./free-features.md#29-duplicate-detection-open-source).
- **Market:** ⚠️ Jira Rovo. Uniqueness ✅. Priority High.
- **Feasibility:** ✅ Build: $0 (open-source SBERT), 4–5 days.

### AI-04 · Auto-Prioritization, Severity Detection & Re-scoring

One scoring service with three behaviours:

1. **Auto-Prioritization** (FTI 10): AI sets priority from module criticality, user impact, and SLA. Weighted scoring in [SPEC #10](./future-features.md#10-auto-prioritization).
2. **Bug Severity Auto-Detection** (FTI 20, [SPEC #20](./future-features.md#20-bug-severity-auto-detection)):

   ```text
   Input: "Login button is not working"

   AI analysis:
     Module:   Login (Critical)
     Impact:   100% of users affected
     Severity: P0 (Critical)

   Auto-set: Priority = P0
   ```

   Market ⚠️ basic version in Jira Rovo AI; uniqueness ✅ (better implementation possible); priority High.
3. **Auto-Priority Adjustment** (CAT 37, 5 days, $20–50/month): priorities go stale, so re-score as new signals arrive:

   ```text
   Task: "Login bug"
   Initial: P2
   10 more reports received → automatically raised to P0
   ```

- **Rule-based v0:** keyword → priority ([FREE #30](./free-features.md#30-auto-priority-rule-based)); note that "bug" → P1 would make almost every bug P1.
- **Market (FTI 10):** ❌ not available. Uniqueness ✅✅. Priority High.
- **Feasibility:** ✅ Build: $0 rules-based, 2–3 days. Severity detection should be **merged here**, not built separately ([feasibility](./feasibility-analysis.md#19-bug-severity-auto-detection)).

### AI-05 · AI Bug Report (Image)

- **What:** User describes a bug (optionally with a screenshot); AI returns a complete report including expected behaviour.
- **Spec:** [SPEC #3](./future-features.md#3-ai-bug-report-image). Mobile camera capture (MOB-09) feeds it.
- **Market:** ✅ GitHub Copilot. Uniqueness ⚠️. Priority High.
- **Feasibility:** ⚠️ $10–300/month scaling with usage; paid-tier feature with usage caps ([feasibility](./feasibility-analysis.md#9-ai-bug-report-image--report)).

### AI-06 · AI Fix Suggestion

- **What:** Suggest a potential fix alongside the bug, including relevant code/file names.
- **Spec:** [SPEC #18](./future-features.md#18-ai-fix-suggestion). Uses [github-integration.md](./github-integration.md).
- **Market:** ❌ not available. Uniqueness ✅✅. Priority High.
- **Feasibility:** ❌ Skip: codebase access (security), low accuracy, liability ([feasibility](./feasibility-analysis.md#17-ai-fix-suggestion)).
- **Conflict:** the original pricing listed "Auto Fix Suggestions" under Enterprise. See [pricing.md](./pricing.md).

### AI-07 · Voice Activation / Voice Input

- **What:** Create and update tasks by voice (desktop and mobile).
- **Merged:** FTI 4 (Voice Activation) and PLT 38 (Voice Input on mobile, Web Speech API, 3 days, $0, ⭐⭐⭐⭐).
- **Spec:** [SPEC #4](./future-features.md#4-voice-activation).
- **Market:** ❌ not available. Uniqueness ✅✅. Priority Medium.
- **Reality check:** Web Speech recognition isn't available in all browsers (notably Firefox); accuracy issues; low adoption. Nice-to-have, later phase ([feasibility](./feasibility-analysis.md#11-voice-activation)).

### AI-08 · Voice Notes → Task

- **What:** Turn a voice note into a task (hands-free, e.g. while driving).
- **Spec:** [SPEC #15](./future-features.md#15-voice-notes--task).
- **Market:** ❌. Uniqueness ✅. Priority Low.
- **Feasibility:** ❌ Skip: needs a mobile app, expensive transcription, low adoption.

### AI-09 · Smart Email Threading

- **What:** Organize emails per candidate/contact (e.g. Ali Khan: Email 1, 2, 3 + linked task).
- **Spec:** [SPEC #13](./future-features.md#13-smart-email-threading).
- **Market:** ❌. Uniqueness ✅✅. Priority Medium.
- **Feasibility:** ❌ Skip: Gmail/Outlook already thread; high complexity.

### AI-10 · AI Standup Summary

- **What:** Daily auto-generated standup (e.g. Mehroze: 3 bugs fixed; Nikhil: testing).
- **Spec:** [SPEC #14](./future-features.md#14-ai-standup-summary). Superseded by [SPEC #24 Async Standup](./future-features.md#24-async-standup), which collects the input itself.
- **Market:** ❌. Uniqueness ✅✅. Priority Medium.
- **Feasibility:** ❌ Skip as a separate summarizer.

### AI-11 · Predictive Bug Forecasting

- **What:** AI forecasts incoming bug volume (e.g. "~50 bugs expected next week").
- **Spec:** [SPEC #16](./future-features.md#16-predictive-bug-forecasting).
- **Market:** ❌. Uniqueness ✅✅✅. Priority Low. Listed as a USP/killer feature in FTI.
- **Business impact (FTI):** revenue ⭐⭐⭐⭐, effort High, ROI ⭐⭐⭐.
- **Feasibility:** ❌ Skip until 1,000+ active users: needs 6+ months of data.

### AI-12 · AI Meeting → Action Items

- **What:** Extract action items automatically from team meetings (Zoom / Google Meet).

```text
Meeting notes:
  "Login needs to be fixed by tomorrow"
  "Demo for Client X on Friday"

Auto-created tasks:
  ✅ Fix login button   (Due: Tomorrow, Assignee: Mehroze)
  ✅ Demo for Client X  (Due: Friday,   Assignee: Sales Rep)
```

- **Spec:** [SPEC #19](./future-features.md#19-ai-meeting--action-items).
- **Market:** not available; existing tools only transcribe, they don't create action items. Uniqueness ✅✅✅. Priority Medium.
- **Feasibility:** ❌ Skip: recording upload friction, accuracy, cost.

### AI-13 · Dependency Auto-Detection

- **What:** AI detects and links dependencies between issues.

```text
Bug A: "API endpoint not working"
Bug B: "Login button not responding"

AI detection: Bug B depends on Bug A (login button uses that API)
Auto-link:    Bug A → Bug B
```

```text
Task A: "Fix API endpoint /login"
Task B: "Fix login button timeout"

"Task B depends on Task A (login button calls /login API). Set dependency?"
```

- **Merged:** FTI 21 (Auto-Dependency Mapping) and CAT 51 (Smart Dependency Detection, 7 days, $50–100/month).
- **Spec:** [SPEC #29](./future-features.md#29-task-dependencies-auto-detect) ($0–20/month, 5–7 days). Import-graph detection without AI in [github-integration.md](./github-integration.md#use-case-3-dependency-detection).
- **Market:** not available; dependencies are set manually elsewhere. Uniqueness ✅✅✅. Priority Medium. Listed as a USP in FTI.
- **Note:** manual version is CORE-12.

### AI-14 · AI Test Case Generator

- **What:** When a bug is fixed, AI generates test cases for it.

```text
Bug fixed: "Login timeout issue"

AI test cases:
  1. Login with valid credentials   → should pass
  2. Login with invalid credentials → should fail
  3. Login on a slow network        → should time out after 30s
  4. Login from mobile              → should work
```

- **Market:** not available (research stage only). Uniqueness ✅✅✅. Priority Low. Listed as a USP in FTI.
- **Note:** only documented in FTI; no spec or feasibility entry yet.

### AI-15 · Competitor Bug Tracker

- **What:** AI monitors public channels for competitor product issues.

```text
Competitor: "XYZ App"

Monitoring:
  - Twitter:   "XYZ app keeps crashing"
  - App Store: "Payments are failing"
  - Reddit:    "XYZ login issue"

Alert:
  "10 payment bugs reported for XYZ.
   Opportunity: market our payment module."
```

- **Market:** not available. Uniqueness ✅✅✅ (high value for sales/marketing). Priority Low. Listed as a USP in FTI.
- **Note:** only documented in FTI. Social-media and app-store data access (APIs, terms) needs checking before this is feasible.

### AI-16 · Auto-Tagging

- **Problem:** Tags are applied manually.
- **Solution:** AI suggests tags:

```text
Task:    "Login button not working on mobile"
AI tags: mobile, login, ui-bug, critical
```

- **Cheaper path:** keyword rules, 1 day, $0 ([FREE #34](./free-features.md#34-auto-tagging-keyword-based)) instead of the AI version (4 days, $20–50/month).

### AI-17 · Auto-Scheduling

- **Problem:** Setting task timelines manually.
- **Solution:**

```text
"These 10 tasks will take 2 weeks.
 Start: Oct 1 · End: Oct 14 · Buffer: 2 days"
```

### AI-18 · Predictive Task Completion / Risk / Failure

Three versions of the same prediction:

- **Risk Prediction** (CAT 35, 7 days, $50–100/month): not knowing a project will slip until it does.

  ```text
  "This project will be ~3 days late.
   Reason: 5 tasks overdue, 2 developers on leave.
   Suggestion: reassign 2 tasks."
  ```

- **Predictive Task Completion** (CAT 53, 8 days, $80–150/month): not knowing when a task will finish.

  ```text
  Task: "Build login feature"
    Estimated completion: Oct 5 (80% confidence)
    Risk: 2 dependencies pending
    Suggestion: clear the dependencies first
  ```

- **Predictive Task Failure** (GC 19, 5 days, $0 simple ML, claimed ✅✅✅✅): predict *"This task will be late"* from historical completion data + current velocity + open dependencies, to intervene early.

- **Reality check:** needs historical data (cold start). Start with simple rules (e.g. due in 2 days, not started, blocked) before any ML. Not an MVP feature.

### AI-19 · Smart Suggestions (Next Action)

- **Problem:** "What should I do next?"
- **Solution:**

```text
Next best actions:
  1. Complete Task A (due today)
  2. Review PR #123 (waiting 2 days)
  3. Update Client X (no contact for 5 days)
```

### AI-20 · Auto-Documentation

- **Problem:** Tasks get done, documentation doesn't.
- **Solution:** Generate docs from the completed task:

```text
Task: "Build login API"

POST /login
  Input:  { email, password }
  Output: { token, user }
  Errors: 400, 401
```

### AI-21 · Smart Search (Natural Language)

- **Problem:** Writing complex filters.
- **Solution:** Natural-language queries translated to filters:

```text
User: "My pending tasks from yesterday"
AI:   assignee = me AND due_date = yesterday AND status != done
```

> Note: in Urdu/Hindi *"kal"* means both yesterday and tomorrow; the parser
> should ask when it's ambiguous.

### AI-22 · AI Meeting Scheduler

- **Problem:** Scheduling a meeting takes many back-and-forth emails.
- **Solution:**

```text
User: "Schedule a team meeting tomorrow"
AI:   "Everyone is free tomorrow at 10 AM.
       Booked: Oct 1, 10 AM. Calendar invites sent."
```

- **Note:** needs a calendar integration (Google Calendar / Outlook; [FREE #2](./free-features.md#2-google-calendar-integration)). Calendly embed is [FREE #1](./free-features.md#1-calendly-integration).

### AI-23 · Smart Task Splitting

- **Problem:** Breaking large tasks down manually.
- **Solution:** AI proposes subtasks (CORE-13):

```text
Task: "Build login feature"
  1. Design UI      (2 days)
  2. Write API      (3 days)
  3. Write tests    (1 day)
  4. Code review    (1 day)
  5. Deploy         (1 day)
```

### AI-24 · Eisenhower Priority Matrix

- **Problem:** Deciding what to do first.
- **Solution:**

```text
Urgent + Important          → Do now     [Task A, Task B]
Not urgent + Important      → Schedule   [Task C, Task D]
Urgent + Not important      → Delegate   [Task E]
Not urgent + Not important  → Eliminate  [Task F]
```

### AI-25 · Context-Aware Task Creation

- **Problem:** Filling every field manually when creating a task.
- **Solution:**

```text
User: "Need to fix the login bug"

Auto-filled:
  Title:       Fix login button issue
  Description: Login button not responding on mobile
  Module:      Authentication  (detected)
  Priority:    P1              (module criticality)
  Assignee:    Mehroze         (module expertise)
  Estimate:    4 hours         (similar tasks)
```

- **Note:** combines AI-04 and AI-01, plus module detection ([FREE #32](./free-features.md#32-auto-module-detection-rule-based)).

### AI-26 · Auto-Resource Allocation

- **Problem:** Deciding who gets which task.
- **Solution:**

```text
10 new tasks — suggested allocation:
  Mehroze: 4 (Payment expert)
  Nikhil:  3 (Auth expert)
  Ali:     3 (available capacity)
```

- **Note:** batch version of AI-01 + AI-02.

### AI-27 · Smart Board Insights

- **Problem:** Raw board data doesn't produce insights.
- **Solution:**

```text
- Payment module had 40% of all bugs (highest)
  → strengthen code review there
- Mehroze completed 50 tasks (highest)
  → send appreciation
- Average resolution time fell from 6h to 4h (33% better)
  → congratulate the team
```

### AI-28 · Auto-Process Improvement

- **Problem:** Knowing how to improve the team's process.
- **Solution:**

```text
1. Cut daily standup from 30 to 15 min
2. Reduce code review turnaround from 2 days to 1
3. Raise test automation from 50% to 80%
4. Move client demos from weekly to bi-weekly
```

---

## Email & Notifications (NOTIF)

| ID       | Feature                          | Effort | Cost          | Impact     | Sources                        |
| -------- | -------------------------------- | ------ | ------------- | ---------- | ------------------------------ |
| NOTIF-01 | Email Templates                  | 3 days | $0–10/month   | ⭐⭐⭐⭐⭐ | CAT 16                         |
| NOTIF-02 | Automated Email Notifications    | 4 days | $0–10/month   | ⭐⭐⭐⭐⭐ | CAT 17                         |
| NOTIF-03 | Smart Notifications & Daily Digest | 5 days | $20–50/month | ⭐⭐⭐⭐⭐ | FTI 22 · CAT 36               |
| NOTIF-04 | Smart Reminders                  | 5 days | $20–50/month  | ⭐⭐⭐⭐   | CAT 40                         |
| NOTIF-05 | Auto-Status Report (weekly)      | 6 days | $30–80/month  | ⭐⭐⭐⭐⭐ | CAT 47                         |
| NOTIF-06 | Auto Client Reports              | 2–3 days | $0–10/month | Medium     | FTI 11 · SPEC 11               |

Web push is MOB-04. Do Not Disturb is TIME-04.

### NOTIF-01 · Email Templates

- **Problem:** Typing the same emails repeatedly.
- **Solution:** Pre-built templates with variables:

```text
HR — Interview Scheduled
  "Hi {{name}}, your interview is scheduled for {{date}}..."

Client — Project Update
  "Hi {{client}}, your project is {{progress}}% complete..."
```

- **Note:** the audit lists HR, client, and sales templates.

### NOTIF-02 · Automated Email Notifications

- **Problem:** Sending emails manually on every task update.
- **Solution:** Notification rules:

```text
Rule 1: Task assigned         → email the assignee
Rule 2: Task completed        → email the owner
Rule 3: Due date in 1 day     → remind the assignee
```

- **Note:** can be implemented as preset rules of [SPEC #21 Auto-Workflow Builder](./future-features.md#21-auto-workflow-builder).

### NOTIF-03 · Smart Notifications & Daily Digest

- **Problem:** ~100 notifications a day.
- **Solution:** AI triages notifications by importance:

```text
100 notifications received

  ✅ Important (5):  P0 bugs, SLA breaches, client complaints → immediate
  ⚠️ Review   (15): P1 bugs, module updates
  📦 Batch    (80): P2/P3 bugs, status updates → sent in daily digest
```

- **Merged:** FTI 22 (three buckets) and CAT 36 (two buckets: Important 5 / Batch 95 → daily digest email; 5 days, $20–50/month).
- **Market:** not available; other tools deliver every notification. Uniqueness ✅ (unique for SMB tools). Priority Medium.
- **Note:** a rule-based version (by priority/type) needs no AI.

### NOTIF-04 · Smart Reminders

- **Problem:** Generic "task is due" reminders.
- **Solution:** Context-aware reminders:

```text
"Task A is due tomorrow.
 Blocker: waiting for API access.
 Suggestion: ping the API team."
```

### NOTIF-05 · Auto-Status Report (weekly)

- **Problem:** The owner writes the weekly report manually.
- **Solution:**

```text
Weekly Report (Sep 23–29)

Highlights:
  - 40 bugs resolved (target: 30) 🎉
  - Zero P0 bugs in production
  - Client X demo successful

Lowlights:
  - 5 bugs took 2x the estimated time
  - 3 tasks blocked > 2 days

Next week:
  - 15 tasks planned
  - 2 releases scheduled
```

- **Related:** NOTIF-06 (client-facing), ANL-11 (sprint retrospective).

### NOTIF-06 · Auto Client Reports

- **What:** Scheduled automatic report emails to clients (e.g. every Friday).
- **Spec:** [SPEC #11](./future-features.md#11-auto-client-reports). Branded version is CLI-06.
- **Market:** ⚠️ Monday (basic). Uniqueness ✅. Priority Medium.
- **Feasibility:** ✅ Build.

---

## Time & Productivity (TIME)

| ID      | Feature                          | Effort   | Cost | Impact     | Claimed uniqueness                | Sources               |
| ------- | -------------------------------- | -------- | ---- | ---------- | --------------------------------- | --------------------- |
| TIME-01 | Time Tracking                    | 1–2 days | $0   | High       | ❌ (ClickUp, Monday)              | FTI 7 · SPEC 7        |
| TIME-02 | Time Estimates vs Actual & Time Analytics | 3–4 days | $0 | ⭐⭐⭐⭐ | —                          | CAT 44 · PLT 12       |
| TIME-03 | Focus Mode                       | 1 day    | $0   | ⭐⭐⭐⭐⭐ | ✅ (basic in Linear)              | GC 1                  |
| TIME-04 | Do Not Disturb                   | 1 day    | $0   | ⭐⭐⭐⭐⭐ | ✅ (in Slack, not PM tools)       | GC 2                  |
| TIME-05 | Deep Work Sessions (Pomodoro)    | 2 days   | $0   | ⭐⭐⭐⭐   | ✅✅                              | GC 3                  |
| TIME-06 | Task Batching                    | 3 days   | $0   | ⭐⭐⭐⭐⭐ | ✅✅✅                            | GC 4                  |
| TIME-07 | Energy-Based Sorting & Estimation| 2–3 days | $0   | ⭐⭐⭐⭐   | ✅✅✅                            | GC 5 · GC 8           |
| TIME-08 | Context Switching Tracker        | 2 days   | $0   | ⭐⭐⭐⭐   | ✅✅✅                            | GC 6                  |
| TIME-09 | Flow State Detection             | 3 days   | $0   | ⭐⭐⭐⭐⭐ | ✅✅✅✅                          | GC 7                  |
| TIME-10 | Optimal Task Time Suggestion     | 4 days   | $0   | ⭐⭐⭐⭐⭐ | ✅✅✅✅                          | GC 9                  |
| TIME-11 | Weekly Capacity Planning         | 4 days   | $0   | ⭐⭐⭐⭐⭐ | ✅✅✅ (in Motion, but expensive) | GC 10                 |

> **On uniqueness claims:** not verified. Focus/scheduling apps (Motion,
> Reclaim, Sunsama, Clockwise, RescueTime) already do several of these. The
> opportunity is **combining** them inside a PM tool, not inventing them.

### TIME-01 · Time Tracking

- **What:** Track how long each bug/task took to resolve.
- **Spec:** [SPEC #7](./future-features.md#7-time-tracking) (timer, time logs, SLA breach flag).
- **Market:** ✅ ClickUp, Monday. Uniqueness ❌. Priority High.
- **Feasibility:** ✅ Build: $0, 1–2 days.

### TIME-02 · Time Estimates vs Actual & Time Analytics

- **Problem:** No insight into estimation accuracy or where time goes.
- **Solution:**

```text
Task A: estimate 4h, actual 6h (50% over)
Task B: estimate 8h, actual 5h (37.5% under)
Average accuracy: 85%
```

- **Merged:** CAT 44 (Estimates vs Actual, 4 days) and PLT 12 (Time Tracking Analytics: average time per task, module, developer, aggregated from time logs; 3 days).
- **Note:** requires TIME-01.

### TIME-03 · Focus Mode

- **What:** Show only the current task; hide everything else.
- **Why:** Developers need long uninterrupted blocks (4–6 hours) for deep work.
- **How:** A focus view that hides navigation, board, and other tasks.

### TIME-04 · Do Not Disturb

- **What:** Temporarily mute notifications.
- **Why:** Don't break flow state.
- **How:** Notification settings + timer (e.g. mute for 1 hour); queued notifications delivered afterwards.

### TIME-05 · Deep Work Sessions (Pomodoro)

- **What:** Built-in 25-minute focus timer + 5-minute breaks.
- **How:** Timer component + break notifications. Can log sessions into TIME-01 automatically.

### TIME-06 · Task Batching

- **What:** Group similar tasks so they're done together.
- **Why:** Five similar tasks in one hour beat five unrelated tasks: less context switching.
- **How:** Cluster by module / tags / keywords (no paid AI needed). Reuses module detection ([FREE #32](./free-features.md#32-auto-module-detection-rule-based)) and AI-16.

### TIME-07 · Energy-Based Sorting & Estimation

- **Energy-Based Sorting** (GC 5, 2 days): sort tasks by energy required (high / low), so high-energy work happens in the morning and low-energy later. User tags tasks; filter and sort by it.
- **Task Energy Estimation** (GC 8, 3 days): rate how much energy a task needs (1–5) to plan the day (high-energy tasks today, low-energy tomorrow). User estimates; the system learns from history over time.

### TIME-08 · Context Switching Tracker

- **What:** Count how often the user switches tasks (people switch 10–15 times a day).
- **Why:** Awareness of how fragmented the day is.
- **How (proposed):** track browser tab focus/blur events.

> **Reality check:** a web app can only see focus/blur of **its own tab**, not
> which other apps the user switches to. Track **switches between PulseBoard
> tasks** (task opened / timer started) instead. Show it only to the user
> (see [Privacy](#privacy--trust-review)).

### TIME-09 · Flow State Detection

- **What:** Detect when a user is in flow and block notifications.
- **How (proposed):** typing speed + no tab switches for 30+ minutes.

> **Reality check: doesn't work as proposed.** Developers write code in their
> editor, not in PulseBoard. A browser tab can't see typing or activity in other
> apps, so a developer in deep flow looks **idle**. It would also require
> keystroke monitoring, a serious privacy problem.
>
> **Feasible alternative:** infer "focus time" from signals PulseBoard has (an
> active Pomodoro (TIME-05), a running task timer, a calendar focus block, or
> recent commits via the [GitHub integration](./github-integration.md)) and
> auto-enable Do Not Disturb (TIME-04).

### TIME-10 · Optimal Task Time Suggestion

- **What:** Suggest when to do a task, e.g. *"Do this at 10 AM."*
- **Why:** People perform better at certain times of day.
- **How:** Analyze when each user historically completes tasks of each type.
- **Reality check:** needs weeks of per-user history (cold start). Not MVP.

### TIME-11 · Weekly Capacity Planning

- **What:** Every Monday: *"You have 20 hours available this week."*
- **Why:** Prevent overcommitment.
- **How:** Google Calendar sync ([FREE #2](./free-features.md#2-google-calendar-integration)); meetings subtract from available hours; plus historical velocity.
- **Note:** per-person version of [SPEC #27 Sprint Auto-Planning](./future-features.md#27-sprint-auto-planning).

---

## Analytics & Insights (ANL)

| ID     | Feature                               | Effort   | Cost        | Impact     | Sources                                 |
| ------ | ------------------------------------- | -------- | ----------- | ---------- | --------------------------------------- |
| ANL-01 | Burnup Chart                          | 3 days   | $0          | ⭐⭐⭐⭐   | PLT 14                                  |
| ANL-02 | Cumulative Flow Diagram               | 4 days   | $0          | ⭐⭐⭐     | PLT 15                                  |
| ANL-03 | Lead Time & Cycle Time                | 3 days   | $0          | ⭐⭐⭐⭐   | PLT 16                                  |
| ANL-04 | Throughput                            | 3 days   | $0          | ⭐⭐⭐⭐   | PLT 17                                  |
| ANL-05 | WIP Limits                            | 2 days   | $0          | ⭐⭐⭐⭐   | PLT 18                                  |
| ANL-06 | Aging Report                          | 2 days   | $0          | ⭐⭐⭐⭐   | PLT 19                                  |
| ANL-07 | SLA Tracking                          | 3 days   | $0          | ⭐⭐⭐⭐⭐ | PLT 20                                  |
| ANL-08 | Team Wellbeing (Morale / Burnout Risk)| 5 days   | $0          | ⭐⭐⭐⭐⭐ | FTI 26 · GC 16 · SPEC 28 · FREE 22     |
| ANL-09 | Developer Performance Score           | 6 days   | $0          | ⭐⭐⭐⭐⭐ | CAT 45                                  |
| ANL-10 | Team Chemistry Score                  | 4 days   | $0          | ⭐⭐⭐⭐   | GC 17                                   |
| ANL-11 | Skill Gap Analysis                    | 4 days   | $0          | ⭐⭐⭐⭐   | GC 18                                   |
| ANL-12 | Auto-Retrospective & Lessons Learned  | 4–5 days | $0–30/month | ⭐⭐⭐⭐⭐ | FTI 27 · GC 20 · SPEC 30                |

Dashboard, burndown, and velocity are VIEW-07…09. Time analytics is TIME-02.

### ANL-01 · Burnup Chart

- **What:** Total vs completed tasks over time, to track progress.
- **How:** daily snapshots (derive from the status-event table).

### ANL-02 · Cumulative Flow Diagram

- **What:** How many tasks sit in each status over time, to identify bottlenecks.
- **How:** daily status counts.

### ANL-03 · Lead Time & Cycle Time

- **What:** Created → done (lead time) and started → done (cycle time), for process efficiency.
- **How:** calculated from timestamps.

### ANL-04 · Throughput

- **What:** Tasks completed per day / week / month, for capacity planning.
- **How:** daily completion counts.

### ANL-05 · WIP Limits

- **What:** Max tasks per column, to prevent overload.
- **How:** column config + validation.

### ANL-06 · Aging Report

- **What:** How many days tasks have been pending, to find stale tasks.
- **How (proposed):** `created_at` vs today. Better: age since the last status change.

### ANL-07 · SLA Tracking

- **What:** Commitment tracking, e.g. P0 bugs must be resolved within 4 hours.
- **How:** SLA config + breach detection. Related to the `sla_breached` flag in [SPEC #7](./future-features.md#7-time-tracking).

> **Implementation note (ANL-01…07):** these all need **status history**, not
> just current state. See [Cross-Cutting Notes](#cross-cutting-implementation-notes).

### ANL-08 · Team Wellbeing (Morale / Burnout Risk)

One feature with the same goal, proposed four ways:

- **Team Morale Tracking** (FTI 26): AI detects signs of low team morale.

  ```text
  Signals:
    - Response times are slowing
    - Frustration visible in comments
    - Task completion rate is down

  AI alert:
    "Team morale appears low.
     Reason: 3 consecutive late-night releases.
     Suggestion: add a 1-day buffer."
  ```

  Market: not available (research papers only). Uniqueness ✅✅. Priority Low. Listed as a USP in FTI.

- **Burnout Risk Detection** (GC 16, 5 days, $0 open-source ML, claimed ✅✅✅✅): detect when a developer is approaching burnout (critical for retention) from workload + overtime + sentiment analysis of comments.
- **Developer Happiness Score:** fully specified as [SPEC #28](./future-features.md#28-developer-happiness-score) (SPACE framework, 0–100 score, opt-in weekly survey).
- **Sentiment Analysis** of comments ([FREE #22](./free-features.md#22-sentiment-analysis)).

- **Decision:** build **one** feature: SPEC #28. Drop comment sentiment analysis. It's English-only (fails on Roman Urdu) and reads as surveillance. Use workload vs capacity, after-hours activity, and the opt-in weekly survey.

### ANL-09 · Developer Performance Score

- **Problem:** Measuring developer performance.
- **Solution:** A 0–100 score:

```text
Mehroze: 85/100
  Tasks completed: 40 (target 30) ✅
  Average time:    4h (target 6h) ✅
  Code quality:    90% tests pass ✅
  Collaboration:   15 PR reviews ✅
```

> ⚠️ Conflicts with the intent of ANL-08, which exists because developers feel
> *surveilled rather than supported*. Individual output rankings tend to be
> gamed and hurt morale. Use team-level metrics, or show the score only to the
> developer themselves. The audit's "DX metrics" item refers to this or ANL-08.

### ANL-10 · Team Chemistry Score

- **What:** Which people work well together, to optimize team formation.
- **How:** track the success rate of tasks co-assigned to pairs of people.

> **Caution:** scoring pairs of coworkers is sensitive HR data and easy to
> misread (a pair may "fail" because they get the hardest tasks). Small teams
> give sample sizes too small to be meaningful. If built, show aggregates to
> managers only and never rank individuals.

### ANL-11 · Skill Gap Analysis

- **What:** Which skills the team is missing, for hiring and training decisions.
- **How:** task tags/modules × completion rates → areas with slow resolution or a single expert (bus factor of 1).

### ANL-12 · Auto-Retrospective & Lessons Learned

- **What:** AI generates a sprint retrospective when a sprint ends.

```text
Sprint 23 Retrospective

✅ Went well:
  - 40 bugs resolved (target: 30)
  - Zero P0 bugs in production

⚠️ Needs improvement:
  - 5 bugs took 2x the estimated time
  - Communication gap between Dev and QA

🎯 Action items:
  - Add buffer time for complex bugs
  - Daily Dev–QA sync meeting
```

- **Merged:** FTI 27 (Auto-Retrospective; market ⚠️ basic in ClickUp Brain; uniqueness ✅, better implementation possible; priority Low) and GC 20 (Auto-Lessons Learned: at sprint end, summarize *"what we learned"* for continuous improvement; 4 days, $0–20/month via Hugging Face; claimed ✅✅✅). Add lessons learned as a section of the retrospective.
- **Spec:** [SPEC #30](./future-features.md#30-auto-retrospective-generator).

---

## Collaboration (COL)

| ID     | Feature                  | Effort | Cost | Impact     | Proposed approach       | Sources |
| ------ | ------------------------ | ------ | ---- | ---------- | ----------------------- | ------- |
| COL-01 | Real-Time Updates        | 4 days | $0   | ⭐⭐⭐⭐⭐ | Socket.io               | PLT 21  |
| COL-02 | Presence Indicators      | 2 days | $0   | ⭐⭐⭐⭐   | WebSocket heartbeat     | PLT 22  |
| COL-03 | Collaborative Editing    | 5 days | $0   | ⭐⭐⭐     | Operational transforms  | PLT 23  |
| COL-04 | Task Sharing (Public Link)| 2 days | $0  | ⭐⭐⭐⭐   | Token + public route    | PLT 24  |
| COL-05 | Board Sharing (Public Link)| 2 days | $0 | ⭐⭐⭐⭐   | Token + public route    | PLT 25  |
| COL-06 | Embed Widget             | 3 days | $0   | ⭐⭐⭐⭐   | iframe + public API     | PLT 26  |
| COL-07 | Activity Feed            | 3 days | $0   | ⭐⭐⭐⭐⭐ | Activity log + feed UI  | PLT 27  |
| COL-08 | User Profile             | 2 days | $0   | ⭐⭐⭐     | Profile table           | PLT 28  |
| COL-09 | Team Directory           | 2 days | $0   | ⭐⭐⭐⭐   | User list + search      | PLT 29  |
| COL-10 | Org Chart                | 3 days | $0   | ⭐⭐⭐     | Tree visualization      | PLT 30  |

Mentions and emoji reactions: [FREE #39–40](./free-features.md#category-3--free-productivity-3650).

- **COL-01 Real-Time Updates:** a task update appears for everyone without refresh. **Use Supabase Realtime** (already the planned realtime layer; Postgres change broadcasts), not a separate Socket.io server.
- **COL-02 Presence Indicators:** who's online (green dot), for team availability. **Use Supabase Realtime Presence.**
- **COL-03 Collaborative Editing:** multiple people edit one task at once. Use a CRDT library (**Yjs**) rather than hand-rolled OT. 5 days is optimistic. Task fields other than long descriptions rarely need it; last-write-wins with realtime refresh covers most cases.
- **COL-04 / COL-05 Public Sharing:** share a task or a whole board with a client without login. Tokens must be long, random, **revocable**, and ideally **expiring**. Public boards must never expose internal comments or emails. Related to CLI-01 and [SPEC #25 Client Portal](./future-features.md#25-client-portal-white-label).
- **COL-06 Embed Widget:** embed a board on a website (e.g. a public roadmap). Allow only for public boards, and set `Content-Security-Policy: frame-ancestors` on the embed route.
- **COL-07 Activity Feed:** all activities in one place (task create, update, comment). A UI over the CORE-17 event table.
- **COL-08 User Profile:** avatar, bio, stats; for team bonding.
- **COL-09 Team Directory:** members with contact info and role, with search.
- **COL-10 Org Chart:** hierarchy view (Owner → Admin → Member) so the reporting structure is clear.

---

## Security & Permissions (SEC)

| ID     | Feature                    | What / Why                                          | Proposed approach               | Effort | Impact     | Sources |
| ------ | -------------------------- | --------------------------------------------------- | ------------------------------- | ------ | ---------- | ------- |
| SEC-01 | Two-Factor Authentication  | OTP at login (Google Authenticator) for security    | `speakeasy`                     | 2 days | ⭐⭐⭐⭐⭐ | PLT 1   |
| SEC-02 | Google Sign-In             | No password; easier onboarding                      | `passport-google-oauth`         | 2 days | ⭐⭐⭐⭐⭐ | PLT 2   |
| SEC-03 | GitHub Sign-In             | Convenient for developers                           | `passport-github2`              | 2 days | ⭐⭐⭐⭐   | PLT 3   |
| SEC-04 | Role-Based Access Control  | Owner / Admin / Member / Viewer                     | Middleware role check           | 3 days | ⭐⭐⭐⭐⭐ | PLT 4 · FTI Roles & Permissions |
| SEC-05 | Granular Permissions       | Per-feature permissions                             | Permission matrix (JSON)        | 3 days | ⭐⭐⭐⭐   | PLT 5   |
| SEC-06 | Session Management         | See active sessions; sign out remotely              | JWT + session store             | 2 days | ⭐⭐⭐⭐   | PLT 6   |
| SEC-07 | Password Reset             | Forgot password → email reset link                  | Nodemailer + reset token        | 2 days | ⭐⭐⭐⭐⭐ | PLT 7   |
| SEC-08 | Account Deactivation       | User deactivates own account (privacy control)      | Soft delete (`is_active=false`) | 1 day  | ⭐⭐⭐     | PLT 8   |
| SEC-09 | Data Export (GDPR)         | User exports all their data (JSON/CSV)              | Data dump endpoint              | 2 days | ⭐⭐⭐⭐   | PLT 9   |
| SEC-10 | Account Deletion (GDPR)    | Right to be forgotten                               | Hard delete, cascade            | 2 days | ⭐⭐⭐⭐   | PLT 10  |
| SEC-11 | API Rate Limiting          | Prevent API abuse                                   | `express-rate-limit`            | 2 days | ⭐⭐⭐⭐   | PLT 43  |
| SEC-12 | Enterprise SSO (SAML/OIDC) | Okta, Azure AD for large companies                  | —                               | —      | —          | Pricing (Enterprise) |

All $0.

> **Stack notes**
>
> - **SEC-01, 02, 03, 06, 07: use Supabase Auth.** It provides TOTP MFA, Google
>   and GitHub login, sessions with refresh tokens, and password-reset emails.
>   Passport would mean a second auth system. `speakeasy` is unmaintained; if a
>   standalone TOTP library is ever needed, use `otplib`.
> - **SEC-02/03 naming:** Google/GitHub login is *social login*. "SSO" usually
>   means enterprise SAML/OIDC (SEC-12), a separate Enterprise feature.
> - **SEC-07:** Supabase's built-in email sender is heavily rate-limited;
>   configure custom SMTP for production.
> - **SEC-04/05: enforce in the database.** With Supabase the client talks to
>   Postgres directly, so middleware alone isn't enough. Use **Row Level
>   Security** policies; middleware is an extra layer. Role definitions per board
>   are in [SPEC #1](./future-features.md#1-custom-boards).
> - **SEC-10:** "hard delete everything" conflicts with the audit log (CORE-17)
>   and backups (ADV-05). Delete personal data, anonymize audit entries
>   ("Deleted user"), and document backup retention.
> - **SEC-11:** the default in-memory store doesn't work across multiple server
>   instances. Use the **Redis store** (Redis is already planned).

---

## Mobile & Offline (MOB)

| ID     | Feature                  | What / Why                                 | Proposed approach            | Effort  | Stated cost | Impact     | Sources |
| ------ | ------------------------ | ------------------------------------------ | ---------------------------- | ------- | ----------- | ---------- | ------- |
| MOB-01 | Mobile Responsive Design | Works well on phones                       | CSS media queries (Tailwind) | 5 days  | $0          | ⭐⭐⭐⭐⭐ | PLT 31  |
| MOB-02 | PWA                      | Installable, app-like; avoids a native app | Service worker + manifest    | 3 days  | $0          | ⭐⭐⭐⭐⭐ | PLT 32  |
| MOB-03 | Offline Mode             | Works without internet                     | LocalStorage + sync          | 7 days  | $0          | ⭐⭐⭐⭐   | PLT 33  |
| MOB-04 | Web Push Notifications   | Browser alerts (assignment, due dates)     | Web Push API                 | 4 days  | $0          | ⭐⭐⭐⭐⭐ | PLT 34  |
| MOB-05 | Native Mobile App        | iOS / Android                              | React Native                 | 30 days | $0          | ⭐⭐⭐⭐⭐ | PLT 35  |
| MOB-06 | Tablet Optimization      | Layout for iPad                            | Responsive breakpoints       | 3 days  | $0          | ⭐⭐⭐     | PLT 36  |
| MOB-07 | Touch Gestures           | Swipe to complete, long-press to edit      | `react-swipeable`            | 3 days  | $0          | ⭐⭐⭐⭐   | PLT 37  |
| MOB-08 | Camera Capture           | Photo a bug straight into a task           | HTML5 camera                 | 2 days  | $0          | ⭐⭐⭐⭐   | PLT 39  |
| MOB-09 | QR Code Scanner          | Scan a QR to open a task (physical boards) | `react-qr-reader`            | 2 days  | $0          | ⭐⭐⭐     | PLT 40  |

Voice input (PLT 38) is merged into AI-07.

> **Reality checks**
>
> - **MOB-03:** use **IndexedDB**, not LocalStorage (size limits, blocking,
>   strings only). The hard part is **conflict resolution** when two people edit
>   the same task offline. 7 days is optimistic; start with read-only offline.
> - **MOB-04:** on iOS, web push works only when the PWA is **installed to the
>   home screen** (iOS 16.4+).
> - **MOB-05:** React Native does **not** share UI code with a Next.js app; only
>   logic and types. Not $0: Apple Developer Program $99/year, Google Play $25
>   one-time. A good PWA (MOB-01…04) may make it unnecessary early on.
> - **MOB-08:** simplest version is `<input type="file" accept="image/*" capture>`,
>   no library needed. Feeds AI-05.
> - **MOB-09:** `react-qr-reader` is unmaintained with React 18+/19 issues. Use
>   `html5-qrcode` or the browser `BarcodeDetector` API.

---

## Advanced & Platform (ADV)

| ID     | Feature                  | What / Why                                     | Proposed approach            | Effort | Stated cost | Impact     | Sources |
| ------ | ------------------------ | ---------------------------------------------- | ---------------------------- | ------ | ----------- | ---------- | ------- |
| ADV-01 | Custom Domain            | `board.company.com` for branding               | CNAME + domain verification  | 3 days | $0          | ⭐⭐⭐⭐⭐ | PLT 41  |
| ADV-02 | White Label              | Remove PulseBoard branding for agency clients  | Theme config                 | 3 days | $0          | ⭐⭐⭐⭐⭐ | PLT 42  |
| ADV-03 | API Documentation        | Auto-generated API docs                        | Swagger / OpenAPI            | 3 days | $0          | ⭐⭐⭐⭐   | PLT 44  |
| ADV-04 | Webhook Builder          | Users configure outgoing webhooks              | Config UI + delivery system  | 4 days | $0          | ⭐⭐⭐⭐⭐ | PLT 45  |
| ADV-05 | Automatic Backups        | Daily backups for disaster recovery            | Cron + AWS S3                | 3 days | $0 (5 GB)   | ⭐⭐⭐⭐⭐ | PLT 47  |
| ADV-06 | Data Restore             | Restore from backup                            | Backup import API            | 3 days | $0          | ⭐⭐⭐⭐   | PLT 48  |
| ADV-07 | Multi-Language (i18n)    | Urdu, English, Hindi, Arabic…                  | `react-i18next`              | 5 days | $0          | ⭐⭐⭐⭐   | PLT 49  |
| ADV-08 | Accessibility (WCAG)     | Screen reader and keyboard support             | ARIA labels, keyboard nav    | 5 days | $0          | ⭐⭐⭐⭐   | PLT 50  |

Audit log (PLT 46) is merged into CORE-17; API rate limiting (PLT 43) is SEC-11.

> **Reality checks**
>
> - **ADV-01:** each custom domain needs its own **TLS certificate**; a CNAME
>   alone doesn't provide one. Use the host's custom-domains API (e.g. Vercel) or
>   Cloudflare for SaaS; both limit free usage.
> - **ADV-02:** same feature as [SPEC #25 Client Portal](./future-features.md#25-client-portal-white-label); see also CLI-06.
> - **ADV-03:** `swagger-ui-express` was proposed; any OpenAPI generator works.
> - **ADV-04:** outgoing webhooks need **HMAC signatures**, **retries with
>   backoff**, delivery logs, and **SSRF protection** (block internal/private
>   IPs). Related to [SPEC #21 Auto-Workflow Builder](./future-features.md#21-auto-workflow-builder).
> - **ADV-05/06:** Supabase includes daily backups only on **paid** plans, and
>   the AWS S3 free tier lasts only **12 months**. Budget ~$25/month (Supabase
>   Pro) or `pg_dump` to cheap storage. **Test restores regularly.**
> - **ADV-07:** with the Next.js App Router, **`next-intl`** fits better than
>   `react-i18next`. Urdu and Arabic are **right-to-left**, so the layout needs
>   RTL support (Tailwind logical properties, `dir="rtl"`). Budget more than 5 days.
> - **ADV-08:** the current drag-and-drop uses native HTML5 drag events, which
>   aren't keyboard-accessible; `@dnd-kit` fixes that.

---

## Client & Agency (CLI)

| ID     | Feature                          | Effort   | Cost        | Impact     | Claimed uniqueness                 | Sources                     |
| ------ | -------------------------------- | -------- | ----------- | ---------- | ---------------------------------- | --------------------------- |
| CLI-01 | Client View-Only Invite          | 1–2 days | $0          | High       | ❌ (ClickUp Guests)                | FTI 5 · SPEC 5              |
| CLI-02 | One-Click Client Onboarding      | 3–4 days | $0          | Medium     | ✅✅                               | FTI 17 · SPEC 17            |
| CLI-03 | Client Approval Workflow         | 3 days   | $0          | ⭐⭐⭐⭐⭐ | ✅✅ (in Asana, not simple tools)  | GC 11                       |
| CLI-04 | Billable Hours Tracking          | 2 days   | $0          | ⭐⭐⭐⭐⭐ | ✅                                 | GC 12                       |
| CLI-05 | Client Budget Tracker            | 3 days   | $0          | ⭐⭐⭐⭐⭐ | ✅✅                               | GC 13                       |
| CLI-06 | White-Label Client Reports       | 4 days   | $0          | ⭐⭐⭐⭐⭐ | ✅✅                               | GC 14                       |
| CLI-07 | Multi-Client Dashboard           | 4 days   | $0          | ⭐⭐⭐⭐⭐ | ✅✅                               | GC 15                       |
| CLI-08 | Client Feedback → Bug (+ Widget) | 5–7 days | $0–30/month | ⭐⭐⭐⭐   | ✅✅✅                             | FTI 24 · CAT 43 · SPEC 26   |

> Billable hours, budgets, and client approvals are standard in agency-focused
> tools (Teamwork.com, Productive.io, Harvest, ClickUp). Valuable because
> agencies expect them, not because they're unique. Strong candidates for the
> higher tiers in [pricing.md](./pricing.md).

### CLI-01 · Client View-Only Invite

- **What:** Invite a client who can only see their own project (e.g. To Do / In Progress counts).
- **Spec:** [SPEC #5](./future-features.md#5-client-view-only-invite). Branded portal: [SPEC #25](./future-features.md#25-client-portal-white-label).
- **Market:** ✅ ClickUp Guests. Uniqueness ❌. Priority High.
- **Business impact (FTI):** revenue ⭐⭐⭐, effort Low, ROI ⭐⭐⭐⭐. Feasibility ✅ Build (client retention).

### CLI-02 · One-Click Client Onboarding

- **What:** One button creates the client account, sends the welcome email, and sets up their dashboard.
- **Spec:** [SPEC #17](./future-features.md#17-one-click-client-onboarding).
- **Market:** ❌. Uniqueness ✅✅. Priority Medium.
- **Feasibility:** ⏸️ Delay: just three API calls, and client details still need entering.

### CLI-03 · Client Approval Workflow

- **What:** Send a deliverable to the client to approve or reject; agencies need sign-off at each step.
- **How:** "Request approval" on a task → client gets an email → approves or rejects (with comment) from the client portal → task moves column accordingly. Record who approved and when.

### CLI-04 · Billable Hours Tracking

- **What:** Mark time as billable / non-billable; agencies bill clients by the hour.
- **How:** a `billable` flag on time logs (TIME-01) + hourly rate per client or per person.

### CLI-05 · Client Budget Tracker

- **What:** Set a budget per client/project; alert at 80% usage to prevent overruns.
- **How:** budget config + threshold alerts, driven by billable hours × rate (CLI-04).

### CLI-06 · White-Label Client Reports

- **What:** Client reports with the agency's logo and colors.
- **How:** PDF generation with a custom theme. `@react-pdf/renderer` avoids running a headless browser.
- **Note:** branded version of NOTIF-06; relates to ADV-02.

### CLI-07 · Multi-Client Dashboard

- **What:** All clients' progress on one dashboard for the agency owner.
- **How:** aggregated analytics across client boards: progress, budget used (CLI-05), overdue tasks, pending approvals (CLI-03).

### CLI-08 · Client Feedback → Bug (+ Widget)

- **What:** Client feedback (email/form) automatically becomes a bug.

```text
Client email: "Payment gateway is slow"

AI auto-create:
  Bug:      Payment gateway performance issue
  Priority: P1 (client reported)
  Assignee: Payment module owner
  Tag:      Client Feedback
```

- **Widget (CAT 43, 5 days, $0):** a "Give Feedback" button on the client dashboard → form → task created automatically.
- **Public form:** [SPEC #26 Bug Bounty Mode](./future-features.md#26-bug-bounty-mode); form integrations [FREE #16–17](./free-features.md#16-google-forms-integration).
- **Market (FTI):** not available. Uniqueness ✅✅ (FTI) / ✅✅✅ (comparison). Priority Medium. Listed as a USP in FTI.
- **Feasibility:** ⏸️ Delay to Phase 2 ($10–30/month AI parsing, 5–7 days).

---

## Developer Experience (DEV)

| ID     | Feature                               | Effort  | Cost | Impact     | Sources                                |
| ------ | ------------------------------------- | ------- | ---- | ---------- | -------------------------------------- |
| DEV-01 | Code-to-Bug Linking & Auto-Status     | 5 days  | $0   | ⭐⭐⭐⭐⭐ | FTI 23 · CAT 39 · FREE 3               |
| DEV-02 | Smart PR Review Assignment            | 5–7 days| $0   | ⭐⭐⭐⭐⭐ | SPEC 23                                |

AI Fix Suggestion is AI-06; AI Test Case Generator is AI-14; Developer
happiness / DX metrics is ANL-08 / ANL-09.

### DEV-01 · Code-to-Bug Linking & Auto-Status Update

- **Code-to-Bug Linking** (FTI 23): commits are automatically linked to the bugs they fix.

  ```text
  Git commit: "Fixed login timeout issue"

  AI auto-link:
    Bug:    BUG-1234 (Login timeout)
    Status: Resolved
    Commit: abc123
    File:   src/auth/login.js
  ```

  Market ✅ GitHub Issues supports it, but linking is manual; automatic linking is unique ✅. Priority Low.

- **Auto-Status Update** (CAT 39, 5 days, $0): people forget to update statuses, so update from code activity (no AI needed):

  ```text
  Commit referencing the task → "In Progress"
  PR merged                   → "Done"
  ```

- **Design:** [github-integration.md](./github-integration.md). Match on an explicit task key (e.g. `BUG-1234`) first; fuzzy title matching alone mislinks.

### DEV-02 · Smart PR Review Assignment

- Specified in [SPEC #23](./future-features.md#23-smart-pr-review-assignment) and [github-integration.md](./github-integration.md#use-case-1-smart-pr-review-assignment).

---

## Integrations (INT)

| ID     | Feature                     | Sources                       |
| ------ | --------------------------- | ----------------------------- |
| INT-01 | Gmail / Slack → Task        | FTI 8 · SPEC 8 · FREE 4–5     |
| INT-02 | All other integrations      | FREE 1–20                     |

### INT-01 · Gmail / Slack → Task

- **What:** Incoming email (e.g. to HR) automatically creates a task and updates its status.
- **Spec:** [SPEC #8](./future-features.md#8-gmail--slack-integration). Slack commands: [SPEC #22](./future-features.md#22-context-switching-killer).
- **Market:** ⚠️ Zapier. Uniqueness ✅. Priority High.
- **Business impact (FTI):** revenue ⭐⭐⭐⭐, effort Medium, ROI ⭐⭐⭐⭐.
- **Reality check:** Gmail restricted scopes need Google verification and an annual paid security assessment ([FREE #5](./free-features.md#5-gmail-integration)). Feasibility: Phase 2, or via Zapier.

### INT-02 · Other Integrations

Calendly, Google Calendar, GitHub, Slack, Gmail, Google Drive, Discord,
Telegram, WhatsApp Business, Trello / Notion / ClickUp / Monday import,
CSV/Excel, Zapier, Make, IFTTT, Google Forms, Typeform, Airtable: all in
[free-features.md, Category 1](./free-features.md#category-1--free-integrations-120),
with cost reality checks.

---

## Market Comparison

From FTI, for the original 28 features:

| Feature                  | Origin      | Available in Market?  | Uniqueness | Priority | ID       |
| ------------------------ | ----------- | --------------------- | ---------- | -------- | -------- |
| Custom Boards            | Core        | ✅ ClickUp, Monday    | ❌         | High     | CORE-01  |
| Custom Columns           | Core        | ✅ ClickUp, Monday    | ❌         | High     | CORE-02  |
| AI Bug Report (Image)    | Core        | ✅ GitHub Copilot     | ⚠️         | High     | AI-05    |
| Voice Activation         | Core        | ❌                    | ✅✅       | Medium   | AI-07    |
| Client View-Only         | Core        | ✅ ClickUp Guests     | ❌         | High     | CLI-01   |
| Smart Matching           | Core        | ❌                    | ✅✅✅     | Critical | AI-01    |
| Time Tracking            | Core        | ✅ ClickUp, Monday    | ❌         | High     | TIME-01  |
| Gmail/Slack → Task       | Core        | ⚠️ Zapier             | ✅         | High     | INT-01   |
| Duplicate Detection      | Enhancement | ⚠️ Jira Rovo          | ✅         | High     | AI-03    |
| Auto-Prioritization      | Enhancement | ❌                    | ✅✅       | High     | AI-04    |
| Auto Client Reports      | Enhancement | ⚠️ Monday (basic)     | ✅         | Medium   | NOTIF-06 |
| Workload Balancing       | Enhancement | ❌                    | ✅✅✅     | Critical | AI-02    |
| Smart Email Threading    | Enhancement | ❌                    | ✅✅       | Medium   | AI-09    |
| AI Standup Summary       | Enhancement | ❌                    | ✅✅       | Medium   | AI-10    |
| Voice Notes → Task       | Enhancement | ❌                    | ✅         | Low      | AI-08    |
| Predictive Forecasting   | Enhancement | ❌                    | ✅✅✅     | Low      | AI-11    |
| One-Click Onboarding     | Enhancement | ❌                    | ✅✅       | Medium   | CLI-02   |
| AI Fix Suggestion        | Enhancement | ❌                    | ✅✅       | High     | AI-06    |
| AI Meeting → Actions     | Innovation  | ❌                    | ✅✅✅     | Medium   | AI-12    |
| Bug Severity Auto        | Innovation  | ⚠️ Jira (basic)       | ✅         | High     | AI-04    |
| Auto-Dependency Map      | Innovation  | ❌                    | ✅✅✅     | Medium   | AI-13    |
| Smart Notifications      | Innovation  | ❌                    | ✅✅       | Medium   | NOTIF-03 |
| Code-to-Bug Linking      | Innovation  | ⚠️ GitHub (manual)    | ✅         | Low      | DEV-01   |
| Client Feedback → Bug    | Innovation  | ❌                    | ✅✅✅     | Medium   | CLI-08   |
| AI Test Case Gen         | Innovation  | ❌                    | ✅✅✅     | Low      | AI-14    |
| Team Morale Tracking     | Innovation  | ❌                    | ✅✅✅     | Low      | ANL-08   |
| Auto-Retrospective       | Innovation  | ⚠️ ClickUp (basic)    | ✅         | Low      | ANL-12   |
| Competitor Bug Tracker   | Innovation  | ❌                    | ✅✅✅     | Low      | AI-15    |

Competitor pricing comparison is in [pricing.md](./pricing.md#competitor-comparison).

---

## USP Claims & Uniqueness

**FTI "killer features"** (not offered by any competitor, as claimed):

1. Smart Matching (AI-01)
2. Developer Workload Balancing (AI-02)
3. Auto-Dependency Mapping (AI-13)
4. Client Feedback → Bug Auto-Create (CLI-08)
5. AI Test Case Generator (AI-14)
6. Team Morale Tracking (ANL-08)
7. Competitor Bug Tracker (AI-15)
8. Predictive Bug Forecasting (AI-11)

**Final audit "10 truly unique features":** Flow State Detection (TIME-09),
Optimal Task Time Suggestion (TIME-10), Burnout Risk Detection (ANL-08),
Predictive Task Failure (AI-18), Task Batching (TIME-06), Energy-Based Sorting
(TIME-07), Team Chemistry Score (ANL-10), Skill Gap Analysis (ANL-11),
Auto-Lessons Learned (ANL-12), Context Switching Tracker (TIME-08).

> **Reality check:** uniqueness hasn't been verified. Several of these exist in
> adjacent tools; TIME-09 isn't feasible as proposed; ANL-08/10 have privacy
> risks; AI-18/TIME-10 need months of data. Research competitors before using
> these claims in marketing. The most defensible USPs are **AI-01 + AI-02**.

---

## Business Impact

From FTI:

| Feature                | Revenue Impact | Development Effort | ROI        | ID      |
| ---------------------- | -------------- | ------------------ | ---------- | ------- |
| Smart Matching         | ⭐⭐⭐⭐⭐     | Medium             | ⭐⭐⭐⭐⭐ | AI-01   |
| Workload Balancing     | ⭐⭐⭐⭐⭐     | Medium             | ⭐⭐⭐⭐⭐ | AI-02   |
| Auto-Prioritization    | ⭐⭐⭐⭐       | Low                | ⭐⭐⭐⭐⭐ | AI-04   |
| Duplicate Detection    | ⭐⭐⭐⭐       | Low                | ⭐⭐⭐⭐⭐ | AI-03   |
| Gmail/Slack → Task     | ⭐⭐⭐⭐       | Medium             | ⭐⭐⭐⭐   | INT-01  |
| Client View-Only       | ⭐⭐⭐         | Low                | ⭐⭐⭐⭐   | CLI-01  |
| Voice Activation       | ⭐⭐           | High               | ⭐⭐       | AI-07   |
| Predictive Forecasting | ⭐⭐⭐⭐       | High               | ⭐⭐⭐     | AI-11   |

---

## Privacy & Trust Review

Several features monitor individuals. If developers feel watched, they stop
trusting the tool, which defeats the purpose of the wellbeing features.

| Feature                            | Risk                                     | Recommendation                                  |
| ---------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| TIME-08 Context Switching Tracker  | Activity monitoring                      | Personal-only data; opt-in                      |
| TIME-09 Flow State Detection       | Keystroke monitoring                     | Replace with signal-based focus time            |
| ANL-08 Burnout / Morale            | Sentiment analysis of comments           | Drop sentiment; workload + opt-in survey        |
| ANL-09 Developer Performance Score | Individual output ranking                | Team-level, or visible only to the person       |
| ANL-10 Team Chemistry              | Pairwise scoring of coworkers            | Managers see aggregates only; no rankings       |

Principle: **personal productivity data belongs to the individual.** Managers
see team-level aggregates. Anything beyond that is opt-in and visible to the
person it's about. The same concern applies to raw commit/line counts from
GitHub ([github-integration.md](./github-integration.md#use-case-2-developer-activity-overview)).

---

## Cross-Cutting Implementation Notes

1. **One event table.** CORE-17 (history/audit), COL-07 (activity feed), and
   ANL-01…07 (burnup, CFD, cycle time, throughput, aging) all derive from the
   same data. Record every change from day one, e.g.
   `task_status_events: task_id, from_status, to_status, changed_at`. Without
   it, historical charts can't be backfilled.
2. **Soft delete from the start.** A `deleted_at` column powers CORE-04,
   CORE-21, CORE-22, and SEC-08.
3. **Supabase first.** Auth (SEC-01…07), Realtime + Presence (COL-01/02),
   Storage (CORE-16), and Row Level Security (SEC-04/05) replace the standalone
   npm packages originally proposed.
4. **Rules before AI.** AI-04, AI-16, AI-18, NOTIF-03, and TIME-06 all have
   a $0 rule-based v0; add AI later.
5. **Cold start.** AI-11, AI-18, TIME-10, ANL-08 need months of usage data; not
   MVP.

---

## All MVP / Roadmap Proposals

Six Phase 1 proposals exist across the docs. Kept here verbatim so none is lost;
**one must be chosen**.

### A. FTI phased roadmap

**Phase 1 — MVP (Must Launch · 6–8 weeks):** Custom Boards + Custom Columns
(CORE-01/02) · Roles & Permissions (SEC-04) · Smart Matching (AI-01, primary USP)
· Client View-Only Access (CLI-01) · Time Tracking (TIME-01) · Duplicate Bug
Detection (AI-03) · Auto-Prioritization (AI-04) · Gmail/Slack → Task (INT-01).
*8 features (4 original, 4 suggested).*

**Phase 2 — Differentiation (Must Win · 8–12 weeks):** AI Bug Report, Image →
Prompt + Fix (AI-05) · Workload Balancing (AI-02, USP) · Smart Email Threading
(AI-09) · AI Standup Summary (AI-10) · Auto Client Reports (NOTIF-06) · Bug
Severity Auto-Detection (AI-04) · Client Feedback → Bug (CLI-08).
*7 features (2 original, 5 suggested).*

**Phase 3 — Innovation (Market Leader · 12–16 weeks):** Voice Activation (AI-07)
· AI Meeting → Action Items (AI-12) · Auto-Dependency Mapping (AI-13) · Smart
Notifications (NOTIF-03) · One-Click Onboarding (CLI-02) · Code-to-Bug Linking
(DEV-01) · AI Test Case Generator (AI-14) · Team Morale Tracking (ANL-08) ·
Auto-Retrospective (ANL-12) · Competitor Bug Tracker (AI-15) · Predictive Bug
Forecasting (AI-11) · Voice Notes → Task (AI-08). *12 features (1 original, 11 suggested).*

AI Fix Suggestion (AI-06) was not placed in any FTI phase.

### B. Feasibility MVP (4–6 weeks, $0–10/month)

See [feasibility-analysis.md](./feasibility-analysis.md#recommended-phasing):
CORE-01/02, SEC-04, AI-01, CLI-01, TIME-01, AI-03, AI-04, AI-02, NOTIF-06.

### C. SPEC P0 scope (8–10 weeks, $20–50/month)

See [future-features.md](./future-features.md#proposed-p0-scope): 12 features
including Auto-Workflow Builder, Slack commands, Smart PR Review, Async
Standup, Client Portal, Sprint Auto-Planning, Developer Happiness Score.

### D. CAT MVP: all Simple + Medium (30 features)

**Simple:** Bulk Delete (CORE-04) · Bulk Status Change (CORE-05) · Bulk Assign
(CORE-06) · Keyboard Shortcuts (CORE-07) · CSV Import (CORE-08) · CSV Export
(CORE-09) · Save as Template (CORE-10) · Recurring Tasks (CORE-11) · Task
Dependencies (CORE-12) · Subtasks (CORE-13) · Checklists (CORE-14) · Task
Comments (CORE-15) · File Attachments (CORE-16) · Task History (CORE-17) · Quick
Add (CORE-18).

**Medium:** Email Templates (NOTIF-01) · Automated Email Notifications
(NOTIF-02) · Custom Fields (CORE-19) · Gantt (VIEW-03) · Calendar (VIEW-04) ·
Timeline (VIEW-05) · Workload View (VIEW-06) · Burndown (VIEW-07) · Velocity
(VIEW-08) · Dashboard (VIEW-09) · Saved Filters (VIEW-10) · Advanced Search
(VIEW-11) · Task Cloning (CORE-20) · Task Archiving (CORE-21) · Undo Delete
(CORE-22).

Stated: 8–10 weeks. **Timeline check:** category totals are 80–95
developer-days, about 16–19 weeks for one developer or 8–10 weeks for two.
These are table-stakes features that make PulseBoard viable; differentiation
comes from AI-01/AI-02.

CAT priority matrix:

| Category          | Features | Effort     | Cost / month | Impact     | Priority         |
| ----------------- | -------- | ---------- | ------------ | ---------- | ---------------- |
| Simple (1–15)     | 15       | 30–35 days | $0–10        | ⭐⭐⭐⭐   | P0 — Must launch |
| Medium (16–30)    | 15       | 50–60 days | $0–20        | ⭐⭐⭐⭐⭐ | P0 — Must launch |
| Hard (31–45)      | 15       | 70–80 days | $100–300     | ⭐⭐⭐⭐⭐ | P1 — Growth      |
| Legendary (46–55) | 10       | 60–70 days | $400–800     | ⭐⭐⭐⭐⭐ | P2 — Future      |
| **Total**         | **55**   |            | **$500–1,000** (all AI) | |                 |

Split: 30 P0 · 15 P1 · 10 P2.

### E. PLT "Final MVP" (50 features, 10–12 weeks, $0/month)

**Core (1–20):** Custom Boards + Columns · Smart Matching · Workload Balancing ·
Duplicate Detection · Auto-Prioritization · Bulk Delete/Assign/Status Change ·
Keyboard Shortcuts · CSV Import/Export · Save as Template · Recurring Tasks ·
Task Dependencies · Subtasks + Checklists · Task Comments · File Attachments ·
Task History · Quick Add · Email Templates · Automated Email Notifications ·
Custom Fields · Dashboard.

**Integrations (21–30):** Calendly · Google Calendar · GitHub · Slack · Gmail ·
Google Drive · Discord · Telegram Bot · Trello Import · CSV/Excel Import.

**AI (31–40):** Hugging Face Text Classification · Keyword Extraction ·
Auto-Summarization · Language Detection · Spell Check · Auto-Translate · Smart
Search · Duplicate Detection (SBERT) · Auto-Priority (Rule-Based) · Smart
Assignee Suggestion.

**Productivity (41–50):** Dark Mode ✅ exists · Custom Themes · Emoji Reactions ·
@Mentions · Task Templates · Board Templates · Quick Filters · Saved Views · Task
Drag-and-Drop ✅ exists · Undo/Redo.

**Review:** internal duplicates (Duplicate Detection ×2, CSV Import ×2,
Auto-Prioritization ≈ Auto-Priority, Smart Matching ≈ Smart Assignee, Save as
Template ≈ Board Templates) leave ~45 unique. Missing essentials: auth, RBAC
(SEC-04), Row Level Security, real-time (COL-01). Low MVP value: Language
Detection, Spell Check (browser does it), Discord, Telegram, Calendly. 10–12
weeks for ~45 features is not realistic.

### F. GC "Absolute Final MVP" (60 features, 12–14 weeks, $0/month)

PLT's 50 plus: Focus Mode (TIME-03) · Do Not Disturb (TIME-04) · Pomodoro
(TIME-05) · Task Batching (TIME-06) · Energy-Based Sorting (TIME-07) · Context
Switching Tracker (TIME-08) · Flow State Detection (TIME-09) ⚠️ not feasible as
proposed · Optimal Task Time (TIME-10) ⚠️ needs data · Burnout Risk (ANL-08) ⚠️
needs data · Predictive Task Failure (AI-18) ⚠️ needs data.

**Review:** good MVP fits: TIME-03…07 (cheap, client-side, coherent "focus"
story). Not MVP: TIME-10, ANL-08, AI-18. Agency features (CLI-03…07) aren't in
the list but may matter more for revenue. 60 features in 12–14 weeks isn't
achievable for a small team.

### Blockers any MVP needs

Regardless of choice: authentication + Row Level Security (SEC-01…05),
workspaces / multi-tenancy, and billing. See
[README, Not Yet Covered](./README.md#not-yet-covered).

---

## Totals: Claims vs Reality

| Source | Claim | Reality |
| ------ | ----- | ------- |
| FTI | 8 core + 10 enhancement + 10 innovation = **28** | Consistent. |
| CAT | **55** features; $500–1,000/month for all AI | Consistent count. |
| PLT | "150+" features; 250–300 developer-days (10–12 months) | Across SPEC 30 + CAT 55 + FREE 50 + PLT 50 ≈ 185 entries, many duplicated. |
| GC | "170+": 50 core, 50 integrations, 50 AI, 20 game-changers; $0–20/month; 300–350 developer-days (12–14 months) | ~205 entries across all docs. |
| Final audit | 170+ features, 10 truly unique, **$0/month**, **12–14 weeks** | Category counts sum to **195**; 12–14 weeks contradicts the 12–14 **months** estimate; $0 ignores hosting, backups, email, Gmail assessment, WhatsApp, app-store fees. |
| This audit | — | **~115 unique features** here (IDs above), plus ~50 in FREE and 30 specs in SPEC that overlap them. |

---

## Open Questions

1. **Which MVP?** Six proposals above; choose one.
2. **ANL-09 Developer Performance Score:** keep, reshape as team-level, or drop in favor of ANL-08?
3. **VIEW-03 Gantt library:** buy a dhtmlxGantt license or use an MIT alternative?
4. **AI-06 AI Fix Suggestion:** feasibility says skip; original pricing sold it in Enterprise. Which?
5. **AI-14 / AI-15:** only described in FTI; spec them or drop them?
6. **VIEW-02 List view:** needs a spec.

---

## Source Index

Every numbered entry from the four merged docs, mapped to its ID here.

### FTI (features-to-implement.md)

| FTI | → ID | FTI | → ID | FTI | → ID | FTI | → ID |
| --- | ---- | --- | ---- | --- | ---- | --- | ---- |
| 1 | CORE-01 | 8 | INT-01 | 15 | AI-08 | 22 | NOTIF-03 |
| 2 | CORE-02 | 9 | AI-03 | 16 | AI-11 | 23 | DEV-01 |
| 3 | AI-05 | 10 | AI-04 | 17 | CLI-02 | 24 | CLI-08 |
| 4 | AI-07 | 11 | NOTIF-06 | 18 | AI-06 | 25 | AI-14 |
| 5 | CLI-01 | 12 | AI-02 | 19 | AI-12 | 26 | ANL-08 |
| 6 | AI-01 | 13 | AI-09 | 20 | AI-04 | 27 | ANL-12 |
| 7 | TIME-01 | 14 | AI-10 | 21 | AI-13 | 28 | AI-15 |

Also from FTI: "Roles & Permissions" (Phase 1) → SEC-04; Market Comparison, USP
list, Business Impact → sections above.

### CAT (feature-catalog.md)

| CAT | → ID | CAT | → ID | CAT | → ID | CAT | → ID |
| --- | ---- | --- | ---- | --- | ---- | --- | ---- |
| 1 | CORE-04 | 15 | CORE-18 | 29 | CORE-21 | 43 | CLI-08 |
| 2 | CORE-05 | 16 | NOTIF-01 | 30 | CORE-22 | 44 | TIME-02 |
| 3 | CORE-06 | 17 | NOTIF-02 | 31 | AI-03 | 45 | ANL-09 |
| 4 | CORE-07 | 18 | CORE-19 | 32 | AI-16 | 46 | AI-22 |
| 5 | CORE-08 | 19 | VIEW-03 | 33 | AI-21 | 47 | NOTIF-05 |
| 6 | CORE-09 | 20 | VIEW-04 | 34 | AI-17 | 48 | AI-23 |
| 7 | CORE-10 | 21 | VIEW-05 | 35 | AI-18 | 49 | AI-24 |
| 8 | CORE-11 | 22 | VIEW-06 | 36 | NOTIF-03 | 50 | AI-25 |
| 9 | CORE-12 | 23 | VIEW-07 | 37 | AI-04 | 51 | AI-13 |
| 10 | CORE-13 | 24 | VIEW-08 | 38 | AI-19 | 52 | AI-26 |
| 11 | CORE-14 | 25 | VIEW-09 | 39 | DEV-01 | 53 | AI-18 |
| 12 | CORE-15 | 26 | VIEW-10 | 40 | NOTIF-04 | 54 | AI-27 |
| 13 | CORE-16 | 27 | VIEW-11 | 41 | AI-20 | 55 | AI-28 |
| 14 | CORE-17 | 28 | CORE-20 | 42 | CORE-03 | | |

### PLT (platform-features.md)

| PLT | → ID | PLT | → ID | PLT | → ID | PLT | → ID | PLT | → ID |
| --- | ---- | --- | ---- | --- | ---- | --- | ---- | --- | ---- |
| 1 | SEC-01 | 11 | VIEW-09 | 21 | COL-01 | 31 | MOB-01 | 41 | ADV-01 |
| 2 | SEC-02 | 12 | TIME-02 | 22 | COL-02 | 32 | MOB-02 | 42 | ADV-02 |
| 3 | SEC-03 | 13 | VIEW-08 | 23 | COL-03 | 33 | MOB-03 | 43 | SEC-11 |
| 4 | SEC-04 | 14 | ANL-01 | 24 | COL-04 | 34 | MOB-04 | 44 | ADV-03 |
| 5 | SEC-05 | 15 | ANL-02 | 25 | COL-05 | 35 | MOB-05 | 45 | ADV-04 |
| 6 | SEC-06 | 16 | ANL-03 | 26 | COL-06 | 36 | MOB-06 | 46 | CORE-17 |
| 7 | SEC-07 | 17 | ANL-04 | 27 | COL-07 | 37 | MOB-07 | 47 | ADV-05 |
| 8 | SEC-08 | 18 | ANL-05 | 28 | COL-08 | 38 | AI-07 | 48 | ADV-06 |
| 9 | SEC-09 | 19 | ANL-06 | 29 | COL-09 | 39 | MOB-08 | 49 | ADV-07 |
| 10 | SEC-10 | 20 | ANL-07 | 30 | COL-10 | 40 | MOB-09 | 50 | ADV-08 |

### GC (game-changer-features.md)

| GC | → ID | GC | → ID | GC | → ID | GC | → ID |
| -- | ---- | -- | ---- | -- | ---- | -- | ---- |
| 1 | TIME-03 | 6 | TIME-08 | 11 | CLI-03 | 16 | ANL-08 |
| 2 | TIME-04 | 7 | TIME-09 | 12 | CLI-04 | 17 | ANL-10 |
| 3 | TIME-05 | 8 | TIME-07 | 13 | CLI-05 | 18 | ANL-11 |
| 4 | TIME-06 | 9 | TIME-10 | 14 | CLI-06 | 19 | AI-18 |
| 5 | TIME-07 | 10 | TIME-11 | 15 | CLI-07 | 20 | ANL-12 |
