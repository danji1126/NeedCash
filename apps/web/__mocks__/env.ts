import { vi } from "vitest";

// ─── In-Memory KV Store ───
let kvStore = new Map<string, string>();

export const mockKV: KVNamespace = {
  get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
  put: vi.fn(async (key: string, value: string) => { kvStore.set(key, value); }),
  delete: vi.fn(async (key: string) => { kvStore.delete(key); }),
  list: vi.fn(async () => ({ keys: [], list_complete: true, cursor: "" })),
  getWithMetadata: vi.fn(async () => ({ value: null, metadata: null })),
} as unknown as KVNamespace;

// ─── D1 Database Stub ───
function createMockStatement() {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue({ results: [] }),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({ meta: { changes: 0 } }),
  };
  stmt.bind.mockReturnValue(stmt);
  return stmt;
}

export const mockDB: D1Database = {
  prepare: vi.fn(() => createMockStatement()),
  batch: vi.fn(async (stmts: unknown[]) => ({
    results: stmts.map(() => ({ meta: { changes: 0 } })),
  })),
  exec: vi.fn(),
  dump: vi.fn(),
} as unknown as D1Database;

// ─── Export ───
export const getDB = vi.fn((): D1Database => mockDB);
export const getKV = vi.fn((): KVNamespace => mockKV);

// ─── 테스트 유틸리티 ───
export function resetMocks(): void {
  kvStore = new Map<string, string>();
  (mockKV.get as ReturnType<typeof vi.fn>).mockImplementation(
    async (key: string) => kvStore.get(key) ?? null
  );
  (mockKV.put as ReturnType<typeof vi.fn>).mockImplementation(
    async (key: string, value: string) => { kvStore.set(key, value); }
  );
  vi.clearAllMocks();
}

export function seedKV(entries: Record<string, string>): void {
  for (const [key, value] of Object.entries(entries)) kvStore.set(key, value);
}

export function resetToLocalDB(): void {
  const { getLocalDB } = require("../lib/local-db");
  getDB.mockReturnValue(getLocalDB() as unknown as D1Database);
}

export function mockDBFirstResult(result: unknown): void {
  const stmt = createMockStatement();
  stmt.first.mockResolvedValue(result);
  (mockDB.prepare as ReturnType<typeof vi.fn>).mockReturnValue(stmt);
}

export function mockDBAllResults(results: unknown[]): void {
  const stmt = createMockStatement();
  stmt.all.mockResolvedValue({ results });
  (mockDB.prepare as ReturnType<typeof vi.fn>).mockReturnValue(stmt);
}
