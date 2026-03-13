# ADR-0005: Project-Owned Startup Context Config

## Status
Accepted

## Context
Phase 1 originally moved workspace and tenant startup state into `apps/server` persistence so Electron stayed thin and startup stages were server-owned. That solved the host-boundary problem, but tenant context still lived in server-global state under the app state directory.

That shape is wrong for the current product direction:
- tenant context is part of a project’s startup context, not a machine-global preference
- switching projects should switch tenant context with the project
- a project should carry its own startup metadata so creation, editing, and support inspection happen near the workspace root

## Decision
Persist project startup context in a project-owned dotfile:
- file name: `.power-desk.config.json`
- location: project workspace root
- current scope:
  - schema version
  - startup context
  - tenant profile
  - update timestamp

The server remains the owner of startup-stage resolution and session state, but it now reads tenant context from the selected project’s config file instead of treating tenant selection as server-global runtime state.

## Consequences
Positive:
- startup context follows the active project automatically
- tenant metadata becomes inspectable and editable from the project boundary
- project creation can seed the config immediately
- future project-level startup settings have a clear home

Tradeoffs:
- the server now has to reconcile legacy startup-state tenant data into project-owned config on first use
- project context editing must validate the selected project before writing config
- startup context is no longer fully contained in the app state directory

## Implementation Notes
- `apps/server` owns reading, writing, seeding, and migrating `.power-desk.config.json`
- `apps/web` edits project startup context through the Native API, not direct filesystem access
- `apps/desktop` remains unchanged beyond shell-only responsibilities

## Related
- `docs/adr-0001-desktop-server-boundary.md`
- `docs/adr-0004-server-owned-startup-context.md`
