# ADR 0003: T3 Code Augmentation Baseline

Date: 2026-03-12

## Status

Accepted

## Context

The original Power Desk plan pack was written as if implementation would start from an empty repository with a new `.NET/WinUI` desktop shell and fresh project scaffolding. That is no longer the real delivery baseline.

Power Desk is being built by augmenting the existing T3 Code Bun workspace. The active product runtime already exists as a workspace with:

- `apps/desktop` for the Electron shell and native integration
- `apps/server` for startup, configuration, orchestration, logging, persistence, and transport handling
- `apps/web` for the React workbench UI
- `packages/contracts` for shared contracts
- `packages/shared` for reusable runtime helpers

Continuing to plan as if the product were a greenfield `.NET/WinUI` build creates the wrong package boundaries, startup ownership, packaging assumptions, and execution sequence.

## Decision

Power Desk will use the existing T3 Code Bun workspace as its implementation baseline.

This means:

- MVP implementation is an augmentation of the current Electron, Bun, and React architecture.
- `apps/desktop` remains a thin desktop shell for native-only concerns.
- `apps/server` remains the product runtime and owns startup, config, logging, orchestration, persistence, and session state.
- `apps/web` remains the workbench UI rendered against the server transport boundary.
- `packages/contracts` remains schema and contract only.
- `packages/shared` remains reusable helper code only.

The roadmap and phase plans must not assume:

- a new `.NET` solution
- `WinUI 3` host selection work
- `WebView2` as a primary shell decision
- fresh `src/PowerDesk.*` scaffolding

If a future change requires replatforming away from the current workspace architecture, that must be recorded in a later ADR before the plan baseline changes again.

## Consequences

- Phase 1 work focuses on tightening desktop, server, and contract boundaries inside the existing workspace instead of inventing a new host stack.
- Packaging, diagnostics, and startup plans inherit Electron-hosted desktop assumptions unless a later ADR replaces them.
- Later phases should extend the current `apps/*` and `packages/*` boundaries rather than introducing parallel greenfield structures.
- Legacy plan language about empty roots, solution skeletons, `.NET`, `WinUI 3`, and `WebView2` must be removed from `plan/*.md`.
