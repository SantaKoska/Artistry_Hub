import axios from "axios";
//we are using this for navigating from one route to another
// used for the message i need in the top
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";

const registerUser = async (userData, navigate) => {
  // for debugging we are using the below line
  // console.log("Register function called with:", userData);
  const { userName, email, password, role, ...additionalData } = userData;

  //another debugger code
  //console.log("role :", role);
  //console.log("additional data got :", additionalData);

  let dataToSend = {
    userName,
    email,
    password,
    role,
    additionalData: {},
  };
  //debugging
  //console.log("Data to send1:", dataToSend);

  switch (role) {
    case "Artist":
      //console.log("Switch Case for Artist");
      dataToSend.additionalData = {
        artForm: additionalData.artForm || userData.additionalData.artForm,
        specialisation:
          additionalData.specialisation ||
          userData.additionalData.specialisation,
      };
      break;
    case "Viewer/Student":
      //console.log("Switch Case for Viewer/Student");
      dataToSend.additionalData = {
        artForm: additionalData.artForm || userData.additionalData.artForm,
      };
      break;
    case "Institution":
      //console.log("Switch Case for Institution");

      dataToSend.additionalData = {
        registeredUnder:
          additionalData.registeredUnder ||
          userData.additionalData.registeredUnder,
        registrationID:
          additionalData.registrationID ||
          userData.additionalData.registrationID,
        location: {
          postalCode:
            additionalData.location?.postalCode ||
            userData.additionalData.location?.postalCode,
          district:
            additionalData.location?.district ||
            userData.additionalData.location?.district,
          state:
            additionalData.location?.state ||
            userData.additionalData.location?.state,
          country:
            additionalData.location?.country ||
            userData.additionalData.location?.country,
        },
      };
      break;
    case "Service Provider":
      //console.log("Switch Case for Service Provider");
      dataToSend.additionalData = {
        ownerName:
          additionalData.ownerName || userData.additionalData.ownerName,
        expertise:
          additionalData.expertise || userData.additionalData.expertise,
        location: {
          address:
            additionalData.location?.address ||
            userData.additionalData.location?.address,
          postalCode:
            additionalData.location?.postalCode ||
            userData.additionalData.location?.postalCode,
          district:
            additionalData.location?.district ||
            userData.additionalData.location?.district,
          state:
            additionalData.location?.state ||
            userData.additionalData.location?.state,
          country:
            additionalData.location?.country ||
            userData.additionalData.location?.country,
        },
      };
      break;
    default:
      throw new Error("Invalid role 1212");
  }

  //console.log("Data to send2:", dataToSend);

  try {
    const response = await axios.post(
      "http://localhost:8000/auth/register",
      dataToSend
    );

    // console.log("Registration successful, response:", response);

    toast.success("Registration is successful", {
      position: "top-center",
      autoClose: 3000,
    });

    navigate("/login");
  } catch (error) {
    toast.error(
      `Error Registering in: ${
        error.response?.data?.err || "An error occurred"
      }`,
      {
        position: "top-center",
        autoClose: 3000,
      }
    );
    throw error;
  }
};

export default registerUser;
