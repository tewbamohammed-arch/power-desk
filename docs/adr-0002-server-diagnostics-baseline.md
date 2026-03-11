# ADR 0002: Server-Owned Diagnostics Baseline

## Status
Accepted

## Context
Phase 1 requires a logging and diagnostics baseline with explicit ownership boundaries. Power Desk already separates the Electron shell from the Bun server runtime, but diagnostics metadata was still implicit. The web workbench could not reliably surface the current run identity or the server-owned log locations needed for support and restart analysis.

## Decision
- `apps/server` owns runtime diagnostics metadata.
- The server runtime publishes a typed diagnostics summary through shared contracts.
- The diagnostics summary includes:
  - server run identity
  - server start timestamp
  - state directory
  - server log path
  - provider log directory
  - terminal log directory
- `apps/web` may render and request shell-open actions for those paths, but it does not invent or derive them.
- `apps/desktop` remains limited to shell hosting concerns and does not define product diagnostics state.

## Consequences
- Support surfaces can show one authoritative diagnostics view without duplicating path logic.
- Later adapter and orchestration work can attach correlation to a stable server run identity.
- Desktop remains thin: it hosts windows and native actions, while server startup/config/log ownership stays server-side.
