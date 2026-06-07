// comments 도메인 조회/등록 동작을 묶는 커스텀 훅
import { useEffect, useState } from "react";
import {
  createComment,
  deleteComment,
  fetchCommentsByPostId,
} from "@/features/comments/api/commentApi";

export function useComments(postId) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComments = async () => {
    setIsLoading(true);
    setError("");
    try {
      const items = await fetchCommentsByPostId(postId);
      setComments(items);
    } catch (requestError) {
      setError(requestError.message || "댓글을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      void loadComments();
    } else {
      setIsLoading(false);
    }
  }, [postId]);

  const submitComment = async (payload) => {
    await createComment(payload);
    await loadComments();
  };

  const removeComment = async (commentId) => {
    await deleteComment(commentId);
    await loadComments();
  };

  return { comments, isLoading, error, submitComment, removeComment, refresh: loadComments };
}
