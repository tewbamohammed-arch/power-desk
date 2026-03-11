import path from "node:path";

import type {
  AppSessionState,
  AuthContext,
  AuthStatus,
  ModelProviderConfig,
  ServerProviderStatus,
  SessionHealthCheck,
  TenantProfile,
  WorkspaceProfile,
} from "@t3tools/contracts";

interface CreateAppSessionStateInput {
  readonly cwd: string;
  readonly providerStatuses: ReadonlyArray<ServerProviderStatus>;
  readonly tenant?: TenantProfile | null;
  readonly modelProvider?: ModelProviderConfig;
  readonly activeApprovalCount?: number;
  readonly evidenceSummaryRefs?: ReadonlyArray<string>;
  readonly now?: string;
}

function createWorkspaceProfile(cwd: string, now: string): WorkspaceProfile {
  const label = path.basename(cwd) || cwd;
  return {
    id: cwd,
    label,
    rootPath: cwd,
    lastOpenedAt: now,
  };
}

function toHealthCheck(status: ServerProviderStatus): SessionHealthCheck {
  return {
    id: `provider:${status.provider}`,
    label: status.provider === "codex" ? "Codex CLI" : status.provider,
    status: status.status,
    checkedAt: status.checkedAt,
    ...(status.message ? { message: status.message } : {}),
  };
}

function toOpenAiAuthStatus(providerStatus: ServerProviderStatus): AuthStatus {
  switch (providerStatus.authStatus) {
    case "authenticated":
      return "authenticated";
    case "unauthenticated":
      return "unauthenticated";
    default:
      return "unknown";
  }
}

function createAuthContexts(providerStatuses: ReadonlyArray<ServerProviderStatus>): AuthContext[] {
  const openAiProvider = providerStatuses.find((status) => status.provider === "codex");

  return [
    {
      domain: "openai",
      status: openAiProvider ? toOpenAiAuthStatus(openAiProvider) : "unknown",
      ...(openAiProvider ? { lastValidatedAt: openAiProvider.checkedAt } : {}),
    },
    {
      domain: "microsoft",
      status: "unknown",
    },
    {
      domain: "browser-session",
      status: "unknown",
    },
  ];
}

export function createAppSessionState({
  cwd,
  providerStatuses,
  tenant = null,
  modelProvider,
  activeApprovalCount = 0,
  evidenceSummaryRefs = [],
  now = new Date().toISOString(),
}: CreateAppSessionStateInput): AppSessionState {
  const workspace = createWorkspaceProfile(cwd, now);
  const healthChecks = providerStatuses.map(toHealthCheck);
  const hasHealthError = healthChecks.some((check) => check.status === "error");
  const hasHealthWarning = healthChecks.some(
    (check) => check.status === "warning" || check.status === "unknown",
  );

  const stage = hasHealthError || hasHealthWarning ? "tool-health-check" : tenant ? "workbench" : "tenant-selection";
  const status = hasHealthError
    ? "blocked"
    : hasHealthWarning
      ? "degraded"
      : tenant
        ? "ready"
        : "starting";

  return {
    status,
    stage,
    workspace,
    tenant,
    auth: createAuthContexts(providerStatuses),
    ...(modelProvider ? { modelProvider } : {}),
    healthChecks,
    activeApprovalCount,
    evidenceSummaryRefs: [...evidenceSummaryRefs],
    updatedAt: now,
  };
}
