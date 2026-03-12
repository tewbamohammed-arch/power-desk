# ADR 0004: Server-Owned Startup Context

## Status
Accepted

## Date
2026-03-12

## Context
Phase 1 requires an explicit startup flow of workspace selection, tenant selection, tool-health verification, and workbench entry. The initial shell/session work exposed `AppSessionState`, but workspace selection was still effectively inferred from process `cwd`, and tenant context was not persisted as a first-class server concern.

That left two problems unresolved:
- startup state could drift between the active workbench route and the backend session model;
- the server could not reliably resume the last valid workspace and tenant context after restart.

This also weakened the intended boundary from the Phase 1 shell split:
- `apps/desktop` should stay focused on host concerns;
- `apps/server` should own startup, config, logging, and orchestration/session state;
- `packages/contracts` should carry only shared contracts.

## Decision
`apps/server` owns persisted startup context.

The server will:
- persist startup context in `stateDir/startup-state.json`;
- own the currently selected workspace as a project-backed selection, not as an inferred `cwd`;
- own the selected tenant profile and reject tenant updates when no workspace is selected;
- derive `AppSessionState` from persisted startup context plus current provider/tool health;
- clear persisted workspace selection if the selected project no longer exists in the orchestration read model.

The web workbench will:
- select workspace through the Native API based on the active project thread route;
- edit tenant context through explicit server APIs;
- render the server-owned startup stage instead of inventing parallel startup state locally.

The desktop shell will:
- remain uninvolved in workspace or tenant persistence;
- continue to host the window, child process, native menus, dialogs, and shell integration only.

## Consequences

### Positive
- Startup stages now map directly to real backend state: `workspace-selection` -> `tenant-selection` -> `tool-health-check` -> `workbench`.
- Workspace and tenant context survive backend restart without desktop-owned business state.
- Invalid persisted workspace selections are corrected server-side when the project disappears.
- The transport boundary stays clean: workspace and tenant mutations flow through `packages/contracts` and the Native API.

### Negative
- The web shell must keep the server informed about the active project route.
- Startup context persistence adds one more state file under the server state directory.

### Follow-On
- Secure storage for Microsoft and browser-session secrets remains a separate Phase 1 concern and should not be folded into `startup-state.json`.
- Phase 2 adapters can now build against a stable server-owned startup/session contract instead of inventing their own workspace or tenant selection state.
