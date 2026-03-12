import { describe, expect, it } from "vitest";
import { EventId, type ServerProviderStatus } from "@t3tools/contracts";

import { countPendingApprovals, createAppSessionState } from "./appSessionState";

const READY_PROVIDER: ServerProviderStatus = {
  provider: "codex",
  status: "ready",
  available: true,
  authStatus: "authenticated",
  checkedAt: "2026-03-11T12:00:00.000Z",
};

describe("createAppSessionState", () => {
  it("marks the session as workspace-selection when no workspace is selected", () => {
    const sessionState = createAppSessionState({
      providerStatuses: [READY_PROVIDER],
      now: "2026-03-11T12:05:00.000Z",
    });

    expect(sessionState).toEqual({
      status: "starting",
      stage: "workspace-selection",
      workspace: null,
      tenant: null,
      auth: [
        {
          domain: "openai",
          status: "authenticated",
          lastValidatedAt: "2026-03-11T12:00:00.000Z",
        },
        {
          domain: "microsoft",
          status: "unknown",
        },
        {
          domain: "browser-session",
          status: "unknown",
        },
      ],
      healthChecks: [
        {
          id: "provider:codex",
          label: "Codex CLI",
          status: "ready",
          checkedAt: "2026-03-11T12:00:00.000Z",
        },
      ],
      activeApprovalCount: 0,
      evidenceSummaryRefs: [],
      updatedAt: "2026-03-11T12:05:00.000Z",
    });
  });

  it("marks the session as tenant-selection while workspace is ready but no tenant is chosen", () => {
    const sessionState = createAppSessionState({
      workspace: {
        id: "project-1",
        label: "power-desk",
        rootPath: "/workspace/power-desk",
        lastOpenedAt: "2026-03-11T12:05:00.000Z",
      },
      providerStatuses: [READY_PROVIDER],
      now: "2026-03-11T12:05:00.000Z",
    });

    expect(sessionState).toEqual({
      status: "starting",
      stage: "tenant-selection",
      workspace: {
        id: "project-1",
        label: "power-desk",
        rootPath: "/workspace/power-desk",
        lastOpenedAt: "2026-03-11T12:05:00.000Z",
      },
      tenant: null,
      auth: [
        {
          domain: "openai",
          status: "authenticated",
          lastValidatedAt: "2026-03-11T12:00:00.000Z",
        },
        {
          domain: "microsoft",
          status: "unknown",
        },
        {
          domain: "browser-session",
          status: "unknown",
        },
      ],
      healthChecks: [
        {
          id: "provider:codex",
          label: "Codex CLI",
          status: "ready",
          checkedAt: "2026-03-11T12:00:00.000Z",
        },
      ],
      activeApprovalCount: 0,
      evidenceSummaryRefs: [],
      updatedAt: "2026-03-11T12:05:00.000Z",
    });
  });

  it("marks the session as blocked when a tool health check errors", () => {
    const sessionState = createAppSessionState({
      workspace: {
        id: "project-1",
        label: "power-desk",
        rootPath: "/workspace/power-desk",
        lastOpenedAt: "2026-03-11T12:05:00.000Z",
      },
      tenant: {
        id: "tenant-1",
        label: "Contoso Dev",
        tenantId: "11111111-1111-1111-1111-111111111111",
        lastValidatedAt: "2026-03-11T12:05:00.000Z",
      },
      providerStatuses: [
        {
          provider: "codex",
          status: "error",
          available: false,
          authStatus: "unauthenticated",
          checkedAt: "2026-03-11T12:00:00.000Z",
          message: "Codex CLI is not authenticated.",
        },
      ],
      now: "2026-03-11T12:05:00.000Z",
    });

    expect(sessionState.status).toBe("blocked");
    expect(sessionState.stage).toBe("tool-health-check");
    expect(sessionState.auth[0]).toEqual({
      domain: "openai",
      status: "unauthenticated",
      lastValidatedAt: "2026-03-11T12:00:00.000Z",
    });
    expect(sessionState.healthChecks[0]).toEqual({
      id: "provider:codex",
      label: "Codex CLI",
      status: "error",
      checkedAt: "2026-03-11T12:00:00.000Z",
      message: "Codex CLI is not authenticated.",
    });
  });

  it("counts unresolved approvals across threads", () => {
    expect(
      countPendingApprovals([
        {
          activities: [
            {
              id: EventId.makeUnsafe("activity-1"),
              kind: "approval.requested",
              summary: "Command approval requested",
              tone: "approval",
              turnId: null,
              payload: {
                requestId: "approval-1",
                requestKind: "command",
              },
              createdAt: "2026-03-11T12:00:00.000Z",
            },
            {
              id: EventId.makeUnsafe("activity-2"),
              kind: "approval.resolved",
              summary: "Command approval resolved",
              tone: "info",
              turnId: null,
              payload: {
                requestId: "approval-1",
              },
              createdAt: "2026-03-11T12:01:00.000Z",
            },
          ],
        },
        {
          activities: [
            {
              id: EventId.makeUnsafe("activity-3"),
              kind: "approval.requested",
              summary: "File-read approval requested",
              tone: "approval",
              turnId: null,
              payload: {
                requestId: "approval-2",
                requestKind: "file-read",
              },
              createdAt: "2026-03-11T12:02:00.000Z",
            },
          ],
        },
      ]),
    ).toBe(1);
  });
});
