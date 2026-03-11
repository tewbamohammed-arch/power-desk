import { queryOptions } from "@tanstack/react-query";
import { ensureNativeApi } from "~/nativeApi";

export const serverQueryKeys = {
  all: ["server"] as const,
  config: () => ["server", "config"] as const,
  sessionState: () => ["server", "session-state"] as const,
};

export function serverConfigQueryOptions() {
  return queryOptions({
    queryKey: serverQueryKeys.config(),
    queryFn: async () => {
      const api = ensureNativeApi();
      return api.server.getConfig();
    },
    staleTime: Infinity,
  });
}

export function serverSessionStateQueryOptions() {
  return queryOptions({
    queryKey: serverQueryKeys.sessionState(),
    queryFn: async () => {
      const api = ensureNativeApi();
      return api.server.getSessionState();
    },
    staleTime: Infinity,
  });
}
