# UI Overhaul — Session Handoff (2026-10-02)

> **Next session: read this file first. Every redesign must follow §7 DESIGN GUIDE exactly.** Then read then `docs/progress/2026-10-02.md` (full status, §5 A–F pre-apply report, §6 pending decisions).
> Branch: `fixes-v1` · last commit `b9beaeb` · **everything below is uncommitted**.
> Status: **IMPLEMENTED, NOT YET VERIFIED** — `tsc`, `eslint` and build were **not run** for this round's edits (the user asked: no extra build or checks). Production-ready: **NO**.

---

## 0. Standing rules (from the user, still active)

- **No** database migration run, provider setup, package install, external API call, real email, OAuth connect, webhook, commit or push without fresh approval.
- Migrations 21–25 are **written, NOT APPLIED**. Editing their files is allowed; running them is not.
- **Build only when the user says "push".** During work, at most `npx tsc --noEmit` + `npx eslint`, and only when needed.
- Do **not** remove the Owner role without approval. The user's preferred roles are: **Owner, Admin, Member, Viewer, Client Viewer**. Sub Admin can later become a scoped board/department admin.
- Telegram bot and GitHub webhook are **deferred**. No service-role shortcut. No publicly callable secret-only DB function.
- i18n: every new string needs a key in **both** `src/i18n/en.json` and `public/locales/ur.json`. Add them with a new scratchpad file `keys_ui.py`, then run `python apply_keys.py keys_auth keys_phase1 keys_phase2 keys_prefix keys_hero keys_site keys_loader keys_ui`.
  - Scratchpad: `C:\Users\lenovo\AppData\Local\Temp\claude\D--ReactLearning-pulseboard\95d82693-57a2-4849-8770-81be5f94dc89\scratchpad\`
  - If the scratchpad is gone, add the keys by hand to both json files (keys sorted) and run `npm run i18n:check`.
- Prefix new CSS classes (e.g. `es-`, `nb-`, `ia-`). Short names like `c1`, `top` or `me` have collided before.

---

## 1. What the user asked for in the latest request (complete list)

| # | Page / area | Request | Status |
|---|---|---|---|
| 1 | Buttons (global) | Buttons are too small overall (Add board, Book it, Autofill my day, Post update). Make them bigger. | ✅ DONE (CSS) |
| 2 | Inbox | Show "Mark all as read" only when there are unread items. | ✅ DONE |
| 3 | Settings → Plan | Remove the "Public pricing page" button inside the app. | ✅ DONE |
| 4 | Empty state (global) | A designed no-data card, in the style of the loader. | ✅ DONE (component + CSS); rollout to more pages remains, see §3 |
| 5 | No-boards popup (global) | One common modal when there are no boards, with a Create board button and a Close button (the user may just be looking around). | ✅ DONE, ⚠️ i18n keys missing |
| 6 | Integrations → Apps | Plan/status badges stick to long names (e.g. "Zapier / Make / IFTTT"). | 🟡 STARTED, not edited yet |
| 7 | Settings → Profile | Redesign. The role is shown in one card and asked again as "Your role" in another, which is confusing. | ❌ REMAINING |
| 8 | Settings → Your data | Explain what it does, and redesign it. | ❌ REMAINING |
| 9 | Settings → Audit log | Show it as a table. | ❌ REMAINING |
| 10 | Settings → Branding | The page/browser title comes from the brand name. Each org can upload its own icon/logo, falling back to the PulseBoard name/icon. Everything should come from branding. | ❌ REMAINING |
| 11 | Settings → Custom fields | Redesign. | ❌ REMAINING |
| 12 | Settings → AI | Redesign. | ❌ REMAINING |
| 13 | Settings → Security | Redesign. | ❌ REMAINING |
| 14 | Settings → Roles & permissions | It shows 4 roles; the user expects 5, including Client Viewer. | ❌ NEEDS USER DECISION (DB role change) — explain only, don't implement |
| 15 | Integrations → Import | Redesign, and explain the "Add board" button. | ❌ REMAINING |
| 16 | Integrations → Calendar | Redesign. | ❌ REMAINING |
| 17 | Integrations → GitHub | Redesign. | ❌ REMAINING |
| 18 | Integrations → Email-to-task | Redesign. | ❌ REMAINING |
| 19 | AI → Create | Redesign. | ❌ REMAINING |
| 20 | AI → Suggestions | Explain what it does, and redesign. | ❌ REMAINING |
| 21 | AI → Sprint planning | Explain what it does, and redesign. | ❌ REMAINING |
| 22 | AI → Smart assign | Redesign. | ❌ REMAINING |
| 23 | AI → Meeting scheduler | Spacing: the time dropdown and "Book it" are stuck together. Redesign. | ❌ REMAINING |
| 24 | Day page | The "Autofill my day" and "Post update" buttons are small. | 🟡 Covered by the global button CSS; check the layout when screenshotting |

---

## 2. What was done this session (exact changes)

### 2.1 Bigger buttons — `src/app/globals.css`

- **Before**
  - `.btn`: padding 10px 18px, inline-block.
  - `.ghost`: padding 6px 12px, 13px font.
  - `.btn.sm` / `.ghost.sm`: padding 5px 10px, 12px font. These were too small.
- **After**
  - `.btn`: inline-flex, centred, gap 7px, **min-height 42px**, padding 10px 20px.
  - `.ghost`: inline-flex, centred, gap 6px, **min-height 38px**, padding 8px 15px, 13.5px font, radius 10px.
  - `.btn.sm` / `.ghost.sm`: **min-height 34px**, padding 7px 13px, 13px font.
- **Risk:** the display change from inline-block to inline-flex can affect layouts that relied on inline-block. Places to check:
  - icon-only ghost buttons
  - `Link` elements with `display: "inline-block"` inline styles (the inline style wins)
  - tight table rows
  - the topbar
- **Rollback:** restore the three old rule blocks.

### 2.2 Inbox — `src/app/(app)/inbox/page.tsx`

- The "Mark all read" button now renders only when `tab === "notifications" && unread > 0`.

### 2.3 Plan page — `src/app/(app)/settings/plan/page.tsx`

- Removed the `actions` prop of `SettingsHeader`, which held the "Public pricing page" link.
- Removed the unused `Link` and `ArrowRight` imports.
- The i18n key `planPage.publicLink` is now unused. It's harmless; it can be removed later from both json files.

### 2.4 EmptyState redesign — `src/components/ui.tsx` and `globals.css`

- **New signature:** `EmptyState({ title, message?, action?, icon?, compact? })`. Old calls still work unchanged.
- **Design:**
  - a dashed rounded card with a soft accent radial glow
  - a 64px badge (`.es-badge`) with a floating icon circle (`.es-icon`) and two pulsing rings (`.es-ring`)
  - the action sits in `.es-action`
  - `prefers-reduced-motion` turns off the animation
- **Already used in:** clients, dashboard (×2), inbox, projects, projects/[id].

### 2.5 No-boards popup — NEW `src/components/NoBoardsPrompt.tsx`, wired in `src/app/(app)/layout.tsx`

- **When it shows:** `workspaceStatus === "ready"` and there are 0 projects, and none of these:
  - the NewProjectModal is open
  - the popup was dismissed this session
- **Dismissal:** stored in `sessionStorage["pb.noBoardsDismissed"] = workspaceId || "demo"`. It is convenience-only and grants nothing.
- **Admin/creator** (`allowed("project.manage")`): the body text, 3 bullet points, and buttons **"Later"** (close) and **"Create board"** (opens `openNewProjectModal`).
- **Others:** the `bodyMember` text and the Close button only.
- **CSS added at the end of `globals.css`:** `.nb-body`, `.nb-icon`, `.nb-list`, `.nb-actions`.
- `src/components/ProjectPicker.tsx`: the inline "Create a board" button changed from `btn sm` to `ghost sm`, so it is now a quieter secondary action because the popup is the main prompt.
- ⚠️ **TODO — i18n keys not added yet.** Without them the popup shows raw keys and `tsc` may fail on the `MessageKey` type. Suggested text:

| Key | English | Urdu |
|---|---|---|
| `noBoards.title` | No boards yet | ابھی کوئی بورڈ نہیں |
| `noBoards.body` | Tasks live inside boards. Create your first board to start adding work — or close this and look around first. | کام بورڈز کے اندر ہوتے ہیں۔ کام شامل کرنے کے لیے پہلا بورڈ بنائیں — یا اسے بند کر کے پہلے ایپ دیکھ لیں۔ |
| `noBoards.bodyMember` | This workspace has no boards yet. Ask an admin to create one — you can still look around. | اس ورک اسپیس میں ابھی کوئی بورڈ نہیں۔ کسی ایڈمن سے بورڈ بنوائیں — آپ ایپ دیکھ سکتے ہیں۔ |
| `noBoards.point1` | Boards hold columns and tasks (PB-1, PB-2…) | بورڈ میں کالم اور کام (PB-1, PB-2…) ہوتے ہیں |
| `noBoards.point2` | AI, import, calendar and automations need a board to add tasks into | AI، امپورٹ، کیلنڈر اور آٹومیشن کو کام ڈالنے کے لیے بورڈ چاہیے |
| `noBoards.point3` | You can create more boards anytime from the sidebar | آپ سائیڈبار سے کبھی بھی مزید بورڈ بنا سکتے ہیں |
| `noBoards.later` | Maybe later | بعد میں |
| `noBoards.create` | Create board | بورڈ بنائیں |

---

## 3. Where work stopped and exactly how to continue

**Stopped at:** item 6 (Integrations → Apps). I had read `src/app/(app)/integrations/apps/page.tsx` and the `.int-st` CSS (around line 3088 of `globals.css`). No edit was made yet.

**Planned fix for item 6.** Restructure each card:

1. A top row with a monogram icon tile (`.ia-logo`, first letter, tinted) and the name on its own line.
2. A **separate badge row** (`.ia-badges`, flex-wrap, gap 6px) holding `<PlanTag>` and the status pill (or the demo connect button).
3. The description.
4. A footer (`.ia-foot`, margin-top auto) holding the Manage link.

The card is a flex column so footers line up. Don't put `PlanTag` inside the `<b>` name any more.

**Continue in this order:**

1. Add the `noBoards.*` keys (§2.5), then finish item 6.
2. Small fixes:
   - **Meeting scheduler** (`src/app/(app)/ai/meetings/page.tsx`): put the time Dropdown and "Book it" in a grid or flex row with `gap: 12px`, wrapping on mobile.
   - **Day page:** check the button row gap.
3. **Profile** (`settings/profile` or `src/app/(app)/profile/page.tsx`, `DetailsForm`):
   - Rename the job-title field label from "Your role" to **"Job title"** (new key, e.g. `profile.jobTitle`).
   - Show the workspace role once, as a badge in the header card.
   - Layout: a header card (avatar, name, email, role badge), then "Personal details" (form), then "Preferences".
4. **Your data** (`src/app/(app)/settings/data/page.tsx`):
   - Explain to the user what it does: exports the user's own data as CSV/JSON, account deactivate, and account delete via the RPCs `set_my_account_active` / `delete_my_account` in **unapplied** migration 23.
   - Redesign as 3 cards: Export, Deactivate (warn tone), Delete (danger zone, red border, confirm).
5. **Audit log** (`src/app/(app)/settings/audit/page.tsx`):
   - Currently 12 `<p>` rows.
   - Make a `<table>` with columns Time | Actor (avatar + name) | Event | Task (key link that opens the drawer).
   - Add a search filter, show 50 rows with a "Show more" button, and use EmptyState when empty.
   - Keep the CSV export inside `Gate id="CORE-17-EXPORT"`.
6. **Branding** (`src/app/(app)/settings/branding/page.tsx`):
   - `document.title`: set it from the brand name, as `"<Page> · <BrandName>"` with a "PulseBoard" fallback, in a small effect in the app layout.
   - Favicon: use the uploaded logo, otherwise the default.
   - Logo upload:
     - accept png/jpeg/webp only, max ~200 KB
     - check MIME and size client-side, stored as a data URL for now
     - in real mode it needs a column `logo_data_url text` (with a CHECK on length/prefix) added to the **unapplied** migration 24 `workspace_settings` table. Edit the file only; **do not run it**.
     - in demo mode it stays local.
     - Label it honestly: LOCAL-ONLY until migration 24 is applied.
   - Sidebar and topbar: show the org logo + brand name, falling back to the PulseBoard logo and name.
7. **Custom fields, Settings → AI, Security:** redesign with a consistent card layout:
   - a section header with an icon
   - rows of label + description on the left, control on the right
   - status pills
   - EmptyState where there's no data
8. **Integrations sub-pages** (Import, Calendar, GitHub, Email-to-task):
   - Same layout: a hero card (what it does, honest status pill: preview/planned/available), numbered "How it works" steps, then the action card.
   - Import: explain that the "Add board" button appears because import needs a target board (`useProjectPicker` → `ready=false`). The global popup now covers it.
9. **AI sub-pages** (Create, Suggestions, Sprint planning, Smart assign):
   - Redesign with the same hero + steps + result-cards pattern.
   - Label them honestly as **rule-based** where they are (not "AI"). Gemini is only used when the opt-in is on and the key is configured.
10. Roll out `EmptyState` (use `icon` + `action` props) to the remaining plain-text empties:
    - `archive/page.tsx:82`
    - audit
    - activity tab in inbox (`inbox.noActivity`)
    - custom fields, templates, saved filters
    - integrations/webhooks lists
    - AI suggestions with no results
    - team with no members
    - automations with no rules
11. Add all new keys to `keys_ui.py` and run `apply_keys.py`. Then **one** `npx tsc --noEmit` + `npx eslint src` at the end. No build.
12. Append a short "2.6 UI overhaul" section to `docs/progress/2026-10-02.md` and update this file's table.

---

## 4. Explanations the user asked for (give these in chat, don't implement)

- **Roles page shows 4 roles, not 5.**
  - The live DB allows Owner / Admin / Sub Admin / Member / Viewer.
  - The uncommitted code (from unapplied migration 21) merged Owner into Admin. That is why the page shows 4.
  - **Client Viewer does not exist yet.** It needs a DB role CHECK change, RLS for "shared boards only", and a sharing table.
  - That is a role-architecture change, so it **needs the user's approval**. The user's preference is Owner, Admin, Member, Viewer, Client Viewer. Migration 21 must be redesigned around that before anything is applied.
- **AI Suggestions:** rule-based (`nextActions`, `detectDependencies`). It reads the board's own tasks (overdue, blocked, unassigned, similar titles) and suggests next steps. It is not machine learning.
- **Sprint planning:** `sprintPlan` estimates capacity from the done-task history and member count, then picks tasks by priority/due date until capacity is full. `autoSchedule` spreads them over days. These are estimates — review before applying.
- **Import "Add board" button:** import needs a board to put tasks into. With no boards, the picker showed that button. Now the global no-boards popup handles it, and the inline button is a quiet secondary one.
- **Your data:** see §3 step 4.

---

## 5. Still awaiting user decisions (from `docs/progress/2026-10-02.md` §6)

1. Keep or revert the 3 packages added earlier.
2. Migration 21 role model: redesign it as Owner / Admin / Member / Viewer / Client Viewer (Sub Admin as a later scoped role).
3. Split migrations 22–25 into smaller reviewed steps.
4. The first safe feature to apply.
5. When to run migrations (the user runs them in the Supabase SQL editor after review).
6. Commit/push — and build only then.
7. The CLAUDE.md §27 docs files (ENGINEERING_STATUS, ISSUE_REGISTER, etc.) — approval to create them.

Open High items: **TEST-ROLE-001**, **TEST-XTENANT-001** (no real role/cross-tenant tests yet). Architecture is unreviewed.

---

## 6. Files touched this session (uncommitted)

- `src/app/globals.css` — buttons, EmptyState (`.empty-state`, `.es-*`), no-boards (`.nb-*`)
- `src/components/ui.tsx` — EmptyState
- `src/components/NoBoardsPrompt.tsx` — **new**
- `src/components/ProjectPicker.tsx` — btn → ghost
- `src/app/(app)/layout.tsx` — renders `<NoBoardsPrompt />`
- `src/app/(app)/inbox/page.tsx` — conditional "Mark all"
- `src/app/(app)/settings/plan/page.tsx` — pricing button removed
- `docs/progress/2026-10-02-ui-overhaul-handoff.md` — this file

Verification: **Not tested** (no tsc, eslint, build or browser check this round, per the user's instruction).

---

## 7. DESIGN GUIDE — every remaining redesign MUST follow this (do not invent a new style)

> Goal: every redesigned page (Settings, Integrations sub-pages and AI sub-pages) looks like **one product**. It uses the same tokens, the same building blocks and the same spacing as the existing app, the loader (`WorkspaceLoader`) and the new `EmptyState`. Do **not** add a UI library, a new font or new colour tokens. Do **not** restyle the sidebar or topbar, or change the auth/landing pages.

### 7.1 Design tokens (already in `src/app/globals.css :root`, use ONLY these)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#edf2f6` | `#07111b` | page background |
| `--card` | `#fff` | `#0f1f2f` | cards, inputs, modals |
| `--ink` | `#0e2033` | `#e6eff5` | main text |
| `--mute` | `#63788b` | `#8ca3b4` | secondary text, hints |
| `--line` | `#dce5ec` | `#1d3346` | borders, dividers |
| `--soft` | `#ddf5f1` | `#0e3a38` | accent-tinted fills (icon tiles, selected) |
| `--col` | `#e3ebf1` | `#0a1824` | neutral fill (columns, table head, info boxes) |
| `--acc` | `#12b5a0` | same | brand teal: primary buttons, rings, focus |
| `--acc2` | `#0c9585` | same | hover and teal text/icons on `--soft` |
| `--bad` | `#e5483a` | same | danger |
| `--warn` | `#f0a400` | same | warning |
| `--sh` | `0 10px 28px rgba(10,29,48,.08)` | `none` | card shadow |

Rules for colour:
- Tints are always made with `color-mix(in srgb, var(--acc|--warn|--bad) N%, transparent)` (8–12% for fills, 35–55% for borders). This keeps dark mode correct automatically.
- **Never hard-code hex colours** in new CSS, except the existing `.plan-tag.enterprise` purple.
- Never use colour alone for meaning. A status pill always carries text, and an icon where possible.

Typography:
- Manrope (`var(--font-manrope)`), base 15px/1.5.
- `h1` is 26px/800 (from SettingsHeader/SubPageHeader, don't override).
- Card titles: `h2` with `margin:0`, ~17px/800.
- Body text 14–15px.
- `.mute` is 13px.
- Small labels 12px/700.
- Pills/tags 11–12px/800.

Radii: cards 16px · inputs and `.btn` 11px · `.ghost` 10px · icon tiles 11–14px · pills 99px · modals 16px.

Spacing scale (use only these): **4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 32**.
- Card padding is 20px (`.card`).
- Gap between cards is 16px (`.grid`).
- Gap inside a card section is 12px.
- Gap between a button and an input/dropdown is **at least 12px**. This was the Meeting scheduler bug.

Buttons (sizes set this session, don't shrink again):
- `.btn`: primary, min-height 42px.
- `.ghost`: secondary, 38px.
- `.btn.sm` / `.ghost.sm`: 34px.
- `.ghost.danger`: red text.
- `.ic`: 38×38 icon button.

Placement rules:
- One primary `.btn` per card at most. Other actions are `.ghost`.
- Action rows: `flex; gap:10px; wrap; justify-content:flex-end`, stretched on mobile.
- Icons are `lucide-react`, 16 in buttons and 18–22 in headers, always `aria-hidden` next to text.

### 7.2 Existing building blocks — reuse, don't duplicate

| Need | Use |
|---|---|
| Page heading | `<SettingsHeader title hint actions?>` (Settings) or `<SubPageHeader group page hint actions?>` (AI / Integrations / Automations) |
| Card / columns | `.card`, `.grid g2`, `.grid g3` |
| Card header row | `.st-card-head` (flex, gap 10, wraps) |
| Setting row (label left, control right) | `.st-row` > `.st-row-main` (`<b>` title + `<p class="mute">` description) + control |
| Two-column settings layout | `.st-sec-grid` (already used on Security) |
| On/off | `<Switch checked onChange label>` from `components/ui` — never a bare checkbox |
| Select | `<Dropdown>` from `components/Dropdown` — never a native `<select>` |
| Tabs | `.tabs` with `button.on` |
| Status pill | `.int-st` + `connected` / `available` / `setup` / `decision` / `planned` |
| Plan badge | `<PlanTag id="FEATURE-ID">` (components/Gate) |
| Paid-feature wall | `<Gate id compact?>` |
| Honest preview / not-set-up note | `.st-demo-warn` with `<Info size={14}/>` |
| Footnote | `.st-foot` with an icon |
| Error box | `.warn` |
| Success / neutral notice | `.approval` / `.approval.approved` |
| Form field error | `<FieldError id msg>` + `{...invalid(id, msg)}` + `v.*` from `lib/validate` |
| Empty data | `<EmptyState title message? icon? action? compact?>` — **always**, never a bare `<p class="mute">` |
| Board needed | `useProjectPicker()` → `{project, picker, ready}`; disable create buttons when `!ready` |
| Modal | `<Modal title onClose>` |
| Task id | `.task-key` via `taskKey(task, prefix)` (lib/task-keys) |
| Avatar | `<Avatar id>` |

### 7.3 New shared classes to ADD once (prefix `ux-`), then use on every redesigned page

Paste this block **once** at the end of `globals.css` (not added yet). Every page below is built only from it plus §7.2.

```css
/* ===== ux-: shared page-redesign kit (2026-10-02 UI overhaul) ===== */
.ux-page { display: grid; gap: 16px; }
.ux-hero { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap;
  background: radial-gradient(ellipse at 0% 0%, color-mix(in srgb, var(--acc) 10%, transparent), transparent 60%), var(--card); }
.ux-hero-main { flex: 1 1 320px; display: grid; gap: 6px; }
.ux-hero-main h2 { margin: 0; font-size: 18px; }
.ux-hero-main p { margin: 0; line-height: 1.55; }
.ux-icon { display: grid; place-items: center; width: 48px; height: 48px; flex-shrink: 0;
  border-radius: 14px; color: var(--acc2); background: var(--soft);
  border: 1px solid color-mix(in srgb, var(--acc) 35%, var(--line)); }
.ux-icon.sm { width: 36px; height: 36px; border-radius: 11px; }
.ux-icon.warn { color: color-mix(in srgb, var(--warn) 75%, var(--ink)); background: color-mix(in srgb, var(--warn) 12%, transparent); border-color: color-mix(in srgb, var(--warn) 45%, transparent); }
.ux-icon.bad { color: var(--bad); background: color-mix(in srgb, var(--bad) 10%, transparent); border-color: color-mix(in srgb, var(--bad) 40%, transparent); }
.ux-pills { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ux-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); counter-reset: ux; }
.ux-steps li { counter-increment: ux; display: grid; gap: 4px; padding: 14px; border-radius: 12px;
  border: 1px solid var(--line); background: var(--bg); font-size: 13.5px; }
.ux-steps li::before { content: counter(ux); display: grid; place-items: center; width: 26px; height: 26px;
  border-radius: 50%; background: var(--acc); color: #fff; font-weight: 800; font-size: 12px; }
.ux-sec { display: grid; gap: 12px; }
.ux-sec-head { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.ux-sec-head h2 { margin: 0; font-size: 17px; }
.ux-sec-head .ux-pills { margin-inline-start: auto; }
.ux-rows { display: grid; }
.ux-rows > * + * { border-top: 1px solid var(--line); }
.ux-form { display: grid; gap: 14px; }
.ux-form-2 { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.ux-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; align-items: center; }
.ux-inline { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
.ux-inline > label { flex: 1 1 200px; }
.ux-result { display: grid; gap: 10px; padding: 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--bg); }
.ux-result + .ux-result { margin-top: 10px; }
.ux-conf { font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 99px; border: 1px solid var(--line); color: var(--mute); }
.ux-table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 12px; scrollbar-width: thin; }
.ux-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.ux-table th { text-align: start; font-size: 12px; font-weight: 800; color: var(--mute); text-transform: uppercase;
  letter-spacing: .04em; padding: 10px 12px; background: var(--col); white-space: nowrap; }
.ux-table td { padding: 11px 12px; border-top: 1px solid var(--line); vertical-align: middle; }
.ux-table tr:hover td { background: color-mix(in srgb, var(--acc) 5%, transparent); }
.ux-danger { border-color: color-mix(in srgb, var(--bad) 45%, var(--line)); }
.ux-danger h2 { color: var(--bad); }
.ux-tiles { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.ux-tile { display: grid; gap: 2px; padding: 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--bg); }
.ux-tile b { font-size: 20px; }
.ux-card-col { display: flex; flex-direction: column; gap: 10px; }
.ux-card-col .ux-foot { margin-top: auto; }
@media (max-width: 760px) {
  .ux-actions { justify-content: stretch; }
  .ux-actions > .btn, .ux-actions > .ghost { flex: 1 1 auto; }
  .ux-hero { padding: 16px; }
}
```

(`.ux-table-wrap` has a thin scrollbar on purpose. The app hides scrollbars globally, but a wide table needs a visible hint.)

### 7.4 The 4 page templates (pick one per page)

**T1 — Feature page** (all Integrations and AI sub-pages):
```tsx
<>
  <SubPageHeader group={...} page={...} hint={tt("...hint")} />
  <div className="ux-page">
    <section className="card ux-hero" aria-labelledby="h-x">
      <span className="ux-icon" aria-hidden><Icon size={22} /></span>
      <div className="ux-hero-main">
        <div className="ux-pills"><span className={`int-st ${status}`}>{statusText}</span><PlanTag id="FEATURE" /></div>
        <h2 id="h-x">{tt("x.heroTitle")}</h2>
        <p className="mute">{tt("x.heroText")}</p>   {/* what it does, honestly; say "rule-based" when it is */}
      </div>
    </section>
    <section className="card ux-sec" aria-labelledby="h-how">
      <h2 id="h-how">{tt("ux.howItWorks")}</h2>
      <ol className="ux-steps">{/* 3–4 × */}<li><b>{title}</b><span className="mute">{text}</span></li></ol>
    </section>
    <section className="card ux-sec" aria-labelledby="h-tool">   {/* the actual tool */}
      <div className="ux-sec-head"><span className="ux-icon sm" aria-hidden><Icon2 size={18}/></span><h2 id="h-tool">…</h2><div className="ux-pills">{picker}</div></div>
      <div className="ux-form">…fields…</div>
      <div className="ux-actions"><button className="ghost">…</button><button className="btn" disabled={!ready}>…</button></div>
    </section>
    <section className="card ux-sec">{/* results: .ux-result items, or <EmptyState compact …/> */}</section>
  </div>
</>
```

**T2 — Settings page** (Profile, Your data, Custom fields, AI settings, Security, Branding):
`SettingsHeader` → `.ux-page` → one `.card.ux-sec` per topic. Each card has:
- `.ux-sec-head` (`.ux-icon.sm` + `h2` + `.ux-pills` on the right)
- a one-line `.mute` description
- `.ux-rows` of `.st-row` (title + description on the left, Switch / Dropdown / `.ghost` on the right) **or** a `.ux-form` / `.ux-form-2` form
- `.ux-actions` with a single Save `.btn`

The danger card goes last: `.card.ux-sec.ux-danger` with `.ux-icon.bad`.

**T3 — Table page** (Audit log, later any list page):
- a top card with a search input + filters in `.ux-inline` and Export in `.ux-actions`
- `.ux-table-wrap > table.ux-table`, `<th scope="col">`
- 50 rows, then a `.ghost` "Show more"
- `EmptyState` for 0 rows, and EmptyState "No matches" when a filter hides everything

**T4 — Picker grid** (Integrations → Apps): `.grid g3` of `.card.ux-card-col`, containing:
1. The top row: `.ux-icon.sm` monogram (first letter) + name `<b>` (may wrap).
2. A **separate** `.ux-pills` row: `PlanTag` + `.int-st` (or the demo connect button).
3. The description `.mute`.
4. The `.ux-foot` with the `.ghost.sm` Manage link.

**Never put a pill inside the name element.**

### 7.5 Exact layout per remaining page

| Page | Template | Sections (in order) | Notes |
|---|---|---|---|
| Integrations → Apps | T4 | grid only | fixes badge sticking (item 6) |
| Profile | T2 | ① Header card: large Avatar, name, email, **role pill shown once**, workspace · ② "Personal details" `.ux-form-2`: full name, **Job title** (renamed from "Your role"), other existing fields · ③ Preferences rows (language, theme, digest if present) · ④ link to Security | remove the duplicate role display |
| Your data | T2 | ① Export (Download icon): what's included + buttons · ② Deactivate (`.ux-icon.warn`): what happens, reversible · ③ Danger zone `.ux-danger`: delete account, type-to-confirm | `.st-demo-warn` "needs migration 23 (not applied)" when the RPC is missing |
| Audit log | T3 | columns Time · Actor (Avatar + name) · Event · Task (`.task-key` button → `openDrawer`) | keep CSV inside `Gate CORE-17-EXPORT`; `toCsv` keeps formula escaping |
| Branding | T2 | ① Identity: brand name, logo upload (64px preview tile, png/jpeg/webp ≤200 KB, Remove), accent colour · ② Live preview: a mini sidebar header with logo + name (PulseBoard fallback) · ③ Task IDs (existing) · ④ Custom domain (existing DNS check) | LOCAL-ONLY label until migration 24 has `logo_data_url` and is applied |
| Custom fields | T2 | ① Add field `.ux-inline` (name, type Dropdown, Add `.btn`) · ② fields as `.ux-rows` (type pill, required Switch, delete `.ghost.danger`) · EmptyState if none | |
| Settings → AI | T2 | ① Gemini opt-in row + `.st-demo-warn` "API key setup required" when not configured · ② Usage `.ux-tiles` · ③ What is sent / never sent | rule-based features work without AI |
| Security | T2 (keep `.st-sec-grid`) | ① 2FA (status pill, QR setup) · ② Sessions `.ux-table` (device, last seen, "This device" pill, Sign out) + "Sign out others" · ③ Password | sessions need migration 23 → show a note if missing |
| Roles & permissions | — | **no redesign until the user decides on the role model** (§4) | |
| Import | T1 | hero · steps (pick board → upload CSV → map columns → review) · tool card with `picker` · preview `.ux-table` | |
| Calendar | T1 | hero (ICS feed = available; Google free/busy = setup required) · steps · feed URL card (copy + regenerate) · Google card | |
| GitHub | T1 | hero with `int-st decision` (deferred by the user) · what it will do · nothing that pretends to connect | |
| Email-to-task | T1 | hero (honest status) · steps · address/setup card | |
| AI → Create | T1 | hero ("drafts tasks; review before saving") · textarea + picker + Generate · `.ux-result` list with checkboxes + "Add selected" | |
| AI → Suggestions | T1 | hero says **rule-based, uses board data** · `.ux-result` cards with `.ux-conf` + "Open task" / "Apply" (`.ghost.sm`) | never auto-apply |
| AI → Sprint planning | T1 | hero · `.ux-tiles` (capacity, picked, points) · picked list · "Auto-schedule" `.btn` | "Estimate — review before applying" |
| AI → Smart assign | T1 | hero · tasks with suggested assignee (Avatar + reason + `.ux-conf`) · Assign `.ghost.sm` each | human confirmation only |
| AI → Meetings | T1 | tool card: `.ux-inline` = [date] [time Dropdown] [duration] then `.ux-actions` with **Book it** | fixes item 23 (gap ≥12px) |
| Day page | — | put "Autofill my day" / "Post update" in `.ux-actions` | |

### 7.6 Copy and honesty rules

- Status words only: Available, Setup required, Preview, Planned, Deferred, Not implemented. Never "Connected" unless the server confirmed it.
- Rule-based features say "Suggestion · based on your board data · review before applying". Never "AI-powered".
- Every string gets en + ur keys. Common keys to add:

| Key | English | Urdu |
|---|---|---|
| `ux.howItWorks` | How it works | یہ کیسے کام کرتا ہے |
| `ux.showMore` | Show more | مزید دکھائیں |
| `ux.noMatches` | No matches | کوئی نتیجہ نہیں |
| `ux.reviewFirst` | Review before applying | لاگو کرنے سے پہلے جائزہ لیں |
| `ux.ruleBased` | Rule-based · uses your board data | اصولوں پر مبنی · آپ کے بورڈ کا ڈیٹا |

- Urdu is RTL. Use `margin-inline-*` / `padding-inline-*` / `text-align:start`, never left/right. Put `dir="ltr"` on emails, URLs and task keys.

### 7.7 Accessibility and responsive checklist (every page)

- [ ] Each `section` has `aria-labelledby` pointing to its `h2`.
- [ ] Icons beside text are `aria-hidden`; icon-only buttons have `aria-label`.
- [ ] Tables use `<th scope="col">`; clickable cells are real `<button>` elements.
- [ ] Focus outline stays visible. Dialogs use `<Modal>`.
- [ ] At 375px width: no horizontal page scroll (only `.ux-table-wrap` scrolls), action buttons stretch, `.ux-form-2` collapses to 1 column.
- [ ] Dark mode is correct because only tokens and color-mix are used.
- [ ] Every animation is off under `prefers-reduced-motion`.

### 7.8 Verify at the end (once, not per page)

1. `npx tsc --noEmit` and `npx eslint src`.
2. `npm run i18n:check`.
3. If the user wants screenshots: the demo-build flow (memory "Verify UI with demo build"), light + dark, desktop + 375px.
4. **No `next build`** until the user says push.
