import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { FaHeart } from "react-icons/fa"; // For like button
import Modal from "react-modal"; // For modal functionality

const Commonprofileservice = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState(new Set()); // Track expanded posts
  const [selectedPost, setSelectedPost] = useState(null); // For modal post
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const token = localStorage.getItem("token");

  const navigate = useNavigate();

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

  // Function to render post content with Read More/Read Less functionality
  const renderPostContent = (post) => {
    const contentLimit = 100; // Limit to the number of characters before "Read More"

    if (expandedPosts.has(post._id) || post.content.length <= contentLimit) {
      return (
        <>
          {post.content}
          {post.content.length > contentLimit && (
            <span
              className="text-blue-500 cursor-pointer ml-2"
              onClick={() => toggleReadMore(post._id)}
            >
              Read Less
            </span>
          )}
        </>
      );
    } else {
      return (
        <>
          {post.content.slice(0, contentLimit)}...
          <span
            className="text-blue-500 cursor-pointer ml-2"
            onClick={() => toggleReadMore(post._id)}
          >
            Read More
          </span>
        </>
      );
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full max-w-screen-lg mx-auto mt-72">
        <button
          onClick={() => navigate(-1)} // This will navigate back to the previous page
          className="text-black bg-white hover:bg-black hover:text-emerald-800 hover:underline rounded-md p-4 transition-all duration-300"
        >
          Back
        </button>
        {profile && (
          <>
            <div className="flex flex-col md:flex-row gap-10 items-center justify-between">
              <div className="flex flex-col items-center">
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    profile.profilePicture
                  }`}
                  alt="Profile"
                  className="w-48 h-44 rounded-full mb-4 shadow-xl"
                />
                <h1 className="text-5xl font-semibold text-yellow-400 mt-4 text-center">
                  {profile.userName}
                </h1>
              </div>
              <div className="flex flex-col justify-center text-white text-lg space-y-6 w-full">
                <div className="flex justify-between md:justify-start gap-x-10">
                  <div className="text-center">
                    <p className="font-bold text-3xl text-yellow-400">
                      Followers
                    </p>
                    <p>{profile.followerCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-3xl text-yellow-400">Posts</p>
                    <p>{profile.numberOfPosts}</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-xl">
                    Description: {profile.description}
                  </p>
                </div>
                {profile.artForm && (
                  <p className="font-semibold text-xl">
                    Art Form: {profile.artForm}
                  </p>
                )}
                {profile.specialisation && (
                  <p className="font-semibold text-xl">
                    Specialisation: {profile.specialisation}
                  </p>
                )}
                {profile.institutionName && (
                  <p className="font-semibold text-xl">
                    Institution Name: {profile.institutionName}
                  </p>
                )}
                {profile.serviceType && (
                  <p className="font-semibold text-xl">
                    Service Type: {profile.serviceType}
                  </p>
                )}
                {/* <button
                  onClick={handleFollowToggle}
                  className="w-full md:w-64 text-[18px] font-semibold rounded-full bg-yellow-500 text-white hover:bg-yellow-600 py-2 shadow-lg hover:shadow-xl transition-all duration-400"
                >
                  {profile.following ? "Unfollow" : "Follow"}
                </button> */}
              </div>
            </div>

            {/* Posts Section */}
            <div className="mt-10">
              <h2 className="text-3xl text-white mb-4">Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div
                      key={post._id}
                      className="bg-blue-100 rounded-lg p-4 text-black hover:shadow-xl hover:bg-blue-200 transition-all duration-200"
                      onClick={() => openModal(post)}
                    >
                      {post.mediaUrl && post.mediaType === "image" && (
                        <img
                          src={`${import.meta.env.VITE_BACKEND_URL}${
                            post.mediaUrl
                          }`}
                          alt="Post media"
                          className="w-full h-48 object-cover rounded-lg mb-2 shadow-md"
                        />
                      )}
                      {post.mediaUrl && post.mediaType === "video" && (
                        <video
                          controls
                          src={`${import.meta.env.VITE_BACKEND_URL}${
                            post.mediaUrl
                          }`}
                          className="w-full h-48 object-cover rounded-lg mb-2 shadow-md"
                        />
                      )}
                      {post.mediaUrl && post.mediaType === "audio" && (
                        <audio
                          controls
                          src={`${import.meta.env.VITE_BACKEND_URL}${
                            post.mediaUrl
                          }`}
                          className="w-full mb-2"
                        />
                      )}
                      {renderPostContent(post)}{" "}
                      <p className="text-sm text-emerald-900">
                        Posted on: {new Date(post.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-white">No posts available.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal for expanded post */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          className="modal bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 w-full md:w-1/3 mx-auto"
          overlayClassName="overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-75"
        >
          {selectedPost && (
            <div className="bg-white p-5 rounded-lg shadow-xl">
              <h2 className="text-2xl font-bold mb-4">Expanded Post</h2>
              <p className="mb-4">{selectedPost.content}</p>
              {selectedPost.mediaUrl && selectedPost.mediaType === "image" && (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    selectedPost.mediaUrl
                  }`}
                  alt="Expanded post media"
                  className="w-full mb-2"
                />
              )}
              {selectedPost.mediaUrl && selectedPost.mediaType === "video" && (
                <video
                  controls
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    selectedPost.mediaUrl
                  }`}
                  className="w-full mb-2"
                />
              )}
              {selectedPost.mediaUrl && selectedPost.mediaType === "audio" && (
                <audio
                  controls
                  src={`${import.meta.env.VITE_BACKEND_URL}${
                    selectedPost.mediaUrl
                  }`}
                  className="w-full mb-2"
                />
              )}
              <div className="flex justify-between">
                <button
                  onClick={handleLikeToggle}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-lg transition-all duration-300"
                >
                  {selectedPost.liked ? "Unlike" : "Like"} ({selectedPost.likes}
                  )
                </button>
                <button
                  onClick={closeModal}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 shadow-lg transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default Commonprofileservice;
