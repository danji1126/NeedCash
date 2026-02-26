declare global {
  interface CloudflareEnv {
    DB: D1Database;
    ASSETS: Fetcher;
    ADMIN_API_KEY: string;
  }
}

export {};
