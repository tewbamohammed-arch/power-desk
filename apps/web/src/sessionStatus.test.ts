import { describe, expect, it } from "vitest";

import { describeSessionState, formatSessionStageLabel, shouldShowSessionStatusStrip } from "./sessionStatus";

describe("sessionStatus", () => {
  it("describes workspace-selection when no workspace is selected", () => {
    const state = {
      status: "starting",
      stage: "workspace-selection",
      workspace: null,
      tenant: null,
      auth: [],
      healthChecks: [],
      activeApprovalCount: 0,
      evidenceSummaryRefs: [],
      updatedAt: "2026-03-11T09:00:00.000Z",
    } as const;

    expect(formatSessionStageLabel(state.stage)).toBe("Workspace selection");
    expect(describeSessionState(state)).toBe("Choose a workspace to initialize the session.");
    expect(shouldShowSessionStatusStrip(state)).toBe(true);
  });

  it("describes tenant-selection when workspace is ready but tenant is missing", () => {
    const state = {
      status: "starting",
      stage: "tenant-selection",
      workspace: {
        id: "workspace-1",
        label: "sp-power-desk",
        rootPath: "C:/Users/TAR/Projects/sp-power-desk",
        lastOpenedAt: "2026-03-11T09:00:00.000Z",
      },
      tenant: null,
      auth: [],
      healthChecks: [],
      activeApprovalCount: 0,
      evidenceSummaryRefs: [],
      updatedAt: "2026-03-11T09:00:00.000Z",
    } as const;

    expect(formatSessionStageLabel(state.stage)).toBe("Tenant selection");
    expect(describeSessionState(state)).toBe(
      "Workspace is ready. Tenant selection is still pending.",
    );
    expect(shouldShowSessionStatusStrip(state)).toBe(true);
  });

  it("prefers the first failing health-check message", () => {
    const state = {
      status: "blocked",
      stage: "tool-health-check",
      workspace: {
        id: "workspace-1",
        label: "sp-power-desk",
        rootPath: "C:/Users/TAR/Projects/sp-power-desk",
        lastOpenedAt: "2026-03-11T09:00:00.000Z",
      },
      tenant: {
        id: "tenant-1",
        label: "Contoso Dev",
        tenantId: "11111111-1111-1111-1111-111111111111",
        lastValidatedAt: "2026-03-11T09:00:00.000Z",
      },
      auth: [],
      healthChecks: [
        {
          id: "provider:codex",
          label: "Codex CLI",
          status: "error",
          checkedAt: "2026-03-11T09:00:00.000Z",
          message: "Codex CLI is not authenticated.",
        },
      ],
      activeApprovalCount: 0,
      evidenceSummaryRefs: [],
      updatedAt: "2026-03-11T09:00:00.000Z",
    } as const;

    expect(describeSessionState(state)).toBe("Codex CLI is not authenticated.");
    expect(shouldShowSessionStatusStrip(state)).toBe(true);
  });
});
