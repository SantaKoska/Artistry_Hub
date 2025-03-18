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
        padding: "20px",
        width: "90%",
        maxWidth: "800px",
        margin: "20px auto",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        borderRadius: "15px",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "30px",
          width: "100%",
        }}
      >
        <img
          src={LOGO}
          alt="Artistry Hub Logo"
          style={{
            height: "80px",
            marginBottom: "20px",
            maxWidth: "100%",
            objectFit: "contain",
          }}
        />
        <h1
          style={{
            fontSize: "clamp(24px, 5vw, 32px)",
            fontWeight: "600",
            color: "#1a1a1a",
            borderBottom: "2px solid #007bff",
            paddingBottom: "15px",
            textAlign: "center",
          }}
        >
          Certificate Verification
        </h1>
      </div>
      <div
        style={{
          border: "1px solid #e6e6e6",
          borderRadius: "12px",
          padding: "20px",
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
            flexWrap: "wrap",
          }}
        >
          <FontAwesomeIcon
            icon={faIdCard}
            style={{ marginRight: "15px", color: "#007bff", fontSize: "20px" }}
          />
          <span style={{ width: "150px" }}>Issued To:</span>
          <strong>{certificateDetails.recipientName}</strong>
        </p>

        <p
          style={{
            fontSize: "clamp(16px, 4vw, 18px)",
            margin: "15px 0",
            color: "#333",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #f0f0f0",
            flexWrap: "wrap",
          }}
        >
          <FontAwesomeIcon
            icon={faCertificate}
            style={{ marginRight: "15px", color: "#007bff", fontSize: "20px" }}
          />
          <span style={{ minWidth: "150px" }}>Course Name:</span>
          <strong>{certificateDetails.courseName}</strong>
        </p>

        <p
          style={{
            fontSize: "clamp(16px, 4vw, 18px)",
            margin: "15px 0",
            color: "#333",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #f0f0f0",
            flexWrap: "wrap",
          }}
        >
          <FontAwesomeIcon
            icon={faCalendarAlt}
            style={{ marginRight: "15px", color: "#007bff", fontSize: "20px" }}
          />
          <span style={{ minWidth: "150px" }}>Issued Date:</span>
          <strong>
            {new Date(certificateDetails.issueDate).toLocaleDateString()}
          </strong>
        </p>

        <p
          style={{
            fontSize: "clamp(16px, 4vw, 18px)",
            margin: "15px 0",
            color: "#333",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #f0f0f0",
            flexWrap: "wrap",
          }}
        >
          <FontAwesomeIcon
            icon={faCertificate}
            style={{ marginRight: "15px", color: "#007bff", fontSize: "20px" }}
          />
          <span style={{ minWidth: "150px" }}>Serial Number:</span>
          <strong>{certificateDetails.serialNumber}</strong>
        </p>

        <p
          style={{
            fontSize: "clamp(16px, 4vw, 18px)",
            margin: "15px 0",
            color: "#333",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderBottom: "1px solid #f0f0f0",
            flexWrap: "wrap",
          }}
        >
          <FontAwesomeIcon
            icon={faCertificate}
            style={{ marginRight: "15px", color: "#007bff", fontSize: "20px" }}
          />
          <span style={{ minWidth: "150px" }}>Certificate Issued to:</span>
          <strong>{certificateDetails.certificateName}</strong>
        </p>
      </div>
    </div>
  );
};

export default CertificateVerification;
