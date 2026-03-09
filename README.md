# Power Desk

Power Desk is a Codex-first, desktop-hosted web workbench for Power Platform delivery tasks.

## Active architecture

- `apps/server`: Codex session broker, Power Desk tool runtime, WebSocket Native API, and static web serving
- `apps/web`: React/Vite workbench with thread list, chat timeline, composer, activity, evidence, and settings
- `apps/desktop`: Electron shell that starts the server, loads the web app, and exposes native-only bridge APIs
- `packages/contracts`: shared contracts, schemas, session types, and event envelopes
- `packages/shared`: shared helpers for process execution, timestamps, user-data paths, ports, and local knowledge

The desktop app is the primary delivery surface in the current cut. Browser parity is structurally possible later, but it is not the target right now.

## Current product loop

1. Open the desktop shell.
2. Confirm workspace and tenant settings.
3. Start a thread.
4. Send a delivery question or implementation request.
5. Review Codex output alongside evidence, constraints, and tool activity captured from the Power Desk tool runtime.

## Local development

```powershell
bun install
bun run dev
```

Useful commands:

- `bun run dev:web`
- `bun run dev:server`
- `bun run typecheck`
- `bun run build`
- `bun run test`
- `bun run --cwd apps/desktop smoke`

`bun run dev` starts the desktop dev supervisor in `apps/desktop/scripts/dev-electron.mjs`. It launches the web dev server, watches the Electron shell output, and relaunches a single Electron instance without the old `nodemon` duplicate-window behavior.

## Runtime notes

- The server starts `codex app-server` per provider-backed session.
- The web client talks to the server over a single WebSocket connection.
- Power Platform adapters for repo, PAC, Dataverse, and docs live server-side.
- The Electron preload bridge is limited to native concerns such as folder picking, update state, and opening external URLs.

## Settings and user data

Power Desk stores local settings and session data in the user data directory:

```text
%AppData%\Power Desk\
```

That directory contains:

- `settings.json`
- `sessions.json`
- `activity.log.jsonl`

## Status

This repo is still an active migration. The new `apps/*` and `packages/*` workspace is the active architecture, while some legacy files can remain in the worktree until final cleanup is safe.
