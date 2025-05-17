import React, { useState, useEffect } from 'react';
import { FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import './LeaveNotification.css';

const LeaveNotification = () => {
  // Robust user parse from localStorage
  let userData = null;
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser && rawUser !== 'null') {
      userData = JSON.parse(rawUser);
    }
  } catch (e) {
    userData = null;
  }
  const subadminId = userData?.id;
  const userRole = userData?.role;
  // For employee, fallback to firstName + lastName if fullName missing
  let userFullName = userData?.fullName;
  if (!userFullName && userData?.firstName && userData?.lastName) {
    userFullName = `${userData.firstName} ${userData.lastName}`;
  }
  // Theme
  const isDarkMode = localStorage.getItem('theme') === 'dark';
  // State
  const [showStatusSummary, setShowStatusSummary] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // For subadmin: employee list and selection
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeFullName, setSelectedEmployeeFullName] = useState('');
  // For autocomplete
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filteredEmployees = employees.filter(emp => {
    // Fallback to emp.fullName or emp.firstName/lastName or emp.empName
    let fullName = '';
    if (emp.fullName && typeof emp.fullName === 'string') {
      fullName = emp.fullName;
    } else if (emp.firstName && emp.lastName) {
      fullName = `${emp.firstName} ${emp.lastName}`;
    } else if (emp.empName) {
      fullName = emp.empName;
    } else {
      fullName = 'Unknown';
    }
    return fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Fetch employees for subadmin
  useEffect(() => {
    const fetchEmployees = async () => {
      if (userRole === 'SUBADMIN' && subadminId) {
        try {
          const res = await fetch(`https://api.managifyhr.com/api/employee/${subadminId}/employee/all`);
          if (!res.ok) throw new Error('Failed to fetch employees');
          const data = await res.json();
          console.log('Fetched employees:', data); // Debug log
          setEmployees(data);
        } catch (err) {
          setEmployees([]);
        }
      }
    };
    fetchEmployees();
  }, [userRole, subadminId]);

  // Fetch leaves when subadminId and selectedEmployeeFullName (for subadmin) or userFullName (for employee) changes
  useEffect(() => {
    const fetchLeaves = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!subadminId || (userRole === 'SUBADMIN' && !selectedEmployeeFullName) || (userRole !== 'SUBADMIN' && !userFullName)) {
          setLeaveData([]);
          setLoading(false);
          return;
        }
        let empNameToUse = userRole === 'SUBADMIN' ? selectedEmployeeFullName : userFullName;
        if (!empNameToUse) {
          setLeaveData([]);
          setLoading(false);
          return;
        }
        const response = await fetch(`https://api.managifyhr.com/api/leaveform/${subadminId}/${empNameToUse}`);
        if (!response.ok) throw new Error('Failed to fetch leave data');
        const data = await response.json();
        const mapped = data.map(item => ({
          id: item.leaveId,
          employeeName: item.employee?.fullName || '-',
          startDate: item.fromDate,
          endDate: item.toDate,
          reason: item.reason,
          status: item.status,
          isApproved: item.status === 'Approved' ? true : item.status === 'Rejected' ? false : null,
          original: item // Keep original object for PUT
        }));
        setLeaveData(mapped);
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if ((userRole === 'SUBADMIN' && selectedEmployeeFullName) || (userRole !== 'SUBADMIN' && userFullName)) {
      fetchLeaves();
    } else {
      setLoading(false);
    }
  }, [subadminId, selectedEmployeeFullName, userFullName, userRole]);

  // Helper to refresh leave data
  // Helper to refresh leave data
  const refreshLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      let empNameToUse = userRole === 'SUBADMIN' ? selectedEmployeeFullName : userFullName;
      if (!subadminId || !empNameToUse) {
        setError('User not logged in. Please login again.');
        setLoading(false);
        return;
      }
      const response = await fetch(`https://api.managifyhr.com/api/leaveform/${subadminId}/${empNameToUse}`);
      if (!response.ok) throw new Error('Failed to fetch leave data');
      const data = await response.json();
      const mapped = data.map(item => ({
        id: item.leaveId,
        employeeName: item.employee?.fullName || '-',
        startDate: item.fromDate,
        endDate: item.toDate,
        reason: item.reason,
        status: item.status,
        isApproved: item.status === 'Approved' ? true : item.status === 'Rejected' ? false : null,
        original: item
      }));
      setLeaveData(mapped);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };




  // Approve/Reject handlers with PUT API
  const handleApprove = async (id) => {
    const leave = leaveData.find(l => l.id === id);
    if (!leave) return;
    const updatedLeave = { ...leave.original, status: 'Approved' };
    let empNameToUse = userRole === 'SUBADMIN' ? selectedEmployeeFullName : userFullName;
    try {
      setLoading(true);
      const response = await fetch(`https://api.managifyhr.com/api/leaveform/${subadminId}/${empNameToUse}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLeave)
      });
      if (!response.ok) throw new Error('Failed to update leave');
      await refreshLeaves();
    } catch (err) {
      setError(err.message || 'Unknown error');
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    const leave = leaveData.find(l => l.id === id);
    if (!leave) return;
    const updatedLeave = { ...leave.original, status: 'Rejected' };
    let empNameToUse = userRole === 'SUBADMIN' ? selectedEmployeeFullName : userFullName;
    try {
      setLoading(true);
      const response = await fetch(`https://api.managifyhr.com/api/leaveform/${subadminId}/${empNameToUse}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLeave)
      });
      if (!response.ok) throw new Error('Failed to update leave');
      await refreshLeaves();
    } catch (err) {
      setError(err.message || 'Unknown error');
      setLoading(false);
    }
  };



  const handleDelete = (id) => {
    setLeaveData(prevData => prevData.filter(leave => leave.id !== id));
  };

  return (
    <div className="p-4">
    <div className={`leave-notification-container ${isDarkMode ? 'dark' : 'light'}`}>
      <h2 className="leave-notification-title">Leave Approval</h2>

      {/* Subadmin: Autocomplete employee search */}
      {userRole === 'SUBADMIN' && (
        <div style={{ marginBottom: '1rem', position: 'relative', maxWidth: 400 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            autoComplete="off"
          />
          {showSuggestions && searchTerm && filteredEmployees.length > 0 && (
            <ul style={{
              position: 'absolute',
              zIndex: 10,
              background: isDarkMode ? '#222' : '#fff',
              color: isDarkMode ? '#fff' : '#222',
              width: '100%',
              border: '1px solid #ccc',
              borderRadius: 4,
              maxHeight: 180,
              overflowY: 'auto',
              margin: 0,
              padding: 0,
              listStyle: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {filteredEmployees.map(emp => {
                // Fallback for full name
                let fullName = '';
                if (emp.fullName && typeof emp.fullName === 'string') {
                  fullName = emp.fullName;
                } else if (emp.firstName && emp.lastName) {
                  fullName = `${emp.firstName} ${emp.lastName}`;
                } else if (emp.empName) {
                  fullName = emp.empName;
                } else {
                  fullName = 'Unknown';
                }
                return (
                  <li
                    key={emp.empId || fullName}
                    style={{ padding: '8px 12px', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedEmployeeFullName(fullName);
                      setSearchTerm(fullName);
                      setShowSuggestions(false);
                    }}
                  >
                    {fullName}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Show message if subadmin and no employee selected */}
      {userRole === 'SUBADMIN' && !selectedEmployeeFullName && (
        <div style={{margin: '1rem 0', color: 'orange'}}>Please select an employee to view leave requests.</div>
      )}

      <div className="search-section">
        <button
          className={`view-leave-btn ${showStatusSummary ? 'active' : ''}`}
          onClick={() => setShowStatusSummary(!showStatusSummary)}
        >
          {showStatusSummary ? 'Hide Status' : 'View Status'}
        </button>
      </div>

      {showStatusSummary && (
        <div className="status-summary">
          <div className="status-counts">
            <div className="status-item">
              <span className="status-label">Total:</span>
              <span className="status-value">{leaveData.length}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Approved:</span>
              <span className="status-value">
                {leaveData.filter(leave => leave.status === 'Approved').length}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Rejected:</span>
              <span className="status-value">
                {leaveData.filter(leave => leave.status === 'Rejected').length}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Pending:</span>
              <span className="status-value">
                {leaveData.filter(leave => leave.status === 'Pending').length}
              </span>
            </div>
          </div>
          <div className="status-filters">
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Approved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Approved')}
            >
              Approved
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Rejected' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Rejected')}
            >
              Rejected
            </button>
            <button
              className={`filter-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('Pending')}
            >
              Pending
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="leave-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" style={{color:'red'}}>{error}</td></tr>
            ) : leaveData.length === 0 ? (
              <tr><td colSpan="6">No leave requests found.</td></tr>
            ) : (
              leaveData
                .filter(leave => statusFilter === 'all' || leave.status === statusFilter)
                .map((leave, index) => (
                  <tr key={index}>
                    <td>{leave.employeeName}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.reason}</td>
                    <td>{leave.status}</td>
                    <td>
                      <div className="action-buttons no-wrap">
                        <button
                          className={`action-button approve ${leave.isApproved === true ? 'approved' : ''}`}
                          onClick={() => handleApprove(leave.id)}
                          disabled={leave.isApproved === true}
                        >
                          <FaCheck /> Approve
                        </button>
                        <button
                          className={`action-button reject ${leave.isApproved === false ? 'rejected' : ''}`}
                          onClick={() => handleReject(leave.id)}
                          disabled={leave.isApproved === false}
                        >
                          <FaTimes /> Reject
                        </button>
                        <button
                          className="icon-button delete"
                          onClick={() => handleDelete(leave.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default LeaveNotification;
