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

  // Add this new state
  const [showRestrictedContent, setShowRestrictedContent] = useState({});

  // Add this function near the top of your component
  const truncateText = (text, limit) => {
    if (!text) return "";
    if (text.length <= limit) return text;
    return text.substring(0, limit) + "...";
  };

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
        // console.log(response.data.profile);
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
  //

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

  const handleShowRestrictedContent = (postId) => {
    setShowRestrictedContent((prev) => ({
      ...prev,
      [postId]: true,
    }));
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

                    {/* Role-specific information */}
                    {profile.role === "Artist" && (
                      <>
                        <p className="font-semibold text-gray-300">
                          Art Form:{" "}
                          <span className="text-yellow-400">
                            {profile.artForm}
                          </span>
                        </p>
                        <p className="font-semibold text-gray-300">
                          Specialisation:{" "}
                          <span className="text-yellow-400">
                            {profile.specialisation}
                          </span>
                        </p>
                      </>
                    )}

                    {profile.role === "Viewer/Student" && (
                      <p className="font-semibold text-gray-300">
                        Art Form:{" "}
                        <span className="text-yellow-400">
                          {profile.artForm}
                        </span>
                      </p>
                    )}

                    {profile.role === "Service Provider" && (
                      <>
                        <p className="font-semibold text-gray-300">
                          Owner Name:{" "}
                          <span className="text-yellow-400">
                            {profile.ownerName}
                          </span>
                        </p>
                        <p className="font-semibold text-gray-300">
                          Expertise:{" "}
                          <span className="text-yellow-400">
                            {profile.expertise}
                          </span>
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="font-semibold text-gray-300">
                            Location:
                          </p>
                          {profile.address && (
                            <p className="text-yellow-400 ml-4">
                              {profile.address}
                            </p>
                          )}
                          <p className="text-yellow-400 ml-4">
                            {profile.district}, {profile.state}
                          </p>
                          <p className="text-yellow-400 ml-4">
                            {profile.country} - {profile.postalCode}
                          </p>
                        </div>
                      </>
                    )}

                    {profile.role === "Institution" && (
                      <>
                        <p className="font-semibold text-gray-300">
                          Registered Under:{" "}
                          <span className="text-yellow-400">
                            {profile.registeredUnder}
                          </span>
                        </p>
                        <p className="font-semibold text-gray-300">
                          Registration ID:{" "}
                          <span className="text-yellow-400">
                            {profile.registrationID}
                          </span>
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="font-semibold text-gray-300">
                            Location:
                          </p>
                          <p className="text-yellow-400 ml-4">
                            {profile.district}, {profile.state}
                          </p>
                          <p className="text-yellow-400 ml-4">
                            {profile.country} - {profile.postalCode}
                          </p>
                        </div>
                      </>
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
                        className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow"
                        onClick={() => openModal(post)}
                      >
                        {post.mediaUrl && (
                          <>
                            {post.mediaType === "image" && (
                              <div className="relative">
                                {post.isAgeRestricted &&
                                !showRestrictedContent[post._id] ? (
                                  <div className="relative">
                                    <img
                                      src={`${
                                        import.meta.env.VITE_BACKEND_URL
                                      }${post.mediaUrl}`}
                                      alt="Post"
                                      className="w-full h-48 object-cover blur-xl"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                                      <div className="bg-red-900/80 px-4 py-2 rounded-lg text-white mb-2">
                                        18+ Age Restricted Content
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleShowRestrictedContent(post._id);
                                        }}
                                        className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                                      >
                                        Show Content
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={`${import.meta.env.VITE_BACKEND_URL}${
                                      post.mediaUrl
                                    }`}
                                    alt="Post"
                                    className="w-full h-48 object-cover"
                                  />
                                )}
                              </div>
                            )}
                            {post.mediaType === "video" && (
                              <div className="relative">
                                {post.isAgeRestricted &&
                                !showRestrictedContent[post._id] ? (
                                  <div className="relative">
                                    <video
                                      src={`${
                                        import.meta.env.VITE_BACKEND_URL
                                      }${post.mediaUrl}`}
                                      className="w-full h-48 object-cover blur-xl"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                                      <div className="bg-red-900/80 px-4 py-2 rounded-lg text-white mb-2">
                                        18+ Age Restricted Content
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleShowRestrictedContent(post._id);
                                        }}
                                        className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                                      >
                                        Show Content
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <video
                                    controls
                                    src={`${import.meta.env.VITE_BACKEND_URL}${
                                      post.mediaUrl
                                    }`}
                                    className="w-full h-48 object-cover"
                                  />
                                )}
                              </div>
                            )}
                          </>
                        )}

                        <div className="p-4">
                          <p className="text-gray-300">
                            {expandedPosts.has(post._id)
                              ? post.content
                              : truncateText(post.content, 100)}
                            {post.content.length > 100 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReadMore(post._id);
                                }}
                                className="text-yellow-400 hover:text-yellow-500 ml-2 font-medium"
                              >
                                {expandedPosts.has(post._id)
                                  ? "Read Less"
                                  : "Read More"}
                              </button>
                            )}
                          </p>

                          <div className="flex justify-between items-center mt-4">
                            <span className="text-sm text-gray-400">
                              {new Date(post.timestamp).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <FaHeart
                                className={
                                  post.liked ? "text-red-500" : "text-gray-400"
                                }
                              />
                              <span className="text-gray-400">
                                {post.likes}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 col-span-full text-center">
                      No posts available.
                    </p>
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
                        <div className="relative w-full h-full">
                          {selectedPost.isAgeRestricted &&
                          !showRestrictedContent[selectedPost._id] ? (
                            <div className="relative h-full">
                              <img
                                src={`${import.meta.env.VITE_BACKEND_URL}${
                                  selectedPost.mediaUrl
                                }`}
                                alt="Post"
                                className="max-h-full max-w-full object-contain blur-xl"
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                                <div className="bg-red-900/80 px-4 py-2 rounded-lg text-white mb-2">
                                  18+ Age Restricted Content
                                </div>
                                <button
                                  onClick={() =>
                                    handleShowRestrictedContent(
                                      selectedPost._id
                                    )
                                  }
                                  className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                                >
                                  Show Content
                                </button>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={`${import.meta.env.VITE_BACKEND_URL}${
                                selectedPost.mediaUrl
                              }`}
                              alt="Post"
                              className="max-h-full max-w-full object-contain"
                            />
                          )}
                        </div>
                      ) : selectedPost.mediaType === "video" ? (
                        <div className="relative w-full h-full">
                          {selectedPost.isAgeRestricted &&
                          !showRestrictedContent[selectedPost._id] ? (
                            <div className="relative h-full">
                              <video
                                src={`${import.meta.env.VITE_BACKEND_URL}${
                                  selectedPost.mediaUrl
                                }`}
                                className="max-h-full max-w-full object-contain blur-xl"
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                                <div className="bg-red-900/80 px-4 py-2 rounded-lg text-white mb-2">
                                  18+ Age Restricted Content
                                </div>
                                <button
                                  onClick={() =>
                                    handleShowRestrictedContent(
                                      selectedPost._id
                                    )
                                  }
                                  className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                                >
                                  Show Content
                                </button>
                              </div>
                            </div>
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
                        selectedPost.mediaType === "audio" && (
                          <audio
                            controls
                            src={`${import.meta.env.VITE_BACKEND_URL}${
                              selectedPost.mediaUrl
                            }`}
                            className="w-full object-cover"
                          />
                        )
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
