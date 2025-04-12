import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // Default react-calendar styles
import axios from "axios";
import "./calendar-custom.css"; // Import custom calendar styles
import "./animations.css";
import { FaCalendarAlt, FaUserCheck, FaSearch, FaTimes } from 'react-icons/fa';
import { toast } from "react-hot-toast";

export default function ViewAttendance() {
  // Component States
  const [empId, setEmpId] = useState("");
  const [empName, setEmpName] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipContent, setTooltipContent] = useState({});

  // Format date to dd-mm-yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Handle input change
  const handleInputChange = (e) => {
    setEmpId(e.target.value);
  };

  // Fetch attendance data
  const fetchAttendance = async () => {
    if (!empId.trim()) {
      setError("Please enter an Employee ID or Name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const encodedName = encodeURIComponent(empId);
      console.log(`Fetching attendance for ${encodedName}`);
      const response = await axios.get(`/public/getAttendanceByName/${encodedName}`);
      console.log("Attendance data:", response.data);
      setAttendanceData(response.data);
      setEmpName(response.data[0]?.employee?.firstName || "Employee");
      updateStats(response.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data");
      setError(`Error fetching attendance data: ${error.message}`);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const clearAttendance = () => {
    setEmpId("");
    setAttendanceData([]);
    setError("");
    setEmpName("");
    setSelectedDate(null);
  };

  // Called whenever the user navigates to a different month/year in the calendar
  const handleMonthChange = ({ activeStartDate, view }) => {
    if (view === "month") {
      setCurrentMonth(activeStartDate.getMonth());
      setCurrentYear(activeStartDate.getFullYear());
    }
  };

  // Handle date click in calendar
  const handleDateClick = (value) => {
    // Create a date object without time component
    const clickedDate = new Date(value);
    clickedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const dateStr = clickedDate.toISOString().split('T')[0];
    
    setSelectedDate(dateStr);
    
    // Find attendance record for this date
    const record = attendanceData.find(item => item.date === dateStr);
    
    setTooltipContent(record || {});
  };

  // Define color classes for each status
  const statusColors = {
    Present: "bg-green-900/30 border-green-700",
    Absent: "bg-red-900/30 border-red-700",
    "Half-Day": "bg-yellow-900/30 border-yellow-700",
    "Paid Leave": "bg-purple-900/30 border-purple-700",
    "Week Off": "bg-blue-900/30 border-blue-700",
    Holiday: "bg-pink-900/30 border-pink-700",
  };

  // Custom tile content with improved visual feedback
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      // Get date in the format stored in attendanceData
      const clickedDate = new Date(date);
      clickedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      const dateStr = clickedDate.toISOString().split('T')[0];
      
      // Find attendance record for this date
      const record = attendanceData.find(item => item.date === dateStr);
      
      if (record) {
        return (
          <div className={`w-full h-full p-1 ${statusColors[record.status]}`}>
            <div className="text-xs font-bold">{record.status}</div>
          </div>
        );
      }
    }
    return null;
  };

  // Render attendance summary
  const renderAttendanceSummary = () => {
    if (!attendanceData.length) return null;

    // Count occurrences of each status
    const statusCounts = attendanceData.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div 
            key={status}
            className={`p-3 rounded-lg border ${statusColors[status] || "border-gray-700"}`}
          >
            <div className="font-medium text-lg">{status}</div>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs text-gray-400">days</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fadeIn">
      {error && (
        <div className="bg-red-500 text-white p-3 mb-4 rounded animate-shake">{error}</div>
      )}

      {/* Search Section */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg mb-8 border border-blue-900 animate-slideIn">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={empId}
                onChange={handleInputChange}
                placeholder="Enter Employee Name"
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-100 placeholder-gray-400 transition-all duration-300"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <button
            onClick={fetchAttendance}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 btn-interactive"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <>
                <FaUserCheck /> View Attendance
              </>
            )}
          </button>
          {attendanceData.length > 0 && (
            <button
              onClick={clearAttendance}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-2 btn-interactive"
            >
              <FaTimes /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-300">Loading...</div>
      ) : attendanceData.length > 0 ? (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-blue-900 animate-slideIn">
          <h2 className="text-2xl font-semibold mb-4 text-gray-100 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-400" />
            Attendance for {empName}
          </h2>
          
          {/* Calendar View */}
          <div className="relative">
            <Calendar
              value={null}
              onActiveStartDateChange={handleMonthChange}
              onClickDay={handleDateClick}
              tileContent={tileContent}
              className="bg-slate-800 text-gray-100 border-gray-700 rounded-lg"
              showNeighboringMonth={false}
            />
          </div>
          
          {/* Attendance Summary */}
          {renderAttendanceSummary()}
          
          {/* Selected Date Details */}
          {selectedDate && tooltipContent.status && (
            <div className="mt-6 bg-slate-700 p-6 rounded-lg shadow-lg border border-blue-900 animate-slideIn transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <h3 className="text-lg font-semibold mb-3 text-gray-100 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-400 animate-pulse" />
                Attendance Details for {formatDate(selectedDate)}
              </h3>
              <div className={`p-4 rounded-lg border ${statusColors[tooltipContent.status]} transform transition-all duration-300 hover:scale-[1.02]`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className="font-semibold text-lg">{tooltipContent.status}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Employee</p>
                    <p className="font-semibold text-lg">{tooltipContent.employee?.firstName || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
