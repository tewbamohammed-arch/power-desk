import { Schema } from "effect";
import { IsoDateTime, NonNegativeInt, PositiveInt, TrimmedNonEmptyString } from "./baseSchemas";

export const WorkspaceProfile = Schema.Struct({
  id: TrimmedNonEmptyString,
  label: TrimmedNonEmptyString,
  rootPath: TrimmedNonEmptyString,
  lastOpenedAt: Schema.optional(IsoDateTime),
});
export type WorkspaceProfile = typeof WorkspaceProfile.Type;

export const TenantProfile = Schema.Struct({
  id: TrimmedNonEmptyString,
  label: TrimmedNonEmptyString,
  tenantId: TrimmedNonEmptyString,
  environmentId: Schema.optional(TrimmedNonEmptyString),
  environmentUrl: Schema.optional(TrimmedNonEmptyString),
  lastValidatedAt: Schema.optional(IsoDateTime),
});
export type TenantProfile = typeof TenantProfile.Type;

export const AuthDomain = Schema.Literals(["openai", "microsoft", "browser-session"]);
export type AuthDomain = typeof AuthDomain.Type;

export const AuthStatus = Schema.Literals([
  "unknown",
  "authenticated",
  "unauthenticated",
  "expired",
]);
export type AuthStatus = typeof AuthStatus.Type;

export const AuthContext = Schema.Struct({
  domain: AuthDomain,
  status: AuthStatus,
  subject: Schema.optional(TrimmedNonEmptyString),
  lastValidatedAt: Schema.optional(IsoDateTime),
});
export type AuthContext = typeof AuthContext.Type;

export const ModelProviderConfig = Schema.Struct({
  provider: TrimmedNonEmptyString,
  model: TrimmedNonEmptyString,
  baseUrl: Schema.optional(TrimmedNonEmptyString),
  requiresApproval: Schema.Boolean,
});
export type ModelProviderConfig = typeof ModelProviderConfig.Type;

export const ToolExecutionRequest = Schema.Struct({
  requestId: TrimmedNonEmptyString,
  toolId: TrimmedNonEmptyString,
  action: TrimmedNonEmptyString,
  workspaceId: Schema.optional(TrimmedNonEmptyString),
  tenantId: Schema.optional(TrimmedNonEmptyString),
  correlationId: Schema.optional(TrimmedNonEmptyString),
  requiresApproval: Schema.Boolean,
  arguments: Schema.Record(Schema.String, Schema.Unknown),
});
export type ToolExecutionRequest = typeof ToolExecutionRequest.Type;

export const ToolExecutionStatus = Schema.Literals(["success", "failed", "rejected"]);
export type ToolExecutionStatus = typeof ToolExecutionStatus.Type;

export const ToolExecutionResult = Schema.Struct({
  requestId: TrimmedNonEmptyString,
  status: ToolExecutionStatus,
  startedAt: IsoDateTime,
  completedAt: IsoDateTime,
  summary: Schema.optional(TrimmedNonEmptyString),
  evidenceRefs: Schema.Array(TrimmedNonEmptyString),
  error: Schema.optional(TrimmedNonEmptyString),
});
export type ToolExecutionResult = typeof ToolExecutionResult.Type;

export const SessionHealthStatus = Schema.Literals(["unknown", "ready", "warning", "error"]);
export type SessionHealthStatus = typeof SessionHealthStatus.Type;

export const SessionHealthCheck = Schema.Struct({
  id: TrimmedNonEmptyString,
  label: TrimmedNonEmptyString,
  status: SessionHealthStatus,
  checkedAt: IsoDateTime,
  message: Schema.optional(TrimmedNonEmptyString),
});
export type SessionHealthCheck = typeof SessionHealthCheck.Type;

export const AppSessionStage = Schema.Literals([
  "workspace-selection",
  "tenant-selection",
  "tool-health-check",
  "workbench",
]);
export type AppSessionStage = typeof AppSessionStage.Type;

export const AppSessionStatus = Schema.Literals(["starting", "ready", "degraded", "blocked"]);
export type AppSessionStatus = typeof AppSessionStatus.Type;

export const AppSessionState = Schema.Struct({
  status: AppSessionStatus,
  stage: AppSessionStage,
  workspace: Schema.Union([WorkspaceProfile, Schema.Null]),
  tenant: Schema.Union([TenantProfile, Schema.Null]),
  auth: Schema.Array(AuthContext),
  modelProvider: Schema.optional(ModelProviderConfig),
  healthChecks: Schema.Array(SessionHealthCheck),
  activeApprovalCount: NonNegativeInt,
  evidenceSummaryRefs: Schema.Array(TrimmedNonEmptyString),
  updatedAt: IsoDateTime,
});
export type AppSessionState = typeof AppSessionState.Type;

export const DesktopServerConnection = Schema.Struct({
  bindHost: TrimmedNonEmptyString,
  connectHost: TrimmedNonEmptyString,
  port: PositiveInt,
  authToken: TrimmedNonEmptyString,
  httpUrl: TrimmedNonEmptyString,
  wsUrl: TrimmedNonEmptyString,
});
export type DesktopServerConnection = typeof DesktopServerConnection.Type;

export const DesktopServerBootstrap = Schema.Struct({
  kind: Schema.Literal("desktop-server-bootstrap"),
  emittedAt: IsoDateTime,
  stateDir: TrimmedNonEmptyString,
  connection: DesktopServerConnection,
});
export type DesktopServerBootstrap = typeof DesktopServerBootstrap.Type;

export const DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX = "T3CODE_DESKTOP_SERVER_BOOTSTRAP ";
