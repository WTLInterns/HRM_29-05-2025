import React, { useState, useEffect } from 'react';
import { FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import './LeaveNotification.css';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { toast } from 'react-toastify';

const LeaveNotification = () => {
  // --- Get subadminId/userRole FIRST ---
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

  // --- Pending Leaves State ---
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState('');
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingLeavesLoading, setPendingLeavesLoading] = useState(false);
  const [pendingLeavesError, setPendingLeavesError] = useState(null);

  // Fetch pending leaves when date changes and dialog is open
  useEffect(() => {
    if (!showPendingDialog || !pendingDate || !subadminId) return;
    setPendingLeavesLoading(true);
    setPendingLeavesError(null);
    fetch(`https://api.managifyhr.com/api/leaveform/${subadminId}/all`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch pending leaves');
        return res.json();
      })
      .then(data => {
        // Filter for pending and date match
        const filtered = data.filter(item =>
          item.status === 'Pending' &&
          (item.fromDate === pendingDate || item.toDate === pendingDate)
        );
        setPendingLeaves(filtered);
      })
      .catch(err => setPendingLeavesError(err.message || 'Unknown error'))
      .finally(() => setPendingLeavesLoading(false));
  }, [showPendingDialog, pendingDate, subadminId]);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
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
  const [suggestions, setSuggestions] = useState([]);

  // Update suggestions (like Attendance)
  useEffect(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      return;
    }
    const list = employees.map(emp => {
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
      return { empId: emp.empId, fullName };
    });
    const startsWith = [], endsWith = [], includes = [];
    list.forEach(item => {
      const name = item.fullName.toLowerCase();
      if (name.startsWith(query)) startsWith.push(item);
      else if (name.endsWith(query)) endsWith.push(item);
      else if (name.includes(query)) includes.push(item);
    });
    setSuggestions([...startsWith, ...endsWith, ...includes].slice(0, 10));
  }, [searchTerm, employees]);

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
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    let empNameToUse = userRole === 'SUBADMIN' ? selectedEmployeeFullName : userFullName;
    try {
      setLoading(true);
      const response = await fetch(`https://api.managifyhr.com/api/leaveform/${subadminId}/${encodeURIComponent(empNameToUse)}/${deleteTargetId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete leave');
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      toast.success('Leave deleted successfully!');
      await refreshLeaves();
    } catch (err) {
      toast.error(err.message || 'Failed to delete leave');
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
      setLoading(false);
    }
  };


  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  return (
    <div className="p-4">
    <div className={`leave-notification-container ${isDarkMode ? 'dark' : 'light'}`}>
      <h2 className="leave-notification-title">Leave Approval</h2>
      {/* View Pending Leaves Button */}


      {/* Pending Leaves Dialog */}
      <Dialog
        open={showPendingDialog}
        onClose={() => setShowPendingDialog(false)}
        aria-labelledby="pending-leaves-dialog-title"
        PaperProps={{
          style: {
            background: isDarkMode ? '#232b36' : '#fff',
            borderRadius: 12,
            minWidth: 500,
            border: isDarkMode ? '2px solid #38bdf8' : '2px solid #1976d2',
            boxShadow: '0 0 18px 0 #38bdf8',
            color: isDarkMode ? '#fff' : '#222',
          }
        }}
      >
        <DialogTitle
          id="pending-leaves-dialog-title"
          style={{
            color: '#3366ff',
            fontWeight: 700,
            fontSize: 22,
            marginBottom: 0,
            letterSpacing: 0.5
          }}
        >
          View Pending Leaves by Date
        </DialogTitle>
        <DialogContent style={{paddingTop: 10, paddingBottom: 6}}>
          <input
            type="date"
            value={pendingDate}
            onChange={e => setPendingDate(e.target.value)}
            style={{
              fontSize: 17,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              marginBottom: 16,
              background: isDarkMode ? '#232b36' : '#fff',
              color: isDarkMode ? '#fff' : '#222',
            }}
          />
          {pendingDate && (
            <div style={{marginTop: 10}}>
              {pendingLeavesLoading ? (
                <div style={{color: isDarkMode ? '#fff' : '#222'}}>Loading...</div>
              ) : pendingLeavesError ? (
                <div style={{color: '#f87171'}}>{pendingLeavesError}</div>
              ) : pendingLeaves.length === 0 ? (
                <div style={{color: isDarkMode ? '#fff' : '#222'}}>No pending leaves found for this date.</div>
              ) : (
                <table className="leave-table" style={{marginTop: 10, width: '100%'}}>
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLeaves.map(item => (
                      <tr key={item.leaveId}>
                        <td>{item.employee?.fullName || '-'}</td>
                        <td>{item.fromDate}</td>
                        <td>{item.toDate}</td>
                        <td>{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions style={{padding: 18, paddingTop: 0}}>
          <Button
            onClick={() => setShowPendingDialog(false)}
            variant="outlined"
            style={{
              color: isDarkMode ? '#38bdf8' : '#1976d2',
              borderColor: isDarkMode ? '#38bdf8' : '#1976d2',
              fontWeight: 600,
              fontSize: 17,
              minWidth: 110,
              background: isDarkMode ? '#232b36' : '#fff',
              letterSpacing: 0.5
            }}
          >
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>

      <div style={{ marginBottom: '1rem', position: 'relative', maxWidth: 400 }}>
  <input
    type="text"
    className="search-input"
    placeholder="Enter employee name"
    value={searchTerm}
    onChange={e => {
      setSearchTerm(e.target.value);
      setShowSuggestions(true);
      // Only clear selectedEmployeeFullName if user clears the box
      if (e.target.value === '') setSelectedEmployeeFullName('');
    }}
    onFocus={() => setShowSuggestions(true)}
    autoComplete="off"
    style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
  />
  {showSuggestions && searchTerm && suggestions.length > 0 && (
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
      {suggestions.map(emp => (
        <li
          key={emp.empId || emp.fullName}
          style={{ padding: '8px 12px', cursor: 'pointer' }}
          onClick={() => {
            setSelectedEmployeeFullName(emp.fullName);
            setSearchTerm(emp.fullName);
            setShowSuggestions(false);
          // Immediately fetch leaves for this employee
            if (userRole === 'SUBADMIN') {
              // fetchLeaves is an inner function, so trigger by updating selectedEmployeeFullName
              // which is already handled by the useEffect
            }
          }}
        >
          {emp.fullName}
        </li>
      ))}
    </ul>
  )}
  {/* Prompt below input when empty */}
 
</div>
      {userRole === 'SUBADMIN' && !selectedEmployeeFullName && (
        <div style={{margin: '1rem 0', color: 'orange'}}>Please select an employee to view leave requests.</div>
      )}
      <div className="leave-actions-row" style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
        <button className="view-leave-btn" onClick={() => setShowStatusSummary(!showStatusSummary)}>
          View Status
        </button>
        <button className="view-leave-btn" onClick={() => setShowPendingDialog(true)}>
          View Pending Leaves
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

      <div className="actions-table-gap"></div>
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
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          style: {
            background: isDarkMode ? '#232b36' : '#fff',
            borderRadius: 12,
            minWidth: 380,
            border: isDarkMode ? '2px solid #38bdf8' : '2px solid #1976d2',
            boxShadow: '0 0 18px 0 #38bdf8',
            color: isDarkMode ? '#fff' : '#222',
          }
        }}
      >
        <DialogTitle
          id="delete-dialog-title"
          style={{
            color: '#38bdf8',
            fontWeight: 700,
            fontSize: 24,
            marginBottom: 0,
            letterSpacing: 0.5
          }}
        >
          Confirm Deletion
        </DialogTitle>
        <DialogContent style={{paddingTop: 10, paddingBottom: 6}}>
          <div style={{fontSize: 18, marginBottom: 8, fontWeight: 500}}>
            Are you sure you want to delete this leave request?
          </div>
          <div style={{color:'#f87171', fontWeight:700, fontSize:18, marginTop:6}}>
            {(() => {
              const leave = leaveData.find(l => l.id === deleteTargetId);
              if (!leave) return null;
              return (
                <>
                  Employee: {leave.employeeName}<br/>
                  {leave.startDate && leave.endDate && (
                    <>Dates: {leave.startDate} to {leave.endDate}<br/></>
                  )}
                  {leave.reason && (
                    <>Reason: {leave.reason}</>
                  )}
                </>
              );
            })()}
          </div>
        </DialogContent>
        <DialogActions style={{padding: 18, paddingTop: 0}}>
          <Button
            onClick={handleCancelDelete}
            variant="outlined"
            style={{
              color: isDarkMode ? '#38bdf8' : '#1976d2',
              borderColor: isDarkMode ? '#38bdf8' : '#1976d2',
              fontWeight: 600,
              fontSize: 17,
              minWidth: 110,
              marginRight: 10,
              background: isDarkMode ? '#232b36' : '#fff',
              letterSpacing: 0.5
            }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            style={{
              background: '#ef4444',
              color: '#fff',
              fontWeight: 700,
              fontSize: 17,
              minWidth: 130,
              boxShadow: '0 2px 8px #ef4444a3',
              letterSpacing: 0.5
            }}
          >
            YES, DELETE
          </Button>
        </DialogActions>
      </Dialog>
    </div>
    </div>
  );
};

export default LeaveNotification;
