"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import type { Post } from "@/types";

function EditPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/cafe/posts/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const postData = data.data;
          setPost(postData);
          setTitle(postData.title);
          setContent(postData.content);

          // 권한 확인
          if (user && postData.authorId !== user.id) {
            setError("수정 권한이 없습니다.");
          }
        } else {
          setError(data.message);
        }
      })
      .catch(() => setError("게시글을 불러오는데 실패했습니다."))
      .finally(() => setLoading(false));
  }, [params.id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/cafe/posts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/cafe/${params.id}`);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("게시글 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!post) return <ErrorMessage message="게시글을 찾을 수 없습니다." />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">글 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            제목
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "수정 중..." : "수정하기"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded hover:bg-gray-50">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditPage() {
  return (
    <ProtectedRoute>
      <EditPageContent />
    </ProtectedRoute>
  );
}
