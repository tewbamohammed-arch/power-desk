# 2026-03-08 Power Desk Master Roadmap

## Intent
Define the Windows-first internal MVP roadmap for Power Desk so implementation can begin without reopening product-level architecture, scope, or sequencing decisions.

## Why This Phase Exists
The roadmap exists to keep a solo builder focused on the highest-leverage delivery workbench outcomes first: stable desktop shell, tenant-aware tools, evidence-backed agent behavior, and optional browser automation only where APIs or CLIs fall short.

## Scope
- Product definition: "Power Desk is a Windows-first agentic desktop workbench for Power Platform delivery work, combining repo awareness, tenant-aware tools, CLI/API/MCP adapters, and optional browser automation."
- Audience: solo technical builder first, future-ready for small internal teams.
- Primary goals: reduce feasibility-analysis overhead, reduce context switching, improve delivery throughput, and improve stakeholder communication around constraints.
- Non-goals for MVP: multi-user collaboration, full cloud SaaS control plane, cross-platform parity, desktop automation beyond browser, and a full enterprise governance suite.
- Milestones:
  - M1: runnable desktop shell with workspace and tenant context.
  - M2: usable tool runtime with PAC + Dataverse + Graph foundations.
  - M3: agent loop that can plan, invoke tools, and produce delivery artifacts.
  - M4: optional browser automation for maker-portal gaps.
  - M5: packaged internal MVP with logs, config, and supportable operations.
- KPI-style success measures:
  - Complete three real tasks without manual shell hopping.
  - Produce one feasibility assessment from tenant-aware evidence.
  - Reduce time-to-first-working-delivery-loop for a new project to under 30 minutes.
  - Keep browser automation outside the critical path for at least 70% of MVP tasks.
- Roadmap calendar uses effort bands, not dates:
  - Phase 1: 1 week.
  - Phase 2: 2 weeks.
  - Phase 3: 2 weeks.
  - Phase 4: 1 week.
  - Phase 5: 1 week.
- Cross-plan architectural rules:
  - Power Platform core comes first; SharePoint and broader Microsoft 365 breadth are secondary.
  - CLI, API, and MCP tools are primary; browser automation is fallback.
  - Auth is split by domain and never conflated.
  - Every agent claim about feasibility or limitations must point to evidence.
  - Every mutating tool action must have an approval path.
  - Preview Microsoft surfaces must be wrapped in feature flags.
  - The app is a delivery workbench, not a generic chatbot.
- Model-lane separation:
  - Codex lane handles repo, planning, shell, and tool-driven engineering workflows.
  - Operator lane is reserved for future API-backed UI automation and must not shape the MVP core.
- Adapter priority order:
  - PAC Adapter.
  - Dataverse Adapter.
  - Graph Adapter.
  - Repo Adapter.
  - Docs Adapter.
  - Power BI Adapter.
  - SharePoint-specific Adapter only if Graph gaps justify earlier promotion.
- Acceptance scenario backbone:
  - Scenario 1: workspace and tenant selection with PAC auth and readiness checks.
  - Scenario 2: grounded feasibility answer backed by PAC, Dataverse, Graph, or docs evidence.
  - Scenario 3: sequenced implementation plan with dependencies and platform constraints.
  - Scenario 4: stakeholder-safe explanation for blocked or expensive work.
  - Scenario 5: structured environment inspection summary.
  - Scenario 6: classified auth or policy failure with recovery guidance.
  - Scenario 7: browser automation requires justification and explicit approval.
  - Scenario 8: diagnostics bundle can be generated without exposing secrets.

## Out of Scope
- Detailed implementation tickets, code scaffolding, or sprint board breakdowns.
- Final adapter internals beyond the shared contract expectations needed for planning.
- Cross-platform desktop choices, mobile support, or web-first hosting alternatives.
- Generic AI chat features that are not tied to delivery workflows, evidence, or tool execution.

## Dependencies
- Project root is currently empty, so the pack must establish the starting structure.
- The pack assumes an internal MVP posture, a solo builder audience, and Windows as the primary execution environment.
- Each downstream phase depends on the master roadmap for milestone order, adapter priorities, model-lane separation, and acceptance scenario coverage.

## Workstreams
- Product boundary and posture:
  - Lock the MVP as an internal delivery workbench centered on Power Platform execution, not a broad Microsoft 365 admin console.
  - State the primary audience as a solo technical builder while leaving room for later small-team adoption.
  - Capture explicit non-goals so multi-user SaaS, full governance suites, and cross-platform work do not dilute the MVP.
- Architecture and lane separation:
  - Fix Windows-first `.NET/WinUI` as the desktop direction and keep WebView2 limited to targeted embedded surfaces.
  - Separate model-provider concerns from tool-runtime concerns so future model changes do not force adapter redesign.
  - Keep Codex and future Operator lanes distinct so browser automation remains optional and non-blocking.
- Sequencing and milestone control:
  - Sequence shell and process boundaries before tool runtime, tool runtime before agent orchestration, and browser automation after the core loop proves useful.
  - Tie each phase to one milestone so value can be demonstrated in bounded slices with limited backtracking.
  - Reserve packaging and operational hardening for the final phase so stabilization effort lands on proven workflows.
- Success measures and acceptance backbone:
  - Use KPI-style success measures to confirm the MVP improves throughput rather than only producing a polished shell.
  - Use the eight acceptance scenarios as shared validation cases across the phase plans.
  - Require each phase to define measurable outputs, dependencies, and handoff conditions before implementation starts.
- Risk governance:
  - Track auth sprawl, Microsoft API inconsistency, preview MCP volatility, UI automation fragility, and unclear product boundaries as first-order risks.
  - Pair each risk with mitigations that preserve evidence, feature-flag previews, and avoid browser-first dependencies.

## Deliverables
- A roadmap that defines the product vision, MVP boundary, milestone sequence, effort bands, and success measures.
- A consistent planning system for the five downstream phases with shared architectural rules and acceptance scenarios.
- An explicit adapter priority list and model-lane separation policy that downstream phases must preserve.
- A risk register that names the dominant technical and product risks for the internal MVP.

## Measurable Exit Criteria
- Every downstream phase has defined dependencies and measurable outputs.
- The MVP boundary is explicit, including what is deliberately out of scope for the internal release.
- Adapter priorities and model-lane separation are explicit and preserved in the roadmap narrative.
- The roadmap maps all five milestones to effort bands and the shared acceptance scenarios.
- KPI-style success measures are concrete enough to verify whether the MVP reduced delivery friction.

## Risks and Mitigations
- Auth sprawl could blur Microsoft, model-provider, and browser-session concerns.
  - Mitigation: require domain-specific auth boundaries in every downstream phase.
- Microsoft API inconsistency could push the product toward brittle special cases.
  - Mitigation: prioritize PAC, Dataverse, and Graph first, and require evidence-backed failure classification.
- Preview MCP volatility could destabilize the tool layer.
  - Mitigation: treat MCP as an adapter path behind feature flags rather than a hard dependency.
- UI automation fragility could consume roadmap time before core value is proven.
  - Mitigation: keep browser automation outside the critical path and use it only when API or CLI routes fail.
- Unclear product boundaries could turn the workbench into a generic chatbot or admin portal.
  - Mitigation: keep the roadmap anchored on delivery workflows, evidence, and approval-gated actions.

## Open Questions Deferred
- Which distribution channel is best for the internal Windows desktop package.
- Which model providers will be enabled in the first internal MVP beyond the Codex lane baseline.
- Whether a SharePoint-specific adapter should move ahead of Power BI based on real Graph coverage gaps.
- Which docs-grounded retrieval route is most stable: Learn MCP, curated docs ingestion, or a hybrid.

## Next Phase Handoff
Foundation and Shell should lock the host architecture, process boundaries, configuration model, and auth separation without re-litigating product scope. The handoff expectation is that Phase 1 converts this roadmap into concrete shell, startup flow, and shared type decisions that support multiple adapters and future agent workflows.

## Implementation References
- `9f967e8` `feat(foundation): Tighten desktop/server startup boundary` - moved startup/bootstrap ownership into `apps/server`, kept Electron focused on shell concerns, and introduced shared foundation contracts.
- `cfb0f51` `feat(foundation): expose session state over native api` - added typed `AppSessionState` generation in `apps/server` and exposed it through the Native API.
- `dd6b42e` `feat(foundation): push shell session state updates` - pushed session-state updates over WebSocket and surfaced startup/session status in the shell UI.
- `537a904` `feat(foundation): expose server diagnostics baseline` - added server-owned runtime diagnostics metadata, log-path reporting, and a diagnostics baseline aligned with Scenario 8 handoff work.
- `8c0a794` `fix(web): handle unavailable diagnostics state` - fixed the Settings diagnostics UI to handle older or not-yet-restarted backends without showing false in-progress states.
