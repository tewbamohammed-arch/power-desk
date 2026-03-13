import { useCallback, useSyncExternalStore } from "react";
import {
  AppSettings as AppSettingsSchema,
  MAX_CUSTOM_MODEL_LENGTH,
  type AppSettings,
  type ProviderKind,
} from "@t3tools/contracts";
import { Schema } from "effect";
import { getDefaultModel, getModelOptions, normalizeModelSlug } from "@t3tools/shared/model";

import { readNativeApi } from "./nativeApi";

export { MAX_CUSTOM_MODEL_LENGTH };

const MAX_CUSTOM_MODEL_COUNT = 32;
const BUILT_IN_MODEL_SLUGS_BY_PROVIDER: Record<ProviderKind, ReadonlySet<string>> = {
  codex: new Set(getModelOptions("codex").map((option) => option.slug)),
};

export interface AppModelOption {
  slug: string;
  name: string;
  isCustom: boolean;
}

const DEFAULT_APP_SETTINGS = AppSettingsSchema.makeUnsafe({});

type AppSettingsStoreSnapshot = {
  settings: AppSettings;
  configPath: string | null;
  updatedAt: string | null;
  hydrated: boolean;
};

let listeners: Array<() => void> = [];
let loadPromise: Promise<void> | null = null;
let writeGeneration = 0;
let cachedSnapshot: AppSettingsStoreSnapshot = {
  settings: DEFAULT_APP_SETTINGS,
  configPath: null,
  updatedAt: null,
  hydrated: false,
};

export function normalizeCustomModelSlugs(
  models: Iterable<string | null | undefined>,
  provider: ProviderKind = "codex",
): string[] {
  const normalizedModels: string[] = [];
  const seen = new Set<string>();
  const builtInModelSlugs = BUILT_IN_MODEL_SLUGS_BY_PROVIDER[provider];

  for (const candidate of models) {
    const normalized = normalizeModelSlug(candidate, provider);
    if (
      !normalized ||
      normalized.length > MAX_CUSTOM_MODEL_LENGTH ||
      builtInModelSlugs.has(normalized) ||
      seen.has(normalized)
    ) {
      continue;
    }

    seen.add(normalized);
    normalizedModels.push(normalized);
    if (normalizedModels.length >= MAX_CUSTOM_MODEL_COUNT) {
      break;
    }
  }

  return normalizedModels;
}

function normalizeAppSettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    customCodexModels: normalizeCustomModelSlugs(settings.customCodexModels, "codex"),
  };
}

function setSnapshot(next: Partial<AppSettingsStoreSnapshot> & { settings: AppSettings }): void {
  cachedSnapshot = {
    ...cachedSnapshot,
    ...next,
    settings: normalizeAppSettings(next.settings),
  };
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

async function hydrateFromServer(): Promise<void> {
  if (typeof window === "undefined" || cachedSnapshot.hydrated) {
    return;
  }
  if (loadPromise) {
    await loadPromise;
    return;
  }

  const api = readNativeApi();
  if (!api) {
    return;
  }

  loadPromise = api.server
    .getUserSettings()
    .then((response) => {
      setSnapshot({
        settings: response.settings,
        configPath: response.configPath,
        updatedAt: response.updatedAt,
        hydrated: true,
      });
      emitChange();
    })
    .catch((error) => {
      console.warn("Failed to hydrate app settings from server.", error);
    })
    .finally(() => {
      loadPromise = null;
    });

  await loadPromise;
}

function persistSettings(next: AppSettings, previous: AppSettingsStoreSnapshot): void {
  const api = readNativeApi();
  if (!api) {
    return;
  }

  const generation = ++writeGeneration;
  void api.server
    .updateUserSettings(next)
    .then((response) => {
      if (generation !== writeGeneration) {
        return;
      }
      setSnapshot({
        settings: response.settings,
        configPath: response.configPath,
        updatedAt: response.updatedAt,
        hydrated: true,
      });
      emitChange();
    })
    .catch((error) => {
      if (generation !== writeGeneration) {
        return;
      }
      console.warn("Failed to persist app settings to server.", error);
      cachedSnapshot = previous;
      emitChange();
    });
}

function getSnapshot(): AppSettingsStoreSnapshot {
  if (typeof window !== "undefined" && !cachedSnapshot.hydrated) {
    void hydrateFromServer();
  }
  return cachedSnapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  if (typeof window !== "undefined" && !cachedSnapshot.hydrated) {
    void hydrateFromServer();
  }
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
}

export function getAppSettingsSnapshot(): AppSettings {
  return getSnapshot().settings;
}

export function getAppSettingsConfigPath(): string | null {
  return getSnapshot().configPath;
}

export function getAppModelOptions(
  provider: ProviderKind,
  customModels: readonly string[],
  selectedModel?: string | null,
): AppModelOption[] {
  const options: AppModelOption[] = getModelOptions(provider).map(({ slug, name }) => ({
    slug,
    name,
    isCustom: false,
  }));
  const seen = new Set(options.map((option) => option.slug));

  for (const slug of normalizeCustomModelSlugs(customModels, provider)) {
    if (seen.has(slug)) {
      continue;
    }

    seen.add(slug);
    options.push({
      slug,
      name: slug,
      isCustom: true,
    });
  }

  const normalizedSelectedModel = normalizeModelSlug(selectedModel, provider);
  if (normalizedSelectedModel && !seen.has(normalizedSelectedModel)) {
    options.push({
      slug: normalizedSelectedModel,
      name: normalizedSelectedModel,
      isCustom: true,
    });
  }

  return options;
}

export function resolveAppModelSelection(
  provider: ProviderKind,
  customModels: readonly string[],
  selectedModel: string | null | undefined,
): string {
  const options = getAppModelOptions(provider, customModels, selectedModel);
  const trimmedSelectedModel = selectedModel?.trim();
  if (trimmedSelectedModel) {
    const direct = options.find((option) => option.slug === trimmedSelectedModel);
    if (direct) {
      return direct.slug;
    }

    const byName = options.find(
      (option) => option.name.toLowerCase() === trimmedSelectedModel.toLowerCase(),
    );
    if (byName) {
      return byName.slug;
    }
  }

  const normalizedSelectedModel = normalizeModelSlug(selectedModel, provider);
  if (!normalizedSelectedModel) {
    return getDefaultModel(provider);
  }

  return (
    options.find((option) => option.slug === normalizedSelectedModel)?.slug ??
    getDefaultModel(provider)
  );
}

export function getSlashModelOptions(
  provider: ProviderKind,
  customModels: readonly string[],
  query: string,
  selectedModel?: string | null,
): AppModelOption[] {
  const normalizedQuery = query.trim().toLowerCase();
  const options = getAppModelOptions(provider, customModels, selectedModel);
  if (!normalizedQuery) {
    return options;
  }

  return options.filter((option) => {
    const searchSlug = option.slug.toLowerCase();
    const searchName = option.name.toLowerCase();
    return searchSlug.includes(normalizedQuery) || searchName.includes(normalizedQuery);
  });
}

export function useAppSettings() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => ({
    settings: DEFAULT_APP_SETTINGS,
    configPath: null,
    updatedAt: null,
    hydrated: false,
  }));

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    const previous = cachedSnapshot;
    const next = normalizeAppSettings(
      Schema.decodeSync(AppSettingsSchema)({
        ...cachedSnapshot.settings,
        ...patch,
      }),
    );
    setSnapshot({
      settings: next,
      hydrated: true,
    });
    emitChange();
    persistSettings(next, previous);
  }, []);

  const resetSettings = useCallback(() => {
    const previous = cachedSnapshot;
    setSnapshot({
      settings: DEFAULT_APP_SETTINGS,
      hydrated: true,
    });
    emitChange();
    persistSettings(DEFAULT_APP_SETTINGS, previous);
  }, []);

  return {
    settings: snapshot.settings,
    configPath: snapshot.configPath,
    updatedAt: snapshot.updatedAt,
    hydrated: snapshot.hydrated,
    updateSettings,
    resetSettings,
    defaults: DEFAULT_APP_SETTINGS,
  } as const;
}
