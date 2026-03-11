# 2026-03-08 Browser Automation Lane Plan

## Intent
Add browser automation as a secondary capability for maker-portal and service workflows that still lack reliable API, CLI, or adapter coverage.

## Why This Phase Exists
Some Power Platform and adjacent Microsoft surfaces remain UI-first. This phase adds a controlled fallback lane without allowing brittle automation to dictate the core architecture, tool model, or UX.

## Scope
- Playwright and Edge strategy, browser session handling, safety boundaries, screenshot and transcript model, and workflow selection rules for when browser automation is allowed.
- Rules to lock:
  - Browser automation is optional and not required for core value.
  - Default browser target is Microsoft Edge on Windows.
  - Use a dedicated automation session and profile.
  - Do not assume personal signed-in browser sessions are safe to reuse.
  - Browser automation is invoked only when no reliable API, CLI, or adapter path exists.
- Public interfaces and types to define in this phase:
  - `BrowserSessionProfile`
  - `UiTaskPlan`
  - `UiActionTranscript`
  - `ScreenArtifact`
  - `AutomationGuardrail`
  - `UiFallbackReason`
- Target workflows shortlist:
  - maker portal navigation
  - flow inspection
  - app setting verification
  - Power BI service inspections
- Acceptance scenarios covered directly in this phase: Scenario 7, with supporting evidence and audit behavior aligned to Scenario 8.
- Cross-plan rules applied in this phase:
  - Browser automation stays fallback-only.
  - Every mutating browser action requires approval.
  - Every browser-based claim still needs evidence.
  - Preview or brittle UI paths must be isolated behind flags or explicit guardrails.

## Out of Scope
- Replacing PAC, Dataverse, Graph, repo, or docs adapters with browser scripts.
- Reusing personal browser sessions or bypassing the app's auth and approval model.
- Desktop automation beyond browser control.
- Turning browser automation into the main UX path for common tasks.

## Dependencies
- Depends on the master roadmap for fallback-only positioning and milestone order.
- Depends on Foundation and Shell for process separation, auth-domain boundaries, and log redaction expectations.
- Depends on Tool Runtime and Adapters for policy declarations, evidence references, and approval integration.
- Depends on Agent Orchestration and UX for task-state UX, approval checkpoints, and escalation flows.

## Workstreams
- Automation architecture and session model:
  - Define `BrowserSessionProfile` for dedicated automation profiles, session lifecycle, storage location, and isolation from personal browsing data.
  - Define where Playwright execution lives relative to the host and adapter runtime so browser automation uses the same approval and transcript systems.
  - Define Edge-specific launch assumptions for Windows desktop operation and internal supportability.
- Fallback decision model:
  - Define `UiFallbackReason` categories that explain why API, CLI, MCP, or adapter routes were insufficient.
  - Define a decision tree that checks existing adapter capability before any browser task can be proposed.
  - Define clear forbidden cases where browser automation must not run because an API route exists, the task is too risky, or the session context is unclear.
- Safety, approvals, and guardrails:
  - Define `AutomationGuardrail` rules for navigation limits, tenant validation, environment confirmation, mutating-action approvals, and session teardown.
  - Require explicit approval before any browser automation run and a second confirmation for mutating UI actions when needed.
  - Define when screenshots, DOM captures, or transcript steps are required for auditability and later support.
- UI task planning and audit artifacts:
  - Define `UiTaskPlan` so the agent proposes browser steps, expected outcomes, target surfaces, and rollback expectations before execution.
  - Define `UiActionTranscript` so each browser step records target page, action, result, and any validation notes.
  - Define `ScreenArtifact` capture points for before, during, and after steps where visual proof matters.
- Workflow shortlist and acceptance fit:
  - Specify maker portal navigation as a read-first workflow for context gathering and inspection.
  - Specify flow inspection and app setting verification as controlled inspection workflows with guarded mutation paths.
  - Specify Power BI service inspections as a later workflow when API coverage is incomplete for the needed view.
  - Map Scenario 7 to the full fallback explanation, approval flow, and audit trail.
  - Map Scenario 8 to safe transcript and screenshot capture that supports diagnostics without exposing secrets.

## Deliverables
- A browser automation architecture that fits the existing shell, tool runtime, and approval model.
- A UI-fallback decision tree that explains when browser automation is preferred, tolerated, or forbidden.
- Safety and approval rules for automation sessions, navigation scope, and mutating actions.
- A shortlist of browser-automation workflows with clear reasons they remain UI-first.
- An audit model covering screenshots, transcripts, and fallback explanations.

## Measurable Exit Criteria
- An implementer knows exactly when browser automation is preferred, tolerated, or forbidden.
- Browser actions are auditable through screenshots and transcripts.
- The system can explain why it used UI automation instead of APIs.
- Browser automation remains outside the critical path for core MVP tasks and plugs into the same approval model as other mutating actions.
- Scenario 7 can be demonstrated without weakening the primary CLI, API, and adapter-first architecture.

## Risks and Mitigations
- Browser automation could leak into routine workflows and weaken the product boundary.
  - Mitigation: require fallback reasons and forbid browser runs when supported API or CLI paths exist.
- Session reuse could create unsafe cross-tenant or personal-account behavior.
  - Mitigation: use dedicated automation profiles and explicit tenant validation before execution.
- UI surfaces could change and break automation quickly.
  - Mitigation: limit the workflow shortlist, keep transcripts and screenshots for debugging, and feature-flag brittle paths.
- Audit artifacts could capture sensitive information.
  - Mitigation: define redaction and storage rules consistent with the diagnostics strategy before implementation.

## Open Questions Deferred
- Whether Playwright should be hosted through a .NET wrapper, a sidecar process, or an adapter-owned runtime.
- Which maker-portal workflows are stable enough to justify automation in the first MVP.
- Whether screenshot redaction should happen at capture time or during diagnostics export.
- How much DOM capture is useful before transcripts become too heavy for support workflows.

## Next Phase Handoff
Hardening, Packaging, and Operations should treat browser automation as a preview-capable but supportable lane with explicit flags, diagnostics coverage, and safe defaults. The handoff is complete when automation can be enabled, audited, and disabled without destabilizing the core workbench. Do not start Phase 5 until every measurable exit criterion above is satisfied.

## Implementation References
- No linked implementation commits yet.
