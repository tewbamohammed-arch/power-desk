import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as NodeServices from "@effect/platform-node/NodeServices";
import { Effect, Exit, FileSystem, Path, Scope } from "effect";
import { describe, expect, it } from "vitest";

import {
  clearProjectStartupTenant,
  ensureProjectStartupContext,
  type ProjectStartupContextError,
  readProjectStartupContext,
  resolveProjectStartupContextPath,
  setProjectStartupTenant,
} from "./projectStartupContext";

async function runProjectStartupContextEffect<T>(
  effect: Effect.Effect<T, ProjectStartupContextError, FileSystem.FileSystem | Path.Path>,
): Promise<T> {
  const scope = await Effect.runPromise(Scope.make("sequential"));
  try {
    return await Effect.runPromise(effect.pipe(Effect.provide(NodeServices.layer), Scope.provide(scope)));
  } finally {
    await Effect.runPromise(Scope.close(scope, Exit.void));
  }
}

describe("projectStartupContext", () => {
  it("creates a project-owned config file when initializing a workspace", async () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "t3code-project-startup-"));

    try {
      const context = await runProjectStartupContextEffect(
        ensureProjectStartupContext({
          workspaceRoot,
          now: "2026-03-13T09:00:00.000Z",
        }),
      );

      expect(context.configPath).toBe(resolveProjectStartupContextPath(workspaceRoot));
      expect(context.document).toEqual({
        schemaVersion: 1,
        startupContext: {
          tenant: null,
        },
        updatedAt: "2026-03-13T09:00:00.000Z",
      });
      expect(JSON.parse(fs.readFileSync(context.configPath, "utf8"))).toEqual(context.document);
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  it("writes and clears tenant details in the project-owned config file", async () => {
    const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "t3code-project-startup-"));

    try {
      const saved = await runProjectStartupContextEffect(
        setProjectStartupTenant({
          workspaceRoot,
          tenant: {
            id: "tenant-1",
            label: "Contoso Dev",
            tenantId: "11111111-1111-1111-1111-111111111111",
            environmentUrl: "https://contoso.crm.dynamics.com",
          },
          now: "2026-03-13T09:05:00.000Z",
        }),
      );

      expect(saved.document.startupContext.tenant).toEqual({
        id: "tenant-1",
        label: "Contoso Dev",
        tenantId: "11111111-1111-1111-1111-111111111111",
        environmentUrl: "https://contoso.crm.dynamics.com",
        lastValidatedAt: "2026-03-13T09:05:00.000Z",
      });

      const cleared = await runProjectStartupContextEffect(
        clearProjectStartupTenant({
          workspaceRoot,
          now: "2026-03-13T09:10:00.000Z",
        }),
      );

      expect(cleared.document).toEqual({
        schemaVersion: 1,
        startupContext: {
          tenant: null,
        },
        updatedAt: "2026-03-13T09:10:00.000Z",
      });

      const reloaded = await runProjectStartupContextEffect(
        readProjectStartupContext({
          workspaceRoot,
        }),
      );
      expect(reloaded.document).toEqual(cleared.document);
    } finally {
      fs.rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });
});
