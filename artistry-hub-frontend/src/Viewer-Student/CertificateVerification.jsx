import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCertificate,
  faCalendarAlt,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";
import LOGO from "../assets/LOGO.png";

const CertificateVerification = () => {
  const { serialNumber } = useParams();
  const [certificateDetails, setCertificateDetails] = useState(null);
  const [error, setError] = useState(null);
  console.log(certificateDetails);
  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/student/verify-certificate/${serialNumber}`
        );
        setCertificateDetails(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error verifying certificate.");
      }
    };

    verifyCertificate();
  }, [serialNumber]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!certificateDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "40px auto",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        borderRadius: "15px",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <img
          src={LOGO}
          alt="Artistry Hub Logo"
          style={{
            height: "80px",
            marginBottom: "20px",
          }}
        />
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "600",
            color: "#1a1a1a",
            borderBottom: "2px solid #007bff",
            paddingBottom: "15px",
            display: "inline-block",
          }}
        >
          Certificate Verification
        </h1>
      </div>
      <div
        style={{
          border: "1px solid #e6e6e6",
          borderRadius: "12px",
          padding: "30px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
        }}
      >
        <p
          style={{
            fontSize: "18px",
            margin: "15px 0",
            color: "#333",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <FontAwesomeIcon
            icon={faCertificate}
            style={{ marginRight: "15px", color: "#007bff", fontSize: "20px" }}
          />
          <span style={{ width: "150px" }}>Course Name:</span>
          <strong>{certificateDetails.courseName}</strong>
        </p>

        <p
          style={{
            fontSize: "18px",
            margin: "15px 0",
            color: "#333",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <FontAwesomeIcon
            icon={faCalendarAlt}
            style={{ marginRight: "15px", color: "#007bff", fontSize: "20px" }}
          />
          <span style={{ width: "150px" }}>Issued Date:</span>
          <strong>
            {new Date(certificateDetails.issueDate).toLocaleDateString()}
          </strong>
        </p>

        <p
          style={{
            fontSize: "18px",
            margin: "15px 0",
            color: "#333",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <FontAwesomeIcon
            icon={faIdCard}
            style={{ marginRight: "15px", color: "#007bff", fontSize: "20px" }}
          />
          <span style={{ width: "150px" }}>Serial Number:</span>
          <strong>{certificateDetails.serialNumber}</strong>
        </p>

        <p
          style={{
            fontSize: "18px",
            margin: "15px 0",
            color: "#333",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <FontAwesomeIcon
            icon={faCertificate}
            style={{ marginRight: "15px", color: "#007bff", fontSize: "20px" }}
          />
          <span style={{ width: "150px" }}>Certificate Name:</span>
          <strong>{certificateDetails.certificateName}</strong>
        </p>
      </div>
    </div>
  );
};

export default CertificateVerification;
