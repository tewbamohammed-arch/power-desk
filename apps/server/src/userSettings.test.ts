import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as NodeServices from "@effect/platform-node/NodeServices";
import { Effect, Exit, Layer, Scope } from "effect";
import { describe, expect, it } from "vitest";

import { ServerConfig } from "./config";
import {
  resolveUserSettingsPath,
  UserSettingsError,
  UserSettingsStore,
  UserSettingsStoreLive,
} from "./userSettings";

async function runWithUserSettingsStore<T>(
  stateDir: string,
  effect: Effect.Effect<T, UserSettingsError, UserSettingsStore>,
): Promise<T> {
  const scope = await Effect.runPromise(Scope.make("sequential"));
  const serverConfigLayer = ServerConfig.layerTest(process.cwd(), stateDir);
  const dependenciesLayer = Layer.empty.pipe(
    Layer.provideMerge(NodeServices.layer),
    Layer.provideMerge(serverConfigLayer),
    Layer.provideMerge(
      UserSettingsStoreLive.pipe(
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

describe("UserSettingsStore", () => {
  it("persists non-secret app settings to the server state directory", async () => {
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "t3code-user-settings-"));

    try {
      const state = await runWithUserSettingsStore(
        stateDir,
        Effect.gen(function* () {
          const userSettingsStore = yield* UserSettingsStore;
          return yield* userSettingsStore.update(
            {
              theme: "dark",
              codexBinaryPath: "C:/Tools/codex.exe",
              codexHomePath: "C:/Users/TAR/.codex",
              confirmThreadDelete: false,
              enableAssistantStreaming: true,
              customCodexModels: ["custom/internal-model"],
            },
            "2026-03-14T08:00:00.000Z",
          );
        }),
      );

      expect(state).toEqual({
        configPath: resolveUserSettingsPath(stateDir),
        settings: {
          theme: "dark",
          codexBinaryPath: "C:/Tools/codex.exe",
          codexHomePath: "C:/Users/TAR/.codex",
          confirmThreadDelete: false,
          enableAssistantStreaming: true,
          customCodexModels: ["custom/internal-model"],
        },
        updatedAt: "2026-03-14T08:00:00.000Z",
      });

      expect(JSON.parse(fs.readFileSync(resolveUserSettingsPath(stateDir), "utf8"))).toEqual({
        schemaVersion: 1,
        settings: state.settings,
        updatedAt: "2026-03-14T08:00:00.000Z",
      });
    } finally {
      fs.rmSync(stateDir, { recursive: true, force: true });
    }
  });

  it("loads persisted user settings after restart", async () => {
    const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "t3code-user-settings-"));

    try {
      await runWithUserSettingsStore(
        stateDir,
        Effect.gen(function* () {
          const userSettingsStore = yield* UserSettingsStore;
          yield* userSettingsStore.update(
            {
              theme: "light",
              codexBinaryPath: "",
              codexHomePath: "",
              confirmThreadDelete: true,
              enableAssistantStreaming: false,
              customCodexModels: ["tenant/custom-model"],
            },
            "2026-03-14T08:05:00.000Z",
          );
        }),
      );

      const restored = await runWithUserSettingsStore(
        stateDir,
        Effect.gen(function* () {
          const userSettingsStore = yield* UserSettingsStore;
          return yield* userSettingsStore.get;
        }),
      );

      expect(restored).toEqual({
        configPath: resolveUserSettingsPath(stateDir),
        settings: {
          theme: "light",
          codexBinaryPath: "",
          codexHomePath: "",
          confirmThreadDelete: true,
          enableAssistantStreaming: false,
          customCodexModels: ["tenant/custom-model"],
        },
        updatedAt: "2026-03-14T08:05:00.000Z",
      });
    } finally {
      fs.rmSync(stateDir, { recursive: true, force: true });
    }
  });
});
