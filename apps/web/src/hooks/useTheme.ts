import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { ThemePreference } from "@t3tools/contracts";

import { getAppSettingsSnapshot, useAppSettings } from "../appSettings";

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

type ThemeSnapshot = {
  systemDark: boolean;
};

let listeners: Array<() => void> = [];
let lastSnapshot: ThemeSnapshot | null = null;

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getSystemDark(): boolean {
  return window.matchMedia(MEDIA_QUERY).matches;
}

function applyTheme(theme: ThemePreference, suppressTransitions = false) {
  if (suppressTransitions) {
    document.documentElement.classList.add("no-transitions");
  }
  const isDark = theme === "dark" || (theme === "system" && getSystemDark());
  document.documentElement.classList.toggle("dark", isDark);
  if (suppressTransitions) {
    document.documentElement.offsetHeight;
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("no-transitions");
    });
  }
}

// Apply immediately on module load to minimize theme flash before hydration.
applyTheme(getAppSettingsSnapshot().theme);

function getSnapshot(): ThemeSnapshot {
  const systemDark = getSystemDark();
  if (lastSnapshot && lastSnapshot.systemDark === systemDark) {
    return lastSnapshot;
  }

  lastSnapshot = { systemDark };
  return lastSnapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener);

  const mq = window.matchMedia(MEDIA_QUERY);
  const handleChange = () => {
    if (getAppSettingsSnapshot().theme === "system") {
      applyTheme("system", true);
    }
    emitChange();
  };
  mq.addEventListener("change", handleChange);

  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
    mq.removeEventListener("change", handleChange);
  };
}

export function useTheme() {
  const { settings, updateSettings } = useAppSettings();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => ({
    systemDark: false,
  }));
  const theme = settings.theme;

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (snapshot.systemDark ? "dark" : "light") : theme;

  const setTheme = useCallback(
    (next: ThemePreference) => {
      updateSettings({ theme: next });
      applyTheme(next, true);
    },
    [updateSettings],
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme, snapshot.systemDark]);

  return { theme, setTheme, resolvedTheme } as const;
}
