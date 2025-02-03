import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCertificate,
  faCalendarAlt,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";

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
        maxWidth: "600px",
        margin: "auto",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        borderRadius: "10px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "20px",
          textAlign: "center",
          color: "black",
        }}
      >
        Certificate Verification
      </h1>
      <div
        style={{
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px",
          backgroundColor: "#fff",
        }}
      >
        <p style={{ fontSize: "18px", margin: "10px 0", color: "black" }}>
          <FontAwesomeIcon
            icon={faCertificate}
            style={{ marginRight: "10px", color: "#007bff" }}
          />
          Course Name: <strong>{certificateDetails.courseName}</strong>
        </p>
        <p style={{ fontSize: "18px", margin: "10px 0", color: "black" }}>
          <FontAwesomeIcon
            icon={faCalendarAlt}
            style={{ marginRight: "10px", color: "#007bff" }}
          />
          Issued Date:{" "}
          <strong>
            {new Date(certificateDetails.issueDate).toLocaleDateString()}
          </strong>
        </p>
        <p style={{ fontSize: "18px", margin: "10px 0", color: "black" }}>
          <FontAwesomeIcon
            icon={faIdCard}
            style={{ marginRight: "10px", color: "#007bff" }}
          />
          Serial Number: <strong>{certificateDetails.serialNumber}</strong>
        </p>
        <p style={{ fontSize: "18px", margin: "10px 0", color: "black" }}>
          <FontAwesomeIcon
            icon={faCertificate}
            style={{ marginRight: "10px", color: "#007bff" }}
          />
          Certificate Name:{" "}
          <strong>{certificateDetails.certificateName}</strong>
        </p>
      </div>
    </div>
  );
};

export default CertificateVerification;
