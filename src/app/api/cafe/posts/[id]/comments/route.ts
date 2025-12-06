import { NextRequest } from "next/server";
import { successResponse, errorResponse, requireAuthOrThrow, withErrorHandler } from "@/lib/apiHelpers";
import { getDB } from "@/lib/db";
import type { Comment } from "@/types";

/**
 * GET /api/cafe/posts/[id]/comments - 댓글 목록 조회
 */
export const GET = withErrorHandler(async (req: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  if (!context) throw new Error("Missing params");
  const { id } = await context.params;
  const db = getDB();

  const comments = db.prepare("SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC").all(id) as Comment[];

  return successResponse("댓글 목록을 가져왔습니다.", comments);
});

/**
 * POST /api/cafe/posts/[id]/comments - 댓글 작성
 */
export const POST = withErrorHandler(async (req: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  if (!context) throw new Error("Missing params");
  const { id } = await context.params;
  const user = await requireAuthOrThrow(req);
  const { content } = await req.json();

  if (!content?.trim()) {
    return errorResponse("댓글 내용을 입력해주세요.", 400);
  }

  const db = getDB();
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);

  if (!post) {
    return errorResponse("게시글을 찾을 수 없습니다.", 404);
  }

  const now = new Date().toISOString();

  // 트랜잭션: 댓글 추가 + 댓글 수 증가
  const insertComment = db.prepare(
    `INSERT INTO comments (postId, authorId, authorName, content, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const incrementCount = db.prepare("UPDATE posts SET commentCount = commentCount + 1 WHERE id = ?");

  const transaction = db.transaction(() => {
    const result = insertComment.run(id, user.id, user.username, content.trim(), now, now);
    incrementCount.run(id);
    return result.lastInsertRowid;
  });

  const newCommentId = transaction();
  const newComment = db.prepare("SELECT * FROM comments WHERE id = ?").get(newCommentId) as Comment;

  return successResponse("댓글이 작성되었습니다.", newComment);
});
