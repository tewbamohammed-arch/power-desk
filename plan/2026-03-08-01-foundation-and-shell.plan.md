# 2026-03-08 Foundation and Shell Plan

## Intent
Establish the host application shape for Power Desk so every later phase can build on a stable Windows desktop shell, clear process boundaries, and explicit configuration and auth domains.

## Status
Completed on 2026-03-14.

Phase 1 is complete for roadmap sequencing and handoff into Phase 2.
The completion tag is `power-desk-phase-1-complete` at `1a52aa0f`.

## Why This Phase Exists
If the shell, startup flow, auth boundaries, and process model remain ambiguous, every later decision about tools, agents, approvals, and diagnostics will drift. This phase fixes the base architecture before runtime and UX complexity arrive.

## Scope
- Workspace and package structure for the existing Bun monorepo.
- Desktop shell ownership for the existing Electron host.
- UI host guidance for the existing React workbench served by `apps/server`, not a new embedded-web shell decision.
- Configuration approach with user-scoped JSON for app-wide non-secret settings plus project-owned startup context config for workspace-specific tenant metadata.
- Secret storage approach with Windows Credential Manager or equivalent secure secret storage.
- Local process model covering the desktop host process, local adapter host processes, and model-provider abstraction separated from tool runtime.
- Logging and diagnostics baseline for actions, approvals, failures, and health checks.
- Startup flow definition: select workspace -> load project startup context -> confirm tenant -> verify tool health -> open workbench.
- Public interfaces and types to define in this phase:
  - `WorkspaceProfile`
  - `TenantProfile`
  - `ToolExecutionRequest`
  - `ToolExecutionResult`
  - `AuthContext`
  - `ModelProviderConfig`
  - `AppSessionState`
- Acceptance scenarios covered directly in this phase: Scenario 1, Scenario 6 baseline classification handoff, and Scenario 8 diagnostics baseline handoff.
- Cross-plan rules applied in this phase:
  - Power Platform core comes first.
  - CLI, API, and MCP tools remain primary and browser automation stays out of the shell core.
  - Auth is split by domain.
  - Mutating actions will require approvals in later phases, so the shell must reserve the workflow surface now.

## Out of Scope
- Full agent loop behavior, prompt assembly, or approval UX details.
- Adapter-specific execution contracts beyond the host requirements needed to support them.
- Browser automation strategy beyond reserving a clean auth and process boundary for a future lane.
- Production installer details, config migration, and support operations.

## Dependencies
- Depends on the master roadmap for product posture, milestone order, and cross-plan architectural rules.
- Assumes the existing T3 Code workspace is the baseline and this plan must be sufficient for a new implementer to extend it without reopening package or host ownership.
- Must preserve room for the Phase 2 adapter runtime and the Phase 3 workbench UX without forcing a re-architecture.

## Workstreams
- Shell architecture and host choice:
  - Lock the existing Electron desktop host as the shell baseline for the Windows-first internal MVP and record that product logic stays out of Electron main.
  - Keep the React workbench served by `apps/server` as the primary application frame, with embedded browser content reserved only for targeted future surfaces if required.
  - Define the shell responsibilities: workspace selection, tenant selection, health checks, workbench hosting, logs access, and approvals surface.
- Solution layout and code organization:
  - Define the baseline workspace layout:
    - `apps/desktop`
    - `apps/server`
    - `apps/web`
    - `packages/contracts`
    - `packages/shared`
    - `docs`
  - Assign ownership of native shell concerns to `apps/desktop`, orchestration plus runtime ownership to `apps/server`, UI hosting to `apps/web`, shared schemas to `packages/contracts`, and reusable helpers to `packages/shared`.
  - State the minimum ownership, dependency, and test-boundary rules needed so implementation can continue without inventing parallel package structures.
- Configuration, secrets, and auth boundaries:
  - Define user-scoped JSON config for non-secret settings such as workspace defaults, environment preferences, and feature flags, while keeping workspace-specific startup context in a project-owned config file.
  - Define secure secret storage for Microsoft auth refresh artifacts, model-provider credentials, and any browser-session bootstrap material that must not appear in plain text.
  - Split auth domains into OpenAI auth, Microsoft auth, and browser-session auth with distinct lifecycle rules, renewal paths, and log redaction requirements.
- Process model and adapter hosting:
  - Define the desktop host process as the coordinator for native shell lifecycle, windowing, dialogs, menus, and backend child supervision only.
  - Define local adapter host processes as the boundary for PAC, Dataverse, Graph, repo, docs, and future browser automation capabilities.
  - Separate model-provider abstraction from tool runtime so model changes or provider outages do not alter adapter contracts.
  - Define `apps/server` as the owner of startup, session state, approvals, persistence, diagnostics metadata, and tool health verification so the workbench only opens after readiness checks produce a clear pass or actionable failure.
- Shared types and startup flow:
  - Define the purpose and minimum fields for `WorkspaceProfile`, `TenantProfile`, `ToolExecutionRequest`, `ToolExecutionResult`, `AuthContext`, `ModelProviderConfig`, and `AppSessionState`.
  - Map the startup flow from workspace selection through project startup-context loading, tenant confirmation, and tool health checks into explicit state transitions that later UX can present clearly.
  - Reserve structured state for current repo, selected tenant, selected environment, adapter health, active approvals, and evidence summary links.
- Logging and diagnostics baseline:
  - Define a structured logging schema for user actions, tool calls, approvals, failures, startup checks, and session boundaries.
  - Require correlation identifiers so future agent outputs, tool transcripts, and diagnostics bundles can be joined into one supportable story.
  - Define redaction expectations now so secrets, tokens, and browser-session artifacts stay out of standard logs from day one.

## Deliverables
- An architecture decision record covering the augmentation baseline, shell choice, process model, configuration approach, and auth separation.
- An initial workspace ownership plan that maps packages, boundaries, and baseline test locations.
- A startup flow plan that covers workspace selection, tenant selection, tool health verification, and workbench entry.
- A shared type definition brief for `WorkspaceProfile`, `TenantProfile`, `ToolExecutionRequest`, `ToolExecutionResult`, `AuthContext`, `ModelProviderConfig`, and `AppSessionState`.
- A logging schema for actions, approvals, failures, and correlated session diagnostics.

## Measurable Exit Criteria
- The app architecture can support multiple adapters without reworking the shell.
- Auth domains are separated into OpenAI auth, Microsoft auth, and browser-session auth.
- A new implementer can continue augmenting the existing workspace without making new host-stack or package-ownership decisions.
- The startup flow explicitly supports Scenario 1 and leaves clear state hooks for Scenario 6 and Scenario 8.
- Shared host types are defined well enough that Phase 2 can add adapters without inventing new shell-level session concepts.

## Risks and Mitigations
- A shell that overuses web content could become a browser app in disguise.
  - Mitigation: keep Electron thin, keep business logic in `apps/server`, and constrain any future embedded-browser use to targeted surfaces only.
- Config and secret boundaries could blur if convenience wins over clarity.
  - Mitigation: separate JSON settings from secret storage and define redaction rules before implementation.
- Process boundaries could become too heavy for a solo-builder MVP.
  - Mitigation: document a contract that allows isolated services or isolated in-process modules later, while preserving the same logical boundary now.
- Startup flow could become a wall of setup before value appears.
  - Mitigation: keep readiness checks focused on workspace, tenant, and tool health only, and defer deeper inspection to the workbench.
- Replatform drift could re-open shell-stack debates and stall delivery.
  - Mitigation: treat the T3 Code augmentation baseline as fixed unless a later ADR explicitly replaces it.

## Open Questions Deferred
- Whether adapter hosts should start as separate executables or as isolated modules behind the same boundary contract.
- Which workbench-navigation split best fits the current Electron-hosted shell and React workbench surfaces.
- Whether secure storage needs a fallback beyond Windows Credential Manager for unusual enterprise desktops.
- How much session state should persist across launches versus resetting per run.

## Next Phase Handoff
Tool Runtime and Adapters should inherit the fixed host boundaries, shared session types, startup flow, and logging schema from this phase. The handoff is complete when adapter authors can build against a stable shell contract instead of inventing their own runtime, auth, or diagnostics assumptions. Do not start Phase 2 until every measurable exit criterion above is satisfied.

## Implementation References
- Decision baseline: `docs/adr-0003-t3code-augmentation-baseline.md` - records the Phase 1 architecture baseline as T3 Code augmentation on Electron, Bun, and React rather than a scratch-build host-selection exercise.
- `9f967e8` `feat(foundation): Tighten desktop/server startup boundary` - implemented the initial desktop/server split, added shared foundation contracts, and documented the boundary in `docs/adr-0001-desktop-server-boundary.md`.
- `cfb0f51` `feat(foundation): expose session state over native api` - introduced `AppSessionState` creation and `server.getSessionState` so startup/session ownership lives in `apps/server`.
- `dd6b42e` `feat(foundation): push shell session state updates` - added pushed session-state updates plus shell-visible startup/status UI without moving business logic into Electron.
- `537a904` `feat(foundation): expose server diagnostics baseline` - added runtime diagnostics metadata, server-owned log paths, and a documented diagnostics baseline in `docs/adr-0002-server-diagnostics-baseline.md`.
- `8c0a794` `fix(web): handle unavailable diagnostics state` - hardened the diagnostics surface so missing runtime metadata is shown as unavailable/restart-needed instead of a false loading state.
- `9c29fb4` `feat(foundation): persist startup workspace and tenant context` - made `apps/server` own persisted startup context, added workspace/tenant selection APIs, moved startup stage derivation to server-backed workspace and tenant state, and documented the decision in `docs/adr-0004-server-owned-startup-context.md`.
- `b8ba637c` `feat(foundation): store startup context in project config` - moved tenant startup context into per-project `.power-desk.config.json`, added project-scoped startup-context APIs and Settings/context-menu editing flows, reconciled the rebased T3 Code transport/runtime surfaces, and documented the decision in `docs/adr-0005-project-startup-context-config.md`.
- `82678974` `fix(web): open startup config in available editor` - hardened the startup-context support flow so project config files open through an installed editor instead of failing on stale editor preferences.
- `30f51ffe` `feat(foundation): move app settings into server state` - completed the Phase 1 non-secret settings boundary by moving app-wide settings out of browser storage and into server-owned `settings.json`, exposing typed Native API access, and documenting the decision in `docs/adr-0006-server-owned-user-settings.md`.
- `1a52aa0f` `fix(dev): restore desktop startup on main` - restored the main-branch development startup path at the Phase 1 completion tip and is the commit tagged as `power-desk-phase-1-complete`.
