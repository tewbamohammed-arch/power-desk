# 2026-03-08 Tool Runtime and Adapters Plan

## Intent
Define the first-class tool system that gives Power Desk practical leverage through consistent adapter contracts, evidence-bearing results, and approval-aware execution behavior.

## Why This Phase Exists
The workbench only becomes useful when it can inspect environments, read repo state, call Microsoft surfaces, and return grounded results in one consistent runtime. This phase turns the shell from a host into an actual delivery platform.

## Scope
- Adapter contracts, execution model, capability discovery, timeout handling, retry handling, and error handling.
- First-party adapter priorities in this order:
  - `PAC Adapter`
  - `Dataverse Adapter`
  - `Graph Adapter`
  - `Repo Adapter`
  - `Docs Adapter`
  - `Power BI Adapter`
  - `SharePoint-specific Adapter` only if Graph gaps justify it
- Adapter responsibilities:
  - `PAC Adapter`: environments, auth status, solutions, pack and unpack, import and export, diagnostics.
  - `Dataverse Adapter`: tables, records, metadata, solution components.
  - `Graph Adapter`: SharePoint, OneDrive, groups, users, files, permissions.
  - `Repo Adapter`: git status, file inspection, diff context, command execution policy.
  - `Docs Adapter`: Learn MCP or docs-grounded retrieval for evidence-backed planning.
  - `Power BI Adapter`: workspace, report, and dataset metadata plus lifecycle operations.
- Runtime decisions to lock:
  - Adapters execute as isolated services or isolated in-process modules behind the same contract.
  - Each tool declares auth requirements, side-effect classification, retry policy, and approval requirement.
  - Every result returns both machine-usable data and a human-readable summary.
  - All tool actions emit structured logs and evidence references.
- Public interfaces and types to define in this phase:
  - `IToolAdapter`
  - `ToolDescriptor`
  - `ToolCapability`
  - `ToolParameterSchema`
  - `ToolInvocationPolicy`
  - `ExecutionTranscriptEntry`
  - `EvidenceReference`
  - `ConstraintFinding`
- Acceptance scenarios covered directly in this phase: Scenario 2, Scenario 5, Scenario 6, and the tool-side evidence needed for Scenario 8.
- Cross-plan rules applied in this phase:
  - Power Platform core remains first-class.
  - CLI, API, and MCP routes are primary.
  - Every claim must be evidence-backed.
  - Every mutating action must declare an approval path.
  - Preview surfaces must be feature-flag ready.

## Out of Scope
- Final workbench layout, conversation state management, and artifact presentation details.
- Browser automation implementation or portal-driving logic.
- Installer packaging, update flows, or support playbooks beyond the runtime telemetry it must emit.
- Multi-user coordination, server-side tool execution, or remote orchestration.

## Dependencies
- Depends on the master roadmap for adapter priority, acceptance scenarios, and MVP boundaries.
- Depends on Foundation and Shell for process boundaries, auth-domain separation, logging schema, and shared execution request and result shapes.
- Must produce contracts stable enough for Phase 3 UX and orchestration to consume without adapter-specific branching.

## Workstreams
- Shared tool contract and data model:
  - Define `IToolAdapter` as the single contract for discovery, validation, execution, and health reporting across all adapters.
  - Define `ToolDescriptor`, `ToolCapability`, and `ToolParameterSchema` so the UI and agent can inspect tool affordances without hard-coded adapter knowledge.
  - Define `ExecutionTranscriptEntry`, `EvidenceReference`, and `ConstraintFinding` so outputs can support both machine planning and human explanation.
- Invocation runtime and isolation:
  - Define one execution pipeline for request validation, auth checks, policy checks, timeout enforcement, retries, execution, and transcript capture.
  - Preserve a contract that works whether adapters start as isolated processes or isolated in-process modules.
  - Define capability discovery and health-check behavior so startup readiness and runtime fallback logic use the same signals.
- Policy, approvals, and failure classification:
  - Define `ToolInvocationPolicy` so every tool declares auth requirements, side-effect classification, retry policy, and approval requirement.
  - Create an error taxonomy that classifies failures as auth, policy, platform, transport, or user-input errors.
  - Define how recovery guidance is attached to failures so the app can explain blocked runs without vague messages.
- First-party adapter priority set:
  - Specify the `PAC Adapter` as the first delivery adapter for environment context, solutions, import and export, and diagnostics.
  - Specify the `Dataverse Adapter` as the first data-plane adapter for tables, metadata, records, and solution components.
  - Specify the `Graph Adapter` as the first broader Microsoft surface for users, groups, files, permissions, and SharePoint-relevant metadata.
  - Specify the `Repo Adapter` as the workspace-aware bridge for git state, file inspection, diff context, and command execution policy.
  - Specify the `Docs Adapter` as the evidence lane for feasibility checks and planning grounded in official docs.
  - Specify the `Power BI Adapter` and potential `SharePoint-specific Adapter` as later priorities gated by actual MVP need.
- Evidence model and result packaging:
  - Require every tool result to return structured data, a human-readable summary, evidence references, and constraint findings where relevant.
  - Define how evidence links back to tenant, environment, repo, or documentation context so feasibility claims remain auditable.
  - Define transcript capture rules so approval reviews and diagnostics exports can show what happened without exposing secrets.
- Acceptance scenario alignment:
  - Map Scenario 2 to evidence-backed feasibility checks across PAC, Dataverse, Graph, and docs.
  - Map Scenario 5 to environment inspection outputs that summarize environments, solutions, and notable issues.
  - Map Scenario 6 to the error taxonomy and recovery guidance model.
  - Map Scenario 8 to structured transcript and evidence capture that later diagnostics bundling can export safely.

## Deliverables
- An adapter contract spec centered on `IToolAdapter` and the shared runtime data types.
- An initial tool catalog spec with priorities, capabilities, auth requirements, side-effect classifications, and approval expectations.
- An error taxonomy that distinguishes auth, policy, platform, transport, and user-input failures.
- An approval policy matrix that defines which tool actions can run automatically and which require user confirmation.
- An evidence model that shows why the agent believes something is feasible, blocked, risky, or incomplete.

## Measurable Exit Criteria
- An implementer can build PAC and Dataverse adapters without inventing shared contracts.
- Tool outputs can feed both the agent and the UI consistently.
- Failures can be classified as auth, policy, platform, transport, or user-input errors.
- Adapter priority order is explicit enough that PAC, Dataverse, and Graph can start immediately while Power BI and SharePoint depth stay intentionally later.
- The runtime contract supports Scenario 2, Scenario 5, and Scenario 6 without adapter-specific output formats.

## Risks and Mitigations
- Adapter contracts could become too abstract and slow down the first implementations.
  - Mitigation: optimize for PAC and Dataverse first, then confirm other adapters fit the same contract.
- Microsoft APIs and CLI tools could produce inconsistent error shapes.
  - Mitigation: normalize failures into the shared taxonomy and store raw context in transcripts for support use.
- Evidence capture could become verbose and noisy.
  - Mitigation: require concise summaries plus targeted evidence references rather than dumping raw payloads into the UI.
- Repo execution could create unsafe local command behavior.
  - Mitigation: define explicit command execution policy and approval requirements inside the Repo Adapter contract.

## Open Questions Deferred
- Whether docs retrieval should start with Learn MCP, direct docs indexing, or a hybrid adapter.
- Whether Power BI lifecycle operations belong in MVP or should begin as read-mostly metadata coverage.
- Which Graph gaps would justify pulling a SharePoint-specific adapter forward.
- Whether the first adapter implementations should ship in separate processes or inside a common host process boundary.

## Next Phase Handoff
Agent Orchestration and UX should inherit one stable runtime contract, one error taxonomy, one approval policy model, and one evidence model. The handoff is complete when the agent can plan against tool descriptors and the UI can render results, failures, and evidence without special logic for each adapter. Do not start Phase 3 until every measurable exit criterion above is satisfied.

## Implementation References
- Decision baseline: `docs/adr-0003-t3code-augmentation-baseline.md` - keeps adapter-runtime planning anchored on the current `apps/server` and shared-package architecture instead of a parallel greenfield host stack.
- No linked implementation commits yet.
