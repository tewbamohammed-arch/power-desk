import path from "node:path";

import { IsoDateTime, TenantProfile } from "@t3tools/contracts";
import { Effect, FileSystem, Path, Schema } from "effect";

export const PROJECT_STARTUP_CONTEXT_FILENAME = ".power-desk.config.json";

export const ProjectStartupContextDocument = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  startupContext: Schema.Struct({
    tenant: Schema.Union([TenantProfile, Schema.Null]),
  }),
  updatedAt: IsoDateTime,
});
export type ProjectStartupContextDocument = typeof ProjectStartupContextDocument.Type;

const ProjectStartupContextDocumentJson = Schema.fromJsonString(ProjectStartupContextDocument);

export class ProjectStartupContextError extends Schema.TaggedErrorClass<ProjectStartupContextError>()(
  "ProjectStartupContextError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect),
  },
) {}

export function resolveProjectStartupContextPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, PROJECT_STARTUP_CONTEXT_FILENAME);
}

function defaultProjectStartupContext(now: string): ProjectStartupContextDocument {
  return {
    schemaVersion: 1,
    startupContext: {
      tenant: null,
    },
    updatedAt: now,
  };
}

const persistProjectStartupContext = (input: {
  readonly pathService: Path.Path;
  readonly fileSystem: FileSystem.FileSystem;
  readonly configPath: string;
  readonly document: ProjectStartupContextDocument;
}): Effect.Effect<void, ProjectStartupContextError, never> => {
  const tempPath = `${input.configPath}.${process.pid}.${Date.now()}.tmp`;
  const encoded = `${JSON.stringify(input.document, null, 2)}\n`;
  return input.fileSystem.makeDirectory(input.pathService.dirname(input.configPath), {
    recursive: true,
  }).pipe(
    Effect.flatMap(() => input.fileSystem.writeFileString(tempPath, encoded)),
    Effect.flatMap(() => input.fileSystem.rename(tempPath, input.configPath)),
    Effect.mapError(
      (cause) =>
        new ProjectStartupContextError({
          message: "Failed to persist project startup context",
          cause,
        }),
    ),
  );
};

export const readProjectStartupContext = Effect.fn(function* (input: {
  readonly workspaceRoot: string;
}) {
  const fileSystem = yield* FileSystem.FileSystem;
  const configPath = resolveProjectStartupContextPath(input.workspaceRoot);
  const now = new Date().toISOString();
  const raw = yield* fileSystem
    .readFileString(configPath)
    .pipe(Effect.catch(() => Effect.succeed(null)));

  if (!raw) {
    return {
      configPath,
      document: defaultProjectStartupContext(now),
    };
  }

  const document = yield* Schema.decodeEffect(ProjectStartupContextDocumentJson)(raw).pipe(
    Effect.catch((cause) =>
      Effect.logWarning("failed to decode project startup context; using defaults", {
        configPath,
        cause,
      }).pipe(Effect.as(defaultProjectStartupContext(now))),
    ),
  );

  return {
    configPath,
    document,
  };
});

export const ensureProjectStartupContext = Effect.fn(function* (input: {
  readonly workspaceRoot: string;
  readonly now?: string;
}) {
  const fileSystem = yield* FileSystem.FileSystem;
  const pathService = yield* Path.Path;
  const { configPath, document } = yield* readProjectStartupContext({
    workspaceRoot: input.workspaceRoot,
  });
  const exists = yield* fileSystem.exists(configPath).pipe(Effect.orElseSucceed(() => false));
  if (exists) {
    return {
      configPath,
      document,
    };
  }

  const seededDocument = {
    ...document,
    updatedAt: input.now ?? document.updatedAt,
  } satisfies ProjectStartupContextDocument;
  yield* persistProjectStartupContext({
    fileSystem,
    pathService,
    configPath,
    document: seededDocument,
  });
  return {
    configPath,
    document: seededDocument,
  };
});

const updateProjectStartupContext = Effect.fn(function* (input: {
  readonly workspaceRoot: string;
  readonly updater: (
    current: ProjectStartupContextDocument,
  ) => ProjectStartupContextDocument;
}) {
  const fileSystem = yield* FileSystem.FileSystem;
  const pathService = yield* Path.Path;
  const current = yield* ensureProjectStartupContext({
    workspaceRoot: input.workspaceRoot,
  });
  const next = input.updater(current.document);
  yield* persistProjectStartupContext({
    fileSystem,
    pathService,
    configPath: current.configPath,
    document: next,
  });
  return {
    configPath: current.configPath,
    document: next,
  };
});

export const setProjectStartupTenant = Effect.fn(function* (input: {
  readonly workspaceRoot: string;
  readonly tenant: TenantProfile;
  readonly now?: string;
}) {
  const now = input.now ?? new Date().toISOString();
  return yield* updateProjectStartupContext({
    workspaceRoot: input.workspaceRoot,
    updater: (current) => ({
      schemaVersion: current.schemaVersion,
      startupContext: {
        tenant: {
          ...input.tenant,
          lastValidatedAt: input.tenant.lastValidatedAt ?? now,
        },
      },
      updatedAt: now,
    }),
  });
});

export const clearProjectStartupTenant = Effect.fn(function* (input: {
  readonly workspaceRoot: string;
  readonly now?: string;
}) {
  const now = input.now ?? new Date().toISOString();
  return yield* updateProjectStartupContext({
    workspaceRoot: input.workspaceRoot,
    updater: (current) => ({
      schemaVersion: current.schemaVersion,
      startupContext: {
        tenant: null,
      },
      updatedAt: now,
    }),
  });
});
