# 2026-03-08 Agent Orchestration and UX Plan

## Intent
Define the agent loop and workbench experience that turn Power Desk into a delivery assistant for real Power Platform work instead of a generic chat surface.

## Why This Phase Exists
Even with a good shell and strong adapters, the app will feel fragmented unless planning, approvals, evidence, and outputs are orchestrated around delivery tasks. This phase gives the product its actual operating model.

## Scope
- Workbench UX, plan/execute/review loop, approval workflow, evidence-backed reasoning presentation, and artifact generation.
- Core workflows to support:
  - feasibility assessment
  - implementation planning
  - solution and environment inspection
  - task execution with approval gates
  - stakeholder explanation generation
- Important UI surfaces:
  - conversation or workbench pane
  - context pane for workspace, tenant, and selected environment
  - tool activity pane
  - evidence pane
  - output pane for plans, summaries, constraints, and next steps
- Agent decisions to lock:
  - Separate model lanes:
    - `Codex lane` for repo, planning, shell, and tool-driven engineering workflows
    - `Operator lane` reserved for future API-backed UI automation
  - All risky actions pass through approval checkpoints.
  - Agent responses should cite evidence from tools whenever feasibility or limitation claims are made.
  - The UX should prefer task states over free-form transcript sprawl.
- Public interfaces and types to define in this phase:
  - `TaskIntent`
  - `ExecutionPlan`
  - `ApprovalCheckpoint`
  - `FeasibilityAssessment`
  - `StakeholderSummary`
  - `ConstraintSeverity`
  - `UserActionEnvelope`
- Acceptance scenarios covered directly in this phase: Scenario 2, Scenario 3, Scenario 4, Scenario 5, and Scenario 6 presentation behavior.
- Cross-plan rules applied in this phase:
  - The app remains a delivery workbench, not a chatbot.
  - Claims about feasibility or blockers must cite evidence.
  - Mutating actions require approvals.
  - Browser automation must remain outside the core lane.

## Out of Scope
- Browser-driving implementation details and Playwright-specific design.
- Installer packaging, diagnostics export format, and daily support operations.
- Full prompt-engineering experimentation beyond the context assembly needed for the MVP workflows.
- Multi-user chat, shared sessions, or cloud-hosted orchestration.

## Dependencies
- Depends on the master roadmap for product goals, lane separation, and acceptance scenarios.
- Depends on Foundation and Shell for session state, startup flow, context surfaces, and host logging.
- Depends on Tool Runtime and Adapters for descriptors, policies, error taxonomy, evidence references, and result packaging.
- Must leave room for Phase 4 browser automation as a secondary lane rather than a core UX dependency.

## Workstreams
- Task model and stateful workbench:
  - Define `TaskIntent` as the normalized entry point for feasibility checks, planning requests, inspections, and execution tasks.
  - Define `ExecutionPlan` as a sequenced set of proposed tool actions, dependencies, approvals, and expected outputs.
  - Define state transitions for drafted, awaiting approval, running, blocked, completed, and needs-review so the UI communicates progress without transcript overload.
- Plan, execute, and review loop:
  - Define how the agent moves from user request to plan proposal, tool invocation, result synthesis, and artifact generation.
  - Require the agent to propose tool actions before execution whenever a task is non-trivial or risky.
  - Define review behavior that summarizes completed actions, remaining blockers, and next-step options after each task run.
- Approval checkpoints and user control:
  - Define `ApprovalCheckpoint` and `UserActionEnvelope` so risky actions are presented as concrete decisions with scope, side effects, and evidence.
  - Define which approval surfaces belong inline in the task state versus in a separate review panel.
  - Require explicit approvals for mutating tool actions and browser-lane escalation requests.
- Evidence-backed reasoning and constraints presentation:
  - Define `FeasibilityAssessment`, `StakeholderSummary`, and `ConstraintSeverity` so outputs can serve both technical and non-technical audiences.
  - Require every feasibility claim, blocker statement, licensing warning, and unsupported-path explanation to cite tool evidence or docs evidence.
  - Define how constraint findings are grouped into platform limitations, tenant policy constraints, missing prerequisites, or implementation risk.
- Prompt and context assembly:
  - Define the context package for the `Codex lane`: workspace profile, tenant profile, environment state, tool descriptors, recent evidence, active constraints, and approval status.
  - Reserve the `Operator lane` as future-only so its presence does not complicate current prompt assembly or UI flows.
  - Define context trimming rules so the workbench stays task-focused and avoids transcript sprawl.
- Artifact templates and output surfaces:
  - Define output templates for a feasibility report, implementation plan, stakeholder explanation, and next-step checklist.
  - Define how the output pane stores artifacts as first-class objects rather than chat-only messages.
  - Define how tool activity and evidence panes link directly into generated artifacts for auditability and trust.
- Acceptance scenario alignment:
  - Map Scenario 2 to evidence-backed feasibility assessment behavior.
  - Map Scenario 3 to sequenced implementation plan generation with dependencies and platform constraints.
  - Map Scenario 4 to stakeholder-safe summaries tied to platform, policy, or licensing evidence.
  - Map Scenario 5 to structured environment inspection outputs surfaced as task artifacts.
  - Map Scenario 6 to clear blocked-state UX with classified failure reasons and suggested recovery steps.

## Deliverables
- An end-to-end interaction model for plan, execute, approve, review, and artifact generation flows.
- A prompt and context assembly plan for the `Codex lane`, with clear separation from the future `Operator lane`.
- An approval UX spec that defines checkpoints, user actions, and presentation of risky operations.
- Output templates for feasibility reports, implementation plans, stakeholder explanations, and next-step checklists.
- A workbench surface plan covering the conversation pane, context pane, tool activity pane, evidence pane, and output pane.

## Measurable Exit Criteria
- A user can inspect a tenant and workspace and receive a grounded feasibility assessment.
- The agent can propose and sequence tool actions before execution.
- Technical and non-technical outputs are both first-class artifacts.
- Task-state UX is defined clearly enough that plan, blocked, approval-needed, running, and completed states do not rely on transcript reading.
- Scenario 2, Scenario 3, Scenario 4, and Scenario 5 can be demonstrated through one coherent workbench interaction model.

## Risks and Mitigations
- The UX could collapse into a chat log that hides task state and evidence.
  - Mitigation: make task states, artifacts, evidence links, and tool activity first-class surfaces.
- Approval prompts could feel disruptive if they are too frequent or too vague.
  - Mitigation: tie approvals to explicit side effects, scope, and proposed actions instead of generic warnings.
- The agent could overstate certainty when tooling is incomplete.
  - Mitigation: require evidence citations and explicit constraint severity when confidence or coverage is limited.
- Context assembly could become bloated and slow.
  - Mitigation: trim context to active workspace, tenant, environment, current task, recent evidence, and necessary tool descriptors.

## Open Questions Deferred
- Whether artifact history should be searchable in the MVP or only retained per active session.
- How much free-form conversation should be preserved once task-state UX is primary.
- Whether stakeholder outputs should support multiple tone presets in the MVP.
- How much manual editing of generated plans should happen inside the workbench versus in external files.

## Next Phase Handoff
Browser Automation Lane should plug into the workbench as a deliberate exception path, not a default action source. The handoff is complete when the core UX can already plan, approve, execute, and explain work through CLI, API, and docs-backed tools, with a clear escalation point for UI-only workflows. Do not start Phase 4 until every measurable exit criterion above is satisfied.
