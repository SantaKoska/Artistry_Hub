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

const StudentDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalCompletedLessons, setTotalCompletedLessons] = useState(0);
  const [averageProgress, setAverageProgress] = useState(0);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/student/student-analytics?startDate=2023-01-01&endDate=2023-12-31`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // console.log(response);
        setAnalyticsData(response.data.analytics || []);
        setTotalCourses(response.data.totalCourses || 0);
        setTotalCompletedLessons(response.data.totalCompletedLessons || 0);
        setAverageProgress(response.data.averageProgress || 0);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        setError("Failed to fetch analytics data.");
      }
    };

    fetchAnalytics();
  }, [token]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const data = {
    labels: analyticsData.map((item) => item.courseName),
    datasets: [
      {
        label: "Progress",
        data: analyticsData.map((item) => item.progress),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-black text-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Student Analytics</h2>
      <div className="mb-4">
        <h3>Total Courses: {totalCourses}</h3>
        <h3>Total Completed Lessons: {totalCompletedLessons}</h3>
        <h3>Average Progress: {averageProgress}%</h3>
      </div>
      <Bar data={data} />
    </div>
  );
};

export default StudentDashboard;
