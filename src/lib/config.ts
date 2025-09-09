// Runtime configuration loader
// This loads configuration from /config.json at runtime instead of build time
// In Cloud Run, this file will be replaced with values from Secret Manager

let runtimeConfig: any = null;

export async function loadConfig() {
  if (!runtimeConfig) {
    try {
      const res = await fetch("/config.json");
      if (!res.ok) {
        throw new Error(`Failed to load config: ${res.status} ${res.statusText}`);
      }
      runtimeConfig = await res.json();
      console.log("Loaded runtime config:", runtimeConfig);
    } catch (error) {
      console.error("Failed to load runtime config:", error);
      throw new Error("Configuration could not be loaded. Please check if config.json is accessible.");
    }
  }
  return runtimeConfig;
}

export function getConfig(key: string) {
  if (!runtimeConfig) {
    throw new Error("Config not loaded yet. Call loadConfig() first.");
  }
  return runtimeConfig[key];
}

export function isConfigLoaded(): boolean {
  return runtimeConfig !== null;
}

