# AGENTS.md

## Task Completion Requirements

- `bun run typecheck` must pass before considering a task complete.
- `bun run build` must pass before considering a task complete.
- `bun run test` must pass before considering a task complete.
- `bun run lint` exists at the repo root.

### Exception to [Task Completion Requirements](#task-completion-requirements)

> - Documentation changes involving only markdown files.


## Project Snapshot

Power Desk is a Codex-first, desktop-hosted workbench for Power Platform delivery tasks.

The active runtime is a Bun workspace monorepo with:

- `apps/server`: product runtime, Codex app-server broker, provider orchestration, WebSocket Native API, and static web serving
- `apps/web`: React/Vite workbench UI for threads, chat, plans, activity, diffs, and settings
- `apps/desktop`: thin Electron shell that starts the backend and exposes native-only bridge APIs
- `apps/marketing`: Astro marketing site, separate from the desktop product runtime
- `packages/contracts`: shared schemas, WebSocket envelopes, Native API contracts, orchestration events, and desktop bridge types
- `packages/shared`: shared runtime helpers exposed through explicit subpaths

The `apps/*` and `packages/*` workspace is the active architecture. There is no primary `app/*` runtime path in the current tree.

## Planning Baseline

The current product-planning baseline lives under `plan/`:

- `plan/2026-03-08-00-power-desk-master-roadmap.plan.md`
- `plan/2026-03-08-01-foundation-and-shell.plan.md`
- `plan/2026-03-08-02-tool-runtime-and-adapters.plan.md`
- `plan/2026-03-08-03-agent-orchestration-and-ux.plan.md`
- `plan/2026-03-08-04-browser-automation-lane.plan.md`
- `plan/2026-03-08-05-hardening-packaging-and-operations.plan.md`

Use those plans as the current MVP scope and sequencing baseline when making architectural tradeoffs.

<power-desk-exclusive>
When a commit implements work from any `plan/*.md` file, update the end of the relevant `plan/*.md` file or files in an immediate follow-up.

- Add or refresh an `Implementation References` section at the end of each relevant plan file.
- Reference the concrete commit hash and a short implementation note, not just a vague status update.
- If a plan file has no linked implementation yet, keep an explicit `No linked implementation commits yet.` note in that section.
- Maintain this only for files under `plan/*.md`. Do not treat `.plans` paths as the source of truth for this bookkeeping.
</power-desk-exclusive>

## Core Priorities

1. Correctness before convenience.
2. Predictable session, orchestration, and transport behavior under reconnects, restarts, and partial failures.
3. Keep the desktop shell thin. Product logic belongs in `apps/server`, not Electron main.
4. Keep the web UI transport-bound to the Native API and pushed domain events, not preload IPC for business logic.
5. Treat browser automation as a fallback lane, not the default path for workflows that already have CLI, API, or docs-backed tooling.

## Maintainability

- Prefer extracting shared logic into `packages/contracts` or `packages/shared` instead of duplicating code across apps.
- Keep `packages/contracts` schema/data only. Do not put filesystem, process, or adapter logic there.
- Keep `packages/shared` utility-oriented. Do not add a catch-all barrel export.
- Extend existing server services and Effect layers instead of bypassing them with ad hoc globals or cross-module state.
- If a feature only exists because of the desktop host, keep it behind the preload bridge and keep that bridge narrow.

## Package Roles

- `apps/server`: owns session state, provider runtime integration, orchestration, persistence, and WebSocket request handling.
- `apps/web`: renders the workbench UI against the WebSocket Native API and pushed orchestration/provider events.
- `apps/desktop`: owns the Electron window, single-instance lock, backend child lifecycle, dialogs, menus, updates, and shell integration.
- `apps/marketing`: owns the public-facing marketing site only.
- `packages/contracts`: owns shared type-safe contracts between server, web, and desktop.
- `packages/shared`: owns reusable runtime helpers such as process execution, timestamps, ports, user-data paths, and model helpers.

## Server Architecture

Power Desk starts `codex app-server` from `apps/server` for provider-backed sessions.

Relevant current server entry points:

- `apps/server/src/codexAppServerManager.ts`: Codex app-server process lifecycle, JSON-RPC wiring, approvals, and user-input handling
- `apps/server/src/provider/Layers/ProviderService.ts`: cross-provider session routing, validation, recovery, and event fan-out
- `apps/server/src/provider/Layers/ProviderAdapterRegistry.ts`: provider-to-adapter lookup
- `apps/server/src/serverLayers.ts`: composition root for provider, orchestration, git, terminal, and telemetry layers
- `apps/server/src/wsServer.ts`: HTTP/WebSocket server, Native API routing, and static asset serving
- `apps/server/src/orchestration/*`: orchestration engine, reactors, projections, and checkpoint flow

The web client consumes the server through `apps/web/src/nativeApi.ts` and `apps/web/src/wsNativeApi.ts`. Preserve that transport boundary.

## Power Desk-Specific Notes

- Power Platform adapters and tool integrations live server-side and should feed evidence-backed results into the workbench.
- Desktop is the primary delivery surface in the current cut even though the web app is structurally separate.
- The desktop preload bridge is for native concerns only: app info, folder picking, shell-open, update state, and menu actions.
- Browser parity is structurally possible later, but it is not the current product target.

## Skills

This repo adds one project-specific frontend expectation.

- `uncodixfy`: use it whenever generating or revising frontend UI code so the workbench stays restrained, product-like, and avoids generic AI dashboard patterns.
