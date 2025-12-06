"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { useAuth } from "@/contexts/AuthContext";
import { card, button, layout, text, state } from "@/styles/design-system";
import type { Post } from "@/types";

function CafeContent() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 15;

  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/cafe/posts?page=${page}&limit=${PAGE_SIZE}`);
        const data = await res.json();

        if (!cancelled) {
          if (data.success) {
            setPosts(data.data.posts);
            const pages = Math.max(1, Number(data.data.totalPages) || 1);
            setTotalPages(pages);
            setTotalCount(Number(data.data.total) || data.data.posts.length || 0);
          } else {
            setError(data.message);
          }
        }
      } catch (err) {
        if (!cancelled) setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [page]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className={layout.page}>
      <div className={layout.containerMedium}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className={text.pageTitle}>카페</h1>
            <p className={text.secondary}>가벼운 리스트 레이아웃으로 한 화면에 더 많은 글을 확인하세요.</p>
          </div>
          {user && (
            <Link href="/cafe/write" className={`${button.base} ${button.primary} ${button.small}`}>
              글쓰기
            </Link>
          )}
        </div>

        {posts.length === 0 ? (
          <div className={state.empty}>아직 게시글이 없습니다.</div>
        ) : (
          <div className={`${card.base} ${card.paddingSmall} overflow-hidden`}>
            <div className="divide-y divide-gray-100">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/cafe/${post.id}`}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1 py-2 sm:px-2 sm:py-2 hover:bg-gray-50 rounded"
                >
                  <div className="min-w-0 space-y-1">
                    <p className={text.meta}>
                      {post.authorName} · {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                    <h2 className={`${text.bodyMedium} font-semibold truncate`}>{post.title}</h2>
                  </div>
                  <div className={`${text.secondary} flex items-center gap-3 sm:ml-4`}>
                    <span className="whitespace-nowrap">조회 {post.viewCount}</span>
                    <span className="whitespace-nowrap">댓글 {post.commentCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {posts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-sm text-gray-700">
            <div>
              총 {totalCount}개 · {page} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className={`${button.base} ${button.secondary} ${button.small} ${page === 1 ? button.disabled : ""}`}
              >
                이전
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className={`${button.base} ${button.secondary} ${button.small} ${
                  page === totalPages ? button.disabled : ""
                }`}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CafePage() {
  return (
    <ProtectedRoute>
      <CafeContent />
    </ProtectedRoute>
  );
}
