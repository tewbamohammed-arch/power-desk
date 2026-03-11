import { describe, expect, it } from "vitest";

import {
  DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX,
  type DesktopServerBootstrap,
} from "@t3tools/contracts";
import {
  createDesktopServerBootstrap,
  formatDesktopServerBootstrapStdout,
} from "./desktopServerBootstrap";

describe("desktopServerBootstrap", () => {
  it("builds loopback bootstrap metadata for desktop clients", () => {
    const bootstrap = createDesktopServerBootstrap({
      host: "127.0.0.1",
      port: 4010,
      authToken: "secret-token",
      stateDir: "C:/state",
    });

    expect(bootstrap.connection).toEqual({
      bindHost: "127.0.0.1",
      connectHost: "127.0.0.1",
      port: 4010,
      authToken: "secret-token",
      httpUrl: "http://127.0.0.1:4010",
      wsUrl: "ws://127.0.0.1:4010/?token=secret-token",
    } satisfies DesktopServerBootstrap["connection"]);
  });

  it("normalizes wildcard binds back to loopback for renderer connections", () => {
    const bootstrap = createDesktopServerBootstrap({
      host: "0.0.0.0",
      port: 3773,
      authToken: "desktop-auth",
      stateDir: "/tmp/state",
    });

    expect(bootstrap.connection.bindHost).toBe("0.0.0.0");
    expect(bootstrap.connection.connectHost).toBe("127.0.0.1");
    expect(bootstrap.connection.httpUrl).toBe("http://127.0.0.1:3773");
    expect(bootstrap.connection.wsUrl).toBe("ws://127.0.0.1:3773/?token=desktop-auth");
  });

  it("formats the stdout bootstrap line with the agreed prefix", () => {
    const line = formatDesktopServerBootstrapStdout(
      createDesktopServerBootstrap({
        host: "127.0.0.1",
        port: 3773,
        authToken: "abc123",
        stateDir: "/tmp/state",
      }),
    );

    expect(line.startsWith(DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX)).toBe(true);
    expect(() =>
      JSON.parse(line.slice(DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX.length)),
    ).not.toThrow();
  });
});
