import { describe, expect, it } from "vitest";
import type { ServerProviderStatus } from "@t3tools/contracts";

import { createAppSessionState } from "./appSessionState";

const READY_PROVIDER: ServerProviderStatus = {
  provider: "codex",
  status: "ready",
  available: true,
  authStatus: "authenticated",
  checkedAt: "2026-03-11T12:00:00.000Z",
};

describe("createAppSessionState", () => {
  it("marks the session as tenant-selection while workspace is ready but no tenant is chosen", () => {
    const sessionState = createAppSessionState({
      cwd: "/workspace/power-desk",
      providerStatuses: [READY_PROVIDER],
      now: "2026-03-11T12:05:00.000Z",
    });

    expect(sessionState).toEqual({
      status: "starting",
      stage: "tenant-selection",
      workspace: {
        id: "/workspace/power-desk",
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
      cwd: "/workspace/power-desk",
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
});
