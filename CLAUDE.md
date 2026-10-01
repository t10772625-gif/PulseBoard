# CLAUDE.md

# PulseBoard — Strict Engineering, Security and Delivery Rules

## Project

PulseBoard is a multi-tenant SaaS project-management platform inspired by Jira,
Trello, Linear, ClickUp, and agency/client portals.

The product includes or will include:

- Workspaces / organizations
- Roles and permissions
- Boards, columns, tasks, subtasks, comments and attachments
- Client viewers with project-specific access
- Notifications and email templates
- AI/rule-based suggestions
- Smart matching, workload balancing, duplicate detection and prioritization
- Integrations such as GitHub, Slack, Gmail and Calendly
- Billing tiers and feature gates
- Analytics, activity logs, exports and reporting
- Future realtime collaboration and background jobs

PulseBoard must be built as a secure, scalable, production-quality multi-tenant
application — not merely as a UI demo.

Current stack:

- Frontend: Next.js App Router + TypeScript + React
- Styling: Tailwind CSS
- Backend: Next.js Route Handlers / Server Actions initially; Node.js/Express may
  be introduced later only after explicit approval
- Database: PostgreSQL via Supabase
- Authentication: Supabase Auth
- Realtime: Supabase Realtime
- Storage: Supabase Storage
- Planned cache/queue: Redis or an approved equivalent
- Validation: Zod
- Payments: planned Stripe or approved provider
- Email: planned Resend or approved provider

The current repository is early-stage. `src/app` contains the current Next.js app
structure. Read `README.md` before making architectural assumptions.

An MCP server named `supabase` may be configured in `.mcp.json` as read-only.
Read-only database/schema inspection is allowed. Never make database changes
through MCP without explicit approval.

---

# 0. Core Operating Principle

Priority order:

1. Security
2. Tenant/workspace isolation
3. Data integrity
4. No regressions
5. Correctness
6. Honest implementation status
7. Performance
8. Accessibility
9. Visual polish
10. Speed

If there is a conflict:

- Security beats speed.
- Data isolation beats UI convenience.
- Existing working behavior beats unnecessary refactoring.
- Server-side authorization beats client-side checks.
- Least privilege beats broad access.
- Honest status beats marketing language.
- Small safe change beats broad rewrite.

Never claim that something is complete, secure, connected, persistent, live,
production-ready, integrated, or verified unless it has been actually implemented
and verified in this repository and environment.

---

# 1. Absolute Restrictions

## 1.1 Environment files and secrets

Never read, open, print, search, parse, copy, edit, or use values from:

```text
.env
.env.local
.env.production
.env.development
.env.*.local
any file containing real credentials, tokens, keys or secrets
```

Never run commands that could expose environment values, including:

```text
env
printenv
cat .env*
grep on env files
shell debugging that prints environment values
process inspection that exposes environment values
logging environment variables
```

`.env.example` may be read only if it contains placeholders and no real secrets.

If configuration is needed, state only:

- The required environment variable name
- Its purpose
- Whether it must be server-only or public
- Where the user should configure it locally

Never ask the user to paste secrets into chat, source code, a markdown file, a
screenshot, a test fixture, or a commit.

Never expose or use in client-side code:

```text
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
GITHUB_APP_PRIVATE_KEY
GITHUB_WEBHOOK_SECRET
SLACK_SIGNING_SECRET
SLACK_BOT_TOKEN
GOOGLE_CLIENT_SECRET
OAuth refresh tokens
database passwords
session secrets
any non-public API key
```

Only variables deliberately intended for browser exposure may use the
`NEXT_PUBLIC_` prefix. Server-only secrets must never have that prefix.

---

## 1.2 Do not invent reality

Never fabricate:

- API keys
- OAuth credentials
- Supabase URLs or keys
- Stripe payment success
- Email delivery success
- Webhook delivery success
- User IDs
- Workspace IDs
- Board IDs
- Database rows
- Database schema
- Integration connections
- Provider responses
- Production deployment URLs
- Domain verification
- Background job success
- Security audit results
- Test results
- Build results
- Live metrics

Use only these honest labels:

```text
IMPLEMENTED + VERIFIED
IMPLEMENTED, NOT YET VERIFIED
PARTIAL IMPLEMENTATION
UI PROTOTYPE / DEMO ONLY
MOCK DATA ONLY
LOCAL-ONLY PERSISTENCE
BACKEND REQUIRED
DATABASE MIGRATION REQUIRED
API KEY / PROVIDER SETUP REQUIRED
OAUTH PROVIDER APPROVAL REQUIRED
NOT IMPLEMENTED
BLOCKED BY MISSING CONFIGURATION
BLOCKED BY USER APPROVAL
```

Never label a UI button, modal, local state, mock response, simulated webhook,
placeholder, localStorage implementation, or fake connection as a real integration.

---

## 1.3 No unapproved writes or risky changes

Before changing code, first inspect relevant files and provide a short plan.

Explicit user approval is required before:

- Creating, changing or applying database migrations
- Creating or changing RLS policies
- Creating or changing Storage bucket policies
- Adding, removing or upgrading packages
- Modifying package lockfiles
- Changing auth/session architecture
- Changing role/permission architecture
- Changing billing, plan entitlement or feature-gate behavior
- Changing pricing values
- Changing existing user-visible behavior
- Removing, replacing, renaming or broadly refactoring existing features
- Deleting files, data, tables, columns, buckets or records
- Calling a real external API
- Sending real emails
- Connecting an OAuth provider
- Creating webhooks
- Deploying code
- Adding payment code
- Using a service-role key
- Enabling public sharing links
- Enabling realtime for a table
- Adding public file access
- Introducing analytics/tracking that may collect user behavior

After approval, implement only the approved scope.

If a new risk, dependency, migration, external side effect, security concern, or
behavior change is discovered during implementation, stop and request fresh approval.

Read-only inspection, source-code search, type checking, linting, formatting, unit
tests, and other non-destructive verification may be performed without a separate
approval, unless the user explicitly says otherwise.

---

# 2. Required Working Process

Every task must follow this order.

## Step A — Inspect

Before editing, inspect relevant files and report briefly:

```text
1. Current implementation
2. Files/components/routes/tables likely affected
3. Existing dependencies and data flow
4. Existing behavior that must be preserved
5. Roles/workspaces/tiers affected
6. Security, RLS, API and regression risks
7. Whether backend, migration, provider setup or credentials are required
```

Do not make architecture assumptions without inspecting the repository.

---

## Step B — Plan

Before implementation, provide a concise plan:

```text
1. Minimal safe changes proposed
2. Files to change
3. Database/schema/RLS impact
4. Authorization and tenant-isolation impact
5. API validation requirements
6. Regression risks
7. Tests and verification to run
8. Any provider/account/environment setup needed
9. Whether explicit approval is required
```

---

## Step C — Obtain approval when needed

Wait for explicit user approval before performing restricted actions described in
Section 1.3.

Do not interpret a vague request such as “fix it”, “make it real”, “connect it” or
“implement it” as authorization to:

- change database schema
- send real email
- connect third-party services
- deploy production
- expose public links
- alter pricing or billing
- weaken security controls

Clarify scope where required.

---

## Step D — Implement minimally

When approved:

- Make the smallest focused change that satisfies the approved requirement.
- Preserve existing behavior unless the user explicitly approved a behavior change.
- Do not rewrite unrelated code.
- Do not silently “clean up” unrelated files.
- Do not introduce unrelated dependencies.
- Do not remove features because they seem redundant.
- Prefer shared helpers over duplicated authorization/security logic.
- Preserve established project conventions unless a change is approved.

---

## Step E — Verify

Run applicable checks:

```text
- Type check
- Lint
- Build
- Unit tests
- Integration tests
- Permission/role tests
- RLS tests
- API validation tests
- Manual happy-path test
- Manual failure-path test
- Regression test for affected existing behavior
```

Do not say “tested” if only code was written. Clearly distinguish:

```text
Code reviewed
Type checked
Linted
Built
Unit tested
Integration tested
Manually tested
Not tested
Blocked by missing configuration
```

---

## Step F — Final report

Every completed task must end with:

```md
## Status
- IMPLEMENTED + VERIFIED / IMPLEMENTED, NOT YET VERIFIED /
  PARTIAL IMPLEMENTATION / BLOCKED

## Changed
- Exact files changed
- Exact routes/server actions changed
- Database migrations changed
- RLS/storage policies changed
- UI behavior changed

## Security
- Authentication checks
- Authorization checks
- Workspace/tenant checks
- Input validation
- RLS policies
- Rate limits
- Secret handling
- External provider safety

## Verification
- Commands/tests run
- Manual flows tested
- What passed
- What could not be tested

## Limitations / Required Setup
- Required provider accounts
- Required environment variable names only
- OAuth approval needs
- Deployment requirements
- Remaining mock/demo behavior
- Known limitations

## Regression Risk
- Existing areas affected
- How behavior was preserved
- Remaining risk or follow-up work
```

---

# 3. Multi-Tenant Data Isolation

PulseBoard is multi-tenant.

Every organization/workspace must be isolated from every other organization/workspace.

Expected hierarchy:

```text
User
  → Workspace / Organization
    → Workspace Memberships and Roles
      → Projects / Boards
        → Columns
        → Tasks
          → Subtasks
          → Checklists
          → Comments
          → Attachments
          → Time Logs
          → Activity Logs
          → Client Shares / Client Viewer Access
```

A user from Workspace A must never be able to view, search, create, edit, delete,
export, attach to, comment on, infer, subscribe to, download, or receive data from
Workspace B.

This applies to every access channel:

```text
UI pages
route handlers
server actions
REST APIs
RPC/database functions
Supabase queries
Supabase Realtime
Storage URLs
signed URLs
CSV/Excel imports and exports
analytics
reports
audit logs
public links
email links
webhooks
integrations
background jobs
cached data
browser client state
URL manipulation
guessed UUIDs
search
filters
pagination
error messages
logs
```

Never trust a client-provided `workspace_id`, `organization_id`, `owner_id`, role,
plan, board ID, task ID, or client-share ID as proof of authorization.

A client-supplied ID is only a requested target. Verify server-side and database-side:

```text
1. Current user identity
2. Workspace membership
3. Workspace role
4. Board/project permission
5. Exact resource ownership/scope
6. Requested action permission
7. Tenant relationship of every parent and child record
```

---

## 3.1 Workspace context and switching

Workspace context must be authorized, not trusted.

Rules:

- A workspace slug/ID in the URL is a selector, not permission proof.
- Verify membership before loading workspace data.
- Verify each requested board/task belongs to that authorized workspace.
- Persisted “last workspace” state is convenience-only, never authorization.
- On workspace switching, clear tenant-scoped client cache, React state, query cache,
  selected task state, local board state and realtime subscriptions.
- Cache keys, search indexes, exports, analytics, attachments, background jobs and
  realtime channels must include workspace scope.
- Never reuse Workspace A task/board data in Workspace B UI.
- Test guessed-ID and URL-manipulation attacks for every tenant-scoped route.

---

# 4. Roles and Authorization

Default system roles:

```text
owner
admin
sub_admin
member
viewer
client_viewer
```

Expected behavior:

| Role | Typical access |
|---|---|
| Owner | Full workspace control, ownership, billing, roles, deletion, integrations |
| Admin | Manage permitted boards/projects, team, tasks, reports |
| Sub Admin | Manage explicitly assigned departments/boards and scoped members |
| Member | Access assigned/permitted boards; create/update allowed work |
| Viewer | Read-only access to explicitly permitted resources |
| Client Viewer | Read-only access to only explicitly shared project/board data |

Rules:

- A role name is not authorization by itself.
- Authorization must include workspace, board/project and exact resource scope.
- Centralize authorization in permission helpers/policies.
- Do not scatter hard-coded role checks across random UI components.
- UI hiding is not authorization.
- Server-side authorization and database RLS must enforce permissions.
- A viewer/client_viewer must not mutate data by direct request.
- A member cannot elevate themselves to admin/owner.
- An admin cannot change owner-only billing/ownership unless explicitly allowed.
- No user can modify their own role, plan, entitlement, workspace ownership or billing
  status through a client request.
- Client viewers must never enumerate workspace-wide data.
- Role changes, invitation changes, client access changes and ownership transfers
  must create audit log entries.
- Future custom roles must be permission-based, workspace-scoped and deny-by-default.

---

# 5. Supabase, PostgreSQL and RLS Requirements

## 5.1 RLS is mandatory

For every exposed table containing user, workspace, membership, project, board, task,
comment, attachment, client, billing, integration, analytics, report, audit or
settings data:

```text
[ ] RLS enabled
[ ] Explicit SELECT policy
[ ] Explicit INSERT policy
[ ] Explicit UPDATE policy
[ ] Explicit DELETE policy
[ ] Policies scoped to workspace membership
[ ] Policies enforce role/action permission
[ ] INSERT/UPDATE WITH CHECK prevents cross-workspace writes
[ ] Protected fields cannot be client-modified
[ ] Archived/soft-deleted records handled deliberately
[ ] Cross-workspace guessed UUID access tested
```

Never:

- Disable RLS to make code work.
- Use `USING (true)` or `WITH CHECK (true)` for production tenant data.
- Depend only on frontend filtering.
- Depend only on a hidden UI button.
- Add a broad temporary policy without explicit approval and a documented removal plan.

If RLS blocks a valid query, fix the policy correctly. Do not bypass it.

---

## 5.2 Required RLS checks

Every policy must verify relevant conditions:

```text
1. Caller is authenticated where required
2. Caller belongs to the target workspace
3. Target row belongs to the correct workspace
4. Caller role permits the requested action
5. Parent board/project belongs to the same workspace
6. Client viewer is limited to explicitly shared project/board
7. Guessed UUID cannot cross tenant boundaries
8. INSERT/UPDATE cannot change protected tenant/role/billing fields
9. Soft-deleted data follows expected visibility rules
10. Update policy has both USING and WITH CHECK protections
```

---

## 5.3 Tables, foreign keys and constraints

All tenant-scoped tables must include either:

```text
workspace_id
```

or a verifiable parent relationship that cannot cross tenants.

Use:

- Foreign keys
- Unique constraints
- `NOT NULL`
- `CHECK` constraints
- Safe defaults
- Appropriate indexes
- Referential integrity
- Explicit soft-delete/archival fields when needed

Add indexes for commonly queried fields including:

```text
workspace_id
project_id
board_id
column_id
task_id
assignee_id
membership user_id + workspace_id
status
priority
due_date
created_at
updated_at
```

Do not create schema or policy changes without explicit approval.

---

## 5.4 RPC, database functions and views

Every exposed RPC/database function must be reviewed as an API surface.

Rules:

- Validate tenant/workspace scope inside database functions.
- Use parameterized SQL only.
- Do not expose dynamic SQL unless unavoidable and reviewed.
- Avoid `SECURITY DEFINER` functions.
- If `SECURITY DEFINER` is absolutely necessary:
  - require explicit approval
  - use a safe fixed `search_path`
  - perform explicit authorization checks
  - expose only the smallest necessary operation
  - document the reason and threat model
  - test cross-workspace denial
- Views must not leak hidden columns or bypass intended RLS behavior.
- Never assume RLS applies safely to a view/function without verification.

---

## 5.5 Service-role key

`SUPABASE_SERVICE_ROLE_KEY` is server-only and bypasses RLS.

It must never appear in:

```text
client components
browser requests
NEXT_PUBLIC_* variables
frontend source
logs
screenshots
Git commits
error responses
test fixtures
documentation examples containing real values
```

Rules:

- Prefer authenticated user queries protected by RLS.
- Use service role only for narrowly scoped server-only actions that cannot be done
  with standard user access.
- Require explicit approval before adding service-role use.
- Before every service-role operation:
  1. authenticate requesting user
  2. authorize exact action
  3. validate workspace membership
  4. validate resource belongs to workspace
  5. validate role/plan if relevant
- Document every service-role endpoint and why it is unavoidable.
- Never expose service-role query results without output filtering.

---

# 6. API and Server Action Security

Every Route Handler, Server Action, RPC call, webhook endpoint and background-job
entry point must be treated as an untrusted public entry point.

For every mutation endpoint:

```text
[ ] Authenticate caller
[ ] Derive auth context server-side
[ ] Authorize exact resource and action
[ ] Validate params, query and body with Zod
[ ] Use separate create/update/query schemas
[ ] Allow only explicitly mutable fields
[ ] Reject/ignore unexpected privileged fields safely
[ ] Verify workspace scope
[ ] Verify parent-child relationship scope
[ ] Enforce feature entitlement server-side if paid feature
[ ] Apply rate limit if sensitive or expensive
[ ] Return safe errors only
[ ] Avoid stack traces and sensitive detail
[ ] Create audit event if sensitive
[ ] Test wrong-role denial
[ ] Test cross-workspace denial
```

Never:

- Pass raw request body directly into a database insert/update.
- Trust body-provided roles, plans, owner IDs or workspace IDs.
- Trust client “payment successful” or “isPro” state.
- Rely only on frontend guards.
- Return raw provider/database errors to the browser.
- Leak whether other workspace resources exist.

---

## 6.1 API error policy

Safe user-facing errors:

```text
Unauthorized
Forbidden
Not found
Invalid request
Too many requests
Operation could not be completed
```

Never return:

```text
SQL errors
stack traces
service role details
provider tokens
database connection details
raw provider responses
sensitive IDs from other workspaces
environment-variable values
```

Internal logs must also redact secrets and sensitive data.

---

# 7. Authentication, Sessions and CSRF

Rules:

- Use proven Supabase Auth patterns.
- Protect authenticated routes server-side, not only client-side.
- Verify active session before privileged actions.
- Handle expired/invalid sessions safely.
- Prefer secure cookie/session handling over storing sensitive tokens in localStorage.
- Treat Server Actions with the same security rigor as public API endpoints.
- Do not assume framework protections replace authorization checks.
- Use secure redirect validation; never redirect to arbitrary user-provided URLs.
- Password reset and email verification links must be single-use and expire.
- Avoid account enumeration in login/password-reset responses.
- Require re-authentication where appropriate for:
  - account deletion
  - workspace deletion
  - billing changes
  - owner transfer
  - API-key creation
  - integration connection/reconnection
  - export of sensitive workspace data

---

# 8. Billing, Feature Gates and Entitlements

Current intended plans:

```text
Basic: $0
Pro: $12 per user/month
Enterprise: $18 per user/month
```

Billing and feature access must be server-controlled.

Rules:

- Never trust frontend tier state.
- Never unlock paid features through localStorage, query parameters, React state,
  browser devtools or client-provided plan fields.
- Feature gates must be enforced server-side for all paid/sensitive actions.
- Plan changes must be derived from verified billing provider events.
- Payment webhooks must verify signatures.
- Billing webhooks must be idempotent.
- Store event IDs to prevent duplicate processing.
- Never trust a client claim that payment succeeded.
- Define safe behavior for:
  - cancellation
  - failed payment
  - expired trial
  - downgrade
  - seat-limit breach
  - storage-quota breach
  - paused subscription
  - deleted workspace
- Before payment implementation, state exactly whether it is:
  - pricing UI only
  - mock checkout
  - real checkout
  - subscription management
  - webhook verified
  - fully entitlement-enforced

---

# 9. File Upload and Storage Security

All files are untrusted.

Rules:

```text
[ ] Validate upload authorization before accepting file
[ ] Validate workspace/board/task ownership
[ ] Restrict allowed file types
[ ] Validate MIME/content where feasible, not only extension
[ ] Enforce file-size limit by tier server-side
[ ] Generate safe server-side filename/object ID
[ ] Do not trust original filename
[ ] Store in workspace-scoped paths
[ ] Store private by default
[ ] Use short-lived signed URLs for private download/viewing
[ ] Verify download/delete access every time
[ ] Track storage usage server-side per workspace
[ ] Enforce quota server-side
[ ] Do not execute uploaded content
[ ] Consider malware scanning before public production launch
```

Storage path format:

```text
workspace/{workspace_id}/project/{project_id}/board/{board_id}/task/{task_id}/{generated_file_id}
```

Rules:

- Do not create public buckets by default.
- Do not permit path traversal or tenant-path guessing.
- Do not expose storage object URLs permanently unless explicitly intended and safe.
- Do not claim 1 GB / 5 GB / 10 GB storage works unless real storage usage is measured
  and quota enforcement is live.

---

# 10. Realtime Security

Before enabling Supabase Realtime for any table:

```text
[ ] RLS policies verified
[ ] Cross-workspace subscriptions tested
[ ] Client subscription scope reviewed
[ ] Sensitive fields excluded or protected
[ ] Workspace switching unsubscribes old channels
[ ] Unauthorized users cannot listen to tenant data
[ ] Events do not leak data in payloads
[ ] Rate/volume considerations reviewed
```

Never assume a client-side filter is a security boundary.

Realtime must never leak Workspace A events to Workspace B.

---

# 11. Integrations, OAuth, Webhooks and Email

## 11.1 Integration truthfulness

For Gmail, Slack, GitHub, Calendly, Google Drive, Discord, Telegram, WhatsApp,
Zapier, Make, Stripe or any external service, show honest status only:

```text
UI PROTOTYPE / DEMO ONLY
MOCK DATA ONLY
API KEY / PROVIDER SETUP REQUIRED
OAUTH PROVIDER APPROVAL REQUIRED
CONNECTED, NOT YET VERIFIED
LIVE INTEGRATION + VERIFIED
```

Never show “Connected” until OAuth/token exchange has actually succeeded.

---

## 11.2 OAuth rules

- Use minimum OAuth scopes.
- Scope integration records to a workspace.
- Store access/refresh tokens server-side only.
- Encrypt tokens at rest where supported/appropriate.
- Never expose tokens in the client.
- Provide disconnect functionality.
- Revoke/delete tokens on disconnect where provider supports it.
- Confirm provider account/workspace mapping.
- Validate callback `state` and PKCE where applicable.
- Never trust a workspace ID passed through an OAuth callback without verification.
- Log connection/disconnection as an audit event.

---

## 11.3 Webhook rules

Every webhook must:

```text
[ ] Verify signature before processing
[ ] Reject invalid signature
[ ] Use constant-time comparison where relevant
[ ] Validate payload schema
[ ] Use idempotency/event IDs
[ ] Handle duplicate delivery safely
[ ] Map event to correct workspace safely
[ ] Avoid trusting raw payload fields
[ ] Return quickly
[ ] Queue expensive work where appropriate
[ ] Log safe metadata only
[ ] Never log secrets or full sensitive payloads
```

Never create tasks, send emails, change billing, modify access, or process sensitive
operations from an unverified webhook.

---

## 11.4 Email rules

Before calling email “working,” verify through a real provider and intended sender
configuration.

Rules:

- Send email only from server-side routes/jobs.
- Never expose email API keys.
- Use approved/verified sender domain in production.
- Rate-limit email sends.
- Prevent arbitrary spam or open relay behavior.
- Use safe template variables.
- Escape/sanitize user-provided task/comment/client content in email templates.
- Use transactional emails only for necessary operational messages.
- Include opt-out/preferences for non-transactional emails.
- Log delivery attempts safely.
- Do not claim delivery if message is merely queued or mocked.

---

# 12. AI, Rules and Automation Safety

PulseBoard can include:

- Smart matching
- Workload balancing
- Duplicate detection
- Auto-prioritization
- Burnout indicators
- Predictive task-risk suggestions
- Summaries
- Task generation
- AI-assisted bug reports
- Workflow suggestions

Rules:

- Do not call simple keyword/rule logic “AI” without clearly saying it is
  rule-based automation.
- Do not call static sample data or mock scores “machine learning.”
- Do not claim guaranteed accuracy.
- Use language such as:
  ```text
  Suggestion
  Estimated risk
  Based on available task data
  Confidence: low/medium/high
  Review before applying
  ```
- Users must be able to review and override AI/rule-based suggestions.
- Do not automatically perform high-impact actions without human confirmation:
  - deleting tasks
  - merging tasks
  - reassigning users
  - changing priorities
  - emailing clients
  - moving client-visible work
  - changing billing or permissions
- AI output is untrusted input. Validate structured AI output before storing or acting.
- Add usage limits, rate limits and cost controls for expensive AI endpoints.
- Do not transmit private workspace content, source code, attachments, credentials,
  personal data or secrets to external AI providers without:
  1. explicit user approval
  2. clear disclosure
  3. minimum necessary data
  4. redaction where possible
  5. provider configuration
- Never treat burnout, productivity, chemistry or performance scores as factual HR
  decisions. Present them as limited workspace signals and do not make automated HR,
  compensation, disciplinary or hiring decisions from them.

---

# 13. XSS, HTML, CSV and Content Safety

Treat all user/provider/AI content as untrusted, including:

```text
task titles
task descriptions
comments
checklists
custom fields
file names
email content
integration payloads
AI output
imported CSV/XLSX cells
public bug reports
client feedback
URLs
markdown
rich text
```

Rules:

- Never render untrusted HTML through `dangerouslySetInnerHTML`.
- If rich text is explicitly approved, sanitize using a strict allowlist.
- Validate URLs before rendering clickable links.
- Block dangerous URL schemes such as `javascript:`.
- Do not embed arbitrary untrusted content in iframes.
- Sanitize markdown/rich text before rendering.
- Escape exported spreadsheet cells beginning with:
  ```text
  =
  +
  -
  @
  ```
  to prevent CSV/formula injection in Excel/Sheets.
- Sanitize all content inserted into email templates.
- Use a Content Security Policy before production deployment.
- Do not trust imported spreadsheet content, even when uploaded by a workspace user.

---

# 14. Abuse Prevention and Rate Limiting

Implement server-side rate limits for appropriate endpoints, including:

```text
login
signup
password reset
email verification
invitations
public bug submissions
file uploads
search
exports
AI endpoints
email sends
integration sync
webhook retry paths
billing routes
OAuth callback abuse paths where appropriate
```

Rules:

- Use a combination of user ID, workspace ID, IP, route and provider event ID where
  appropriate.
- Use stricter limits for public/unauthenticated endpoints.
- Do not rely only on client-side rate limiting.
- Use CAPTCHA or equivalent abuse prevention for public submission forms if needed.
- Return safe retry guidance.
- Add quotas per plan for costly features such as AI, storage, exports and emails.

---

# 15. Background Jobs, Scheduling and Idempotency

Recurring tasks, scheduled reports, reminders, integration syncs, webhook work,
exports, notifications and AI processing must be designed as safe background jobs.

Rules:

```text
[ ] Idempotency key/job record
[ ] Workspace scope stored and validated
[ ] Bounded retries
[ ] Exponential backoff for transient failure
[ ] No duplicate external side effects
[ ] Safe retry behavior for email/task/payment actions
[ ] Failed job visibility/logging
[ ] Re-check authorization/state at execution time
[ ] No secrets in job logs
```

Never blindly retry:

```text
email sends
payments
task creation
role changes
client invitations
status changes
deletions
```

---

# 16. Dependency and Supply-Chain Security

Before adding, upgrading or removing a dependency, explain:

```text
- Package name
- Why it is needed
- Official source/maintainer
- Maintenance status
- Security considerations
- License concern if applicable
- Bundle/runtime impact
- Alternatives considered
- Why existing dependencies cannot solve it
```

Rules:

- Do not install packages without explicit approval.
- Keep versions locked through package manager lockfile.
- Do not use unofficial forks without explicit approval.
- Do not use typosquatted or unmaintained packages.
- Run relevant dependency audit after package changes when available.
- Do not blindly run `npm audit fix --force`.
- If an advisory appears, report:
  - package and version
  - dependency path
  - severity
  - whether reachable in this app
  - known patch/mitigation
  - regression risk
  - whether it is development-only or production-reachable

---

# 17. Database Migrations and Data Integrity

Before any database change:

1. Inspect current schema and migration history.
2. Propose a new migration; never rewrite an applied migration.
3. Explain impact and await explicit approval.
4. Prefer additive, reversible changes.
5. Preserve current data.
6. Define backfill and rollback plan.

Before migration approval, report:

```text
- Tables affected
- Columns added/changed/removed
- Foreign keys and constraints
- Indexes added/changed
- Data backfill required
- RLS policies added/changed
- Storage impact if relevant
- Compatibility with existing UI/API
- Potential risk
- Rollback plan
```

Never:

- Drop tables/columns/data without explicit approval.
- Change types destructively without migration plan.
- Make nullable data mandatory without safe backfill.
- Add `CASCADE` deletion without explaining impact.
- Remove RLS to simplify a migration.
- Create cross-workspace relationships.

Use transactions where available for critical multi-step data operations.

---

# 18. Deletion, Archive and Irreversible Actions

Destructive actions include:

```text
workspace deletion
project/board deletion
bulk task deletion
attachment deletion
member removal
client access revocation
integration deletion
account deletion
plan downgrade with over-quota data
database replacement
configuration overwrite
migration/drop operations
```

Rules:

- Resolve exact target first.
- Explain what will be affected.
- Prefer archive/soft-delete for business data.
- Require explicit confirmation for irreversible actions.
- Explain dependent impact:
  - subtasks
  - comments
  - attachments
  - time logs
  - client shares
  - recurring tasks
  - audit history
  - exports
- Provide undo/restore where feasible.
- Do not silently cascade-delete important related data.
- Create audit logs for destructive actions.

---

# 19. Regression Prevention

Before modifying any feature, identify:

```text
[ ] Affected pages/routes/components
[ ] Affected roles
[ ] Affected workspaces/tenant scope
[ ] Affected pricing tiers
[ ] Affected tables/RLS policies
[ ] Affected integrations
[ ] Affected realtime/cache behavior
[ ] Possible regressions
```

Minimum task/board regression checklist:

```text
[ ] Owner can create/read/update/delete permitted resource
[ ] Admin behavior remains correct
[ ] Sub-admin board scope remains correct
[ ] Member behavior remains correct
[ ] Viewer cannot write
[ ] Client viewer sees only shared project/board data
[ ] Cross-workspace access is denied
[ ] Create works
[ ] Read works
[ ] Update works
[ ] Archive/delete works
[ ] Restore works if supported
[ ] Bulk action works
[ ] Comments work
[ ] Attachments remain scoped
[ ] UI updates correctly
[ ] Data persists after refresh
[ ] Realtime does not leak data
[ ] Audit log remains correct
[ ] Existing unrelated board/task behavior remains unchanged
```

If tests do not exist, say so clearly.

---

# 20. Minimum Testing Requirements

Before marking backend, persistence, security or billing work as
`IMPLEMENTED + VERIFIED`, run applicable tests.

## Unit tests

Test:

```text
Zod schemas
permission helpers
feature-gate helpers
workspace-scope helpers
plan entitlement helpers
AI/rule output validation
quota calculations
safe export escaping
```

## Integration tests

Test:

```text
owner/admin/sub_admin/member/viewer/client_viewer permissions
cross-workspace reads denied
cross-workspace writes denied
guessed UUID access denied
client viewer cannot enumerate other projects/boards
protected fields cannot be changed
RLS denies unauthorized SELECT/INSERT/UPDATE/DELETE
Storage access is workspace-scoped
public links do not expose private workspace data
webhook invalid signature rejected
webhook duplicate event processed idempotently
feature-gate bypass fails server-side
billing event signature is required
workspace switching clears stale data
```

## Regression tests

Test:

```text
board/task CRUD
bulk actions
comments
attachments
archive/restore
client share behavior
role changes
exports
imports
search/filtering
data persistence after refresh
```

A feature is not `IMPLEMENTED + VERIFIED` if required configuration is absent or
the relevant test could not run.

---

# 21. Performance and Reliability

Rules:

- Avoid N+1 database queries.
- Paginate large tasks, comments, activity, audit logs and search results.
- Do not load all workspace data into the browser.
- Use workspace-scoped cache keys.
- Avoid fetching unauthorized data even if UI will hide it.
- Add loading, empty, error and retry states.
- Optimistic UI must rollback correctly on failure.
- Use transactions for critical multi-step operations.
- Do not block webhook responses on expensive processing.
- Avoid polling when a safe event/realtime approach is available.
- Do not add large dependencies without explaining impact.
- Do not optimize prematurely, but identify obvious query/index bottlenecks.
- Preserve correctness over perceived speed.

---

# 22. Accessibility and UX

Rules:

- Core interactions must support keyboard navigation.
- Buttons/icons must have accessible labels.
- Modals must manage focus correctly and close safely.
- Do not rely on color alone for status, priority or errors.
- Maintain accessible contrast in dark mode.
- Preserve mobile responsiveness.
- Do not hide validation or backend errors.
- Warn users before losing unsaved changes.
- Use confirmation for destructive/irreversible actions.
- Preserve current design language unless redesign is explicitly requested.
- Avoid changing existing layout/interaction without approval.

---

# 23. Logging, Monitoring and Audit Logs

Use safe structured logs where logging exists.

Allowed log metadata may include:

```text
request ID
safe event ID
route/action name
workspace ID when safe
user ID when safe
success/failure category
duration
safe provider status
```

Never log:

```text
passwords
tokens
cookies
API keys
OAuth codes
refresh tokens
email bodies
attachment contents
full sensitive task/comment data
raw provider payloads
database credentials
environment variables
service-role results
```

Sensitive actions requiring audit records include:

```text
role changes
member invites/removal
client access changes
workspace deletion
board/project deletion
bulk delete
export
integration connect/disconnect
billing change
plan change
public-link creation/revocation
backup restore
permission change
```

Audit logs must be workspace-scoped and not editable by ordinary users.

---

# 24. Deep Audit Mode

When the user says:

```text
audit
security audit
deep audit
full audit
verify everything
check everything
production readiness
RLS audit
API audit
```

Perform a detailed audit, not a surface-level summary.

Inspect every applicable layer:

```text
1. Authentication
2. Session handling
3. Authorization and role enforcement
4. Workspace/tenant isolation
5. RLS on every relevant table
6. Storage bucket/object policies
7. Realtime subscription isolation
8. API routes and Server Actions
9. Input validation
10. Protected field mutation
11. Service-role usage
12. Secrets exposure
13. Environment safety
14. OAuth flow/state/token security
15. Webhook signature/idempotency
16. Email abuse protection
17. Billing/entitlement verification
18. Feature-gate enforcement
19. XSS/HTML/markdown/URL safety
20. CSV/formula-injection safety
21. SQL injection/function/view safety
22. CSRF/session risks
23. Rate limiting and public-form abuse
24. File upload/download safety
25. Background jobs/retry safety
26. Cache/workspace-switch leakage
27. Dependency vulnerabilities
28. Database indexes/query performance
29. Accessibility and mobile regressions
30. Mock/demo/live labeling accuracy
31. Data persistence after refresh
32. Public link/client viewer scope
33. Logging/error data leakage
34. Backup/restore safety
```

For every finding, report:

```text
Severity: Critical / High / Medium / Low / Informational
Exact location: file, route, table, RLS policy, bucket, function, component or flow
Problem:
Attack/failure scenario:
Impact:
Recommended remediation:
Status: fixed / partially fixed / unresolved / requires configuration
Verification method:
```

Never say “no security issues found” unless relevant files, routes, RLS policies,
storage policies, auth flow, configuration boundaries and applicable database objects
were actually inspected.

---

# 25. Final Product Truth Rules

Do not market or label a feature as real until it is real.

| Actual state | Allowed wording |
|---|---|
| Button, modal, static screen | UI PROTOTYPE / DEMO ONLY |
| Local mock state | MOCK DATA ONLY |
| Browser localStorage | LOCAL-ONLY PERSISTENCE |
| Supabase database + RLS + verified flow | IMPLEMENTED AND PERSISTENT |
| Real provider + verified response | LIVE INTEGRATION + VERIFIED |
| Tests and applicable security audit pass | VERIFIED |
| Needs key, OAuth or provider approval | SETUP REQUIRED |
| Planned only | NOT IMPLEMENTED |

Never inflate feature counts.

Count one unique user-facing capability once. Do not count the same feature under
multiple labels.

Never claim:

```text
170+ real features
100% secure
all integrations
AI-powered
production-ready
unlimited storage
real-time
enterprise-ready
```

unless code, security controls, infrastructure, configuration and verification
support that exact claim.

Build PulseBoard as a trustworthy multi-tenant SaaS product, not a misleading demo.



---

# 27. Mandatory Daily Memory, Push Handoff and Session Continuity Protocol

PulseBoard must maintain permanent repository-based engineering memory.

Chat history, previous sessions, screenshots, verbal summaries, UI appearance, and
agent memory are not sources of truth.

The repository documentation is the only source of truth for:

- Current implementation state
- What changed
- Why it changed
- Previous behavior
- Current behavior
- Security decisions
- RLS/API/storage state
- Test evidence
- Open issues
- Known limitations
- Required credentials/provider setup
- Pending work
- Regression risks
- Rollback steps
- Next-session instructions

The required files are:

```text
docs/ENGINEERING_STATUS.md
docs/ISSUE_REGISTER.md
docs/VERIFICATION_LOG.md
docs/SECURITY_DECISIONS.md

docs/daily-memory/YYYY-MM-DD.md

docs/handoffs/CURRENT_HANDOFF.md
docs/handoffs/archive/YYYY-MM-DD-push-NNN.md
```

Do not create, modify, delete, archive or overwrite these files without explicit
user approval if the current task has not approved documentation changes.

When documentation updates are approved, these files are mandatory and must be kept
consistent with the actual repository code, database migrations and test evidence.

---

## 27.1 New Session Mandatory Read Order

At the start of every new Claude session, before proposing, implementing, auditing,
claiming knowledge, or saying something is fixed, read in exactly this order:

```text
1. CLAUDE.md
2. README.md
3. docs/ENGINEERING_STATUS.md
4. docs/handoffs/CURRENT_HANDOFF.md
5. docs/ISSUE_REGISTER.md
   - all open Critical issues
   - all open High issues
   - all open Medium issues relevant to requested work
6. docs/VERIFICATION_LOG.md
   - latest relevant change records
7. docs/SECURITY_DECISIONS.md
   - relevant decisions only
8. Latest daily memory file in docs/daily-memory/
```

Then state briefly:

```text
- Current known product state
- Relevant open risks/issues
- Relevant pending or blocked work
- Relevant limitations
- Whether documentation is stale, missing, contradictory or incomplete
- Whether the requested work conflicts with previous decisions
```

Never ask the user to repeat project history that is available in these files.

Never say:

```text
I do not know what happened previously
Please explain the old work again
I assume the previous work is complete
Previous chat said it was fixed
I remember it was working
```

Read the repository memory first.

---

## 27.2 Daily Memory Rule

Whenever the user says any of these:

```text
memory
save memory
daily memory
today's memory
aaj ki memory
handoff
save handoff
push memory
update docs
end of day summary
```

create or update:

```text
docs/daily-memory/YYYY-MM-DD.md
docs/handoffs/CURRENT_HANDOFF.md
```

The daily memory must record everything done that day, including:

```text
- What was requested
- Why the work was requested
- What existed before
- Why the old implementation/state existed
- What was changed
- Why the new implementation/state is better or required
- Exact files changed
- Exact routes/components/hooks/utilities changed
- Database migrations/tables/columns changed
- RLS policies changed
- Storage policies/buckets changed
- API routes/server actions changed
- Integrations/provider configurations affected
- Roles and permissions affected
- Feature tiers affected
- Existing features that could regress
- Tests run
- Tests passed
- Tests failed
- Tests not run
- Browser checks run/not run
- Security checks run/not run
- Known issues found
- New issue IDs created
- Existing issue IDs updated
- What is pending
- Why it is pending
- What is blocked
- What is required from user/provider
- Exact next steps
- Rollback plan
```

Never create a vague daily memory such as:

```text
Worked on roles.
Fixed RLS.
Updated UI.
Everything looks good.
```

Daily memory must be factual, detailed, and evidence-based.

---

## 27.3 Push Handoff Rule

Before every git push, or when the user says “push memory”, “handoff”, “commit
summary”, “save current state”, or “prepare for next session”:

1. Inspect the actual current diff/status.
2. Compare current changes with:
   - ENGINEERING_STATUS.md
   - ISSUE_REGISTER.md
   - VERIFICATION_LOG.md
   - current daily memory file
3. Identify undocumented changes, risks, mock behavior, untested paths and blockers.
4. Update the approved documentation files.
5. Create a new immutable handoff archive file:

```text
docs/handoffs/archive/YYYY-MM-DD-push-NNN.md
```

6. Replace/update:

```text
docs/handoffs/CURRENT_HANDOFF.md
```

7. Only then propose or perform git push if the user explicitly approved pushing.

Never claim “ready to push” until the handoff accurately reflects the current code state.

Never push automatically without explicit user approval.

---

## 27.4 Current Handoff Requirements

`docs/handoffs/CURRENT_HANDOFF.md` must always describe the exact current state after
the latest approved push or latest approved working session.

It must contain:

```text
1. Handoff metadata
   - Date/time
   - Current branch
   - Last known commit hash, if available
   - Environment: local/dev/staging/production
   - Current app state: mock/local-only/Supabase/partial/live

2. Executive summary
   - What changed most recently
   - Whether it is verified
   - What must not be assumed

3. Current implementation truth
   - Implemented and verified
   - Implemented but unverified
   - Demo/mock-only
   - Setup required
   - Not implemented

4. Security and data state
   - Auth state
   - RLS state
   - API authorization state
   - Storage state
   - Realtime state
   - Secret/configuration status
   - Known tenant-isolation risk, if any

5. Open issues
   - Critical/High/Medium issues
   - Relevant issue IDs
   - Exact next action

6. Current blockers
   - User action needed
   - Provider action needed
   - Missing domain/API key/OAuth app
   - Missing test account
   - Missing browser verification

7. Verification status
   - Tests actually run
   - Browser checks actually run
   - Tests not run
   - Why not run

8. Regression warnings
   - Areas likely affected by next change
   - Existing behavior that must be preserved

9. Recommended next task
   - Single safest next task
   - Prerequisites
   - Risks
   - Approval required or not

10. Do not do without approval
   - migrations
   - RLS changes
   - package installs
   - external API calls
   - email sends
   - production deployment
   - destructive actions
```

A new session should be able to begin productive work by reading only:

```text
CLAUDE.md
ENGINEERING_STATUS.md
CURRENT_HANDOFF.md
relevant open issues
latest verification log
```

No user re-explanation should be needed.

---

## 27.5 Immutable Push Archive Rules

Every push handoff archive file must include:

```text
- Push number for the day
- Date/time
- Branch
- Commit message proposed or used
- Files changed since previous push
- Why each change was made
- Previous behavior/state
- New behavior/state
- Security/RLS/API/storage impact
- Tests and results
- Untested areas
- Open issues at time of push
- New issues discovered
- Deferred items
- Exact rollback/revert guidance
- Next session instructions
```

Push archive files are historical records.

Never silently rewrite old archive files to make history look cleaner.

If an old handoff was inaccurate, add a correction section:

```md
## Correction

Previous statement:
...

Why it was inaccurate:
...

Correct current understanding:
...

Evidence:
...
```

---

## 27.6 Mandatory Before / Why / After Format

For every meaningful change in a daily memory or handoff, document this exact pattern:

```md
### Change: [Name]

**Before**
- What existed before this work
- What was missing, insecure, broken, mocked, unverified or limited
- Why the previous state existed

**Why change was needed**
- User/business/security/technical reason
- Specific risk or limitation addressed
- Related issue ID(s)

**What changed**
- Exact implementation details
- Exact files/tables/routes/policies changed
- Role/tier/workspace impact

**After**
- What works now
- What remains unverified
- What is still missing
- What user-visible behavior changed
- What security behavior changed

**Verification**
- Tests run and actual results
- Manual/browser verification
- What was not tested

**Regression risk**
- Existing feature(s) that may be affected
- What was done to preserve them

**Rollback**
- How to revert safely
```

---

## 27.7 No Hidden Pending Work

Every incomplete item must appear in at least one of:

```text
docs/ISSUE_REGISTER.md
docs/ENGINEERING_STATUS.md
docs/handoffs/CURRENT_HANDOFF.md
```

Pending work must include:

```text
- What is pending
- Why it is pending
- Severity/importance
- What blocks it
- What evidence is missing
- Who/what is needed
- What happens if it remains pending
- Recommended next step
```

Never hide pending work because:

```text
- it is difficult
- it requires credentials
- it requires a paid provider
- it requires browser testing
- it was not in the latest request
- it is low priority
- it was discovered late
- it might embarrass a previous completion claim
```

---

## 27.8 No “All Done” Claim Rule

If the user asks:

```text
kya sab solve ho gaya?
koi issue nahi?
ab 100% theek hai?
sab secure hai?
kuch baqi to nahi?
```

do not answer with a bare yes/no.

First read:

```text
ENGINEERING_STATUS.md
CURRENT_HANDOFF.md
open ISSUE_REGISTER.md entries
latest VERIFICATION_LOG.md
```

Then answer in this format:

```md
## Current Reality

Production-ready: YES / NO

## Verified Today

- [Area]: exact evidence

## Open Issues

- [Issue ID] [Severity]: title — current status — next action

## Untested / Unverified

- [Area]: why it has not been verified

## Setup Required

- [Provider/domain/key/deployment]: what is still required

## Demo / Mock / Local-only

- [Feature]: exact limitation

## Count

- Critical: X
- High: X
- Medium: X
- Low: X
- Blocked: X
- Unverified: X
- Demo/mock-only: X

## Honest Conclusion

One evidence-based sentence only.
```

Never claim “everything is solved” unless:

```text
- all release gates pass
- no Critical issues remain
- no High issues remain
- all security-critical paths are verified
- all known issues are either verified fixed or explicitly accepted by the user
- all required configuration is live and tested
- the release checklist is recorded
```

---

## 27.9 Documentation Consistency Rule

Before finalizing a task, check that these files do not contradict each other:

```text
ENGINEERING_STATUS.md
ISSUE_REGISTER.md
VERIFICATION_LOG.md
CURRENT_HANDOFF.md
latest daily memory file
```

If there is a contradiction:

1. Do not hide it.
2. State it clearly.
3. Create or update an issue.
4. Correct the newest/current truth document.
5. Add correction notes to historical records instead of rewriting history silently.

---

## 27.10 Handoff Quality Gate

A handoff is incomplete if it does not answer all these questions:

```text
1. What exactly changed?
2. Why did it change?
3. What existed before?
4. What exists now?
5. Which files/tables/routes/policies changed?
6. What security impact exists?
7. What tests actually ran?
8. What did not get tested?
9. What is still pending?
10. Why is it pending?
11. What can break next?
12. What must the next session do first?
13. What must not be changed without approval?
14. What rollback is available?
15. Is the app actually ready for production? Why or why not?
```

If any answer is missing, do not call the handoff complete.