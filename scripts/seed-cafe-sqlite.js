/**
 * 카페 SQLite DB를 기본 데이터로 시드합니다.
 * - posts/comments 테이블이 비어 있을 때만 삽입
 * - 기존 데이터가 있으면 아무 작업도 하지 않습니다.
 */
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const dbPath = path.join(DATA_DIR, "cafe.db");

// 데이터 디렉토리가 없으면 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// 테이블 보장 (존재하지 않으면 생성)
db.exec(`
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

  CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt DESC);
  CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId);
  CREATE INDEX IF NOT EXISTS idx_comments_createdAt ON comments(createdAt);
`);

try {
  const postCount = db.prepare("SELECT COUNT(*) as count FROM posts").get().count;

  if (postCount > 0) {
    console.log("ℹ️  posts 테이블에 데이터가 있어 시드를 건너뜁니다.");
    process.exit(0);
  }

  const now = new Date().toISOString();

  const insertPost = db.prepare(
    `INSERT INTO posts (authorId, authorName, title, content, createdAt, updatedAt, viewCount, commentCount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertComment = db.prepare(
    `INSERT INTO comments (postId, authorId, authorName, content, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    const postResult = insertPost.run(
      "1",
      "관리자",
      "카페 게시판을 오픈합니다",
      "환영합니다! 자유롭게 글을 작성해주세요.",
      now,
      now,
      0,
      1
    );

    insertComment.run(postResult.lastInsertRowid, "1", "관리자", "첫 댓글입니다.", now, now);
  });

  transaction();

  console.log("✅ 카페 DB 시드 완료: 기본 게시글 1개, 댓글 1개");
} catch (error) {
  console.error("❌ 시드 실패:", error.message);
  process.exit(1);
} finally {
  db.close();
}
