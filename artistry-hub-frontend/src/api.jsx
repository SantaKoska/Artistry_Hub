import axios from "axios";
//we are using this for navigating from one route to another
// used for the message i need in the top
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const registerUser = async (userData, navigate) => {
  const { userName, email, password, role, ...additionalData } = userData;

  let dataToSend = {
    userName,
    email,
    password,
    role,
    additionalData: {},
  };

  switch (role) {
    case "Artsist":
      dataToSend.additionalData = {
        artForm: additionalData.artForm,
        specialisation: additionalData.specialisation,
      };
      break;
    case "Viewer/Student":
      dataToSend.additionalData = {
        artForm: additionalData.artForm,
      };
      break;
    case "Institution":
      dataToSend.additionalData = {
        universityAffiliation: additionalData.universityAffiliation,
        registrationID: additionalData.registrationID,
        location: {
          postalCode: additionalData.location.postalCode,
          district: additionalData.location.district,
          state: additionalData.location.state,
          country: additionalData.location.country,
        },
      };
      break;
    case "Service Provider":
      dataToSend.additionalData = {
        ownerName: additionalData.ownerName,
        expertise: additionalData.expertise,
        location: {
          address: additionalData.location.address,
          postalCode: additionalData.location.postalCode,
          district: additionalData.location.district,
          state: additionalData.location.state,
          country: additionalData.location.country,
        },
      };
      break;
    default:
      throw new Error("Invalid role");
  }

  try {
    const response = await axios.post(
      "http://localhost:8000/auth/register",
      dataToSend
    );

    toast.success("Registeration is Successfull", {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 3000,
    });

    navigate("/login");
  } catch (error) {
    console.error("Error registering user:", error.response.data.err);

    toast.error("Registeration failed. Please try again.", {
      position: toast.POSITION.TOP_CENTER,
      autoClose: 3000,
    });
    throw error;
  }
};

export default registerUser;
