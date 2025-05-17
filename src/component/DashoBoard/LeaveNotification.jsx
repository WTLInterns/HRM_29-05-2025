import React, { useState } from 'react';
import { FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import './LeaveNotification.css';

const LeaveNotification = () => {
  // Get theme from localStorage
  const isDarkMode = localStorage.getItem('theme') === 'dark';
  const [showStatusSummary, setShowStatusSummary] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveData, setLeaveData] = useState([
    {
      id: 1,
      employeeName: 'John Doe',
      startDate: '2025-05-20',
      endDate: '2025-05-25',
      reason: 'Vacation',
      status: 'Pending',
      isApproved: null
    },
    {
      id: 2,
      employeeName: 'Jane Smith',
      startDate: '2025-05-22',
      endDate: '2025-05-24',
      reason: 'Personal',
      status: 'Pending',
      isApproved: null
    },
    {
      id: 3,
      employeeName: 'John Cena',
      startDate: '2025-05-26',
      endDate: '2025-05-28',
      reason: 'Attend Family Function...',
      status: 'Pending',
      isApproved: null
    }
  ]);

  const handleApprove = (id) => {
    setLeaveData(prevData =>
      prevData.map(leave =>
        leave.id === id
          ? { ...leave, isApproved: true, status: 'Approved' }
          : leave
      )
    );
  };

  const handleReject = (id) => {
    setLeaveData(prevData =>
      prevData.map(leave =>
        leave.id === id
          ? { ...leave, isApproved: false, status: 'Rejected' }
          : leave
      )
    );
  };

  const handleDelete = (id) => {
    setLeaveData(prevData => prevData.filter(leave => leave.id !== id));
  };

  return (
    <div className="p-4">
    <div className={`leave-notification-container ${isDarkMode ? 'dark' : 'light'}`}>
      <h2 className="leave-notification-title">Leave Approval</h2>
      
      <div className="search-section">
        <input 
          type="text" 
          placeholder="Search by employee name..." 
          className="search-input"
        />
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
            {leaveData
              .filter(leave => statusFilter === 'all' || leave.status === statusFilter)
              .map((leave, index) => (
              <tr key={index}>
                <td>{leave.employeeName}</td>
                <td>{leave.startDate}</td>
                <td>{leave.endDate}</td>
                <td>{leave.reason}</td>
                <td>{leave.status}</td>
                <td className="action-buttons">
                  <button
                    className={`action-button approve ${leave.isApproved === true ? 'approved' : ''}`}
                    onClick={() => handleApprove(leave.id)}
                  >
                    <FaCheck /> Approve
                  </button>
                  <button
                    className={`action-button reject ${leave.isApproved === false ? 'rejected' : ''}`}
                    onClick={() => handleReject(leave.id)}
                  >
                    <FaTimes /> Reject
                  </button>
                  <button
                    className="icon-button delete"
                    onClick={() => handleDelete(leave.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default LeaveNotification;
