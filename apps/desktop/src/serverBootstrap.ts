import {
  DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX,
  DesktopServerBootstrap,
  type DesktopServerBootstrap as DesktopServerBootstrapShape,
} from "@t3tools/contracts";
import { decodeJsonResult, formatSchemaError } from "@t3tools/shared/schemaJson";
import { Result } from "effect";
import { DESKTOP_WS_URL_ARG_PREFIX, readDesktopWsUrlFromArgv } from "./desktopWsUrlArg";

const decodeDesktopServerBootstrap = decodeJsonResult(DesktopServerBootstrap);

export function parseDesktopServerBootstrapLine(
  line: string,
): DesktopServerBootstrapShape | null {
  if (!line.startsWith(DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX)) {
    return null;
  }

  const payload = line.slice(DESKTOP_SERVER_BOOTSTRAP_STDOUT_PREFIX.length).trim();
  if (payload.length === 0) {
    throw new Error("Desktop server bootstrap payload was empty.");
  }

  try {
    JSON.parse(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Desktop server bootstrap payload was not valid JSON: ${message}`);
  }

  const decoded = decodeDesktopServerBootstrap(payload);
  if (Result.isFailure(decoded)) {
    throw new Error(
      `Desktop server bootstrap payload did not match the shared contract: ${formatSchemaError(decoded.failure)}`,
    );
  }

  return decoded.success;
}
export { DESKTOP_WS_URL_ARG_PREFIX, readDesktopWsUrlFromArgv };
