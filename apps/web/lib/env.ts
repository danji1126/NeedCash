// lib/env.ts — Cloudflare 바인딩 접근 단일 소스

let localKVStore: Map<string, string> | null = null;

export function getDB(): D1Database {
  if (process.env.USE_LOCAL_DB === "true") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocalDB } = require("./local-db");
    return getLocalDB() as unknown as D1Database;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.DB;
}

export function getKV(): KVNamespace {
  if (process.env.USE_LOCAL_DB === "true") {
    if (!localKVStore) localKVStore = new Map<string, string>();
    return {
      get: async (key: string) => localKVStore!.get(key) ?? null,
      put: async (key: string, value: string) => {
        localKVStore!.set(key, value);
      },
      delete: async (key: string) => {
        localKVStore!.delete(key);
      },
    } as unknown as KVNamespace;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getCloudflareContext } = require("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  return env.SITE_CONFIG;
}
