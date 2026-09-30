# Free & Low-Cost Features

50 features built on free APIs, free tiers, and open-source libraries:
integrations, lightweight AI/NLP, and productivity features.

This doc has its **own numbering (1–50)**, separate from
[future-features.md](./future-features.md) and
[feature-audit.md](./feature-audit.md).

> ⚠️ **"Free" needs qualifying.** Many items below are free *to call* but have
> hidden costs: security assessments, per-message pricing, hosting, or free
> tiers too small for production. Each feature has a **Reality check** where the
> original assumption didn't hold. Third-party pricing and limits change often —
> verify them before building.

## Contents

1. [Category 1 — Free Integrations (1–20)](#category-1--free-integrations-120)
2. [Category 2 — Free AI & NLP (21–35)](#category-2--free-ai--nlp-2135)
3. [Category 3 — Free Productivity (36–50)](#category-3--free-productivity-3650)
4. [Summary](#summary)
5. [MVP Recommendation](#mvp-recommendation)
6. [Already in the Codebase](#already-in-the-codebase)
7. [Overlaps with Other Docs](#overlaps-with-other-docs)

---

## Category 1 — Free Integrations (1–20)

| #   | Integration              | Effort | Stated cost | Actual cost             | Impact     |
| --- | ------------------------ | ------ | ----------- | ----------------------- | ---------- |
| 1   | Calendly                 | 2 days | $0          | ⚠️ Webhooks need paid plan | ⭐⭐⭐⭐⭐ |
| 2   | Google Calendar          | 3 days | $0          | $0                      | ⭐⭐⭐⭐⭐ |
| 3   | GitHub                   | 4 days | $0          | $0                      | ⭐⭐⭐⭐⭐ |
| 4   | Slack                    | 3 days | $0          | $0                      | ⭐⭐⭐⭐⭐ |
| 5   | Gmail                    | 4 days | $0          | ⚠️ Security assessment  | ⭐⭐⭐⭐⭐ |
| 6   | Google Drive             | 3 days | $0          | $0 (user's storage)     | ⭐⭐⭐⭐   |
| 7   | Discord                  | 3 days | $0          | $0                      | ⭐⭐⭐⭐   |
| 8   | Telegram Bot             | 2 days | $0          | $0                      | ⭐⭐⭐⭐   |
| 9   | WhatsApp Business        | 4 days | $0          | ⚠️ Per-message pricing  | ⭐⭐⭐⭐⭐ |
| 10  | Trello Import            | 2 days | $0          | $0                      | ⭐⭐⭐⭐   |
| 11  | Notion Import            | 3 days | $0          | $0                      | ⭐⭐⭐⭐   |
| 12  | CSV / Excel Import       | 2 days | $0          | $0                      | ⭐⭐⭐⭐⭐ |
| 13  | Zapier                   | 3 days | $0          | $0 (user pays their plan) | ⭐⭐⭐⭐⭐ |
| 14  | Make (Integromat)        | 3 days | $0          | $0 (user pays their plan) | ⭐⭐⭐⭐ |
| 15  | IFTTT                    | 2 days | $0          | $0 (user pays their plan) | ⭐⭐⭐   |
| 16  | Google Forms             | 3 days | $0          | $0                      | ⭐⭐⭐⭐⭐ |
| 17  | Typeform                 | 2 days | $0          | $0 (10 responses/month) | ⭐⭐⭐     |
| 18  | Airtable                 | 3 days | $0          | ⚠️ API call cap on free plan | ⭐⭐⭐⭐ |
| 19  | ClickUp Import           | 2 days | $0          | $0                      | ⭐⭐⭐     |
| 20  | Monday.com Import        | 2 days | $0          | $0                      | ⭐⭐⭐     |

### 1. Calendly Integration

- **What:** Embed a meeting scheduler in PulseBoard.
- **Why:** Saves the back-and-forth emails when booking client meetings.
- **How:**
  - Free tier: 1 event type, unlimited meetings, embeddable widget
  - Client opens the Calendly widget inside PulseBoard → picks a time
  - Event is added to Google Calendar
  - PulseBoard task created: *"Meeting with Client X"*

> **Reality check:** the embed is free, but Calendly **webhooks and API
> automation require a paid plan**, so the automatic task creation isn't free.
> Free alternative: the embed widget fires a browser `postMessage` event on
> booking, which PulseBoard can use to create the task client-side.

### 2. Google Calendar Integration

- **What:** Task due dates appear on Google Calendar.
- **Why:** Developers see deadlines alongside meetings.
- **How:**
  - Google Calendar API (free, ~1M queries/day per project)
  - User connects Google (OAuth)
  - Due date → calendar event; detect conflicts with existing events

> **Reality check:** calendar events have no "done" state. On task completion,
> update the event title (e.g. prefix ✅) or delete it.

### 3. GitHub Integration

- **What:** Link PRs and commits to tasks.
- **Why:** Less switching between GitHub and PulseBoard.
- **How:**
  - GitHub API (free, 5,000 requests/hour per installation and up) + free webhooks
  - PR opened → task "In Progress"; PR merged → task "Done"
  - Task key in commit message (`BUG-123`) → auto-link

Full design: [github-integration.md](./github-integration.md).

### 4. Slack Integration

- **What:** Create and update tasks from Slack.
- **Why:** The team already talks in Slack.
- **How:**
  - Slash command: `/pulse create bug: login issue`
  - Task updates → Slack notifications
  - Daily standup summary → Slack channel

> **Reality check:** the Slack API is free, but there is no "10,000 messages/month"
> API quota — that was an old workspace history limit. What matters are
> per-method rate limits, which are stricter for apps not listed in the Slack
> Marketplace. See also
> [#22 Context Switching Killer](./future-features.md#22-context-switching-killer).

### 5. Gmail Integration

- **What:** Create tasks from emails.
- **Why:** HR currently turns emails into tasks by hand.
- **How:**
  - Email with the "PulseBoard" label → task created
  - Task update → reply sent
  - Email attachments → task files

> **Reality check:** Gmail API calls are free (quota is ~1B *quota units*/day per
> project, available to all accounts, not only Workspace). But reading mail uses
> **restricted scopes**, which require Google OAuth verification **and an annual
> third-party security assessment (CASA)** for public apps — typically a paid
> assessment. Cheaper paths: a forwarding address (`tasks@pulseboard.com`) or
> Zapier.

### 6. Google Drive Integration

- **What:** Store task attachments in Google Drive.
- **Why:** Easier file management and versioning.
- **How:**
  - Upload → Drive folder; share link saved on the task
  - Drive keeps file version history

> **Reality check:** the 15 GB is the **user's** Drive storage, not PulseBoard's.
> Files live in each user's account, so access breaks if that user leaves.
> Consider Supabase Storage as the primary store and Drive as an optional link.

### 7. Discord Integration

- **What:** Create and update tasks from Discord.
- **Why:** Many dev teams use Discord.
- **How:** Command to create tasks; task updates → Discord notifications.

> **Reality check:** use **slash commands** (`/pulse create ...`), not `!pulse`
> prefix commands — reading message text requires the privileged Message
> Content intent. Discord also has rate limits; it isn't unlimited.

### 8. Telegram Bot

- **What:** Manage tasks from Telegram.
- **Why:** Quick task creation on mobile.
- **How:**
  - Bot `@PulseBoardBot`: `/new bug: login issue, P1` → task created
  - Task updates → Telegram notifications

> **Reality check:** the Bot API is free but **rate-limited** (roughly 1
> message/second per chat, ~30 messages/second overall).

### 9. WhatsApp Business API

- **What:** Create tasks and send updates over WhatsApp.
- **Why:** Clients and HR live on WhatsApp.
- **How:** Incoming message → task; task update → WhatsApp notification;
  progress updates to clients.

> **Reality check:** Meta now prices **per message**. Replies within the 24-hour
> customer-service window are free, but **business-initiated messages
> (notifications, progress updates) are paid** template messages. It also
> requires Meta business verification. Budget for it, or make it a paid-plan
> feature.

### 10. Trello Import

- **What:** Import Trello boards.
- **Why:** Easy migration from Trello.
- **How:** Trello board JSON export → import; lists → columns, cards → tasks.
  Trello API is free with per-token rate limits.

### 11. Notion Import

- **What:** Import Notion databases.
- **Why:** Easy migration from Notion.
- **How:** Connect a database via the Notion API (free, ~3 requests/second);
  pages → tasks, properties → [custom fields](./feature-audit.md#core-19--custom-fields).

### 12. CSV / Excel Import

- **What:** Bulk-import tasks from CSV or Excel.
- **Why:** Migrate existing data.
- **How:**
  - Libraries: SheetJS (`xlsx`) for Excel, PapaParse for CSV
  - Upload → map columns (title, description, assignee…) → rows become tasks

> **Reality check:** the project already depends on `xlsx@0.18.5` from npm. That
> version is no longer updated on the npm registry and has known security
> advisories (prototype pollution, ReDoS) — risky for parsing user-uploaded
> files. SheetJS now publishes fixed versions from its own CDN. Upgrade before
> building import.

Same as [CORE-08 CSV Import](./feature-audit.md#core-08--csv-import).

### 13. Zapier

- **What:** Connect PulseBoard to thousands of apps.
- **Why:** Covers integrations we don't build ourselves.
- **How:** PulseBoard exposes a webhook/API; users build Zaps (e.g. Gmail → PulseBoard).

> The Zapier free plan (~100 tasks/month) is the **user's** limit, not ours. A
> proper listing means building a Zapier integration on the (free) Zapier
> Developer Platform.

### 14. Make (Integromat)

- **What:** Complex multi-app workflows.
- **How:** Make webhook → PulseBoard API (e.g. Gmail + Slack → PulseBoard).
  Free tier has a small monthly operations/credits allowance (user's limit).

### 15. IFTTT

- **What:** Simple if-this-then-that automations for non-technical users.
- **How:** IFTTT webhook → PulseBoard API, e.g. *"If Gmail label 'Urgent', create a
  task."* Free plan allows only a couple of applets.

### 16. Google Forms Integration

- **What:** Form submissions become tasks.
- **Why:** Client feedback forms → tasks.
- **How:** Form submit → Apps Script trigger → `POST` to PulseBoard API → task created.

> **Reality check:** Google Sheets has no built-in webhook. Use an **Apps Script**
> `onFormSubmit` trigger that calls the PulseBoard API with `UrlFetchApp`.

### 17. Typeform

- **What:** Typeform submissions become tasks.
- **How:** Typeform webhook → PulseBoard API.
- **Limit:** free plan is only ~10 responses/month — fine for demos, not production.

### 18. Airtable Integration

- **What:** Sync Airtable records with tasks.
- **How:** Connect a base; records ↔ tasks (two-way sync).

> **Reality check:** besides 5 requests/second and 1,000 records/base, the free
> plan caps **API calls per month** (around 1,000). Two-way sync would hit that
> quickly. Offer one-time import on free; sync for paid Airtable plans.

### 19. ClickUp Import

- **What:** Import ClickUp tasks.
- **How:** Via ClickUp API or export → import; tasks → PulseBoard tasks.
- **Rate limit:** ~100 requests per **minute** per token (not per second).

### 20. Monday.com Import

- **What:** Import Monday boards.
- **How:** Via Monday GraphQL API or export → import; items → tasks.
- **Rate limit:** Monday uses **complexity-based** limits per minute, not a flat
  request count.

---

## Category 2 — Free AI & NLP (21–35)

| #   | Feature                         | Effort | Cost | Impact     | Works for Roman Urdu? |
| --- | ------------------------------- | ------ | ---- | ---------- | --------------------- |
| 21  | Text Classification (HF)        | 3 days | $0*  | ⭐⭐⭐⭐   | ⚠️ Limited            |
| 22  | Sentiment Analysis              | 2 days | $0   | ⭐⭐⭐⭐   | ❌                    |
| 23  | Keyword Extraction              | 2 days | $0   | ⭐⭐⭐⭐   | ⚠️ Limited            |
| 24  | Auto-Summarization              | 3 days | $0*  | ⭐⭐⭐     | ⚠️ Limited            |
| 25  | Language Detection              | 1 day  | $0   | ⭐⭐⭐     | ❌                    |
| 26  | Spell Check                     | 2 days | $0   | ⭐⭐⭐     | ❌                    |
| 27  | Auto-Translate                  | 3 days | $0*  | ⭐⭐⭐⭐   | ⚠️ Limited            |
| 28  | Smart Search                    | 4 days | $0   | ⭐⭐⭐⭐⭐ | ✅ (fuzzy)            |
| 29  | Duplicate Detection (SBERT)     | 5 days | $0   | ⭐⭐⭐⭐⭐ | ⚠️ Use multilingual model |
| 30  | Auto-Priority (Rule-Based)      | 1 day  | $0   | ⭐⭐⭐⭐⭐ | ✅ (add keywords)     |
| 31  | Smart Assignee Suggestion       | 2 days | $0   | ⭐⭐⭐⭐⭐ | ✅                    |
| 32  | Auto-Module Detection           | 1 day  | $0   | ⭐⭐⭐⭐   | ✅ (add keywords)     |
| 33  | Text Pattern Matching (Regex)   | 1 day  | $0   | ⭐⭐⭐     | ✅                    |
| 34  | Auto-Tagging (Keyword-Based)    | 1 day  | $0   | ⭐⭐⭐⭐   | ✅ (add keywords)     |
| 35  | Smart Filter Suggestions        | 2 days | $0   | ⭐⭐⭐     | ✅                    |

\* Free tier or credits too small for production use — see notes.

> **Language note:** the team writes in Roman Urdu / English mix. Most
> off-the-shelf NLP libraries (sentiment, keywords, spell check, language
> detection) are English-only and give wrong results on Roman Urdu. Rule-based
> features where we control the keyword lists (30–34) handle it best.

### 21. Hugging Face Text Classification

- **What:** Categorize tasks automatically (bug, feature, ui, backend).
- **How:** Task description → Hugging Face model → labels → auto-tags.

> **Reality check:**
> - Free Hugging Face accounts get only a small monthly inference credit (~$0.10) —
>   enough to prototype, not to run production.
> - `distilbert-base-uncased` is a **base model, not a classifier**; it would need
>   fine-tuning. For labels without training, use a zero-shot model
>   (e.g. `facebook/bart-large-mnli`).
> - Free at scale means self-hosting, or running a small model in-process with
>   transformers.js.

### 22. Sentiment Analysis

- **What:** Detect positive / negative / neutral tone in comments.
- **Why:** Track team morale.
- **How:** `sentiment` npm package (AFINN, score −5 to +5) → dashboard
  *"Team morale: 78% positive"*.

> **Reality check:** AFINN is an English word list — it won't understand Roman Urdu.
> Also, sentiment-scoring coworkers' comments can feel like surveillance; prefer
> the opt-in survey approach of
> [Developer Happiness Score](./future-features.md#28-developer-happiness-score).

### 23. Keyword Extraction

- **What:** Extract keywords from task descriptions.
- **How:** `keyword-extractor` or `natural` → `["login", "timeout", "mobile", "bug"]`
  → tags. English stopword lists only.

### 24. Auto-Summarization

- **What:** Summarize long descriptions to 2–3 lines on the task card.
- **How:** `facebook/bart-large-cnn` via Hugging Face.
- **Limit:** same free-credit issue as #21.

### 25. Language Detection

- **What:** Detect a description's language and show a badge.
- **How:** `franc` or `languagedetect`.

> **Reality check:** these detect languages mostly by script and character
> patterns. Roman Urdu (Urdu in Latin script) is usually misdetected. Low value
> for this team.

### 26. Spell Check

- **What:** Underline spelling mistakes and suggest fixes.
- **How:** `typo-js` or similar.

> **Simpler:** browsers already spell-check inputs via the `spellcheck`
> attribute — zero effort, zero cost.

### 27. Auto-Translate

- **What:** Translate tasks between Urdu, English, and Hindi.
- **How:** Google Cloud Translation API — free tier ~500k characters/month
  (requires a billing account).

> **Reality check:** don't use `translate-google` and similar npm packages —
> they scrape Google Translate unofficially, break without warning, and violate
> its terms.

### 28. Smart Search

- **What:** Full-text search with fuzzy matching.
- **How (original):** self-hosted Elasticsearch.

> **Reality check:** self-hosted Elasticsearch has no document limit, but it isn't
> free to *run* — it needs a server with several GB of RAM. Since PulseBoard
> uses Supabase Postgres, use **Postgres full-text search + `pg_trgm`** for fuzzy
> matching: genuinely $0 and no extra service.

### 29. Duplicate Detection (Open-Source)

- **What:** Detect similar tasks.
- **How:** Embeddings (SBERT) → cosine similarity → > 80% similar = *"A similar
  task already exists."*

> `sentence-transformers` is Python; the backend is Node. Options: a small Python
> service, transformers.js in Node, or embeddings in a Supabase Edge Function.
> Store vectors with pgvector. Use a **multilingual** model for Roman Urdu. Same
> feature as [#9 Duplicate Bug Detection](./future-features.md#9-duplicate-bug-detection).

### 30. Auto-Priority (Rule-Based)

- **What:** Set priority from keywords.
- **How:**

```text
critical, urgent, down, broken  → P0
bug, issue, fix                 → P1
feature, enhancement            → P2
nice to have, optional          → P3
```

User can override.

> **Note:** "bug" → P1 will make almost every bug P1. Use this as the v0 input to
> the weighted scoring in
> [#10 Auto-Prioritization](./future-features.md#10-auto-prioritization), not as
> a replacement.

### 31. Smart Assignee Suggestion (Rule-Based)

- **What:** Suggest an assignee by module.
- **How:**

```text
Payment → Mehroze
Auth    → Nikhil
UI      → Ali
```

Module detected from keywords (#32); user can override. A static v0 of
[#6 Smart Matching](./future-features.md#6-smart-matching).

### 32. Auto-Module Detection (Rule-Based)

- **What:** Detect module from keywords.
- **How:**

```text
payment, checkout, stripe  → Payment
login, auth, oauth         → Authentication
ui, button, design         → UI/UX
```

### 33. Text Pattern Matching (Regex)

- **What:** Extract structured data from descriptions and auto-link it.
- **How:**

```text
Email:    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/
URL:      /https?:\/\/[^\s]+/
Task key: /\b(BUG|TASK)-\d+\b/
```

(Fixed from the original: the email pattern had `[A-Z|a-z]`, which also matches
a literal `|`; the task pattern required a `#` that other docs don't use.)

### 34. Auto-Tagging (Keyword-Based)

- **What:** Tag tasks from keywords.
- **How:**

```text
mobile, android, ios          → mobile
slow, performance, timeout    → performance
ui, design, color             → ui
```

### 35. Smart Filter Suggestions

- **What:** Suggest saved filters based on usage.
- **How:** Track which filters a user repeats →
  *"You use 'My Tasks' every day — save it as a filter?"*

---

## Category 3 — Free Productivity (36–50)

| #   | Feature                  | How                                   | Effort | Impact     |
| --- | ------------------------ | ------------------------------------- | ------ | ---------- |
| 36  | Dark Mode                | CSS variables + saved preference      | 1 day  | ⭐⭐⭐⭐⭐ |
| 37  | Custom Themes            | CSS variables + color picker          | 2 days | ⭐⭐⭐⭐   |
| 38  | Custom Board Backgrounds | Image upload / color, CSS             | 1 day  | ⭐⭐⭐     |
| 39  | Emoji Reactions          | Unicode emoji, stored in DB           | 2 days | ⭐⭐⭐⭐   |
| 40  | @Mentions                | Parse `@username`, send notification  | 2 days | ⭐⭐⭐⭐⭐ |
| 41  | Task Templates           | Save / load pre-filled tasks          | 2 days | ⭐⭐⭐⭐⭐ |
| 42  | Board Templates          | Export / import board JSON            | 3 days | ⭐⭐⭐⭐⭐ |
| 43  | Quick Filters            | Predefined filter buttons             | 1 day  | ⭐⭐⭐⭐⭐ |
| 44  | Saved Views              | Filters + sort + columns saved in DB  | 3 days | ⭐⭐⭐⭐   |
| 45  | Column Collapse/Expand   | UI state                              | 1 day  | ⭐⭐⭐⭐   |
| 46  | Task Drag-and-Drop       | See note                              | 3 days | ⭐⭐⭐⭐⭐ |
| 47  | Column Drag-and-Drop     | See note                              | 2 days | ⭐⭐⭐⭐   |
| 48  | Inline Edit              | Edit on the card, no modal            | 2 days | ⭐⭐⭐⭐⭐ |
| 49  | Multi-Select Tasks       | Checkbox + multi-select → bulk actions| 2 days | ⭐⭐⭐⭐⭐ |
| 50  | Undo / Redo              | Action history stack                  | 3 days | ⭐⭐⭐⭐⭐ |

All $0.

**Why each matters**

- **36 Dark Mode** — developers often work late. *(Already implemented — see below.)*
- **37 Custom Themes** — branding and personalization.
- **38 Board Backgrounds** — visual appeal.
- **39 Emoji Reactions** — quick feedback on tasks and comments.
- **40 @Mentions** — notify a specific person from a comment.
- **41 Task Templates** — for recurring task types.
- **42 Board Templates** — reuse a full board (columns + tasks) for new clients.
- **43 Quick Filters** — one-click My Tasks / Overdue / High Priority.
- **44 Saved Views** — different views for different contexts.
- **45 Column Collapse** — focus on fewer columns.
- **46/47 Drag-and-Drop** — intuitive task and column movement.
- **48 Inline Edit** — fast edits without a modal.
- **49 Multi-Select** — enables bulk delete / assign / status change.
- **50 Undo / Redo** — recover from mistakes.

> **Implementation notes**
>
> - **46/47:** `react-beautiful-dnd` (originally suggested) is **deprecated and
>   doesn't support React 19**, which this project uses. Use `@dnd-kit/core` or
>   `@hello-pangea/dnd` (a maintained fork). Task drag-and-drop already exists
>   using native HTML5 drag events; a library mainly adds touch/mobile and
>   keyboard accessibility.
> - **48:** prefer controlled `<input>` / `<textarea>` swapped in on click over
>   `contenteditable`, which is awkward to manage in React.
> - **50:** build on the same soft-delete model as
>   [CORE-21–22](./feature-audit.md#core-21--task-archiving-soft-delete).

---

## Summary

```text
Total: 50 features
  20 integrations
  15 AI / NLP features
  15 productivity features

Effort: ~100–120 developer-days (4–5 months for one developer)
```

**Cost is not $0 overall.** Items with real costs or limits:

| Item                         | Cost / constraint                                          |
| ---------------------------- | ---------------------------------------------------------- |
| Gmail (#5)                   | Restricted-scope verification + annual security assessment |
| WhatsApp (#9)                | Business-initiated messages are paid per message           |
| Calendly automation (#1)     | Webhooks require a paid Calendly plan                      |
| Hugging Face (#21, #24)      | Free credits only cover prototyping                        |
| Airtable sync (#18)          | Free plan monthly API cap                                  |
| Hosting (everything)         | App server, database, storage are not free at scale        |

---

## MVP Recommendation

Proposed Phase 1 (30 features). The original estimate was 8–10 weeks; the
listed efforts add up to **~76 developer-days** (~15 weeks for one developer).

**Integrations**

- [ ] Calendly (embed only on free tier)
- [ ] Google Calendar
- [ ] GitHub
- [ ] Slack
- [ ] Gmail — ⚠️ consider forwarding address instead (see #5)
- [ ] Google Drive
- [ ] Discord
- [ ] Telegram Bot
- [ ] Trello Import
- [ ] CSV / Excel Import — ⚠️ upgrade `xlsx` first

**AI / NLP**

- [ ] Text Classification (Hugging Face)
- [ ] Sentiment Analysis — ⚠️ English-only
- [ ] Keyword Extraction
- [ ] Auto-Summarization
- [ ] Language Detection — ⚠️ low value for Roman Urdu
- [ ] Spell Check — ✅ use browser `spellcheck`
- [ ] Auto-Translate
- [ ] Smart Search — ✅ use Postgres FTS + `pg_trgm`
- [ ] Duplicate Detection (SBERT)
- [ ] Auto-Priority (Rule-Based)

**Productivity**

- [x] Dark Mode *(exists)*
- [ ] Custom Themes
- [ ] Emoji Reactions
- [ ] @Mentions
- [ ] Task Templates
- [ ] Board Templates
- [ ] Quick Filters
- [ ] Saved Views
- [x] Task Drag-and-Drop *(exists, native HTML5)*
- [ ] Undo / Redo

---

## Already in the Codebase

As of this writing:

| Feature                 | Where                                                         |
| ----------------------- | ------------------------------------------------------------- |
| Dark mode (#36)         | `theme` state in `src/lib/store.tsx`                          |
| Task drag-and-drop (#46)| `src/components/TaskCard.tsx`, `src/app/(app)/projects/[id]/page.tsx`, `src/app/(app)/day/page.tsx` |
| Excel library (#12)     | `xlsx@0.18.5` in `package.json` (needs upgrade)               |

---

## Overlaps with Other Docs

| This doc                       | Overlaps with                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------ |
| 3 GitHub                       | [github-integration.md](./github-integration.md)                               |
| 4 Slack                        | [#22 Context Switching Killer](./future-features.md#22-context-switching-killer), [#8 Gmail/Slack](./future-features.md#8-gmail--slack-integration) |
| 5 Gmail                        | [#8 Gmail/Slack Integration](./future-features.md#8-gmail--slack-integration)  |
| 12 CSV / Excel Import          | [CORE-08](./feature-audit.md#core-08--csv-import)                                |
| 16 / 17 Forms                  | [#26 Bug Bounty Mode](./future-features.md#26-bug-bounty-mode), [CLI-08](./feature-audit.md#cli-08--client-feedback--bug--widget) |
| 28 Smart Search                | [VIEW-11 / AI-21](./feature-audit.md#view-11--advanced-search)                   |
| 29 Duplicate Detection         | [#9](./future-features.md#9-duplicate-bug-detection), [AI-03](./feature-audit.md#ai-03--duplicate-detection--smart-merge) |
| 30 Auto-Priority               | [#10 Auto-Prioritization](./future-features.md#10-auto-prioritization)         |
| 31 Smart Assignee              | [#6 Smart Matching](./future-features.md#6-smart-matching)                     |
| 34 Auto-Tagging                | [AI-16](./feature-audit.md#ai-16--auto-tagging)                            |
| 41 / 42 Templates              | [CORE-10 / CORE-03](./feature-audit.md#core-10--save-as-template)                    |
| 43 / 44 Filters & Views        | [VIEW-10](./feature-audit.md#view-10--saved-filters)                           |
| 49 Multi-Select                | [CORE-04–06](./feature-audit.md#core-04--bulk-delete)                             |
| 50 Undo / Redo                 | [CORE-22](./feature-audit.md#core-22--undo-delete)                             |
