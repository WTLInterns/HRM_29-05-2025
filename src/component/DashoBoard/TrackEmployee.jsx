import React, { useState, useEffect } from "react";
import axios from "axios";
import { useApp } from "../../context/AppContext";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "16px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
  margin: "24px 0"
};

// Reverse geocoding function
const fetchAddress = async (lat, lng, setter) => {
  try {
    const apiKey = "AIzaSyCelDo4I5cPQ72TfCTQW-arhPZ7ALNcp8w";
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "OK" && data.results.length > 0) {
      setter(data.results[0].formatted_address);
    } else {
      setter("");
    }
  } catch (e) {
    setter("");
  }
};

const TrackEmployee = () => {
  const { isDarkMode } = useApp();
  const [employeeName, setEmployeeName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState("");
  const [lastAddress, setLastAddress] = useState("");

  // Google Maps API Loader
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCelDo4I5cPQ72TfCTQW-arhPZ7ALNcp8w"
  });

  // Fetch employee list on mount
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      const subAdminId = user?.id;
      if (subAdminId) {
        axios
          .get(`https://api.managifyhr.com/api/employee/${subAdminId}/employee/all`)
          .then(res => {
            setEmployeeList(res.data || []);
          })
          .catch(() => setEmployeeList([]));
      }
    }
  }, []);

  // Autocomplete logic (from SalarySlip.jsx)
  useEffect(() => {
    const query = employeeName.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      return;
    }
    const list = employeeList.map(emp => ({
      empId: emp.empId,
      fullName: `${emp.firstName} ${emp.lastName}`
    }));
    const startsWith = [];
    const endsWith = [];
    const includes = [];
    list.forEach(item => {
      const name = item.fullName.toLowerCase();
      if (name.startsWith(query)) startsWith.push(item);
      else if (name.endsWith(query)) endsWith.push(item);
      else if (name.includes(query)) includes.push(item);
    });
    setSuggestions([...startsWith, ...endsWith, ...includes].slice(0, 10));
  }, [employeeName, employeeList]);

  // Fetch employee location
  const handleTrack = async (emp) => {
    setError("");
    setLocation(null);
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const subadminId = user?.id;
      if (!subadminId) throw new Error("No subadmin session");
      const locRes = await axios.get(
        `https://api.managifyhr.com/api/location/${subadminId}/employee/${emp.empId}`
      );
      if (!locRes.data || !locRes.data.latitude || !locRes.data.longitude) {
        throw new Error("No location data available for this employee");
      }
      const lat = parseFloat(locRes.data.latitude);
      const lng = parseFloat(locRes.data.longitude);
      const lastLat = locRes.data.lastLatitude ? parseFloat(locRes.data.lastLatitude) : null;
      const lastLng = locRes.data.lastLongitude ? parseFloat(locRes.data.lastLongitude) : null;
      setLocation({
        lat,
        lng,
        empName: emp.fullName,
        lastLat,
        lastLng
      });
      // Reverse geocode for current location
      fetchAddress(lat, lng, setAddress);
      // Reverse geocode for last known location if present
      if (lastLat && lastLng) {
        fetchAddress(lastLat, lastLng, setLastAddress);
      } else {
        setLastAddress("");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto p-6 rounded-lg shadow-lg mt-10 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}
      sm:p-4 sm:mt-6 md:p-6 md:mt-8 lg:mt-10`} style={{ boxSizing: 'border-box' }}>
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Track Employee Location</h2>
      <div className="mb-6">
        <div className="relative w-full">
          <input
            type="text"
            className={`w-full p-3 rounded-lg border text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none
              ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-300' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'}`}
            placeholder="Enter Employee Name"
            value={employeeName}
            onChange={e => {
              setEmployeeName(e.target.value);
              setSelectedEmployee(null);
              setLocation(null);
            }}
            autoComplete="off"
            style={{ minHeight: 48, fontSize: 18 }}
          />
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && !selectedEmployee && (
            <div className={`absolute left-0 right-0 z-30 w-full mt-1 border rounded-lg shadow-lg overflow-hidden
              ${isDarkMode ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-gray-900 border-gray-200'}`}
              style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {suggestions.map(sug => (
                <div
                  key={sug.empId}
                  className={`px-5 py-3 cursor-pointer text-lg transition-all duration-150
                    ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-blue-100'}`}
                  style={{ minHeight: 48 }}
                  onClick={() => {
                    setEmployeeName(sug.fullName);
                    setSelectedEmployee(sug);
                    handleTrack(sug);
                  }}
                >
                  {sug.fullName}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition mb-4"
        disabled={!selectedEmployee || loading}
        onClick={() => selectedEmployee && handleTrack(selectedEmployee)}
      >
        {loading ? "Tracking..." : "Track Location"}
      </button>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {location && isLoaded && (
        <div>
          <div className="mb-2 text-lg font-semibold text-gray-700">
            {location.empName ? `Current Location for ${location.empName}` : "Employee Location"}
          </div>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={{ lat: location.lat, lng: location.lng }}
            zoom={16}
          >
            <Marker position={{ lat: location.lat, lng: location.lng }} />
          </GoogleMap>
          <div className="mt-2 text-gray-700 text-sm">
            <div><b>Latitude:</b> {location.lat}</div>
            <div><b>Longitude:</b> {location.lng}</div>
            {address && (
              <div className="text-xs text-blue-500 mt-1">Current Address: {address}</div>
            )}
            {location.lastLat && location.lastLng && (
              <>
                <div className="text-xs text-gray-500 mt-1">Last known: {location.lastLat}, {location.lastLng}</div>
                {lastAddress && (
                  <div className="text-xs text-blue-400 mt-1">Last Known Address: {lastAddress}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackEmployee;
