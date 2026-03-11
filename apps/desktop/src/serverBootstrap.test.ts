import { describe, expect, it } from "vitest";

import { DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX } from "@t3tools/contracts";
import {
  DESKTOP_WS_URL_ARG_PREFIX,
  parseDesktopServerBootstrapLine,
  readDesktopWsUrlFromArgv,
} from "./serverBootstrap";

describe("serverBootstrap", () => {
  it("parses the shared desktop bootstrap line", () => {
    const bootstrapLine = `${DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX}${JSON.stringify({
      kind: "desktop-server-bootstrap",
      emittedAt: "2026-03-11T00:00:00.000Z",
      stateDir: "C:/state",
      connection: {
        bindHost: "127.0.0.1",
        connectHost: "127.0.0.1",
        port: 3773,
        authToken: "secret-token",
        httpUrl: "http://127.0.0.1:3773",
        wsUrl: "ws://127.0.0.1:3773/?token=secret-token",
      },
    })}`;

    expect(parseDesktopServerBootstrapLine(bootstrapLine)?.connection.wsUrl).toBe(
      "ws://127.0.0.1:3773/?token=secret-token",
    );
  });

  it("ignores non-bootstrap lines", () => {
    expect(parseDesktopServerBootstrapLine("INFO server started")).toBeNull();
  });

  it("rejects malformed bootstrap payloads", () => {
    expect(() => parseDesktopServerBootstrapLine(`${DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX}{`)).toThrow(
      "Desktop server bootstrap payload was not valid JSON",
    );
  });

  it("reads the desktop ws url from renderer argv", () => {
    expect(
      readDesktopWsUrlFromArgv([
        "electron",
        ".",
        `${DESKTOP_WS_URL_ARG_PREFIX}ws://127.0.0.1:3773/?token=abc`,
      ]),
    ).toBe("ws://127.0.0.1:3773/?token=abc");
  });

  it("returns null when the renderer launch args do not include a ws url", () => {
    expect(readDesktopWsUrlFromArgv(["electron", "."])).toBeNull();
  });
});
