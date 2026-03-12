import type { AppSessionStage, AppSessionState, SessionHealthCheck } from "@t3tools/contracts";

export function formatSessionStageLabel(stage: AppSessionStage): string {
  switch (stage) {
    case "workspace-selection":
      return "Workspace selection";
    case "tenant-selection":
      return "Tenant selection";
    case "tool-health-check":
      return "Tool health";
    case "workbench":
      return "Workbench";
  }
}

function findPrimaryHealthCheck(
  healthChecks: ReadonlyArray<SessionHealthCheck>,
): SessionHealthCheck | null {
  return (
    healthChecks.find((check) => check.status === "error") ??
    healthChecks.find((check) => check.status === "warning") ??
    healthChecks.find((check) => check.status === "unknown") ??
    null
  );
}

export function shouldShowSessionStatusStrip(state: AppSessionState): boolean {
  return state.status !== "ready" || state.stage !== "workbench";
}

export function describeSessionState(state: AppSessionState): string {
  if (!state.workspace) {
    return "Choose a workspace to initialize the session.";
  }

  if (!state.tenant) {
    return "Workspace is ready. Tenant selection is still pending.";
  }

  const primaryHealthCheck = findPrimaryHealthCheck(state.healthChecks);
  if (primaryHealthCheck) {
    return (
      primaryHealthCheck.message ??
      `${primaryHealthCheck.label} still needs verification before the session is fully ready.`
    );
  }

  return "Session is ready.";
}
