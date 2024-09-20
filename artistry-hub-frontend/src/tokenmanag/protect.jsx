import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (decodedToken.exp < currentTime) {
      // Token is expired
      localStorage.removeItem("token"); // Clear expired token
      return <Navigate to="/login" />;
    }
  } catch (error) {
    // If token decoding fails, treat it as an invalid token
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
