import path from "node:path";

import { IsoDateTime, ProjectId, TenantProfile } from "@t3tools/contracts";
import { Effect, FileSystem, Layer, Path, Ref, Schema, ServiceMap } from "effect";

import { ServerConfig } from "./config";

const StartupWorkspaceSelection = Schema.Struct({
  projectId: ProjectId,
  lastSelectedAt: IsoDateTime,
});
export type StartupWorkspaceSelection = typeof StartupWorkspaceSelection.Type;

export const PersistedStartupState = Schema.Struct({
  workspaceSelection: Schema.Union([StartupWorkspaceSelection, Schema.Null]),
  tenant: Schema.Union([TenantProfile, Schema.Null]),
  updatedAt: IsoDateTime,
});
export type PersistedStartupState = typeof PersistedStartupState.Type;

const PersistedStartupStateJson = Schema.fromJsonString(PersistedStartupState);

export class StartupStateError extends Schema.TaggedErrorClass<StartupStateError>()(
  "StartupStateError",
  {
  message: Schema.String,
  cause: Schema.optional(Schema.Defect),
  },
) {}

export interface StartupStateStoreShape {
  readonly get: Effect.Effect<PersistedStartupState, StartupStateError>;
  readonly selectWorkspace: (
    projectId: ProjectId,
    now?: string,
  ) => Effect.Effect<PersistedStartupState, StartupStateError>;
  readonly clearWorkspaceSelection: (
    now?: string,
  ) => Effect.Effect<PersistedStartupState, StartupStateError>;
  readonly setTenant: (
    tenant: TenantProfile,
    now?: string,
  ) => Effect.Effect<PersistedStartupState, StartupStateError>;
  readonly clearTenant: (now?: string) => Effect.Effect<PersistedStartupState, StartupStateError>;
}

export class StartupStateStore extends ServiceMap.Service<
  StartupStateStore,
  StartupStateStoreShape
>()("t3/startupState/StartupStateStore") {}

export function resolveStartupStatePath(stateDir: string): string {
  return path.join(stateDir, "startup-state.json");
}

function defaultStartupState(now: string): PersistedStartupState {
  return {
    workspaceSelection: null,
    tenant: null,
    updatedAt: now,
  };
}

const makeStartupStateStore: Effect.Effect<
  StartupStateStoreShape,
  StartupStateError,
  ServerConfig | FileSystem.FileSystem | Path.Path
> = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const effectPath = yield* Path.Path;
  const { stateDir } = yield* ServerConfig;
  const startupStatePath = resolveStartupStatePath(stateDir);

  const loadInitialState: Effect.Effect<PersistedStartupState, never> = Effect.gen(function* () {
    const now = new Date().toISOString();
    const raw = yield* fs.readFileString(startupStatePath).pipe(Effect.catch(() => Effect.succeed(null)));
    if (!raw) {
      return defaultStartupState(now);
    }

    return yield* Schema.decodeEffect(PersistedStartupStateJson)(raw).pipe(
      Effect.catch((cause) =>
        Effect.logWarning("failed to decode persisted startup state; using defaults", {
          path: startupStatePath,
          cause,
        }).pipe(Effect.as(defaultStartupState(now))),
      ),
    );
  });

  const ref = yield* Ref.make(yield* loadInitialState);

  const persistState = (
    state: PersistedStartupState,
  ): Effect.Effect<void, StartupStateError, never> => {
    const tempPath = `${startupStatePath}.${process.pid}.${Date.now()}.tmp`;
    const encoded = `${JSON.stringify(state, null, 2)}\n`;
    return fs.makeDirectory(effectPath.dirname(startupStatePath), { recursive: true }).pipe(
      Effect.flatMap(() => fs.writeFileString(tempPath, encoded)),
      Effect.flatMap(() => fs.rename(tempPath, startupStatePath)),
      Effect.mapError(
        (cause) =>
          new StartupStateError({
            message: "Failed to persist startup state",
            cause,
          }),
      ),
    );
  };

  const updateState = (
    updater: (current: PersistedStartupState) => PersistedStartupState,
  ): Effect.Effect<PersistedStartupState, StartupStateError, never> =>
    Ref.get(ref).pipe(
      Effect.map(updater),
      Effect.tap(persistState),
      Effect.tap((next) => Ref.set(ref, next)),
    );

  return {
    get: Ref.get(ref),
    selectWorkspace: (projectId, now = new Date().toISOString()) =>
      updateState((current) => ({
        workspaceSelection: {
          projectId,
          lastSelectedAt: now,
        },
        tenant: current.tenant,
        updatedAt: now,
      })),
    clearWorkspaceSelection: (now = new Date().toISOString()) =>
      updateState((current) => ({
        workspaceSelection: null,
        tenant: current.tenant,
        updatedAt: now,
      })),
    setTenant: (tenant, now = new Date().toISOString()) =>
      updateState((current) => ({
        workspaceSelection: current.workspaceSelection,
        tenant: {
          ...tenant,
          lastValidatedAt: tenant.lastValidatedAt ?? now,
        },
        updatedAt: now,
      })),
    clearTenant: (now = new Date().toISOString()) =>
      updateState((current) => ({
        workspaceSelection: current.workspaceSelection,
        tenant: null,
        updatedAt: now,
      })),
  } satisfies StartupStateStoreShape;
}).pipe(
  Effect.mapError(
    (cause) =>
      new StartupStateError({
        message: "Failed to initialize startup state store",
        cause,
      }),
  ),
);

export const StartupStateStoreLive = Layer.effect(StartupStateStore, makeStartupStateStore);
