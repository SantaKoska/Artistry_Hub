import Login from "./login";
import Register from "./Register";
import Home from "./home";
import { Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./tokenmanag/protect";

//bg image
import backgroundImage from "./assets/Van-Gogh-Starry-Night.svg";
import { Routes } from "react-router-dom";

function App() {
  return (
    <>
      <div
        className="text-white flex justify-center items-center bg-cover bg-center h-screen"
        // style={{
        //   backgroundImage: `url(${backgroundImage})`,
        // }}
      >
        <ToastContainer />
        {/* Routes */}
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route
            path="home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate replace to="/login" />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
