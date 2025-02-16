import React from "react";
import { FaUser, FaCalendar, FaClock } from "react-icons/fa";

const LiveClassStudents = ({ students, classId }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-yellow-400 mb-6">
        Enrolled Students ({students.length})
      </h3>

      <div className="space-y-4">
        {students.map((student) => (
          <div
            key={student.studentId._id}
            className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              {student.studentId.profilePicture ? (
                <img
                  src={student.studentId.profilePicture}
                  alt={student.studentId.userName}
                  className="w-10 h-10 rounded-full mr-4"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-4">
                  <FaUser className="text-gray-400" />
                </div>
              )}

              <div>
                <h4 className="text-white font-medium">
                  {student.studentId.userName}
                </h4>
                <div className="text-sm text-gray-400 flex items-center mt-1">
                  <FaCalendar className="mr-1" />
                  Joined:{" "}
                  {new Date(student.enrollmentDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-yellow-400 font-medium">
                Next Payment Due:
              </div>
              <div className="text-sm text-gray-400 flex items-center justify-end mt-1">
                <FaClock className="mr-1" />
                {new Date(student.nextPaymentDue).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveClassStudents;
