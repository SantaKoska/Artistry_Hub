import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the necessary components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/artist/course-analytics`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAnalyticsData(response.data);
      } catch (error) {
        setError("Error fetching analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  const data = {
    labels: analyticsData.map((item) => item.courseName),
    datasets: [
      {
        label: "Enrolled Students",
        data: analyticsData.map((item) => item.enrolledCount),
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="bg-black text-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Course Analytics</h2>
      <Bar data={data} options={{ responsive: true }} />
    </div>
  );
};

export default Dashboard;
