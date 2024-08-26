import axios from "axios";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BiUser } from "react-icons/bi";
import { AiOutlineUnlock } from "react-icons/ai";

const Register = () => {
  const [role, setRole] = useState("");
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    artForm: "",
    specialisation: "",
    expertise: "",
    ownerName: "",
    location: {
      address: "",
      district: "",
      state: "",
      country: "",
      postalCode: "",
    },
    universityAffiliation: "",
    registrationID: "",
  });

  //getting data usin pincode
  const fetchLocationData = async (postalCode) => {
    try {
      const response = await axios.get(
        `https://api.postalpincode.in/pincode/${postalCode}`
      );
      if (
        response.data &&
        response.data[0] &&
        response.data[0].Status === "Success"
      ) {
        const place = response.data[0].PostOffice[0];
        setFormData((formData) => ({
          ...formData,
          location: {
            ...formData.location,
            district: place.District,
            state: place.State,
            country: "India",
          },
        }));
      } else {
        console.error("Error fetching data: ", response.data[0].Message);
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // location input changes
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      location: { ...prevFormData.location, [name]: value },
    }));

    if (name === "postalCode" && value.length === 6) {
      fetchLocationData(value);
    }
  };

  // for handling the role changes
  const handleRoleChange = (e) => {
    setRole(e.target.value);
    setFormData({
      ...formData,
      artForm: "",
      specialisation: "",
      expertise: "",
      ownerName: "",
      universityAffiliation: "",
      registrationID: "",
      location: {
        address: "",
        district: "",
        state: "",
        country: "",
        postalCode: "",
      },
    });
  };

  return (
    <div className=" bg-slate-800 rounded-md p-8 shadow-lg backdrop-filter backdrop-blur-md bg-opacity-30 relative">
      <div>
        <h1 className="text-4xl font-semibold text-white text-center mb-6">
          Register
        </h1>

        {/* form starting username , password , confirm password and email */}
        <form action="">
          <div className="relative my-4 mb-8">
            <input
              type="text"
              name="userName"
              className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
              placeholder=" "
              value={formData.userName}
              onChange={handleInputChange}
            />
            <label
              htmlFor="userName"
              className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              User Name
            </label>
            <BiUser className="absolute top-0 right-4 peer-focus:text-yellow-500" />
          </div>

          <div className="relative my-4 mb-8">
            <input
              type="email"
              name="email"
              className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
              placeholder=" "
              value={formData.email}
              onChange={handleInputChange}
            />
            <label
              htmlFor="email"
              className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              Your Email
            </label>
            <BiUser className="absolute top-0 right-4 peer-focus:text-yellow-500" />
          </div>

          <div className="relative my-4 mt-8">
            <input
              type="password"
              name="password"
              className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
              placeholder=" "
              value={formData.password}
              onChange={handleInputChange}
            />
            <label
              htmlFor="password"
              className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              Your Password
            </label>
            <AiOutlineUnlock className="absolute top-0 right-4 peer-focus:text-yellow-500" />
          </div>

          <div className="relative my-4 mt-8">
            <input
              type="password"
              name="confirmPassword"
              className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
              placeholder=" "
              value={formData.confirmPassword}
              onChange={handleInputChange}
            />
            <label
              htmlFor="confirmPassword"
              className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
            >
              Confirm Your Password
            </label>
            <AiOutlineUnlock className="absolute top-0 right-4 peer-focus:text-yellow-500" />
          </div>

          {/* roles choice code  */}

          <div className="relative my-4 mt-8">
            <select
              className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
              value={role}
              onChange={handleRoleChange}
            >
              <option value="" disabled>
                Select your role
              </option>
              <option value="Artist">Artist</option>
              <option value="Viewer/Student">Viewer/Student</option>
              <option value="Service Provider">Service Provider</option>
              <option value="Institution">Institution</option>
            </select>
            <label className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6">
              Role
            </label>
          </div>

          {/* if the role is a Artist */}

          {role === "Artist" && (
            <>
              <div className="relative my-4 mt-8">
                <select
                  name="artForm"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  value={formData.artForm}
                  onChange={handleInputChange}
                >
                  <option value="" disabled>
                    Select your artform
                  </option>
                  <option value="Painting">Painting</option>
                  <option value="Sculpturet">Sculpture</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Literature">Literature</option>
                  <option value="Cinema">Cinema</option>
                  <option value="Theater">Theater</option>
                  <option value="Music">Music</option>
                </select>
                <label
                  htmlFor="artForm"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Known Art Form
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="specialisation"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.specialisation}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="specialisation"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  What is your specialisation these artform?
                </label>
              </div>
            </>
          )}

          {/* if viewer/students is selected */}
          {role === "Viewer/Student" && (
            <div className="relative my-4 mt-8">
              <select
                name="artForm"
                className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                value={formData.artForm}
                onChange={handleInputChange}
              >
                <option value="" disabled>
                  Select your artform
                </option>
                <option value="Painting">Painting</option>
                <option value="Sculpturet">Sculpture</option>
                <option value="Architecture">Architecture</option>
                <option value="Literature">Literature</option>
                <option value="Cinema">Cinema</option>
                <option value="Theater">Theater</option>
                <option value="Music">Music</option>
              </select>
              <label
                htmlFor="artForm"
                className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Favourite Art Form
              </label>
            </div>
          )}

          {/* if service provider is selected */}
          {role === "Service Provider" && (
            <>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="ownerName"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.ownerName}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="ownerName"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Owner Name
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="expertise"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.expertise}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="expertise"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Expertise
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="address"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.location.address}
                  onChange={handleLocationChange}
                />
                <label
                  htmlFor="address"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Address
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="postalCode"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.location.postalCode}
                  onChange={handleLocationChange}
                />
                <label
                  htmlFor="postalCode"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  PinCode
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="district"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.location.district}
                  readOnly
                />
                <label
                  htmlFor="district"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  District
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="state"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.location.state}
                  readOnly
                />
                <label
                  htmlFor="state"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  State
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="country"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.location.country}
                  readOnly
                />
                <label
                  htmlFor="country"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Country
                </label>
              </div>
            </>
          )}

          {/* if selected Institution */}
          {role === "Institution" && (
            <>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="universityAffiliation"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.universityAffiliation}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="universityAffiliation"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  University Affiliation (Optional)
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="registrationID"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.registrationID}
                  onChange={handleInputChange}
                />
                <label
                  htmlFor="registrationID"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Registration ID
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="postalCode"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.location.postalCode}
                  onChange={handleLocationChange}
                />
                <label
                  htmlFor="postalcode"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  PinCode
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="district"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.location.district}
                  onChange={handleLocationChange}
                />
                <label
                  htmlFor="district"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  district
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="state"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.location.state}
                  onChange={handleLocationChange}
                />
                <label
                  htmlFor="state"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  State
                </label>
              </div>
              <div className="relative my-4 mt-8">
                <input
                  type="text"
                  name="country"
                  className="block w-96 py-2.4 px-0 text-base text-white font-semibold bg-transparent border-0 border-b-2 border-emerald-900 appearance-none focus:outline-none focus:ring-0 focus:text-black focus:border-yellow-500 peer"
                  placeholder=" "
                  value={formData.location.country}
                  onChange={handleLocationChange}
                />
                <label
                  htmlFor="country"
                  className="absolute text-white text-lg duration-300 transform -translate-y-6 scale-75 top-0 -z-10 origin-[0] peer-focus:text-yellow-400 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Country
                </label>
              </div>
            </>
          )}

          <button
            className="w-full mb-4 text-[18px] font-semibold mt-6 rounded-full bg-white text-black hover:bg-emerald-900 hover:text-white py-2 transition-colors duration-400"
            type="submit"
          >
            Register
          </button>

          <div>
            <span>
              Already have an account?{" "}
              <Link className="text-yellow-400" to="/login">
                Login
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
