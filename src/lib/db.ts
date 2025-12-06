import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "cafe.db");
const db = new Database(dbPath);

// WAL 모드 활성화 (성능 향상 + 동시성 지원)
db.pragma("journal_mode = WAL");

// 테이블 초기화
db.exec(`
  -- 게시글 테이블
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    authorId TEXT NOT NULL,
    authorName TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    viewCount INTEGER DEFAULT 0,
    commentCount INTEGER DEFAULT 0
  );

  -- 댓글 테이블
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postId INTEGER NOT NULL,
    authorId TEXT NOT NULL,
    authorName TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
  );

  -- 인덱스 생성
  CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId);
  CREATE INDEX IF NOT EXISTS idx_comments_createdAt ON comments(createdAt);
`);

console.log("✅ 카페 데이터베이스 초기화 완료:", dbPath);

export function getDB() {
  return db;
}

export default db;
