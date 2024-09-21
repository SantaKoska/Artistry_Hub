import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHeart } from "react-icons/fa";

const ArtistHome = () => {
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/artist/homeposts",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // update likedPosts based on whether the user has liked the post
        const { posts, userId } = response.data;
        // console.log(userId);
        const likedPostIds = new Set(
          posts
            .map((post) => (post.likedBy.includes(userId) ? post._id : null))
            .filter(Boolean)
        );

        setPosts(posts);
        setLikedPosts(likedPostIds);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    fetchPosts();
  }, [token]);

  const handleLike = async (postId) => {
    try {
      // Send request to toggle like/unlike
      await axios.post(
        `http://localhost:8000/posts/${postId}/toggle-like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedPosts = await axios.get(
        "http://localhost:8000/artist/homeposts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { posts, userId } = updatedPosts.data;

      setPosts(posts);

      // Update liked posts state after toggle
      const likedPostIds = new Set(
        posts
          .map((post) => (post.likedBy.includes(userId) ? post._id : null))
          .filter(Boolean)
      );
      setLikedPosts(likedPostIds);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {posts.length > 0 ? (
        posts.map((post) => (
          <div
            key={post._id}
            className="bg-white shadow-md rounded-lg p-4 mb-6"
          >
            {/* Profile Info */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-black">
                <img
                  src={`http://localhost:8000${post.user.profilePicture}`}
                  alt={post.user.userName}
                  className="w-12 h-12 rounded-full"
                />
                <div className="ml-4">
                  <p className="font-bold text-lg">{post.user.userName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(post.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <p className="mb-2 text-black">{post.content}</p>

            {/* Post Media */}
            {post.mediaUrl && post.mediaType === "image" && (
              <img
                src={`http://localhost:8000${post.mediaUrl}`}
                alt="Post media"
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
            )}
            {post.mediaUrl && post.mediaType === "video" && (
              <video
                controls
                src={`http://localhost:8000${post.mediaUrl}`}
                className="w-full h-48 object-cover rounded-lg mb-2"
              />
            )}
            {post.mediaUrl && post.mediaType === "audio" && (
              <audio
                controls
                src={`http://localhost:8000${post.mediaUrl}`}
                className="w-full mb-2"
              />
            )}

            {/* Like Button */}
            <div className="flex flex-col items-center">
              <button
                className={`${
                  likedPosts.has(post._id) ? "text-yellow-500" : "text-gray-500"
                }`}
                onClick={() => handleLike(post._id)}
              >
                <FaHeart size={24} />
              </button>
              <span className="mt-1 text-black">Likes: {post.likes}</span>
            </div>
          </div>
        ))
      ) : (
        <p>No posts available</p>
      )}
    </div>
  );
};

export default ArtistHome;
