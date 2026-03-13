# ADR 0006: Server-Owned User Settings

## Status
Accepted

## Context

Phase 1 defines two non-secret configuration scopes:

- user-scoped JSON for app-wide settings
- project-owned startup context config for workspace-specific tenant metadata

Power Desk already moved startup context into per-project `.power-desk.config.json` files. App-wide settings were still inconsistent with that baseline because the web client owned them through browser-local persistence.

That created the wrong boundary for a desktop-hosted product:

- Electron and the web shell could disagree about the current settings state.
- Settings could not be inspected or supported from the server state directory.
- Browser storage became the source of truth for a product that is explicitly desktop-first.
- Non-secret settings and project startup context no longer followed the same server-owned configuration model.

## Decision

App-wide non-secret settings move to a server-owned `settings.json` file under the server state directory.

The resulting ownership model is:

- `apps/server` owns validation, persistence, and the path for user-scoped settings.
- `apps/web` reads and updates settings only through the Native API / WebSocket contract.
- `packages/contracts` owns the shared `AppSettings` schema and related request/response contracts.
- project-specific tenant startup context remains in per-project `.power-desk.config.json`.
- secrets remain out of `settings.json` and out of project config files.

## Consequences

Positive:

- App settings now follow the same server-owned configuration boundary as startup context and diagnostics.
- The desktop shell and the workbench use one source of truth for non-secret settings.
- Settings are inspectable from the app state directory and can be opened from the UI for support workflows.
- Browser-local storage is no longer the persistence authority for desktop product behavior.

Tradeoffs:

- The web client must hydrate settings asynchronously from the server.
- Settings updates now depend on the server transport instead of local synchronous writes.
- The client keeps a small optimistic in-memory cache and must handle rollback on failed writes.

## Notes

- `settings.json` is for user-scoped non-secret settings only.
- `.power-desk.config.json` remains the project-scoped startup-context file.
- Secret material still requires secure storage rather than JSON persistence.
