import { NextRequest } from "next/server";
import { successResponse, errorResponse, requireAuth, requireAuthOrThrow, withErrorHandler } from "@/lib/apiHelpers";
import { getDB } from "@/lib/db";
import type { Post } from "@/types";

/**
 * GET /api/cafe/posts - 게시글 목록 조회
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authResult = requireAuth(req);
  if (authResult.response) return authResult.response;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  const db = getDB();

  const posts = db.prepare("SELECT * FROM posts ORDER BY createdAt DESC LIMIT ? OFFSET ?").all(limit, offset) as Post[];

  const totalResult = db.prepare("SELECT COUNT(*) as count FROM posts").get() as { count: number };
  const total = totalResult.count;

  return successResponse("게시글 목록을 가져왔습니다.", {
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * POST /api/cafe/posts - 게시글 작성
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuthOrThrow(req);
  const body = await req.json();

  const { title, content } = body;
  if (!title?.trim() || !content?.trim()) {
    return errorResponse("제목과 내용을 입력해주세요.", 400);
  }

  const db = getDB();
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO posts (authorId, authorName, title, content, createdAt, updatedAt, viewCount, commentCount)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)`
    )
    .run(user.id, user.username, title.trim(), content.trim(), now, now);

  const newPost = db.prepare("SELECT * FROM posts WHERE id = ?").get(result.lastInsertRowid) as Post;

  return successResponse("게시글이 작성되었습니다.", newPost);
});
