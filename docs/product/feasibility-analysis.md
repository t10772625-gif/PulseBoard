# Feasibility & Cost Analysis

An assessment of each planned feature: whether it is worth building, what it
would cost to run, and how much effort it needs. The outcome is a lean,
low-cost MVP scope.

Related docs:
[feature-audit.md](./feature-audit.md) (all features and roadmap proposals) ·
[future-features.md](./future-features.md) (technical specs) ·
[pricing.md](./pricing.md) (plans)

> **Note:** Costs and effort are rough estimates. Third-party pricing, free tiers,
> and API quotas change often — verify them before committing to a provider.

## Contents

1. [Summary](#summary)
2. [Build — Low Cost, High Impact](#1-build--low-cost-high-impact)
3. [Consider Carefully — Costly or Complex](#2-consider-carefully--costly-or-complex)
4. [Skip or Delay — Negative ROI](#3-skip-or-delay--negative-roi)
5. [Recommended Phasing](#recommended-phasing)
6. [Monthly Cost Breakdown](#monthly-cost-breakdown)
7. [Final Verdict](#final-verdict)

---

## Summary

| #   | Feature                       | Cost / month | Effort     | Verdict                          |
| --- | ----------------------------- | ------------ | ---------- | -------------------------------- |
| 1   | Custom Boards + Columns       | $0           | 2–3 days   | ✅ Build                         |
| 2   | Client View-Only Invite       | $0           | 1–2 days   | ✅ Build                         |
| 3   | Time Tracking                 | $0           | 1–2 days   | ✅ Build                         |
| 4   | Smart Matching                | $0           | 3–4 days   | ✅ Build — **USP #1**            |
| 5   | Duplicate Bug Detection       | $0           | 4–5 days   | ✅ Build                         |
| 6   | Auto-Prioritization           | $0           | 2–3 days   | ✅ Build                         |
| 7   | Developer Workload Balancing  | $0           | 2–3 days   | ✅ Build — **USP #2**            |
| 8   | Auto Client Reports           | $0–10        | 2–3 days   | ✅ Build                         |
| 9   | AI Bug Report (Image)         | $10–300      | 4–5 days   | ⚠️ Paid (Pro) feature            |
| 10  | Gmail / Slack Integration     | $0           | 7–10 days  | ⚠️ Phase 2 / via Zapier          |
| 11  | Voice Activation              | $0           | 5–7 days   | ⚠️ Nice-to-have, later phase     |
| 12  | Smart Email Threading         | $20–50       | 10–12 days | ❌ Skip                          |
| 13  | AI Standup Summary            | $10–30       | 5–7 days   | ❌ Skip                          |
| 14  | Voice Notes → Task            | $50–100      | 10–15 days | ❌ Skip                          |
| 15  | Predictive Bug Forecasting    | $0           | 15–20 days | ❌ Skip (revisit at 1000+ users) |
| 16  | One-Click Client Onboarding   | $0           | 3–4 days   | ⏸️ Delay                         |
| 17  | AI Fix Suggestion             | $50–200      | 15–20 days | ❌ Skip                          |
| 18  | AI Meeting → Action Items     | $30–100      | 10–15 days | ❌ Skip                          |
| 19  | Bug Severity Auto-Detection   | $0           | 2–3 days   | 🔀 Merge into Auto-Prioritization|
| 20  | Client Feedback → Bug         | $10–30       | 5–7 days   | ⏸️ Delay                         |

---

## 1. Build — Low Cost, High Impact

### 1. Custom Boards + Columns

- **Feasibility:** Fully feasible
- **Cost:** $0 — database tables only
- **Effort:** 2–3 days
- **Recommendation:** Build. A baseline feature users expect.

### 2. Client View-Only Invite

- **Feasibility:** Fully feasible
- **Cost:** $0 — permissions logic only
- **Effort:** 1–2 days
- **Recommendation:** Build. Critical for client retention.

### 3. Time Tracking

- **Feasibility:** Fully feasible
- **Cost:** $0 — timer logic only
- **Effort:** 1–2 days
- **Recommendation:** Build. Simple and adds clear value.

### 4. Smart Matching (Auto-Assign)

- **Feasibility:** Fully feasible
- **Cost:** $0 — SQL query, no AI API required
- **Effort:** 3–4 days
- **Recommendation:** Build. **Primary USP.**

### 5. Duplicate Bug Detection

- **Feasibility:** Fully feasible
- **Cost:** $0 — open-source SBERT embeddings
- **Effort:** 4–5 days
- **Recommendation:** Build. High value at low cost.

### 6. Auto-Prioritization

- **Feasibility:** Fully feasible
- **Cost:** $0 — rules-based scoring, no AI
- **Effort:** 2–3 days
- **Recommendation:** Build. Simple rules, high impact.

### 7. Developer Workload Balancing

- **Feasibility:** Fully feasible
- **Cost:** $0 — simple calculation
- **Effort:** 2–3 days
- **Recommendation:** Build. **Second USP.**

### 8. Auto Client Reports (Email)

- **Feasibility:** Fully feasible
- **Cost:** $0–10/month — transactional email provider free/entry tier
- **Effort:** 2–3 days
- **Recommendation:** Build. Supports client retention.

---

## 2. Consider Carefully — Costly or Complex

### 9. AI Bug Report (Image → Report)

- **Feasibility:** Fully feasible
- **Cost:** $10–300/month (vision model API, ~$0.01–0.03 per image)
  - Light usage: 1,000 images/month ≈ $10–30
  - Heavy usage: 100 users × 5 images/day × $0.02 ≈ $10/day ≈ **$300/month**
- **Effort:** 4–5 days
- **Risk:** Cost scales directly with usage.
- **Recommendation:** Keep out of the MVP until there is traction. Then either:
  - Make it a paid feature (Pro plan only), or
  - Add a free-tier limit (e.g. 5 images/month, then paid)

### 10. Gmail / Slack Integration

- **Feasibility:** Fully feasible
- **Cost:** $0 — APIs are free
- **Effort:** 7–10 days (OAuth, webhooks, and error handling are complex)
- **Risks:**
  - Gmail API needs Google OAuth verification for sensitive scopes — a lengthy process
  - Slack App review can take several days
  - Both APIs enforce per-user / per-method rate limits
- **Recommendation:** Phase 2, after core features are solid. Alternatively,
  offer a Zapier integration that users configure themselves.

### 11. Voice Activation

- **Feasibility:** Fully feasible
- **Cost:** $0 — browser Web Speech API
- **Effort:** 5–7 days (NLP command parsing is the hard part)
- **Risks:**
  - Speech recognition is not supported in every browser (notably Firefox)
  - Accuracy issues with accents and background noise
  - Low adoption — most users prefer typing
- **Recommendation:** Nice-to-have, not must-have. Later phase.

---

## 3. Skip or Delay — Negative ROI

### 12. Smart Email Threading

- **Feasibility:** Possible, but complex
- **Cost:** $20–50/month (AI clustering)
- **Effort:** 10–12 days
- **Problems:**
  - Gmail and Outlook already thread emails
  - Low user value — organizing candidate emails isn't critical
  - High complexity (NLP clustering, entity extraction)
- **Recommendation:** ❌ Skip — negative ROI.

### 13. AI Standup Summary

- **Feasibility:** Possible
- **Cost:** $10–30/month (AI summarization)
- **Effort:** 5–7 days
- **Problems:**
  - Standups already happen in Slack / Teams
  - The owner can see the same information on the dashboard
  - Extra API cost
- **Recommendation:** ❌ Skip — a simple dashboard is enough.

### 14. Voice Notes → Task

- **Feasibility:** Possible, but very complex
- **Cost:** $50–100/month (speech-to-text, ~$0.006 per 15 seconds;
  1,000 notes × 30 s ≈ $60/month)
- **Effort:** 10–15 days (mobile app + backend + NLP)
- **Problems:**
  - Requires a separate mobile app
  - Transcription is expensive
  - Low adoption
- **Recommendation:** ❌ Skip — strongly negative ROI.

### 15. Predictive Bug Forecasting

- **Feasibility:** Possible, but overkill
- **Cost:** $0 (open-source ML)
- **Effort:** 15–20 days (model training, data pipeline)
- **Problems:**
  - Needs 6+ months of historical data
  - Accuracy will be low initially
  - Owners care about current bugs, not forecasts
- **Recommendation:** ❌ Skip — revisit at 1,000+ active users.

### 16. One-Click Client Onboarding

- **Feasibility:** Possible
- **Cost:** $0
- **Effort:** 3–4 days
- **Problems:**
  - It's just three API calls (create user, send email, schedule report)
  - Not truly "one click" — client details still need to be entered
- **Recommendation:** ⏸️ Delay — manual onboarding works initially.

### 17. AI Fix Suggestion

- **Feasibility:** Possible, but very complex
- **Cost:** $50–200/month (AI code analysis; 1,000 bugs × $0.05 ≈ $50/month)
- **Effort:** 15–20 days (GitHub integration + code analysis)
- **Problems:**
  - Requires codebase access (security concerns)
  - Low accuracy — may point to the wrong file
  - Liability if a suggested fix is wrong
- **Recommendation:** ❌ Skip — too risky and costly.

### 18. AI Meeting → Action Items

- **Feasibility:** Possible, but overkill
- **Cost:** $30–100/month (speech-to-text + AI; 100 meetings × 30 min ≈ $72/month)
- **Effort:** 10–15 days
- **Problems:**
  - Uploading recordings adds friction
  - Accuracy issues (accents, noise)
  - Low adoption
- **Recommendation:** ❌ Skip — negative ROI.

### 19. Bug Severity Auto-Detection

- **Feasibility:** Possible
- **Cost:** $0 (rules-based)
- **Effort:** 2–3 days
- **Problem:** Duplicates [Auto-Prioritization](#6-auto-prioritization), which
  already accounts for severity.
- **Recommendation:** 🔀 Merge into Auto-Prioritization — don't build separately.

### 20. Client Feedback → Bug Auto-Create

- **Feasibility:** Possible
- **Cost:** $10–30/month (AI parsing)
- **Effort:** 5–7 days
- **Problems:**
  - Feedback already arrives via email / forms
  - Manual bug creation works fine
  - Extra AI cost
- **Recommendation:** ⏸️ Delay — reconsider in Phase 2.

---

## Recommended Phasing

### Phase 1 — MVP (4–6 weeks · $0–10/month)

| Feature                        | Effort   | Note     |
| ------------------------------ | -------- | -------- |
| Custom Boards + Columns        | 2 days   |          |
| Roles & Permissions            | 2 days   |          |
| Smart Matching                 | 3 days   | USP #1   |
| Client View-Only Access        | 2 days   |          |
| Time Tracking                  | 2 days   |          |
| Duplicate Bug Detection        | 4 days   |          |
| Auto-Prioritization            | 2 days   |          |
| Developer Workload Balancing   | 3 days   | USP #2   |
| Auto Client Reports            | 2 days   |          |
| **Total**                      | **~22 days (4–5 weeks)** |  |

### Phase 2 — Growth (8–12 weeks · $50–100/month)

- ⚠️ AI Bug Report (Image) — as a paid Pro feature
- ⚠️ Gmail / Slack Integration — via Zapier (user-configured)
- ⚠️ Voice Activation — nice-to-have
- ⏸️ Client Feedback → Bug — reconsider here

### Deferred / Skipped (revisit at scale, 6+ months)

- ❌ Smart Email Threading
- ❌ AI Standup Summary
- ❌ Voice Notes → Task
- ❌ Predictive Bug Forecasting (at 1,000+ users)
- ❌ AI Fix Suggestion
- ❌ AI Meeting → Action Items
- ⏸️ One-Click Client Onboarding
- 🔀 Bug Severity Auto-Detection (merged into Auto-Prioritization)

---

## Monthly Cost Breakdown

| Feature                  | API Cost   | Notes                               |
| ------------------------ | ---------- | ----------------------------------- |
| Smart Matching           | $0         | SQL query                           |
| Duplicate Detection      | $0         | SBERT (open-source)                 |
| Auto-Prioritization      | $0         | Rules-based                         |
| Workload Balancing       | $0         | Simple calculation                  |
| Auto Client Reports      | $0–10      | Transactional email provider        |
| AI Bug Report (Image)    | $10–300    | Vision API (~$0.02/image)           |
| Gmail / Slack            | $0         | Free APIs, but high effort          |
| Voice Activation         | $0         | Browser Web Speech API              |
| **Total — Phase 1**      | **$0–10**  | Affordable                          |
| **Total — Phase 2**      | **$50–100**| With AI features                    |

---

## Final Verdict

**Build (low cost, high impact)**

- Smart Matching
- Developer Workload Balancing
- Duplicate Bug Detection
- Auto-Prioritization
- Client View-Only Access
- Time Tracking
- Auto Client Reports

**Build as a paid (Pro) feature**

- AI Bug Report (Image)

**Skip / delay (negative ROI)**

- Smart Email Threading
- AI Standup Summary
- Voice Notes → Task
- Predictive Bug Forecasting
- AI Fix Suggestion

### MVP Formula

```text
PulseBoard MVP =
    Custom Boards + Columns
  + Smart Matching          (USP #1)
  + Workload Balancing      (USP #2)
  + Duplicate Detection
  + Auto-Prioritization
  + Client View-Only
  + Time Tracking
  + Auto Client Reports

Cost:   $0–10 / month
Effort: 4–6 weeks
```

These eight features differentiate PulseBoard from Jira, ClickUp, and Monday
while staying low-cost and high-impact.
