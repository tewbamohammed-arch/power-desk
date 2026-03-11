import {
  DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX,
  type DesktopServerBootstrap,
} from "@t3tools/contracts";
import type { ServerConfigShape } from "./config";

const DEFAULT_DESKTOP_CONNECT_HOST = "127.0.0.1";

function isWildcardHost(host: string | undefined): boolean {
  return host === "0.0.0.0" || host === "::" || host === "[::]";
}

function formatHostForUrl(host: string): string {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

export function createDesktopServerBootstrap(
  config: Pick<ServerConfigShape, "host" | "port" | "stateDir"> & { readonly authToken: string },
): DesktopServerBootstrap {
  const bindHost = config.host ?? DEFAULT_DESKTOP_CONNECT_HOST;
  const connectHost = isWildcardHost(bindHost) ? DEFAULT_DESKTOP_CONNECT_HOST : bindHost;
  const formattedConnectHost = formatHostForUrl(connectHost);

  return {
    kind: "desktop-server-bootstrap",
    emittedAt: new Date().toISOString(),
    stateDir: config.stateDir,
    connection: {
      bindHost,
      connectHost,
      port: config.port,
      authToken: config.authToken,
      httpUrl: `http://${formattedConnectHost}:${config.port}`,
      wsUrl: `ws://${formattedConnectHost}:${config.port}/?token=${encodeURIComponent(config.authToken)}`,
    },
  };
}

export function formatDesktopServerBootstrapStdout(
  bootstrap: DesktopServerBootstrap,
): string {
  return `${DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX}${JSON.stringify(bootstrap)}`;
}
