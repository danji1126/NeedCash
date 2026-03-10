import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "local.sqlite");

class LocalD1PreparedStatement {
  private db: Database.Database;
  private sql: string;
  private params: unknown[] = [];

  constructor(db: Database.Database, sql: string) {
    this.db = db;
    this.sql = sql;
  }

  bind(...values: unknown[]): this {
    this.params = values;
    return this;
  }

  async all<T>(): Promise<{ results: T[] }> {
    const stmt = this.db.prepare(this.sql);
    const results = stmt.all(...this.params) as T[];
    return { results };
  }

  async first<T>(): Promise<T | null> {
    const stmt = this.db.prepare(this.sql);
    const result = stmt.get(...this.params) as T | undefined;
    return (result as T) ?? null;
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const stmt = this.db.prepare(this.sql);
    const info = stmt.run(...this.params);
    return { meta: { changes: info.changes } };
  }
}

class LocalD1Database {
  private db: Database.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
  }

  prepare(sql: string): LocalD1PreparedStatement {
    return new LocalD1PreparedStatement(this.db, sql);
  }

  async batch(
    statements: LocalD1PreparedStatement[]
  ): Promise<{ results: unknown[] }> {
    const results: unknown[] = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return { results };
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }
}

let instance: LocalD1Database | null = null;

export function getLocalDB(): LocalD1Database {
  if (!instance) {
    instance = new LocalD1Database(DB_PATH);
    runMigrations(instance);
  }
  return instance;
}

function runMigrations(db: LocalD1Database): void {
  const migrationsDir = path.join(process.cwd(), "migrations");

  if (!fs.existsSync(migrationsDir)) return;

  // _migrations 추적 테이블 생성 (멱등)
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    // 이미 적용된 마이그레이션 스킵 (better-sqlite3 직접 접근으로 동기 확인)
    const dbRaw = (db as unknown as { db: import("better-sqlite3").Database }).db;
    const already = dbRaw.prepare("SELECT name FROM _migrations WHERE name = ?").get(file);
    if (already) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    try {
      db.exec(sql);
      dbRaw.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
    } catch {
      // 이미 존재하는 테이블/데이터는 무시 (CREATE IF NOT EXISTS, UNIQUE 충돌)
    }
  }
}
