import { NextRequest } from "next/server";
import { successResponse, errorResponse, requireAuthOrThrow, withErrorHandler } from "@/lib/apiHelpers";
import { getDB } from "@/lib/db";
import type { Comment } from "@/types";

/**
 * DELETE /api/cafe/comments/[id] - 댓글 삭제 (본인 + 관리자)
 */
export const DELETE = withErrorHandler(async (req: NextRequest, context?: { params: Promise<{ id: string }> }) => {
  if (!context) throw new Error("Missing params");
  const { id } = await context.params;
  const user = await requireAuthOrThrow(req);

  const db = getDB();
  const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(id) as Comment | undefined;

  if (!comment) {
    return errorResponse("댓글을 찾을 수 없습니다.", 404);
  }

  if (comment.authorId !== user.id && user.role !== "admin") {
    return errorResponse("삭제 권한이 없습니다.", 403);
  }

  // 트랜잭션: 댓글 삭제 + 댓글 수 감소
  const deleteComment = db.prepare("DELETE FROM comments WHERE id = ?");
  const decrementCount = db.prepare("UPDATE posts SET commentCount = MAX(0, commentCount - 1) WHERE id = ?");

  const transaction = db.transaction(() => {
    deleteComment.run(id);
    decrementCount.run(comment.postId);
  });

  transaction();

  return successResponse("댓글이 삭제되었습니다.", null);
});
