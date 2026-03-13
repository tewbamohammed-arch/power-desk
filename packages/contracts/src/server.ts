import { Schema } from "effect";
import { IsoDateTime, ProjectId, TrimmedNonEmptyString } from "./baseSchemas";
import { KeybindingRule, ResolvedKeybindingsConfig } from "./keybindings";
import { EditorId } from "./editor";
import { ProviderKind } from "./orchestration";
import { AppSessionState, TenantProfile } from "./foundation";

const KeybindingsMalformedConfigIssue = Schema.Struct({
  kind: Schema.Literal("keybindings.malformed-config"),
  message: TrimmedNonEmptyString,
});

const KeybindingsInvalidEntryIssue = Schema.Struct({
  kind: Schema.Literal("keybindings.invalid-entry"),
  message: TrimmedNonEmptyString,
  index: Schema.Number,
});

export const ServerConfigIssue = Schema.Union([
  KeybindingsMalformedConfigIssue,
  KeybindingsInvalidEntryIssue,
]);
export type ServerConfigIssue = typeof ServerConfigIssue.Type;

const ServerConfigIssues = Schema.Array(ServerConfigIssue);

export const ServerProviderStatusState = Schema.Literals(["ready", "warning", "error"]);
export type ServerProviderStatusState = typeof ServerProviderStatusState.Type;

export const ServerProviderAuthStatus = Schema.Literals([
  "authenticated",
  "unauthenticated",
  "unknown",
]);
export type ServerProviderAuthStatus = typeof ServerProviderAuthStatus.Type;

export const ServerProviderStatus = Schema.Struct({
  provider: ProviderKind,
  status: ServerProviderStatusState,
  available: Schema.Boolean,
  authStatus: ServerProviderAuthStatus,
  checkedAt: IsoDateTime,
  message: Schema.optional(TrimmedNonEmptyString),
});
export type ServerProviderStatus = typeof ServerProviderStatus.Type;

const ServerProviderStatuses = Schema.Array(ServerProviderStatus);

export const ServerRuntime = Schema.Struct({
  mode: Schema.Literals(["web", "desktop"]),
  runId: TrimmedNonEmptyString,
  startedAt: IsoDateTime,
});
export type ServerRuntime = typeof ServerRuntime.Type;

export const ServerDiagnosticsPaths = Schema.Struct({
  stateDir: TrimmedNonEmptyString,
  logsDir: TrimmedNonEmptyString,
  serverLogPath: TrimmedNonEmptyString,
  providerLogsDir: TrimmedNonEmptyString,
  terminalLogsDir: TrimmedNonEmptyString,
});
export type ServerDiagnosticsPaths = typeof ServerDiagnosticsPaths.Type;

export const ServerConfig = Schema.Struct({
  runtime: ServerRuntime,
  cwd: TrimmedNonEmptyString,
  diagnostics: ServerDiagnosticsPaths,
  keybindingsConfigPath: TrimmedNonEmptyString,
  keybindings: ResolvedKeybindingsConfig,
  issues: ServerConfigIssues,
  providers: ServerProviderStatuses,
  availableEditors: Schema.Array(EditorId),
});
export type ServerConfig = typeof ServerConfig.Type;

export const ServerUpsertKeybindingInput = KeybindingRule;
export type ServerUpsertKeybindingInput = typeof ServerUpsertKeybindingInput.Type;

export const ServerSelectWorkspaceInput = Schema.Struct({
  projectId: ProjectId,
});
export type ServerSelectWorkspaceInput = typeof ServerSelectWorkspaceInput.Type;

export const ServerGetProjectStartupContextInput = Schema.Struct({
  projectId: ProjectId,
});
export type ServerGetProjectStartupContextInput = typeof ServerGetProjectStartupContextInput.Type;

export const ServerProjectStartupContext = Schema.Struct({
  projectId: ProjectId,
  workspaceRoot: TrimmedNonEmptyString,
  configPath: TrimmedNonEmptyString,
  tenant: Schema.Union([TenantProfile, Schema.Null]),
  updatedAt: IsoDateTime,
});
export type ServerProjectStartupContext = typeof ServerProjectStartupContext.Type;

export const ServerSetTenantProfileInput = Schema.Struct({
  projectId: ProjectId,
  label: TrimmedNonEmptyString,
  tenantId: TrimmedNonEmptyString,
  environmentId: Schema.optional(TrimmedNonEmptyString),
  environmentUrl: Schema.optional(TrimmedNonEmptyString),
});
export type ServerSetTenantProfileInput = typeof ServerSetTenantProfileInput.Type;

export const ServerClearTenantProfileInput = Schema.Struct({
  projectId: ProjectId,
});
export type ServerClearTenantProfileInput = typeof ServerClearTenantProfileInput.Type;

export const ServerUpsertKeybindingResult = Schema.Struct({
  keybindings: ResolvedKeybindingsConfig,
  issues: ServerConfigIssues,
});
export type ServerUpsertKeybindingResult = typeof ServerUpsertKeybindingResult.Type;

export const ServerConfigUpdatedPayload = Schema.Struct({
  issues: ServerConfigIssues,
  providers: ServerProviderStatuses,
});
export type ServerConfigUpdatedPayload = typeof ServerConfigUpdatedPayload.Type;

export const ServerSessionStateUpdatedPayload = AppSessionState;
export type ServerSessionStateUpdatedPayload = typeof ServerSessionStateUpdatedPayload.Type;

export const ServerTenantProfile = TenantProfile;
export type ServerTenantProfile = typeof ServerTenantProfile.Type;
