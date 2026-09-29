# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

PulseBoard — a full-stack project management platform (Jira/Trello-style) built to
practice production-level patterns: scalable frontend architecture, backend API
design, auth/authorization, realtime collaboration, caching, and performance.

- Frontend: Next.js (App Router) + TypeScript + React, Tailwind CSS
- Backend: planned Node.js/Express REST API (not yet present in `src/`)
- Database: PostgreSQL via Supabase
- Realtime: Supabase Realtime
- Cache: Redis (planned)

Current structure is early-stage: `src/app` only (Next.js app directory). See
`README.md` for the full intended architecture, data model, and roadmap.

An MCP server named `supabase` is configured in `.mcp.json` (read-only) for project
`qqtnarnmvkytwotyrjej`, covering docs/account/database/debugging/development/
functions/branching.

## Hard restrictions

- **Never read, open, print, or otherwise access `.env`, `.env.local`, or any other
  env file in this repo.** Do not use their contents even if they appear in tool
  output incidentally. Treat these files as off-limits, not just "don't quote them."
- **Ask before implementing anything.** Do not write or edit code, run installs,
  run migrations, or make other changes on your own initiative. Propose the
  approach first and wait for explicit go-ahead before touching files — this
  applies even to small or "obvious" changes, not just large ones.
