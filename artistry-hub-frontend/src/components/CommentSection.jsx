import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHeart, FaGift } from "react-icons/fa";

const CommentSection = ({ postId, userId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [likedComments, setLikedComments] = useState(new Set());
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [selectedGif, setSelectedGif] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingGifs, setTrendingGifs] = useState([]);

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    if (showGifPicker && !searchQuery) {
      fetchTrendingGifs();
    }
  }, [showGifPicker]);

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

  const fetchTrendingGifs = async () => {
    try {
      const response = await axios.get(
        `https://api.giphy.com/v1/gifs/trending`,
        {
          params: {
            api_key: import.meta.env.VITE_GIPHY_API_KEY,
            limit: 9,
            rating: "g",
          },
        }
      );
      setGifs(response.data.data);
    } catch (error) {
      console.error("Error fetching trending GIFs:", error);
    }
  };

  const searchGifs = async (query) => {
    if (!query.trim()) {
      fetchTrendingGifs();
      return;
    }

    try {
      const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
        params: {
          api_key: import.meta.env.VITE_GIPHY_API_KEY,
          q: query,
          limit: 9,
          rating: "g",
        },
      });
      setGifs(response.data.data);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
    }
  };

  const handleGifSelect = (gif) => {
    setSelectedGif({
      url: gif.images.fixed_height.url,
      id: gif.id,
    });
    setShowGifPicker(false);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment && !selectedGif) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/comments/${postId}/comment`,
        {
          content: newComment,
          gifUrl: selectedGif?.url,
          gifId: selectedGif?.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNewComment("");
      setSelectedGif(null);
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
              className="comment mb-4 pb-2 border-b border-yellow-500/10"
            >
              <div className="flex flex-col">
                <div className="flex items-center">
                  <strong className="text-yellow-400">
                    {comment.user.userName}
                  </strong>
                  <span className="text-gray-300 ml-2">{comment.content}</span>
                </div>

                {comment.gifUrl && (
                  <div className="mt-2">
                    <img
                      src={comment.gifUrl}
                      alt="Comment GIF"
                      className="rounded-lg max-w-[200px]"
                    />
                  </div>
                )}

                <div className="flex items-center mt-2">
                  <button
                    onClick={() => handleLikeComment(comment._id)}
                    className={`focus:outline-none transition-all duration-300 transform hover:scale-110 ${
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
            </div>
          ))}
        </div>
      )}

      {showComments && (
        <form onSubmit={handleCommentSubmit} className="mt-4">
          <div className="flex mb-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-grow p-2 border border-gray-600 rounded-l-lg bg-zinc-800 text-white"
            />
            <button
              type="button"
              onClick={() => setShowGifPicker(!showGifPicker)}
              className="bg-zinc-700 px-3 hover:bg-zinc-600 transition-colors"
            >
              <FaGift />
            </button>
            <button
              type="submit"
              className="bg-yellow-400 text-black p-2 rounded-r-lg hover:bg-yellow-300 transition-colors"
            >
              Post
            </button>
          </div>

          {showGifPicker && (
            <div className="bg-zinc-800 p-4 rounded-lg mb-4">
              <input
                type="text"
                placeholder="Search GIFs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchGifs(e.target.value);
                }}
                className="w-full p-2 mb-2 border border-gray-600 rounded-lg bg-zinc-700 text-white"
              />
              <div className="text-gray-400 mb-2">
                {!searchQuery && <span>Trending GIFs</span>}
                {searchQuery && <span>Search Results</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {gifs.map((gif) => (
                  <img
                    key={gif.id}
                    src={gif.images.fixed_height.url}
                    alt="GIF"
                    onClick={() => handleGifSelect(gif)}
                    className="cursor-pointer rounded-lg hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}

          {selectedGif && (
            <div className="relative inline-block">
              <img
                src={selectedGif.url}
                alt="Selected GIF"
                className="max-w-[200px] rounded-lg"
              />
              <button
                onClick={() => setSelectedGif(null)}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default CommentSection;
