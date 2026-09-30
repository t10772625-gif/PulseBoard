# GitHub Integration — Technical Design

How PulseBoard reads code activity from GitHub, maps it to modules and tasks,
and uses it to power code-aware features.

**Answers the question:** *A developer can write anything, in any module — how
does PulseBoard know which module they worked on and what the code does?*

Powers these features in [future-features.md](./future-features.md):

- [#6 Smart Matching](./future-features.md#6-smart-matching) — module expertise from real commits
- [#12 Workload Balancing](./future-features.md#12-developer-workload-balancing) — activity signals
- [#23 Smart PR Review Assignment](./future-features.md#23-smart-pr-review-assignment)
- [#29 Task Dependencies Auto-Detect](./future-features.md#29-task-dependencies-auto-detect)

> **Status:** Proposal. Code samples are illustrative, not production-ready.

## Contents

1. [Overview](#overview)
2. [Step 1 — GitHub App](#step-1--github-app)
3. [Step 2 — Webhooks](#step-2--webhooks)
4. [Step 3 — Analysis & Task Linking](#step-3--analysis--task-linking)
5. [Data Model](#data-model)
6. [Backend](#backend)
7. [Frontend](#frontend)
8. [Use Cases](#use-cases)
9. [Security & Privacy](#security--privacy)
10. [Cost & Effort](#cost--effort)
11. [Summary](#summary)

---

## Overview

```text
GitHub repo ──(webhook)──▶ PulseBoard API ──▶ module detection ──▶ task linking
                                  │                                     │
                                  └──(optional)──▶ LLM code analysis ───┘
```

Three steps:

1. The customer installs the **PulseBoard GitHub App** on their repositories.
2. GitHub sends **webhooks** to PulseBoard on PRs and pushes.
3. PulseBoard **detects the module** from file paths, optionally **analyzes the
   code** with an LLM, and **links** the activity to a PulseBoard task.

---

## Step 1 — GitHub App

PulseBoard is registered as a GitHub App (optionally listed on GitHub
Marketplace). A company admin installs it:

1. Open the PulseBoard App page on GitHub and click **Install**.
2. Choose the organization and repositories.
3. Approve the requested permissions.

### Permissions

| Permission        | Access | Why                                              |
| ----------------- | ------ | ------------------------------------------------ |
| `metadata`        | Read   | Mandatory for all GitHub Apps; repo info, contributors |
| `contents`        | Read   | Files, commits, and repository tree              |
| `pull_requests`   | Read   | Track PRs and their changed files                |
| `pull_requests`   | Write  | **Only if** [Smart PR Review Assignment](#use-case-1-smart-pr-review-assignment) is enabled — requesting reviewers is a write operation |

Never requested: `contents: write` (no code changes) and merge rights.

> Offer read-only as the default and make reviewer auto-assignment an opt-in
> that asks for the extra permission.

---

## Step 2 — Webhooks

A GitHub App has **one webhook URL and secret, configured once at the app
level** — customers don't set up webhooks per repository.

| Setting | Value                                                              |
| ------- | ------------------------------------------------------------------ |
| URL     | `https://pulseboard.com/api/webhooks/github`                       |
| Secret  | App-level secret, used to verify `X-Hub-Signature-256`             |
| Events  | `pull_request` (`opened`, `synchronize`), `push`                   |

Whenever a developer opens a PR, pushes commits, or updates a PR, GitHub
notifies PulseBoard.

### Payload (abridged)

The `pull_request` webhook does **not** include the list of changed files; they
are fetched separately (see [Step 3](#step-3--analysis--task-linking)).

```json
{
  "action": "opened",
  "installation": { "id": 987654 },
  "pull_request": {
    "id": 12345,
    "number": 42,
    "title": "Fix payment timeout issue",
    "body": "Fixed timeout issue in payment gateway",
    "html_url": "https://github.com/company/company-backend/pull/42",
    "user": { "login": "mehroze" }
  },
  "repository": {
    "name": "company-backend",
    "full_name": "company/company-backend"
  }
}
```

---

## Step 3 — Analysis & Task Linking

1. **Fetch changed files** — `GET /repos/{owner}/{repo}/pulls/{number}/files`:

   ```json
   [
     { "filename": "src/payment/gateway.js",   "status": "modified", "additions": 15, "deletions": 3 },
     { "filename": "src/payment/validator.js", "status": "added",    "additions": 50, "deletions": 0 }
   ]
   ```

2. **Detect module** from file paths:
   `src/payment/gateway.js` → **Payment**, `src/payment/validator.js` → **Payment**.

3. **Fetch code (optional)** — `GET /repos/{owner}/{repo}/contents/{path}?ref={sha}`
   returns the file base64-encoded. Only needed for AI analysis.

4. **Analyze with an LLM (optional)** — which functions changed, what they
   depend on, bug fix vs feature.

5. **Link to the task:**

   | Field          | Value                              |
   | -------------- | ---------------------------------- |
   | Task           | BUG-1234 — Fix payment timeout issue |
   | Module         | Payment                            |
   | Developer      | Mehroze                            |
   | Files changed  | `gateway.js`, `validator.js`       |
   | Lines          | +65 / −3                           |

**Task matching:** match on an explicit task key in the branch name, PR title, or
commit message first (e.g. `BUG-1234`), and fall back to title/module similarity
only when no key is present. Fuzzy matching alone will mislink PRs.

---

## Data Model

```sql
-- One row per GitHub App installation
CREATE TABLE github_integrations (
  id                      UUID PRIMARY KEY,
  company_id              UUID NOT NULL,
  github_installation_id  BIGINT NOT NULL UNIQUE,
  is_active               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- Code activity linked to tasks
CREATE TABLE code_commits (
  id               UUID PRIMARY KEY,
  task_id          UUID REFERENCES tasks(id),
  developer_id     UUID REFERENCES users(id),
  repo_name        VARCHAR NOT NULL,
  commit_hash      VARCHAR NOT NULL,
  files_changed    JSONB,
  module_detected  VARCHAR,
  lines_added      INTEGER,
  lines_deleted    INTEGER,
  commit_message   TEXT,
  committed_at     TIMESTAMPTZ
);

-- Path-pattern → module mapping, configured per company
CREATE TABLE code_modules (
  id                 UUID PRIMARY KEY,
  company_id         UUID NOT NULL,
  module_name        VARCHAR NOT NULL,
  file_patterns      JSONB,  -- ["src/payment/**", "src/checkout/**"]
  expert_developers  JSONB,  -- ["mehroze", "nikhil"]
  last_updated       TIMESTAMPTZ
);
```

The App ID and webhook secret are app-wide configuration (server secrets), not
per-company rows. Store only the installation ID per company.

---

## Backend

Node.js / Express, illustrative.

### Webhook handler

```javascript
// Signature must be verified against the RAW request body
app.post(
  '/api/webhooks/github',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!verifyWebhook(signature, req.body, process.env.GITHUB_WEBHOOK_SECRET)) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.headers['x-github-event'];
    const payload = JSON.parse(req.body.toString('utf8'));

    // Acknowledge quickly; do the work in a background job
    res.status(200).send('OK');

    if (event === 'pull_request' && ['opened', 'synchronize'].includes(payload.action)) {
      await queue.add('github.pr', payload);
    } else if (event === 'push' && payload.ref === 'refs/heads/main') {
      await queue.add('github.push', payload);
    }
  }
);
```

### PR handler

```javascript
async function handlePullRequest(payload) {
  const pr = payload.pull_request;
  const repo = payload.repository.full_name;

  // Changed files are not in the webhook payload — fetch them
  const files = await githubAPI.getPRFiles(repo, pr.number);

  // ["src/payment/gateway.js"] → ["Payment"]
  const modules = detectModules(files, companyModuleMapping);

  // Explicit key (e.g. BUG-1234) first, similarity fallback second
  const task = await findMatchingTask({ title: pr.title, branch: pr.head.ref, modules });
  if (!task) return;

  await linkPRToTask(task.id, {
    pr_id: pr.id,
    pr_number: pr.number,
    pr_url: pr.html_url,
    files_changed: files,
    modules,
    developer: pr.user.login,
  });

  await notifyDeveloper(pr.user.login, task.id);
}
```

### Module detection (rule-based)

```javascript
import { minimatch } from 'minimatch';

// Loaded from code_modules for the company
const moduleMapping = {
  'src/payment/**': 'Payment',
  'src/auth/**': 'Authentication',
  'src/checkout/**': 'Checkout',
  'src/search/**': 'Search',
};

// A PR can touch several modules — return all of them
function detectModules(files, mapping) {
  const found = new Set();
  for (const file of files) {
    for (const [pattern, module] of Object.entries(mapping)) {
      if (minimatch(file.filename, pattern)) found.add(module);
    }
  }
  return found.size ? [...found] : ['Unknown'];
}
```

### Fetching file contents

```javascript
async function fetchCodeContent(repo, filePath, ref) {
  const response = await githubAPI.getContents(repo, { path: filePath, ref });
  return Buffer.from(response.content, 'base64').toString('utf-8');
}
```

### AI code analysis (optional)

```javascript
async function analyzeCodeWithAI(diff, taskDescription) {
  const prompt = `
Analyze this code change.

Task: ${taskDescription}
Diff:
${diff.substring(0, 5000)}

Answer:
1. Which module does this belong to?
2. Which functions were changed?
3. What does it depend on (imports, API calls)?
4. Is this a bug fix or a feature?
`;

  // Provider-agnostic wrapper; pick a current model at implementation time
  return callLLM(prompt);
}
```

Send the **diff** rather than whole files — it is smaller, cheaper, and exposes
less code.

---

## Frontend

Task detail panel (illustrative, Tailwind):

```tsx
function TaskCodeChanges({ pr }: { pr: LinkedPR }) {
  return (
    <section className="space-y-3">
      <h3 className="font-semibold">Code Changes</h3>

      <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
        View PR #{pr.number} on GitHub
      </a>

      <div>
        <h4 className="text-sm font-medium">Files modified ({pr.files.length})</h4>
        <ul className="text-sm">
          {pr.files.map((file) => (
            <li key={file.filename} className="flex justify-between font-mono">
              <span>{file.filename}</span>
              <span>
                <span className="text-green-600">+{file.additions}</span>{' '}
                <span className="text-red-600">−{file.deletions}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm">
        <strong>Modules:</strong> {pr.modules.join(', ')}
      </p>
    </section>
  );
}
```

---

## Use Cases

### Use Case 1: Smart PR Review Assignment

```text
Mehroze opens PR "Fix payment timeout"
Files changed: src/payment/gateway.js

PulseBoard:
  1. Module detected: Payment
  2. Payment experts: [Mehroze, Nikhil]
     - Mehroze is the author → excluded
     - Nikhil: available, 2 active PRs
  3. Requests Nikhil as reviewer   (needs pull_requests: write)

Result:
  - Nikhil gets a GitHub review request for the PR
  - Task updated: "PR assigned to Nikhil for review"
```

### Use Case 2: Developer Activity Overview

```text
Owner opens Mehroze's profile

Active tasks: 12
GitHub activity (last 7 days):
  Commits:        45
  PRs opened:     8
  PRs reviewed:   15
  Files changed:  120
  Lines added:    2,500
  Modules:        Payment 60% · Auth 30% · Search 10%

Insight:
  Mostly working on Payment; high activity this week.
  Suggestion: move 2–3 tasks to Nikhil.
```

> **Caution:** commit and line counts are weak proxies for workload and can feel
> like surveillance — the opposite of the goal of
> [Developer Happiness Score](./future-features.md#28-developer-happiness-score).
> Use **module distribution** for expertise, and **open tasks vs capacity** for
> workload. Show raw activity counts to the developer themselves, not as a
> ranking.

### Use Case 3: Dependency Detection

```text
Task A: "Fix API endpoint /login"      (Mehroze) → src/auth/api.js
Task B: "Fix login button timeout"     (Nikhil)  → src/components/LoginButton.js

Analysis:
  LoginButton.js imports and calls the /login API from src/auth/api.js
  → Task B depends on Task A

Alert:
  ⚠️ "Task B depends on Task A (LoginButton calls /login API).
      Set this dependency?"
  [Yes — Set Dependency]   [No]
```

Import graphs can be built without AI by parsing `import` / `require`
statements; the LLM is only needed for less explicit relationships.

---

## Security & Privacy

### Data flow

| Step                       | What moves                                                        |
| -------------------------- | ----------------------------------------------------------------- |
| GitHub → PulseBoard        | Metadata (file names, commit hashes, PR info) by default; code only when AI analysis is enabled |
| PulseBoard → LLM (optional)| Diff snippet (max ~5,000 chars) + task description                |
| LLM → PulseBoard           | Analysis result (modules, dependencies, suggestions)              |

### Safeguards

- Verify every webhook's `X-Hub-Signature-256` against the raw body.
- Request read-only permissions by default; write only for opt-in features.
- Respect GitHub API rate limits (per-installation tokens; back off on 403/429).
- Do not persist fetched source code; store only derived metadata.
- **Scan diffs for secrets** (API keys, tokens, `.env` content) and redact
  before sending anything to an LLM — code can contain secrets even when it
  shouldn't.
- Check the chosen LLM provider's data-retention and training policy, and make
  AI code analysis an explicit per-company opt-in.

---

## Cost & Effort

| Component             | Effort      | Cost              | Notes                              |
| --------------------- | ----------- | ----------------- | ---------------------------------- |
| GitHub App setup      | 2–3 days    | $0                | Free GitHub developer account      |
| Webhook handler       | 2–3 days    | $0                | Backend API + job queue            |
| Module detection      | 2–3 days    | $0                | Rule-based (file paths)            |
| AI code analysis      | 5–7 days    | $50–100/month     | Optional                           |
| Frontend integration  | 3–4 days    | $0                | Task detail UI                     |
| **Total**             | **14–20 days** | **$0–100/month** | $0 without AI                     |

---

## Summary

**How does PulseBoard read code?**

1. The company installs the PulseBoard GitHub App.
2. GitHub sends webhooks on PRs and pushes.
3. PulseBoard fetches the changed files, detects modules from paths, optionally
   analyzes the diff with an LLM, and links everything to the task.

**How are dependencies detected?**

- **Module mapping:** file paths → modules (`src/payment/**` → Payment)
- **Import analysis:** parse imports / API calls between changed files
- **AI analysis (optional):** for relationships that aren't explicit in code
- **Task linking:** suggest dependencies between tasks touching related modules

**Cost**

- Basic (no AI): **$0/month**
- Advanced (with AI): **$50–100/month**
