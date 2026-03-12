import type {
  AppSessionState,
  AuthContext,
  AuthStatus,
  ModelProviderConfig,
  OrchestrationThreadActivity,
  ServerProviderStatus,
  SessionHealthCheck,
  TenantProfile,
  WorkspaceProfile,
} from "@t3tools/contracts";

interface CreateAppSessionStateInput {
  readonly workspace?: WorkspaceProfile | null;
  readonly providerStatuses: ReadonlyArray<ServerProviderStatus>;
  readonly tenant?: TenantProfile | null;
  readonly modelProvider?: ModelProviderConfig;
  readonly activeApprovalCount?: number;
  readonly evidenceSummaryRefs?: ReadonlyArray<string>;
  readonly now?: string;
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

function getApprovalRequestId(activity: OrchestrationThreadActivity): string | null {
  if (!activity.payload || typeof activity.payload !== "object") {
    return null;
  }
  const requestId = (activity.payload as Record<string, unknown>).requestId;
  return typeof requestId === "string" ? requestId : null;
}

function getActivityDetail(activity: OrchestrationThreadActivity): string | null {
  if (!activity.payload || typeof activity.payload !== "object") {
    return null;
  }
  const detail = (activity.payload as Record<string, unknown>).detail;
  return typeof detail === "string" ? detail : null;
}

function countPendingApprovalsForActivities(
  activities: ReadonlyArray<OrchestrationThreadActivity>,
): number {
  const openApprovals = new Set<string>();
  const orderedActivities = [...activities].toSorted((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );

  for (const activity of orderedActivities) {
    const requestId = getApprovalRequestId(activity);
    if (!requestId) {
      continue;
    }

    if (activity.kind === "approval.requested") {
      openApprovals.add(requestId);
      continue;
    }

    if (activity.kind === "approval.resolved") {
      openApprovals.delete(requestId);
      continue;
    }

    if (
      activity.kind === "provider.approval.respond.failed" &&
      getActivityDetail(activity)?.includes("Unknown pending permission request")
    ) {
      openApprovals.delete(requestId);
    }
  }

  return openApprovals.size;
}

export function countPendingApprovals(
  threads: ReadonlyArray<{ readonly activities: ReadonlyArray<OrchestrationThreadActivity> }>,
): number {
  return threads.reduce(
    (total, thread) => total + countPendingApprovalsForActivities(thread.activities),
    0,
  );
}

export function createAppSessionState({
  workspace = null,
  providerStatuses,
  tenant = null,
  modelProvider,
  activeApprovalCount = 0,
  evidenceSummaryRefs = [],
  now = new Date().toISOString(),
}: CreateAppSessionStateInput): AppSessionState {
  const healthChecks = providerStatuses.map(toHealthCheck);
  const hasHealthError = healthChecks.some((check) => check.status === "error");
  const hasHealthWarning = healthChecks.some(
    (check) => check.status === "warning" || check.status === "unknown",
  );

  const stage = !workspace
    ? "workspace-selection"
    : !tenant
      ? "tenant-selection"
      : hasHealthError || hasHealthWarning
        ? "tool-health-check"
        : "workbench";
  const status = hasHealthError
    ? "blocked"
    : hasHealthWarning
      ? "degraded"
      : workspace && tenant
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
