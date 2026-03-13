import type { ProjectId } from "@t3tools/contracts";
import { queryOptions } from "@tanstack/react-query";
import { ensureNativeApi } from "~/nativeApi";

export const serverQueryKeys = {
  all: ["server"] as const,
  config: () => ["server", "config"] as const,
  sessionState: () => ["server", "session-state"] as const,
  projectStartupContext: (projectId: string) =>
    ["server", "project-startup-context", projectId] as const,
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

export function serverProjectStartupContextQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: serverQueryKeys.projectStartupContext(projectId),
    queryFn: async () => {
      const api = ensureNativeApi();
      return api.server.getProjectStartupContext({ projectId: projectId as ProjectId });
    },
    staleTime: Infinity,
  });
}
