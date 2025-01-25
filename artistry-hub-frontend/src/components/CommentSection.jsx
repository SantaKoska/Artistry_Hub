import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHeart } from "react-icons/fa";

const CommentSection = ({ postId, userId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [likedComments, setLikedComments] = useState(new Set());

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/comments/${postId}/comments`
      );
      setComments(response.data);

      // Initialize liked comments set based on the current user's likes
      const initialLikedComments = new Set(
        response.data
          .filter((comment) => comment.likedBy.includes(userId))
          .map((comment) => comment._id)
      );
      setLikedComments(initialLikedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/comments/${postId}/comment`,
        { content: newComment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/comments/${postId}/comments/${commentId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the liked comments state
      const updatedComment = response.data;
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment._id === updatedComment._id ? updatedComment : comment
        )
      );

      // Update likedComments set
      setLikedComments((prev) => {
        const newLikedComments = new Set(prev);
        if (newLikedComments.has(commentId)) {
          newLikedComments.delete(commentId);
        } else {
          newLikedComments.add(commentId);
        }
        return newLikedComments;
      });
    } catch (error) {
      console.error("Error liking/unliking comment:", error);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center">
        <button
          onClick={() => setShowComments((prev) => !prev)}
          className="text-yellow-400 hover:text-yellow-300 transition-colors"
        >
          💬 {comments.length}
        </button>
      </div>

      {showComments && (
        <div className="comments bg-zinc-900 border border-yellow-500/20 rounded-lg p-4 mt-2">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="comment mb-2 flex items-center justify-between"
            >
              <div className="flex items-center">
                <strong className="text-yellow-400">
                  {comment.user.userName}
                </strong>
                <span className="text-gray-300 ml-2">{comment.content}</span>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleLikeComment(comment._id)}
                  className={`ml-2 focus:outline-none transition-all duration-300 transform hover:scale-110 ${
                    likedComments.has(comment._id)
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}
                >
                  <FaHeart size={16} />
                </button>
                <span className="ml-1 text-gray-400 text-sm">
                  {comment.likes}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showComments && (
        <form onSubmit={handleCommentSubmit} className="flex mt-4">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-grow p-2 border border-gray-600 rounded-l-lg bg-zinc-800 text-white"
          />
          <button
            type="submit"
            className="bg-yellow-400 text-black p-2 rounded-r-lg hover:bg-yellow-300 transition-colors"
          >
            Post
          </button>
        </form>
      )}
    </div>
  );
};

export default CommentSection;
