-- Phase 3: 보안 강화 - game_sessions 복원 + rate_limits 생성

-- SEC-09: game_sessions 복원 (0004에서 삭제됨, 서버 검증에 필요)
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  game TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- SEC-10: 원자적 rate limit (KV 대신 D1 기반)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL
);
