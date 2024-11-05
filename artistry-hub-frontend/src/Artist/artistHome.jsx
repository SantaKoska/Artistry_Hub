import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaHeart } from "react-icons/fa";
import { Link } from "react-router-dom"; // Import Link for navigation

const ArtistHome = () => {
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [expandedPosts, setExpandedPosts] = useState(new Set()); // To track expanded posts
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/artist/homeposts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const { posts, userId } = response.data;
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
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/posts/${postId}/toggle-like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refetch posts to update the like count and liked posts
      const updatedPosts = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/artist/homeposts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { posts, userId } = updatedPosts.data;

      setPosts(posts);

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

  const toggleReadMore = (postId) => {
    setExpandedPosts((prev) => {
      const newExpandedPosts = new Set(prev);
      if (newExpandedPosts.has(postId)) {
        newExpandedPosts.delete(postId);
      } else {
        newExpandedPosts.add(postId);
      }
      return newExpandedPosts;
    });
  };

  return (
    <div className="container mx-auto w-full max-w-screen-2xl pt-28 pb-20">
      <div className="grid gap-10 mt-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post._id}
              className="bg-white border border-gray-200 rounded-lg shadow-lg mx-auto p-6 mb-8 hover:shadow-2xl transition-shadow duration-300"
            >
              {/* Profile Info */}
              <div className="flex items-center mb-4">
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    post.user.profilePicture
                  }`}
                  alt={post.user.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="ml-4">
                  <Link to={`/profile/${post.user.userName}`}>
                    <p className="font-bold text-lg text-emerald-900 hover:underline">
                      {post.user.userName}
                    </p>
                  </Link>
                  <p className="text-sm text-gray-500">
                    {new Date(post.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Post Media */}
              {post.mediaUrl && post.mediaType === "image" && (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                  alt="Post media"
                  className="w-full h-64 object-cover rounded-md mb-4"
                />
              )}
              {post.mediaUrl && post.mediaType === "video" && (
                <video
                  controls
                  src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                  className="w-full h-64 object-cover rounded-md mb-4"
                />
              )}
              {post.mediaUrl && post.mediaType === "audio" && (
                <audio
                  controls
                  src={`${import.meta.env.VITE_BACKEND_URL}${post.mediaUrl}`}
                  className="w-full mb-4"
                />
              )}

              {/* Post Content */}
              <p className="mb-4 text-gray-700">
                {expandedPosts.has(post._id)
                  ? post.content
                  : `${post.content.slice(0, 150)}...`}
              </p>
              {post.content.length > 150 && (
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => toggleReadMore(post._id)}
                >
                  {expandedPosts.has(post._id) ? "Read Less" : "Read More"}
                </button>
              )}

              {/* Like Button */}
              <div className="flex items-center mt-4">
                <button
                  className={`focus:outline-none ${
                    likedPosts.has(post._id)
                      ? "text-red-500"
                      : "text-gray-500 hover:text-red-500"
                  } transition-colors duration-300`}
                  onClick={() => handleLike(post._id)}
                >
                  <FaHeart size={24} />
                </button>
                <span className="ml-2 text-gray-700 text-sm">
                  {post.likes} {post.likes === 1 ? "Like" : "Likes"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 col-span-full">
            No posts available
          </p>
        )}
      </div>
    </div>
  );
};

export default ArtistHome;
