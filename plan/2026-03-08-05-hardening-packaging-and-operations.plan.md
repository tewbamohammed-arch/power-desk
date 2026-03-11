# 2026-03-08 Hardening, Packaging, and Operations Plan

## Intent
Turn the internal MVP into a supportable Windows workstation app that can be installed, configured, diagnosed, updated, and safely operated without tribal knowledge.

## Why This Phase Exists
An MVP that only works on the builder's machine is still a prototype. This phase converts the proven shell, tools, agent loop, and optional browser lane into an internal product that can survive failure, change, and daily use.

## Scope
- Installer and packaging strategy, config migration, diagnostics export, telemetry and privacy defaults, update strategy, support playbooks, and internal security review readiness.
- Operational decisions to lock:
  - Package as a Windows desktop internal app.
  - Local logs must be exportable and redactable.
  - Secrets never appear in standard logs.
  - Preview adapters and preview MCP integrations are feature-flagged.
  - Unsupported tenant states should degrade gracefully with evidence, not silent failure.
- Public interfaces and types to define in this phase:
  - `FeatureFlagSet`
  - `DiagnosticBundle`
  - `RedactionPolicy`
  - `SupportSnapshot`
  - `AdapterHealthReport`
- Acceptance scenarios covered directly in this phase: Scenario 6 operational recovery, Scenario 8 diagnostics export, and go-live readiness for Scenarios 1 through 7.
- Cross-plan rules applied in this phase:
  - Preview and brittle surfaces stay behind feature flags.
  - Evidence remains required for degraded states and blocked operations.
  - The app remains an internal delivery workbench, not a sprawling admin platform.

## Out of Scope
- Large-scale enterprise fleet management, centralized cloud control planes, or multi-user administration consoles.
- Full compliance certification work beyond MVP-ready internal review artifacts.
- New core workflow invention that should have been proven in earlier phases.
- Cross-platform installer strategy or non-Windows packaging.

## Dependencies
- Depends on the master roadmap for MVP boundaries, risk priorities, and milestone definition.
- Depends on Foundation and Shell for config, secrets, logging, and session-state assumptions.
- Depends on Tool Runtime and Adapters for health reporting, evidence capture, error taxonomy, and preview surface handling.
- Depends on Agent Orchestration and UX for approval traces, task outcomes, and artifact storage assumptions.
- Depends on Browser Automation Lane for flagging, transcript handling, and screenshot redaction requirements if the lane is enabled.

## Workstreams
- Packaging and distribution:
  - Define the internal Windows packaging strategy, install prerequisites, and upgrade path for a `.NET/WinUI` desktop app.
  - Define first-run setup expectations for config location, secure storage initialization, and adapter health verification.
  - Define how updates are delivered without requiring undocumented manual steps from the builder.
- Configuration migration and feature flags:
  - Define `FeatureFlagSet` so preview adapters, preview MCP integrations, and browser automation can be enabled or disabled safely.
  - Define config schema versioning and migration rules so user-scoped JSON settings survive upgrades cleanly.
  - Define safe defaults so the app starts in a minimal, supportable mode even when optional lanes exist.
- Diagnostics, redaction, and support snapshot:
  - Define `DiagnosticBundle` to include logs, transcripts, health reports, feature flags, config metadata, and recent task context without exposing secrets.
  - Define `RedactionPolicy` for tokens, secrets, browser-session artifacts, and personally sensitive content before export.
  - Define `SupportSnapshot` and `AdapterHealthReport` so failures can be reproduced or triaged without relying on memory.
- Telemetry, privacy, and graceful degradation:
  - Define local telemetry defaults that help support failed runs while respecting internal privacy expectations.
  - Define how unsupported tenant states, missing permissions, and preview-surface failures are surfaced with evidence instead of silent failure.
  - Define when the app should disable or hide unstable features automatically after health checks fail.
- Support playbooks and operational readiness:
  - Define a support checklist for installation, auth troubleshooting, adapter health verification, log export, and feature-flag review.
  - Define the MVP go and no-go checklist for daily internal use across the primary acceptance scenarios.
  - Define internal security review inputs for secret handling, local storage, browser automation isolation, and diagnostics redaction.
- Acceptance scenario alignment:
  - Map Scenario 6 to supportable recovery guidance for auth, policy, or transport failures.
  - Map Scenario 8 to diagnostics bundle generation with redaction guarantees.
  - Confirm that Scenarios 1 through 7 still work after packaging, configuration, and feature-flag controls are applied.

## Deliverables
- A packaging and distribution plan for the Windows desktop internal app.
- A diagnostics bundle spec that covers logs, transcripts, health reports, redaction, and export behavior.
- A feature-flag matrix for preview adapters, preview MCP integrations, and browser automation.
- A support checklist for install, configure, diagnose, and recover workflows.
- An MVP go and no-go checklist for internal daily use.

## Measurable Exit Criteria
- The app can be installed, configured, diagnosed, and updated without tribal knowledge.
- Preview integrations are isolated behind flags.
- Support artifacts are sufficient to debug failed tool runs and auth issues.
- Scenario 8 can be completed without exposing secrets, and Scenario 6 failures can be triaged with the exported artifacts.
- The packaged MVP degrades gracefully when adapters, tenants, or preview lanes are unavailable.

## Risks and Mitigations
- Packaging could lag behind implementation and introduce last-minute platform surprises.
  - Mitigation: define prerequisites, first-run behavior, and upgrade rules before final code hardening starts.
- Diagnostics could become either too sparse to debug or too noisy to share safely.
  - Mitigation: define the export schema and redaction policy together, with support snapshots anchored on concrete failure cases.
- Feature flags could hide real instability without operational clarity.
  - Mitigation: pair every preview flag with health reporting, support guidance, and default-off behavior unless proven stable.
- Graceful degradation could turn into silent failure if unsupported states are not surfaced clearly.
  - Mitigation: require evidence-backed degraded-state messaging and adapter health reporting for every blocked feature.

## Open Questions Deferred
- Which installer technology is the best fit for internal distribution and upgrades.
- Whether diagnostics export should support one-click share targets or only local bundle generation in the MVP.
- How much local telemetry should remain enabled by default after internal privacy review.
- Whether browser automation should ship enabled-by-flag in the first packaged MVP or wait for a later internal release.

## Next Phase Handoff
This phase closes the roadmap pack and hands off to implementation and internal daily-use validation. The handoff is complete when the product can be installed on a fresh Windows workstation, configured with documented steps, exercised through the core scenarios, and debugged through exported support artifacts rather than builder memory. This roadmap pack is only complete when every measurable exit criterion above is satisfied.

## Implementation References
- No linked implementation commits yet.
