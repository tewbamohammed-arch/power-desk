import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as NodeServices from "@effect/platform-node/NodeServices";
import { Effect, Exit, Layer, Scope } from "effect";
import { describe, expect, it } from "vitest";
import { ProjectId } from "@t3tools/contracts";

import { ServerConfig } from "./config";
import {
  resolveStartupStatePath,
  StartupStateError,
  StartupStateStore,
  StartupStateStoreLive,
} from "./startupState";

async function runWithStartupStateStore<T>(
  stateDir: string,
  effect: Effect.Effect<T, StartupStateError, StartupStateStore>,
): Promise<T> {
  const scope = await Effect.runPromise(Scope.make("sequential"));
  const serverConfigLayer = ServerConfig.layerTest(process.cwd(), stateDir);
  const dependenciesLayer = Layer.empty.pipe(
    Layer.provideMerge(NodeServices.layer),
    Layer.provideMerge(serverConfigLayer),
    Layer.provideMerge(
      StartupStateStoreLive.pipe(
        Layer.provideMerge(serverConfigLayer),
        Layer.provideMerge(NodeServices.layer),
      ),
    ),
  );

  try {
    return await Effect.runPromise(
      effect.pipe(
        Effect.provide(dependenciesLayer),
        Scope.provide(scope),
      ),
    );
  } finally {
    await Effect.runPromise(Scope.close(scope, Exit.void));
  }
}

describe("StartupStateStore", () => {
  it("persists workspace and tenant selections to the server state directory", async () => {
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "t3code-startup-state-"));

    try {
      const state = await runWithStartupStateStore(
        stateDir,
        Effect.gen(function* () {
          const startupStateStore = yield* StartupStateStore;
          yield* startupStateStore.selectWorkspace(
            ProjectId.makeUnsafe("project-1"),
            "2026-03-12T10:00:00.000Z",
          );
          yield* startupStateStore.setTenant(
            {
              id: "tenant-1",
              label: "Contoso Dev",
              tenantId: "11111111-1111-1111-1111-111111111111",
            },
            "2026-03-12T10:05:00.000Z",
          );
          return yield* startupStateStore.get;
        }),
      );

      expect(state).toEqual({
        workspaceSelection: {
          projectId: "project-1",
          lastSelectedAt: "2026-03-12T10:00:00.000Z",
        },
        tenant: {
          id: "tenant-1",
          label: "Contoso Dev",
          tenantId: "11111111-1111-1111-1111-111111111111",
          lastValidatedAt: "2026-03-12T10:05:00.000Z",
        },
        updatedAt: "2026-03-12T10:05:00.000Z",
      });

      const persistedRaw = fs.readFileSync(resolveStartupStatePath(stateDir), "utf8");
      expect(JSON.parse(persistedRaw)).toEqual(state);
    } finally {
      fs.rmSync(stateDir, { recursive: true, force: true });
    }
  });

  it("loads persisted startup state when the server restarts", async () => {
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "t3code-startup-state-"));

    try {
      await runWithStartupStateStore(
        stateDir,
        Effect.gen(function* () {
          const startupStateStore = yield* StartupStateStore;
          yield* startupStateStore.selectWorkspace(
            ProjectId.makeUnsafe("project-2"),
            "2026-03-12T11:00:00.000Z",
          );
          yield* startupStateStore.setTenant(
            {
              id: "tenant-2",
              label: "Contoso Prod",
              tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              environmentUrl: "https://contoso.crm.dynamics.com",
            },
            "2026-03-12T11:05:00.000Z",
          );
        }),
      );

      const restored = await runWithStartupStateStore(
        stateDir,
        Effect.gen(function* () {
          const startupStateStore = yield* StartupStateStore;
          return yield* startupStateStore.get;
        }),
      );

      expect(restored).toEqual({
        workspaceSelection: {
          projectId: "project-2",
          lastSelectedAt: "2026-03-12T11:00:00.000Z",
        },
        tenant: {
          id: "tenant-2",
          label: "Contoso Prod",
          tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          environmentUrl: "https://contoso.crm.dynamics.com",
          lastValidatedAt: "2026-03-12T11:05:00.000Z",
        },
        updatedAt: "2026-03-12T11:05:00.000Z",
      });
    } finally {
      fs.rmSync(stateDir, { recursive: true, force: true });
    }
  });
});
