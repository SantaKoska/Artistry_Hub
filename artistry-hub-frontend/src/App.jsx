import Login from "./login";
import Register from "./Register";
import ResetPassword from "./FP/resetPassword";
import ForgotPassword from "./FP/forgotpassword";
import { Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./tokenmanag/protect";
import ArtistProfile from "./Artist/artistProfile";
import ArtistBase from "./Artist/artistBase";
//bg image
import backgroundImage from "./assets/Van-Gogh-Starry-Night.svg";
import { Routes } from "react-router-dom";
import ArtistHome from "./Artist/artistHome";
import CommonProfile from "./common/common";
import MyCourses from "./Artist/Learning/MyCourses";
import MessagePage from "./common/message";
import LoginRegisterBase from "./loginregisterbase";
import HomePage from "./home";
import EditCourse from "./Artist/Learning/EditCourse";
import AddCourse from "./Artist/Learning/AddCourse";
import StudentBase from "./Viewer-Student/studentBase";
import StudentHome from "./Viewer-Student/studentHome";
import StudentProfile from "./Viewer-Student/studentProfile";
import StudentCreateServiceRequest from "./Viewer-Student/studentServiceRequest";
import ArtistCreateServiceRequest from "./Artist/artistServiceRequest";
import StudentDashboard from "./Viewer-Student/Studentlearning/LearnDashboard";
import ServiceProviderBase from "./serviceprovider/serviceBase";
import ServiceProviderHome from "./serviceprovider/servicehome";
import Commonprofileservice from "./serviceprovider/profileservice";
import ServiceProviderProfile from "./serviceprovider/serviceproviderprofile";
import InstitutionBase from "./institution/InstitutionBase";
import InstitutionHome from "./institution/InstitutionHome";
import InstitutionProfile from "./institution/InstitutionProfile";
import CertificateVerification from "./Viewer-Student/CertificateVerification";
import InstitutionOpportunities from "./institution/InstitutionOpportunities";
import Opportunities from "./common/Opportunities";
import LiveClassRoom from "./components/LiveClassRoom";
import AdminBase from "./Admin/AdminBase";
import AdminDashboard from "./Admin/AdminDashboard";
import AdminLogin from "./Admin/AdminLogin";

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
          <Route
            path="/verify-certificate/:serialNumber"
            element={<CertificateVerification />}
          />
          <Route path="/" element={<LoginRegisterBase />}>
            <Route path="/" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          <Route path="login/forgotpassword" element={<ForgotPassword />} />
          <Route
            path="profile/:username"
            element={
              <PrivateRoute>
                <CommonProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          {/* This is for Artist  */}
          <Route
            path="/artist-Home"
            element={
              <PrivateRoute>
                <ArtistBase />
              </PrivateRoute>
            }
          >
            <Route index element={<ArtistHome />} />
            <Route path="artistprofile" element={<ArtistProfile />} />
            <Route path="my-courses" element={<MyCourses />} />
            <Route path="add-course" element={<AddCourse />} />
            <Route path="edit-course/:courseid" element={<EditCourse />} />
            <Route
              path="Service-Request"
              element={<ArtistCreateServiceRequest />}
            />
            <Route path="Message" element={<MessagePage />} />
            <Route path="opportunities" element={<Opportunities />} />
          </Route>

          {/* This is for Viewer-Students */}
          <Route
            path="/viewer-student-home"
            element={
              <PrivateRoute>
                <StudentBase />
              </PrivateRoute>
            }
          >
            <Route index element={<StudentHome />} />
            <Route path="studentprofile" element={<StudentProfile />} />
            <Route path="Message" element={<MessagePage />} />
            <Route
              path="service-requests"
              element={<StudentCreateServiceRequest />}
            />
            <Route path="learning" element={<StudentDashboard />} />
            <Route path="opportunities" element={<Opportunities />} />
          </Route>

          <Route
            path="/Service-Provider-home"
            element={
              <PrivateRoute>
                <ServiceProviderBase />
              </PrivateRoute>
            }
          >
            <Route index element={<ServiceProviderHome />} />
            <Route path="Message" element={<MessagePage />} />
            <Route
              path="profile-service/:username"
              element={<Commonprofileservice />}
            />
            <Route
              path="serviceproviderprofile"
              element={<ServiceProviderProfile />}
            />
          </Route>

          <Route
            path="/Institution-home"
            element={
              <PrivateRoute>
                <InstitutionBase />
              </PrivateRoute>
            }
          >
            <Route index element={<InstitutionHome />} />
            <Route path="institutionprofile" element={<InstitutionProfile />} />
            <Route path="Message" element={<MessagePage />} />
            <Route
              path="opportunities"
              element={<InstitutionOpportunities />}
            />
          </Route>

          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route path="/login" element={<Navigate replace to="/" />} />
          <Route
            path="/live-class-room/:classId"
            element={
              <LiveClassRoom
                isArtist={location.search.includes("role=artist")}
              />
            }
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute>
                <AdminBase />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            {/* Add more admin routes here as needed */}
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
