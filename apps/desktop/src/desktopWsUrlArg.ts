export const DESKTOP_WS_URL_ARG_PREFIX = "--t3-ws-url=";

export function readDesktopWsUrlFromArgv(argv: readonly string[]): string | null {
  const argument = argv.find((value) => value.startsWith(DESKTOP_WS_URL_ARG_PREFIX));
  if (!argument) {
    return null;
  }

  const wsUrl = argument.slice(DESKTOP_WS_URL_ARG_PREFIX.length).trim();
  return wsUrl.length > 0 ? wsUrl : null;
}
