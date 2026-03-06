-- 익명 방문자
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  visit_count INTEGER NOT NULL DEFAULT 1
);

-- 게임 점수 (리더보드)
CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  game_slug TEXT NOT NULL,
  score REAL NOT NULL,
  score_type TEXT NOT NULL,
  nickname TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (visitor_id) REFERENCES visitors(id)
);

CREATE INDEX IF NOT EXISTS idx_gs_game_score ON game_scores(game_slug, score);
CREATE INDEX IF NOT EXISTS idx_gs_visitor ON game_scores(visitor_id);
CREATE INDEX IF NOT EXISTS idx_gs_created ON game_scores(created_at);

-- 게임 세션 (조작 방지)
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  game TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 통계 수집 카운터 (KV 쓰기 제한 회피)
CREATE TABLE IF NOT EXISTS analytics_counters (
  date TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
