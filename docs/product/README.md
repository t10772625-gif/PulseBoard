# PulseBoard Product Docs

Index of all product planning docs, where each feature category lives, and
what is still missing.

> **Status:** Planning. Nothing in these docs is committed scope yet. One MVP
> still has to be chosen (see [Next Steps](#next-steps)).

## Documents

| Doc                                                   | What it contains                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [feature-audit.md](./feature-audit.md)                | **Master list.** Every feature once, with IDs (`CORE-01`, `AI-03`…), estimates, market notes, reality checks, privacy review, all MVP proposals |
| [pricing.md](./pricing.md)                            | Pricing Option 1 & Option 2, **feature → tier matrix**, limits, margins, projections, go-to-market |
| [future-features.md](./future-features.md)            | Technical specs for 30 features: data model, API, frontend (SPEC #1–30)                           |
| [free-features.md](./free-features.md)                | 50 free-tier integrations, NLP libraries, productivity features, with cost reality checks (FREE #1–50) |
| [feasibility-analysis.md](./feasibility-analysis.md)  | Build / skip verdicts with cost and effort for SPEC #1–20; lean 4–6 week MVP                      |
| [github-integration.md](./github-integration.md)      | GitHub App, webhooks, module detection, task linking design                                       |

`features-to-implement.md`, `feature-catalog.md`, `platform-features.md`, and
`game-changer-features.md` were merged into `feature-audit.md` and removed. The
audit's [Source Index](./feature-audit.md#source-index) maps every old number
to its new ID.

---

## Feature Categories

The 13 categories from the final feature audit. "Stated" is the count the
original audit claimed; the audit section has the actual deduplicated list.

| # | Category                 | Stated | Where                                                                                     |
| - | ------------------------ | ------ | ----------------------------------------------------------------------------------------- |
| 1 | Core Task Management     | 30     | [CORE](./feature-audit.md#core-task-management-core)                                      |
| 2 | Views & Visualization    | 15     | [VIEW](./feature-audit.md#views--visualization-view)                                      |
| 3 | AI Features              | 25     | [AI](./feature-audit.md#ai--automation-ai) · [FREE 21–35](./free-features.md#category-2--free-ai--nlp-2135) |
| 4 | Integrations             | 20     | [INT](./feature-audit.md#integrations-int) · [FREE 1–20](./free-features.md#category-1--free-integrations-120) · [github-integration](./github-integration.md) |
| 5 | Email & Notifications    | 10     | [NOTIF](./feature-audit.md#email--notifications-notif)                                    |
| 6 | Time & Productivity      | 15     | [TIME](./feature-audit.md#time--productivity-time) · [FREE 36–50](./free-features.md#category-3--free-productivity-3650) |
| 7 | Analytics & Insights     | 15     | [ANL](./feature-audit.md#analytics--insights-anl)                                         |
| 8 | Collaboration            | 15     | [COL](./feature-audit.md#collaboration-col)                                               |
| 9 | Security & Permissions   | 10     | [SEC](./feature-audit.md#security--permissions-sec)                                       |
| 10 | Mobile & Offline        | 10     | [MOB](./feature-audit.md#mobile--offline-mob)                                             |
| 11 | Advanced                | 10     | [ADV](./feature-audit.md#advanced--platform-adv)                                          |
| 12 | Client & Agency         | 10     | [CLI](./feature-audit.md#client--agency-cli)                                              |
| 13 | Developer Experience    | 10     | [DEV](./feature-audit.md#developer-experience-dev) · [github-integration](./github-integration.md) |

Stated counts sum to **195** (the audit said "170+"). After deduplication the
audit has ~115 unique features. See
[Totals: Claims vs Reality](./feature-audit.md#totals-claims-vs-reality).

**Already in the codebase:** Kanban board (VIEW-01), task drag-and-drop, dark
mode. Excel library `xlsx@0.18.5` is installed but needs an upgrade
([FREE #12](./free-features.md#12-csv--excel-import)).

---

## Not Yet Covered

The feature audit said nothing was missing. These gaps remain, and several
block launch:

| Gap                                   | Why it matters                                                                         |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| **Billing & subscriptions**           | [pricing.md](./pricing.md) defines paid plans, but no doc covers payments (e.g. Stripe / Lemon Squeezy / Paddle), invoices, upgrades, or cancellations. **No billing = no revenue.** |
| **Plan limit enforcement**            | [pricing.md limits](./pricing.md#limits-per-tier) define boards, members, storage, AI caps; nothing specifies how they're enforced. |
| **Workspaces / multi-tenancy**        | How companies, boards, and users are isolated from each other (core to RLS design).    |
| **User onboarding**                   | Signup flow, first-board setup, invites, empty states.                                 |
| **In-app notification center**        | Notifications are specified for email/Slack/push, not an in-app inbox.                 |
| **List view**                         | Listed in the audit but not specified anywhere (VIEW-02).                              |
| **Admin / super-admin panel**         | Managing customers, plans, and support as the PulseBoard operator.                     |
| **Monitoring & error tracking**       | Logging, uptime, error reporting (e.g. Sentry) for production.                         |
| **Legal**                             | Terms of Service, Privacy Policy, DPA; needed for GDPR claims and paid plans.         |

---

## Next Steps

1. **Pick one MVP.** Six proposals exist; they're collected in
   [All MVP / Roadmap Proposals](./feature-audit.md#all-mvp--roadmap-proposals).
2. **Pick a pricing option.** [Option 1 or Option 2](./pricing.md#options-at-a-glance);
   mainly whether Smart Matching sits in Pro or Legendary.
3. **Add the blockers.** Auth + RLS, workspaces, and billing belong in the MVP
   regardless of which features are chosen.
