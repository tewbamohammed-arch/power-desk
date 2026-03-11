# ADR 0001: Desktop and Server Boundary

## Status
Accepted on March 11, 2026.

## Context
Phase 1 requires a stable shell boundary before adapter or UX work continues. The desktop host had been choosing the server port, auth token, shared state directory, and backend log sink, which blurred ownership between `apps/desktop` and `apps/server`.

## Decision
- `apps/desktop` owns Electron shell concerns only: window lifecycle, menus, dialogs, theme, updates, native bridge exposure, and child-process supervision.
- `apps/server` owns runtime startup/config resolution, state-directory selection, server logging, auth token generation, and session/orchestration state.
- Shared startup/session boundary types live in `packages/contracts`, including the desktop server bootstrap contract and Phase 1 session primitives.
- Desktop/server bootstrap uses a typed stdout contract emitted by the server after it is ready. Electron consumes that contract and passes only the resolved WebSocket URL into the renderer.
- On child restart, Electron reuses the server-issued connection contract instead of inventing new runtime settings.

## Consequences
- Desktop no longer precomputes server runtime config or persists a separate backend child log.
- Server startup is now the single place where the desktop connection, auth token, and state directory are decided.
- Later Phase 1 work can add workspace/tenant startup flow and health checks on top of a clearer boundary without moving responsibilities back into Electron.
