import { NextRequest } from "next/server";
import { successResponse, errorResponse, requireAuth, requireAuthOrThrow, withErrorHandler } from "@/lib/apiHelpers";
import { getDB } from "@/lib/db";
import type { Post } from "@/types";

/**
 * GET /api/cafe/posts/[id] - 게시글 상세 조회 (조회수 증가)
 */
export const GET = withErrorHandler(async (req: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  if (!context) throw new Error("Missing params");
  const { id } = await context.params;
  const authResult = requireAuth(req);
  if (authResult.response) return authResult.response;

  const db = getDB();

  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as Post | undefined;
  if (!post) {
    return errorResponse("게시글을 찾을 수 없습니다.", 404);
  }

  // 조회수 증가
  db.prepare("UPDATE posts SET viewCount = CAST(viewCount AS INTEGER) + 1 WHERE id = ?").run(id);

  // 업데이트된 게시글 다시 조회
  const updatedPost = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as Post;

  return successResponse("게시글을 가져왔습니다.", updatedPost);
});

/**
 * PUT /api/cafe/posts/[id] - 게시글 수정 (본인만)
 */
export const PUT = withErrorHandler(async (req: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  if (!context) throw new Error("Missing params");
  const { id } = await context.params;
  const user = await requireAuthOrThrow(req);
  const { title, content } = await req.json();

  if (!title?.trim() || !content?.trim()) {
    return errorResponse("제목과 내용을 입력해주세요.", 400);
  }

  const db = getDB();
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as Post | undefined;

  if (!post) {
    return errorResponse("게시글을 찾을 수 없습니다.", 404);
  }

  if (post.authorId !== user.id) {
    return errorResponse("수정 권한이 없습니다.", 403);
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE posts SET title = ?, content = ?, updatedAt = ? WHERE id = ?").run(
    title.trim(),
    content.trim(),
    now,
    id
  );

  const updatedPost = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as Post;
  return successResponse("게시글이 수정되었습니다.", updatedPost);
});

/**
 * DELETE /api/cafe/posts/[id] - 게시글 삭제 (본인 + 관리자)
 */
export const DELETE = withErrorHandler(async (req: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  if (!context) throw new Error("Missing params");
  const { id } = await context.params;
  const user = await requireAuthOrThrow(req);

  const db = getDB();
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as Post | undefined;

  if (!post) {
    return errorResponse("게시글을 찾을 수 없습니다.", 404);
  }

  if (post.authorId !== user.id && user.role !== "admin") {
    return errorResponse("삭제 권한이 없습니다.", 403);
  }

  // 트랜잭션: 댓글 먼저 삭제 후 게시글 삭제 (FK 제약 조건)
  const deleteComments = db.prepare("DELETE FROM comments WHERE postId = ?");
  const deletePost = db.prepare("DELETE FROM posts WHERE id = ?");

  const transaction = db.transaction(() => {
    deleteComments.run(id);
    deletePost.run(id);
  });

  transaction();

  return successResponse("게시글이 삭제되었습니다.", null);
});
