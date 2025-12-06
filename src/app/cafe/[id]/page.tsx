"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/contexts/AuthContext";
import { layout, state, text } from "@/styles/design-system";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import type { Post, Comment } from "@/types";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/cafe/posts/${params.id}`).then((r) => r.json()),
      fetch(`/api/cafe/posts/${params.id}/comments`).then((r) => r.json()),
    ])
      .then(([postData, commentsData]) => {
        if (postData.success) setPost(postData.data);
        if (commentsData.success) setComments(commentsData.data);
      })
      .catch(() => setError("게시글을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      const res = await fetch(`/api/cafe/posts/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      const data = await res.json();
      if (data.success) {
        setComments([...comments, data.data]);
        setNewComment("");
        setPost((prev) => (prev ? { ...prev, commentCount: prev.commentCount + 1 } : null));
      } else {
        alert(data.message);
      }
    } catch {
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/cafe/posts/${params.id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        router.push("/cafe");
      } else {
        alert(data.message);
      }
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/cafe/comments/${commentId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setComments(comments.filter((c) => c.id !== commentId));
        setPost((prev) => (prev ? { ...prev, commentCount: prev.commentCount - 1 } : null));
      } else {
        alert(data.message);
      }
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!post) return <ErrorMessage message="게시글을 찾을 수 없습니다." />;

  const canEdit = user?.id === post.authorId;
  const canDelete = user?.id === post.authorId || user?.role === "admin";

  return (
    <div className={layout.page}>
      <div className={layout.containerMedium}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/cafe")}
            className="flex items-center gap-2 text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>목록으로</span>
          </Button>

          {(canEdit || canDelete) && (
            <div className="flex flex-wrap justify-end gap-2">
              {canEdit && (
                <Button variant="secondary" size="sm" onClick={() => router.push(`/cafe/${post.id}/edit`)}>
                  수정
                </Button>
              )}
              {canDelete && (
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  삭제
                </Button>
              )}
            </div>
          )}
        </div>

        <Card className="mb-6 space-y-4">
          <div className="space-y-3">
            <h1 className={text.pageTitle}>{post.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`${text.meta} font-medium text-gray-800`}>{post.authorName}</span>
              <span className={text.meta}>{new Date(post.createdAt).toLocaleString("ko-KR")}</span>
              <span className={`${text.meta} flex items-center gap-1`}>조회 {post.viewCount}</span>
              <span className={`${text.meta} flex items-center gap-1`}>댓글 {post.commentCount}</span>
            </div>
          </div>

          <div className={`${text.bodyMedium} whitespace-pre-wrap leading-relaxed`}>{post.content}</div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={text.sectionTitle}>댓글 {comments.length}</h2>
          </div>

          {user ? (
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요"
                rows={4}
                className="min-h-[120px]"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={commentLoading} size="sm">
                  {commentLoading ? "작성 중..." : "댓글 작성"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-gray-700">
              댓글을 작성하려면 로그인이 필요합니다.
            </div>
          )}

          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className={`${state.empty} py-4`}>아직 댓글이 없습니다.</div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} padding="sm" className="border-gray-100 bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={`${text.meta} flex flex-wrap items-center gap-2`}>
                        <span className="font-medium text-gray-800">{comment.authorName}</span>
                        <span>{new Date(comment.createdAt).toLocaleString("ko-KR")}</span>
                      </div>
                      <p className={`${text.body} whitespace-pre-wrap`}>{comment.content}</p>
                    </div>
                    {(user?.id === comment.authorId || user?.role === "admin") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleCommentDelete(comment.id)}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
