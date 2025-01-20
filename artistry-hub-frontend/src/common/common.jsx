import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FaHeart, FaArrowLeft } from "react-icons/fa"; // For like button
import Modal from "react-modal"; // For modal functionality

const CommonProfile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState([]);
  const [posts, setPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState(new Set()); // Track expanded posts
  const [selectedPost, setSelectedPost] = useState(null); // For modal post
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const token = localStorage.getItem("token");

  const navigate = useNavigate();

  // Add this state for tracking expanded content
  const [expandedContent, setExpandedContent] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/common-things/profile/${username}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setProfile(response.data.profile);
        setPosts(response.data.posts);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, [username, token]);

  const handleFollowToggle = async () => {
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/common-things/profile/${username}/follow`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProfile((prevProfile) => ({
        ...prevProfile,
        following: response.data.following,
      }));
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  const openModal = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleLikeToggle = async () => {
    if (!selectedPost) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/posts/${
          selectedPost._id
        }/toggle-like`, // Updated endpoint
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the selected post with new likes count
      setSelectedPost((prevPost) => ({
        ...prevPost,
        likes: response.data.likes,
        liked: !prevPost.liked, // Toggle the liked state
      }));
    } catch (error) {
      console.error("Error liking/unliking post:", error);
    }
  };

  // Function to toggle Read More/Read Less
  const toggleReadMore = (postId) => {
    const updatedExpandedPosts = new Set(expandedPosts);
    if (expandedPosts.has(postId)) {
      updatedExpandedPosts.delete(postId); // Collapse the post
    } else {
      updatedExpandedPosts.add(postId); // Expand the post
    }
    setExpandedPosts(updatedExpandedPosts);
  };

  // Add this function to handle content expansion
  const renderPostContent = (content) => {
    const contentLimit = 150; // Character limit before "See more"
    const isLongContent = content.length > contentLimit;

    return (
      <div className="text-white">
        <p className="leading-relaxed">
          {!expandedContent && isLongContent
            ? `${content.slice(0, contentLimit)}...`
            : content}
        </p>
        {isLongContent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedContent(!expandedContent);
            }}
            className="text-yellow-400 hover:text-yellow-300 text-sm font-medium mt-1 transition-colors duration-300"
          >
            {expandedContent ? "See less" : "See more"}
          </button>
        )}
      </div>
    );
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-grow container mx-auto px-4 md:px-6 py-6 max-w-full overflow-hidden">
        <div className="bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800 max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-white hover:text-yellow-400 bg-gray-800 hover:bg-gray-700 rounded-md p-2 transition-all duration-300 flex items-center gap-2"
          >
            <FaArrowLeft /> Back
          </button>

          {profile && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center md:w-1/4">
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${
                      profile.profilePicture
                    }`}
                    alt="Profile"
                    className="w-32 h-32 rounded-full shadow-xl object-cover border-4 border-yellow-500"
                  />
                  <h1 className="text-3xl font-semibold text-yellow-400 mt-2 text-center md:text-left">
                    {profile.userName}
                  </h1>
                </div>

                <div className="flex flex-col text-gray-200 space-y-4 md:w-3/4">
                  <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                    <div className="text-center bg-gray-800 p-4 rounded-lg shadow-md flex-1 min-w-[150px]">
                      <p className="font-bold text-lg text-yellow-400">
                        Followers
                      </p>
                      <p className="text-gray-300">{profile.followerCount}</p>
                    </div>
                    <div className="text-center bg-gray-800 p-4 rounded-lg shadow-md flex-1 min-w-[150px]">
                      <p className="font-bold text-lg text-yellow-400">Posts</p>
                      <p className="text-gray-300">{profile.numberOfPosts}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm bg-gray-800 p-4 rounded-lg max-h-48 overflow-y-auto shadow-md">
                    {profile.description && (
                      <p className="font-semibold text-gray-300">
                        Description:{" "}
                        <span className="text-yellow-400">
                          {profile.description}
                        </span>
                      </p>
                    )}
                    {profile.artForm && (
                      <p className="font-semibold text-gray-300">
                        Art Form:{" "}
                        <span className="text-yellow-400">
                          {profile.artForm}
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleFollowToggle}
                    className="w-full md:w-40 text-sm font-semibold rounded-full bg-yellow-600 text-black hover:bg-yellow-700 py-3 transition-all duration-300 shadow-md"
                  >
                    {profile.following ? "Unfollow" : "Follow"}
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-2xl text-yellow-400 mb-4">Posts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <div
                        key={post._id}
                        className="bg-gray-800 rounded-lg p-4 text-gray-200 hover:border-yellow-500 transition-all duration-300 overflow-hidden shadow-md"
                        onClick={() => openModal(post)}
                      >
                        {post.mediaUrl && (
                          <div className="h-40 mb-2">
                            {post.mediaType === "image" && (
                              <img
                                src={`${import.meta.env.VITE_BACKEND_URL}${
                                  post.mediaUrl
                                }`}
                                alt="Post media"
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                        )}
                        <p className="text-sm line-clamp-3">{post.content}</p>
                        <p className="text-xs text-yellow-400 mt-2">
                          {new Date(post.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">No posts available.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Modal
            isOpen={isModalOpen}
            onRequestClose={() => {
              closeModal();
              setExpandedContent(false); // Reset expanded state when closing modal
            }}
            className="modal fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black w-[95%] md:w-[1000px] h-[90vh] rounded-md shadow-2xl backdrop-filter backdrop-blur-md bg-opacity-90 border border-yellow-500 overflow-hidden"
            overlayClassName="overlay fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
          >
            {selectedPost && (
              <div className="h-full flex flex-col md:flex-row">
                {/* Left side - Selected Post */}
                <div className="md:w-[60%] h-full bg-black/20">
                  {selectedPost.mediaUrl ? (
                    <div className="relative h-full flex items-center justify-center bg-black/40">
                      {selectedPost.mediaType === "image" ? (
                        <img
                          src={`${import.meta.env.VITE_BACKEND_URL}${
                            selectedPost.mediaUrl
                          }`}
                          alt="Post"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <video
                          controls
                          src={`${import.meta.env.VITE_BACKEND_URL}${
                            selectedPost.mediaUrl
                          }`}
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-8 bg-yellow-900/20">
                      {renderPostContent(selectedPost.content)}
                    </div>
                  )}
                </div>

                {/* Right side - Info and Other Posts */}
                <div className="md:w-[40%] h-full flex flex-col bg-gray-800/50">
                  {/* Post Info */}
                  <div className="p-4 border-b border-yellow-500">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${
                          profile.profilePicture
                        }`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border border-yellow-500"
                      />
                      <div>
                        <h3 className="text-yellow-400 font-semibold">
                          {profile.userName}
                        </h3>
                        <p className="text-xs text-gray-300">
                          {new Date(selectedPost.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Post Content with See More/Less */}
                    <div className="mb-4">
                      {selectedPost.mediaUrl ? (
                        renderPostContent(selectedPost.content)
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                          {renderPostContent(selectedPost.content)}
                        </div>
                      )}
                    </div>

                    {/* Like Button */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleLikeToggle}
                        className="flex items-center gap-2 text-white hover:text-yellow-400 transition-colors duration-300"
                      >
                        <FaHeart
                          className={selectedPost.liked ? "text-red-500" : ""}
                        />
                        <span>{selectedPost.likes} likes</span>
                      </button>
                    </div>
                  </div>

                  {/* Other Posts Grid */}
                  <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <h4 className="text-yellow-400 text-sm font-medium p-3 border-b border-yellow-500">
                      More posts
                    </h4>
                    <div className="grid grid-cols-2 gap-1 p-1">
                      {posts
                        .filter((post) => post._id !== selectedPost._id)
                        .map((post) => (
                          <div
                            key={post._id}
                            onClick={() => {
                              setSelectedPost(post);
                              setExpandedContent(false); // Reset expanded state when switching posts
                            }}
                            className="aspect-square relative cursor-pointer group"
                          >
                            {post.mediaUrl ? (
                              <>
                                {post.mediaType === "image" ? (
                                  <img
                                    src={`${import.meta.env.VITE_BACKEND_URL}${
                                      post.mediaUrl
                                    }`}
                                    alt="Post"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <video
                                    src={`${import.meta.env.VITE_BACKEND_URL}${
                                      post.mediaUrl
                                    }`}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                  <span className="text-white text-sm">
                                    View Post
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-yellow-900/20 p-2 flex items-center justify-center group-hover:bg-yellow-900/40 transition-colors duration-300">
                                <p className="text-white text-xs line-clamp-4 text-center">
                                  {post.content}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      closeModal();
                      setExpandedContent(false);
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default CommonProfile;
