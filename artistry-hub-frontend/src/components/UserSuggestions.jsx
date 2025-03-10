import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserSuggestions = () => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  //   console.log(suggestedUsers);

  useEffect(() => {
    fetchUserSuggestions(); // Fetch user suggestions on component mount
  }, []);

  useEffect(() => {
    const results = suggestedUsers.filter((user) =>
      user.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchQuery, suggestedUsers]);

  const fetchUserSuggestions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/suggestions/user-suggestions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuggestedUsers(response.data);
    } catch (error) {
      console.error("Error fetching user suggestions:", error);
    }
  };

  const handleFollowToggle = async (userId, isFollowing) => {
    const token = localStorage.getItem("token");
    const action = isFollowing ? "unfollow" : "follow"; // Determine action based on current state

    // Optimistically update the UI
    setSuggestedUsers((prev) =>
      prev.map((user) =>
        user._id === userId ? { ...user, isFollowing: !isFollowing } : user
      )
    );

    try {
      await axios.post(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/common-things/profile/${userId}/follow`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Reload the user suggestions after the follow/unfollow action
      fetchUserSuggestions(); // Ensure the component reloads the suggestions
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      // If there's an error, revert the optimistic update
      setSuggestedUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, isFollowing } : user
        )
      );
    }
  };

  const navigateToProfile = (userName) => {
    navigate(`/profile/${userName}`);
  };

  const UserList = ({ users, isModal = false }) => (
    <ul className="flex flex-col gap-2">
      {users.map((user) => (
        <li key={user._id} className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}${user.profilePicture}`}
              alt={user.userName}
              className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500/30"
            />
            <div className="ml-2 flex-grow">
              <span
                className="text-gray-300 cursor-pointer"
                onClick={() => navigateToProfile(user.userName)}
              >
                {user.userName}
              </span>
              <p className="text-xs text-gray-400">
                Mutual Friends: {user.mutualFollowerCount}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleFollowToggle(user.userName, user.isFollowing)}
            className={`ml-4 text-sm font-semibold ${
              user.isFollowing ? "text-red-500" : "text-yellow-400"
            }`}
          >
            {user.isFollowing ? "Unfollow" : "Follow"}
          </button>
        </li>
      ))}
    </ul>
  );

  const displayedUsers = filteredUsers.slice(0, 5);
  const hasMoreUsers = filteredUsers.length > 5;

  return (
    <>
      <div className="fixed w-[23%] bg-zinc-900 border border-yellow-500/20 rounded-xl shadow-xl p-6 mb-4 mx-4 overflow-y-auto max-h-[calc(100vh-100px)]">
        <h2 className="text-lg font-semibold text-yellow-400 text-center">
          Suggested Users
        </h2>
        <input
          type="text"
          placeholder="Search by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-600 rounded text-black"
        />
        <UserList users={displayedUsers} />
        {hasMoreUsers && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full mt-4 py-2 text-yellow-400 hover:text-yellow-300 text-sm font-semibold"
          >
            Show More Suggestions
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-6 w-[90%] max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-yellow-400">
                All Suggestions
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <input
              type="text"
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 mb-4 border border-gray-600 rounded text-black"
            />
            <UserList users={filteredUsers} isModal={true} />
          </div>
        </div>
      )}
    </>
  );
};

export default UserSuggestions;
