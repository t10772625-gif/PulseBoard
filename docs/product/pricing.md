# Pricing Strategy

PulseBoard's subscription tiers: two pricing options side by side, what each
tier includes, a feature-by-feature tier matrix, limits, cost and margin
estimates, revenue projections, and go-to-market plan.

Features are referenced by their IDs from [feature-audit.md](./feature-audit.md)
(e.g. `AI-01` = Smart Matching).

> **Status:** Draft. Two options are documented; one needs to be chosen.
>
> The owner's direction is to gate features by tier rather than giving
> everything away free:
>
> - AI features around **$10–15/user/month**
> - Smart Matching and the big/advanced features around **$15–20/user/month**
>
> **Option 1** is the earlier proposal ($15 / $25 / $50). **Option 2** follows
> the owner's price range.

## Contents

1. [Options at a Glance](#options-at-a-glance)
2. [Option 1: Proposal ($15 / $25 / $50)](#option-1-proposal-15--25--50)
3. [Option 2: Owner's Range ($12 / $18 / Custom)](#option-2-owners-range-12--18--custom)
4. [Limits per Tier](#limits-per-tier)
5. [Feature → Tier Matrix](#feature--tier-matrix)
6. [Billing Terms](#billing-terms)
7. [Pricing Psychology](#pricing-psychology)
8. [Costs & Margins](#costs--margins)
9. [Revenue Projections](#revenue-projections)
10. [Competitor Comparison](#competitor-comparison)
11. [Go-To-Market](#go-to-market)
12. [Review & Open Issues](#review--open-issues)
13. [Previous Draft](#previous-draft)

---

## Options at a Glance

| Tier           | Option 1 price           | Option 2 price                 | Headline difference                                                          |
| -------------- | ------------------------ | ------------------------------ | ---------------------------------------------------------------------------- |
| **Free**       | $0                       | $0                             | Opt 1: unlimited users, 1 project. Opt 2: 5 members, 3 boards.               |
| **Pro**        | $15/user/month           | **$12**/user/month (range $10–15) | Opt 1: Smart Matching + Workload here. Opt 2: **AI features** here.        |
| **Legendary**  | $25/user/month           | **$18**/user/month (range $15–20) | Opt 1: focus/insight + agency + all AI. Opt 2: **Smart Matching**, Workload, agency, big features. |
| **Enterprise** | $50/user/month or custom | Custom (from ~$30/user/month)  | Same scope: SSO, compliance, dedicated support.                              |

**Main decision:** where the core USP (AI-01 Smart Matching + AI-02 Workload
Balancing) lives.

- **Option 1** puts it in Pro, so more paying users experience the USP.
- **Option 2** puts it in Legendary, so it becomes the main reason to pay the higher price.
- **Middle ground:** Smart Matching *suggestions* in Pro, *automatic* assignment + workload balancing in Legendary.

---

## Option 1: Proposal ($15 / $25 / $50)

| Tier          | Price                    | Target                               | Projects  | Storage   | Support              |
| ------------- | ------------------------ | ------------------------------------ | --------- | --------- | -------------------- |
| **Free**      | $0                       | Attract users                        | 1         | 1 GB      | Community            |
| **Pro**       | $15/user/month           | Most teams (expected ~80% of paid)   | Unlimited | 5 GB      | Priority             |
| **Legendary** | $25/user/month           | Agencies, serious teams, power users | Unlimited | 10 GB     | 24/7 priority        |
| **Enterprise**| $50/user/month or custom | Large companies                      | Custom    | Unlimited | Dedicated + training |

### 🎁 Free — $0

**Goal:** hook users; if they like the product, they upgrade.
**Limit:** unlimited users, 1 project. Stated as "100+ basic features".

- Custom boards + columns (CORE-01/02)
- Tasks, subtasks, checklists (CORE-13/14)
- Bulk operations (CORE-04…06)
- Keyboard shortcuts (CORE-07)
- CSV import / export (CORE-08/09)
- Basic templates (CORE-10)
- Comments + attachments (CORE-15/16)
- Dark mode
- Mobile responsive (MOB-01)
- 1 GB storage
- Community support

### ⭐ Pro — $15/user/month

**Goal:** best value; expected to be the most popular tier (~80% of paid).
Stated as "150+ features, everything except enterprise". Everything in Free, plus:

- Smart Matching, auto-assign (AI-01)
- Workload Balancing (AI-02)
- Duplicate Detection (AI-03)
- Auto-Prioritization (AI-04)
- Time Tracking (TIME-01)
- Gantt, Calendar, and Timeline views (VIEW-03…05)
- Dashboard analytics (VIEW-09)
- Burndown / velocity charts (VIEW-07/08)
- All integrations: GitHub, Slack, Gmail, Calendly, … (INT-01/02)
- Email templates + automated notifications (NOTIF-01/02)
- Client view-only access (CLI-01)
- Custom fields (CORE-19)
- Recurring tasks (CORE-11)
- Dependencies (CORE-12)
- Saved views + filters (VIEW-10)
- 5 GB storage
- Priority support

**Limit:** unlimited projects.

### 🚀 Legendary — $25/user/month

**Goal:** agencies, serious teams, power users. Stated as "170+ features,
everything". Everything in Pro, plus:

**Focus & insights** (claimed ⭐ UNIQUE)

- Flow State Detection (TIME-09) ⚠️ not feasible as proposed
- Burnout Risk Detection (ANL-08)
- Predictive Task Failure (AI-18)
- Optimal Task Time Suggestion (TIME-10)
- Task Batching (TIME-06)
- Energy-Based Sorting (TIME-07)
- Context Switching Tracker (TIME-08)
- Team Chemistry Score (ANL-10)
- Skill Gap Analysis (ANL-11)
- Auto-Lessons Learned (ANL-12)
- All AI features: Hugging Face, auto-translate, etc.

**Agency**

- White-label reports (CLI-06)
- Custom domain (ADV-01)
- Billable hours tracking (CLI-04)
- Client budget tracker (CLI-05)
- Multi-client dashboard (CLI-07)

**Plan**

- 10 GB storage
- 24/7 priority support
- Unlimited everything

### 🏢 Enterprise — $50/user/month (or custom)

**Goal:** big companies with budget and quality/compliance needs. Everything
in Legendary, plus:

- SSO: SAML, Okta (SEC-12)
- Audit logs (CORE-17)
- Advanced permissions (SEC-05)
- Data backup / restore (ADV-05/06)
- SLA guarantees
- Dedicated support
- On-premise deployment (optional) ⚠️
- Custom integrations
- Unlimited storage
- Training + onboarding

**Limit:** custom.

---

## Option 2: Owner's Range ($12 / $18 / Custom)

Follows the owner's direction: **AI features in the $10–15 tier**, **Smart
Matching and the big features in the $15–20 tier**. Prices are placeholders
inside those ranges.

| Tier           | Price                        | Target                                        | Boards    | Members           | Storage  | AI usage          | Support              |
| -------------- | ---------------------------- | --------------------------------------------- | --------- | ----------------- | -------- | ----------------- | -------------------- |
| **Free**       | $0                           | Small teams trying the product                | 3         | Up to 5           | 1 GB     | None              | Community            |
| **Pro**        | $12/user/month ($10–15)      | Teams that want AI help                       | Unlimited | Unlimited (per seat) | 5 GB  | Standard caps     | Email, priority      |
| **Legendary**  | $18/user/month ($15–20)      | Teams and agencies that want automation       | Unlimited | Unlimited (per seat) | 10 GB | Higher caps       | Priority, faster SLA |
| **Enterprise** | Custom (from ~$30/user/month)| Large companies, compliance                   | Unlimited | Unlimited         | Custom   | Custom            | Dedicated + training |

### 🎁 Free — $0

Everything a small team needs to run a board, **no AI**:

- Boards, columns, tasks, subtasks, checklists, comments, attachments (CORE)
- Bulk actions, shortcuts, quick add, cloning, archive, undo, CSV import/export
- Board and list views, basic templates
- Real-time updates and presence (COL-01/02), activity feed
- All security basics: 2FA, Google/GitHub login, basic roles, GDPR export/deletion
- Mobile responsive + PWA, dark mode, focus mode, do not disturb

### ⭐ Pro — $12/user/month (AI tier)

Everything in Free, plus **AI and productivity**:

- **AI:** Duplicate Detection (AI-03), Auto-Prioritization (AI-04), AI Bug Report with monthly cap (AI-05), Auto-Tagging (AI-16), Natural-language search (AI-21), Next-action suggestions (AI-19), Task splitting (AI-23), Eisenhower matrix (AI-24), Context-aware task creation (AI-25), Smart notifications & reminders (NOTIF-03/04), summarization & auto-translate
- **Views:** Gantt, Calendar, Timeline, Dashboard, Burndown, Velocity, saved filters/views, advanced search
- **Work:** Time tracking + estimates vs actual, Pomodoro, recurring tasks, dependencies, custom fields
- **Analytics:** burnup, CFD, cycle time, throughput, WIP limits, aging
- **Clients & integrations:** client view-only (CLI-01), client reports (NOTIF-06), client feedback → bug (CLI-08), GitHub/Slack/Google Calendar/Gmail integrations, code-to-bug linking (DEV-01), API access
- **Automation:** Auto-Workflow Builder with a rule limit (SPEC #21)

### 🚀 Legendary — $18/user/month (Smart Matching & big features)

Everything in Pro, plus:

- **Core USP:** Smart Matching auto-assign (AI-01), Workload Balancing + Workload view (AI-02, VIEW-06), Auto-Resource Allocation (AI-26), Smart PR Review Assignment (DEV-02)
- **Planning:** Sprint Auto-Planning (SPEC #27), Weekly Capacity Planning (TIME-11), Auto-Scheduling (AI-17), Dependency auto-detection (AI-13)
- **Insights:** Team wellbeing / happiness (ANL-08), Skill gap (ANL-11), Retrospective + lessons learned (ANL-12), Board insights (AI-27), Weekly status report (NOTIF-05), SLA tracking (ANL-07); predictive features (AI-18, TIME-10) once enough data exists
- **Focus suite:** Task batching, energy-based planning, context-switch tracker (personal only), focus-time detection (TIME-06…09)
- **Agency:** approvals, billable hours, budgets, white-label reports, multi-client dashboard, one-click onboarding (CLI-02…07), client portal (SPEC #25), custom domain + white label (ADV-01/02)
- **Automation:** unlimited workflow rules, webhook builder (ADV-04), async standup (SPEC #24), embed widget (COL-06)

### 🏢 Enterprise — Custom

Everything in Legendary, plus:

- SAML/OIDC SSO (SEC-12), granular permissions (SEC-05)
- Audit log export and retention controls (CORE-17)
- Customer-initiated backup/restore (ADV-05/06)
- SLA guarantees, dedicated support, training + onboarding
- Custom integrations, custom storage and AI limits

---

## Limits per Tier

| Limit                 | Opt 1 Free | Opt 1 Pro | Opt 1 Legendary | Opt 1 Ent. | Opt 2 Free | Opt 2 Pro   | Opt 2 Legendary | Opt 2 Ent. |
| --------------------- | ---------- | --------- | --------------- | ---------- | ---------- | ----------- | --------------- | ---------- |
| Projects / boards     | 1 project  | Unlimited | Unlimited       | Custom     | 3 boards   | Unlimited   | Unlimited       | Unlimited  |
| Members               | Unlimited  | Per seat  | Per seat        | Custom     | 5          | Per seat    | Per seat        | Custom     |
| Storage               | 1 GB       | 5 GB      | 10 GB           | Unlimited  | 1 GB       | 5 GB        | 10 GB           | Custom     |
| AI actions / user / month | —      | Not set   | "All AI"        | Custom     | 0          | e.g. 200    | e.g. 1,000      | Custom     |
| AI bug reports (image) / user / month | — | —   | Not set         | Custom     | 0          | e.g. 20     | e.g. 100        | Custom     |
| Workflow rules        | —          | Not set   | Not set         | Custom     | 0          | e.g. 10     | Unlimited       | Unlimited  |
| Support               | Community  | Priority  | 24/7 priority   | Dedicated  | Community  | Email       | Priority        | Dedicated  |

AI caps are examples. They exist so that per-seat AI cost can never exceed the
seat price.

---

## Feature → Tier Matrix

Every feature from [feature-audit.md](./feature-audit.md).

Tier codes: **F** Free · **P** Pro · **L** Legendary · **E** Enterprise ·
**—** not planned / skipped · **Later** = tier decided, but built after enough
data or demand.

`†` = Option 1 didn't name this feature, so its tier is inferred from the
closest item Option 1 did name (e.g. "Dashboard analytics" → Pro, "All AI
features" → Legendary).

### Core Task Management

| ID      | Feature                      | Option 1 | Option 2 |
| ------- | ---------------------------- | -------- | -------- |
| CORE-01 | Custom Boards                | F (1 project) | F (3 boards) |
| CORE-02 | Custom Columns               | F        | F        |
| CORE-03 | Smart Board Templates        | P†       | P        |
| CORE-04 | Bulk Delete                  | F        | F        |
| CORE-05 | Bulk Status Change           | F        | F        |
| CORE-06 | Bulk Assign                  | F        | F        |
| CORE-07 | Keyboard Shortcuts           | F        | F        |
| CORE-08 | CSV Import                   | F        | F        |
| CORE-09 | CSV Export                   | F        | F        |
| CORE-10 | Save as Template (basic)     | F        | F        |
| CORE-11 | Recurring Tasks              | P        | P        |
| CORE-12 | Task Dependencies (manual)   | P        | P        |
| CORE-13 | Subtasks                     | F        | F        |
| CORE-14 | Checklists                   | F        | F        |
| CORE-15 | Task Comments                | F        | F        |
| CORE-16 | File Attachments             | F (1 GB) | F (1 GB) |
| CORE-17 | Task History / Audit Log     | History F† · Audit log E | History F · Audit export E |
| CORE-18 | Quick Add                    | F†       | F        |
| CORE-19 | Custom Fields                | P        | P        |
| CORE-20 | Task Cloning                 | F†       | F        |
| CORE-21 | Task Archiving               | F†       | F        |
| CORE-22 | Undo Delete                  | F†       | F        |

### Views & Visualization

| ID      | Feature                      | Option 1 | Option 2 |
| ------- | ---------------------------- | -------- | -------- |
| VIEW-01 | Board (Kanban)               | F        | F        |
| VIEW-02 | List view                    | F†       | F        |
| VIEW-03 | Gantt                        | P        | P        |
| VIEW-04 | Calendar                     | P        | P        |
| VIEW-05 | Timeline                     | P        | P        |
| VIEW-06 | Workload view                | P†       | L        |
| VIEW-07 | Burndown                     | P        | P        |
| VIEW-08 | Velocity                     | P        | P        |
| VIEW-09 | Dashboard                    | P        | P        |
| VIEW-10 | Saved Filters / Views        | P        | P (quick filters F) |
| VIEW-11 | Advanced Search              | P†       | P        |

### AI & Automation

| ID    | Feature                                 | Option 1 | Option 2         |
| ----- | --------------------------------------- | -------- | ---------------- |
| AI-01 | Smart Matching                          | P        | **L**            |
| AI-02 | Workload Balancing                      | P        | **L**            |
| AI-03 | Duplicate Detection & Merge             | P        | P                |
| AI-04 | Auto-Prioritization / Severity          | P        | P                |
| AI-05 | AI Bug Report (Image)                   | L†       | P (capped)       |
| AI-06 | AI Fix Suggestion                       | L†       | — (skip)         |
| AI-07 | Voice Activation / Input                | L†       | L, Later         |
| AI-08 | Voice Notes → Task                      | L†       | — (skip)         |
| AI-09 | Smart Email Threading                   | L†       | — (skip)         |
| AI-10 | AI Standup Summary                      | L†       | L (as Async Standup) |
| AI-11 | Predictive Bug Forecasting              | L†       | L, Later         |
| AI-12 | AI Meeting → Action Items               | L†       | — (skip)         |
| AI-13 | Dependency Auto-Detection               | L†       | L                |
| AI-14 | AI Test Case Generator                  | L†       | — (undecided)    |
| AI-15 | Competitor Bug Tracker                  | L†       | — (undecided)    |
| AI-16 | Auto-Tagging                            | L†       | P                |
| AI-17 | Auto-Scheduling                         | L†       | L                |
| AI-18 | Predictive Task Completion / Failure    | L        | L, Later         |
| AI-19 | Smart Suggestions (Next Action)         | L†       | P                |
| AI-20 | Auto-Documentation                      | L†       | L                |
| AI-21 | Smart Search (Natural Language)         | L†       | P                |
| AI-22 | AI Meeting Scheduler                    | L†       | L                |
| AI-23 | Smart Task Splitting                    | L†       | P                |
| AI-24 | Eisenhower Matrix                       | L†       | P                |
| AI-25 | Context-Aware Task Creation             | L†       | P                |
| AI-26 | Auto-Resource Allocation                | L†       | L                |
| AI-27 | Smart Board Insights                    | L†       | L                |
| AI-28 | Auto-Process Improvement                | L†       | L                |

### Email & Notifications

| ID       | Feature                           | Option 1 | Option 2 |
| -------- | --------------------------------- | -------- | -------- |
| NOTIF-01 | Email Templates                   | P        | P        |
| NOTIF-02 | Automated Email Notifications     | P        | P (basic in-app notifications F) |
| NOTIF-03 | Smart Notifications & Digest      | L†       | P        |
| NOTIF-04 | Smart Reminders                   | L†       | P        |
| NOTIF-05 | Auto-Status Report (weekly)       | L†       | L        |
| NOTIF-06 | Auto Client Reports               | P†       | P        |

### Time & Productivity

| ID      | Feature                          | Option 1 | Option 2           |
| ------- | -------------------------------- | -------- | ------------------ |
| TIME-01 | Time Tracking                    | P        | P                  |
| TIME-02 | Estimates vs Actual / Analytics  | P†       | P                  |
| TIME-03 | Focus Mode                       | L†       | F                  |
| TIME-04 | Do Not Disturb                   | L†       | F                  |
| TIME-05 | Pomodoro                         | L†       | P                  |
| TIME-06 | Task Batching                    | L        | L                  |
| TIME-07 | Energy-Based Sorting             | L        | L                  |
| TIME-08 | Context Switching Tracker        | L        | L (personal only)  |
| TIME-09 | Flow State Detection             | L ⚠️     | L (reworked as focus-time detection) |
| TIME-10 | Optimal Task Time                | L        | L, Later           |
| TIME-11 | Weekly Capacity Planning         | L†       | L                  |

### Analytics & Insights

| ID     | Feature                               | Option 1 | Option 2              |
| ------ | ------------------------------------- | -------- | --------------------- |
| ANL-01 | Burnup                                | P†       | P                     |
| ANL-02 | Cumulative Flow                       | P†       | P                     |
| ANL-03 | Lead / Cycle Time                     | P†       | P                     |
| ANL-04 | Throughput                            | P†       | P                     |
| ANL-05 | WIP Limits                            | P†       | P                     |
| ANL-06 | Aging Report                          | P†       | P                     |
| ANL-07 | SLA Tracking                          | P†       | L                     |
| ANL-08 | Team Wellbeing / Burnout              | L        | L                     |
| ANL-09 | Developer Performance Score           | L†       | — (reconsider)        |
| ANL-10 | Team Chemistry Score                  | L        | — (reconsider)        |
| ANL-11 | Skill Gap Analysis                    | L        | L                     |
| ANL-12 | Retrospective & Lessons Learned       | L        | L                     |

### Collaboration

| ID     | Feature                  | Option 1 | Option 2 |
| ------ | ------------------------ | -------- | -------- |
| COL-01 | Real-Time Updates        | F†       | F        |
| COL-02 | Presence                 | F†       | F        |
| COL-03 | Collaborative Editing    | P†       | P        |
| COL-04 | Task Public Link         | P†       | P        |
| COL-05 | Board Public Link        | P†       | P        |
| COL-06 | Embed Widget             | P†       | L        |
| COL-07 | Activity Feed            | F†       | F        |
| COL-08 | User Profile             | F†       | F        |
| COL-09 | Team Directory           | F†       | F        |
| COL-10 | Org Chart                | P†       | P        |

### Security & Permissions

Security basics should not be paywalled: every tier gets them in both options.

| ID     | Feature                    | Option 1        | Option 2        |
| ------ | -------------------------- | --------------- | --------------- |
| SEC-01 | Two-Factor Auth            | F†              | F               |
| SEC-02 | Google Sign-In             | F†              | F               |
| SEC-03 | GitHub Sign-In             | F†              | F               |
| SEC-04 | Roles (Owner/Admin/Member/Viewer) | F† (basic)  | F (basic)       |
| SEC-05 | Granular / Advanced Permissions | E          | E               |
| SEC-06 | Session Management         | F†              | F               |
| SEC-07 | Password Reset             | F†              | F               |
| SEC-08 | Account Deactivation       | F†              | F               |
| SEC-09 | Data Export (GDPR)         | F†              | F               |
| SEC-10 | Account Deletion (GDPR)    | F†              | F               |
| SEC-11 | API Rate Limiting          | Platform-wide   | Platform-wide   |
| SEC-12 | Enterprise SSO (SAML/Okta) | E               | E               |

### Mobile & Offline

| ID     | Feature                  | Option 1 | Option 2 |
| ------ | ------------------------ | -------- | -------- |
| MOB-01 | Mobile Responsive        | F        | F        |
| MOB-02 | PWA                      | F†       | F        |
| MOB-03 | Offline Mode             | P†       | P        |
| MOB-04 | Web Push                 | F†       | F        |
| MOB-05 | Native Mobile App        | Later    | Later    |
| MOB-06 | Tablet Optimization      | F†       | F        |
| MOB-07 | Touch Gestures           | F†       | F        |
| MOB-08 | Camera Capture           | F†       | F        |
| MOB-09 | QR Code Scanner          | P†       | P        |

### Advanced & Platform

| ID     | Feature                  | Option 1 | Option 2 |
| ------ | ------------------------ | -------- | -------- |
| ADV-01 | Custom Domain            | L        | L        |
| ADV-02 | White Label              | L        | L        |
| ADV-03 | API Documentation / API access | P†  | P        |
| ADV-04 | Webhook Builder          | P†       | L        |
| ADV-05 | Backups (customer-initiated) | E    | E        |
| ADV-06 | Data Restore (customer-initiated) | E | E       |
| ADV-07 | Multi-Language (i18n)    | F†       | F        |
| ADV-08 | Accessibility            | F†       | F        |

Platform backups of all customer data happen for every tier; ADV-05/06 is the
customer's own self-serve backup/restore.

### Client & Agency

| ID     | Feature                          | Option 1 | Option 2 |
| ------ | -------------------------------- | -------- | -------- |
| CLI-01 | Client View-Only Invite          | P        | P        |
| CLI-02 | One-Click Client Onboarding      | L†       | L        |
| CLI-03 | Client Approval Workflow         | L†       | L        |
| CLI-04 | Billable Hours                   | L        | L        |
| CLI-05 | Client Budget Tracker            | L        | L        |
| CLI-06 | White-Label Client Reports       | L        | L        |
| CLI-07 | Multi-Client Dashboard           | L        | L        |
| CLI-08 | Client Feedback → Bug (+ Widget) | L†       | P        |

### Developer Experience & Integrations

| ID     | Feature                          | Option 1 | Option 2 |
| ------ | -------------------------------- | -------- | -------- |
| DEV-01 | Code-to-Bug Linking & Auto-Status| P        | P        |
| DEV-02 | Smart PR Review Assignment       | P†       | L        |
| INT-01 | Gmail / Slack → Task             | P        | P        |
| INT-02 | Other integrations ([FREE 1–20](./free-features.md#category-1--free-integrations-120)) | P ("all integrations") | P: GitHub, Slack, Google Calendar, Drive, imports, Zapier/Make · L: WhatsApp, Gmail auto-task (these have real per-use costs) |

### Spec-only features ([future-features.md](./future-features.md))

| SPEC | Feature                     | Option 1 | Option 2               |
| ---- | --------------------------- | -------- | ---------------------- |
| 21   | Auto-Workflow Builder       | P†       | P (10 rules) · L (unlimited) |
| 22   | Context Switching Killer (Slack commands) | P† | P               |
| 24   | Async Standup               | L†       | L                      |
| 25   | Client Portal (White-Label) | L        | L                      |
| 26   | Bug Bounty Mode (public form) | L†     | P                      |
| 27   | Sprint Auto-Planning        | L†       | L                      |
| 28   | Developer Happiness Score   | L        | L                      |

### Free-tier productivity & NLP extras ([free-features.md](./free-features.md))

| FREE    | Feature                                   | Option 1 | Option 2                         |
| ------- | ----------------------------------------- | -------- | -------------------------------- |
| 36      | Dark Mode                                 | F        | F                                |
| 37–38   | Custom Themes, Board Backgrounds          | P†       | P                                |
| 39–40   | Emoji Reactions, @Mentions                | F†       | F                                |
| 43–44   | Quick Filters / Saved Views               | P        | Quick filters F · Saved views P  |
| 45–49   | Column collapse, drag-and-drop, inline edit, multi-select | F† | F                     |
| 50      | Undo / Redo                               | F†       | F                                |
| 21, 24, 27 | Text classification, summarization, auto-translate | L | P (within AI caps)           |
| 22–23, 25 | Sentiment, keyword extraction, language detection | L | — (English-only / low value)     |
| 26      | Spell check                               | L        | F (browser built-in)             |

---

## Billing Terms

Applies to both options.

- **Per seat, per month.** Every member counts as a seat, except viewers and clients (CLI-01), who are free.
- **Annual plan:** ~17% discount (2 months free). Standard in SaaS, and it improves cash flow.
- **Trial:** 14-day trial of the paid tier (from the go-to-market plan), with no card required.
- **AI usage caps** per tier (see [Limits](#limits-per-tier)), with optional top-up packs.
- **Downgrade:** data is kept; paid features become read-only.
- **Payments provider:** not chosen yet. Check which providers support payouts in your country. Merchant-of-record services (Paddle, Lemon Squeezy) handle global sales tax/VAT.

---

## Pricing Psychology

1. **Free tier as marketing.** Free users try the product, like it, and upgrade.
   It also drives word of mouth ("so much for free, imagine paid").
2. **Pro as best value.** Roughly the price of a coffee. Option 1 compared it
   with Jira ($7) + ClickUp ($10) + Calendly ($8) ≈ $25 of value for $15.
3. **Legendary as premium.** Agencies bill a client $500–1,000+, so a
   $18–25 seat is small next to agency-specific features.
4. **Enterprise as high margin.** Large companies have budget and value
   compliance; even 10–50 seats is $500–2,500/month in Option 1.

---

## Costs & Margins

### Fixed (monthly)

| Item                          | Cost                          |
| ----------------------------- | ----------------------------- |
| Hosting (Vercel + Supabase)   | $50–100 (start on free tiers) |
| Domain + email                | $20                           |
| **Total**                     | **$70–120**                   |

Supabase Pro (~$25/month) is needed for platform backups
([feature-audit ADV-05](./feature-audit.md#advanced--platform-adv)).

### Variable (per paid user, monthly)

| Item                                   | Cost          |
| -------------------------------------- | ------------- |
| AI APIs (Legendary in Opt 1; Pro + Legendary in Opt 2) | $0.50–1.00 |
| Transactional email                    | $0.10         |
| Storage (5 GB)                         | $0.20         |
| **Subtotal (as originally proposed)**  | **$0.80–1.30**|
| Payment processing (~5% + $0.30, worst case one seat per invoice) | $0.90–2.80 |

### Margin

| Tier            | Price | Cost (proposed) | Margin (proposed) | Cost incl. payments | Margin incl. payments |
| --------------- | ----- | --------------- | ----------------- | ------------------- | --------------------- |
| Opt 1 Pro       | $15   | $1.30           | 91%               | $2.35               | 84%                   |
| Opt 1 Legendary | $25   | $1.30           | 95%               | $2.85               | 89%                   |
| Opt 1 Enterprise| $50   | $1.30           | 97%               | $4.10               | 92%                   |
| Opt 2 Pro       | $12   | $1.30           | 89%               | $2.20               | 82%                   |
| Opt 2 Legendary | $18   | $1.30           | 93%               | $2.50               | 86%                   |
| Opt 2 Enterprise| ~$30  | $1.30           | 96%               | $3.10               | 90%                   |

Support time, sales tax handling, and refunds are not included. Option 1
stated an "average margin 90–95%" and "break-even at 50 paid users
(Month 3–4)".

---

## Revenue Projections

"Users" means seats. Same seat mix for both options; only prices differ.

| Year | Total users | Free         | Pro          | Legendary    | Enterprise  | **Opt 1 MRR** | **Opt 1 ARR** | **Opt 2 MRR** | **Opt 2 ARR** |
| ---- | ----------- | ------------ | ------------ | ------------ | ----------- | ------------- | ------------- | ------------- | ------------- |
| 1    | 1,000       | 800 (80%)    | 150 (15%)    | 40 (4%)      | 10 (1%)     | $3,750        | $45,000       | $2,820        | $33,840       |
| 2    | 5,000       | 3,500 (70%)  | 1,000 (20%)  | 400 (8%)     | 100 (2%)    | $30,000       | $360,000      | $22,200       | $266,400      |
| 3    | 20,000      | 12,000 (60%) | 5,000 (25%)  | 2,000 (10%)  | 1,000 (5%)  | $175,000      | $2.1M         | $126,000      | $1.51M        |

Option 2 assumes Enterprise at $30/seat. Option 1 labelled Year 1
"conservative" and Year 3 "aggressive".

> **Reality check:** freemium SaaS commonly converts **2–5%** of free users to
> paid. These projections assume 20% paid in Year 1, rising to 40% in Year 3.
> At 4% conversion, Year 1 is roughly 40 paid seats: ~$700 MRR (Opt 1) or
> ~$550 MRR (Opt 2). Plan for the conservative case.

---

## Competitor Comparison

Approximate list prices; verify before publishing.

| Tool                     | Price (per user/month) | Notes                                         |
| ------------------------ | ---------------------- | --------------------------------------------- |
| Jira                     | ~$8–16                 | Has AI (Atlassian Intelligence / Rovo)        |
| ClickUp                  | ~$7–19                 | Very broad feature set, AI add-on             |
| Monday                   | ~$9–19                 | Limited free tier                             |
| Asana                    | ~$11–25                | Time tracking on higher tiers                 |
| Linear                   | ~$8–16                 | Focused, developer-oriented                   |
| **PulseBoard Free**      | $0                     | Generous free tier                            |
| **PulseBoard Pro**       | $15 (Opt 1) / $12 (Opt 2) | Opt 1: Smart Matching. Opt 2: AI features. |
| **PulseBoard Legendary** | $25 (Opt 1) / $18 (Opt 2) | Opt 1: focus/insight + agency. Opt 2: Smart Matching + agency. |

> The original comparison claimed Jira has no AI and Asana has no time
> tracking; both are outdated, so those claims were removed. Per-tool "feature
> counts" (Jira ~80, ClickUp ~120, Monday ~100, Asana ~90, Linear ~70,
> PulseBoard 100+/150+/170+) were also removed. They weren't sourced, and
> customers compare specific capabilities, not counts.

---

## Go-To-Market

| Phase                  | Months | Actions                                                                                   | Goal                          |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------- | ----------------------------- |
| 1. Attract free users  | 1–3    | Product Hunt launch; Reddit (r/productivity, r/projectmanagement); Twitter/LinkedIn feature threads; YouTube tutorials | 1,000 free users              |
| 2. Convert to paid     | 4–6    | Email campaigns showing paid features; in-app prompts ("Upgrade for Smart Matching"); 14-day trial | 10% conversion (~100 paid)    |
| 3. Scale               | 7–12   | Paid ads (Google, LinkedIn); affiliate program (10% commission); agency partnerships      | 5,000 users, 500 paid         |

---

## Review & Open Issues

**What works (both options)**

- Gating features by tier instead of giving everything away free.
- Putting AI-01 + AI-02 (the core USP) behind a paid tier. They are the main reason to upgrade.
- Agency features (billable hours, budgets, white-label, multi-client) in the higher tier. Agencies are used to paying for these.

**Needs a decision**

| # | Issue | Detail |
|---|-------|--------|
| 1 | **Option 1 or 2** | Mainly: price points, and whether Smart Matching is Pro or Legendary. See [Options at a Glance](#options-at-a-glance). |
| 2 | **Free tier limits** | Option 1's "unlimited users" costs hosting and reduces the reason to upgrade. Member limits (Option 2: 5) are the most common upgrade trigger. |
| 3 | **Selling unbuilt / risky features** | Option 1's Legendary headline includes TIME-09 (not feasible as proposed) and features needing months of data (AI-18, TIME-10, ANL-08). Selling them before they work risks refunds and trust. Lead Legendary with **agency features** and **AI-01/02**, which are buildable now. |
| 4 | **AI placement & caps** | [feasibility-analysis.md](./feasibility-analysis.md) recommends AI Bug Report as a Pro feature. Option 1 puts "all AI" in Legendary; Option 2 puts most AI in Pro with caps. Caps are needed either way. |
| 5 | **On-premise Enterprise** | The stack is hosted Supabase + Vercel. On-premise means supporting self-hosted Supabase per customer, a large ongoing cost. Drop until there's demand. |
| 6 | **Tier naming** | "Legendary" is memorable but unusual for B2B buyers; "Business" is the conventional name. |
| 7 | **AI Fix Suggestion (AI-06)** | The previous draft sold "Auto Fix Suggestions" in Enterprise; feasibility says skip (security, accuracy, liability). |
| 8 | **Payments provider** | Not chosen (see [Billing Terms](#billing-terms)). Billing itself isn't specified anywhere yet ([README](./README.md#not-yet-covered)). |

---

## Previous Draft

The original three-tier plan, kept for reference:

| Plan       | Price          | Features                                                                   |
| ---------- | -------------- | -------------------------------------------------------------------------- |
| Free       | $0             | 1 Board, 5 Members, Basic AI, No Smart Matching                            |
| Pro        | $10/user/month | Unlimited Boards, Smart Matching, AI Bug Report, Time Tracking             |
| Enterprise | $25/user/month | Custom AI Models, Auto Fix Suggestions, Voice Activation, Priority Support |

See [feature-audit.md](./feature-audit.md) for every feature, and
[README.md](./README.md) for the doc index.
