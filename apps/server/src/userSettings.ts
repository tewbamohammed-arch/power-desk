import path from "node:path";

import { AppSettings, IsoDateTime, type ServerUserSettings } from "@t3tools/contracts";
import { Effect, FileSystem, Layer, Path, Ref, Schema, ServiceMap } from "effect";

import { ServerConfig } from "./config";

export const PersistedUserSettingsDocument = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  settings: AppSettings,
  updatedAt: IsoDateTime,
});
export type PersistedUserSettingsDocument = typeof PersistedUserSettingsDocument.Type;

const PersistedUserSettingsDocumentJson = Schema.fromJsonString(PersistedUserSettingsDocument);

export class UserSettingsError extends Schema.TaggedErrorClass<UserSettingsError>()(
  "UserSettingsError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect),
  },
) {}

export interface UserSettingsStoreShape {
  readonly get: Effect.Effect<ServerUserSettings, UserSettingsError>;
  readonly update: (
    settings: typeof AppSettings.Type,
    now?: string,
  ) => Effect.Effect<ServerUserSettings, UserSettingsError>;
}

export class UserSettingsStore extends ServiceMap.Service<
  UserSettingsStore,
  UserSettingsStoreShape
>()("t3/userSettings/UserSettingsStore") {}

export function resolveUserSettingsPath(stateDir: string): string {
  return path.join(stateDir, "settings.json");
}

function defaultUserSettingsDocument(now: string): PersistedUserSettingsDocument {
  return {
    schemaVersion: 1,
    settings: AppSettings.makeUnsafe({}),
    updatedAt: now,
  };
}

function toServerUserSettings(configPath: string, document: PersistedUserSettingsDocument): ServerUserSettings {
  return {
    configPath,
    settings: document.settings,
    updatedAt: document.updatedAt,
  };
}

const makeUserSettingsStore: Effect.Effect<
  UserSettingsStoreShape,
  UserSettingsError,
  ServerConfig | FileSystem.FileSystem | Path.Path
> = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const pathService = yield* Path.Path;
  const { stateDir } = yield* ServerConfig;
  const settingsPath = resolveUserSettingsPath(stateDir);

  const loadInitialDocument: Effect.Effect<PersistedUserSettingsDocument, never> = Effect.gen(
    function* () {
      const now = new Date().toISOString();
      const raw = yield* fs.readFileString(settingsPath).pipe(Effect.catch(() => Effect.succeed(null)));
      if (!raw) {
        return defaultUserSettingsDocument(now);
      }

      return yield* Schema.decodeEffect(PersistedUserSettingsDocumentJson)(raw).pipe(
        Effect.catch((cause) =>
          Effect.logWarning("failed to decode persisted user settings; using defaults", {
            path: settingsPath,
            cause,
          }).pipe(Effect.as(defaultUserSettingsDocument(now))),
        ),
      );
    },
  );

  const ref = yield* Ref.make(yield* loadInitialDocument);

  const persistDocument = (
    document: PersistedUserSettingsDocument,
  ): Effect.Effect<void, UserSettingsError, never> => {
    const tempPath = `${settingsPath}.${process.pid}.${Date.now()}.tmp`;
    const encoded = `${JSON.stringify(document, null, 2)}\n`;
    return fs.makeDirectory(pathService.dirname(settingsPath), { recursive: true }).pipe(
      Effect.flatMap(() => fs.writeFileString(tempPath, encoded)),
      Effect.flatMap(() => fs.rename(tempPath, settingsPath)),
      Effect.mapError(
        (cause) =>
          new UserSettingsError({
            message: "Failed to persist user settings",
            cause,
          }),
      ),
    );
  };

  const updateDocument = (
    updater: (current: PersistedUserSettingsDocument) => PersistedUserSettingsDocument,
  ): Effect.Effect<ServerUserSettings, UserSettingsError, never> =>
    Ref.get(ref).pipe(
      Effect.map(updater),
      Effect.tap(persistDocument),
      Effect.tap((next) => Ref.set(ref, next)),
      Effect.map((next) => toServerUserSettings(settingsPath, next)),
    );

  return {
    get: Ref.get(ref).pipe(Effect.map((document) => toServerUserSettings(settingsPath, document))),
    update: (settings, now = new Date().toISOString()) =>
      updateDocument((current) => ({
        schemaVersion: current.schemaVersion,
        settings,
        updatedAt: now,
      })),
  } satisfies UserSettingsStoreShape;
}).pipe(
  Effect.mapError(
    (cause) =>
      new UserSettingsError({
        message: "Failed to initialize user settings store",
        cause,
      }),
  ),
);

export const UserSettingsStoreLive = Layer.effect(UserSettingsStore, makeUserSettingsStore);
