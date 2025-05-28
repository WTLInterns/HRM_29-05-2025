import React, { useEffect, useState, useMemo } from "react";
import ReactConfetti from "react-confetti";
import axios from "axios";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import Attendance from "./Attendance";
import TrackEmployee from "./TrackEmployee";
import SalarySheet from "./SalarySheet";
import SalarySlip from "./SalarySlip";
import AddEmp from "./AddEmp";
import ViewAttendance from "./ViewAttendance";
import { IoIosLogOut, IoIosPersonAdd } from "react-icons/io";
import { LuNotebookPen } from "react-icons/lu";
import { MdOutlinePageview, MdKeyboardArrowDown, MdKeyboardArrowRight, MdDashboard } from "react-icons/md";
import { FaReceipt, FaCalendarAlt, FaRegIdCard, FaExclamationTriangle, FaTimes, FaSignOutAlt, FaChartPie, FaArrowUp, FaArrowDown, FaMoon, FaSun, FaFileAlt, FaBell, FaUserCog } from "react-icons/fa";
import { BiSolidSpreadsheet } from "react-icons/bi";
import { HiMenu, HiX } from "react-icons/hi";
import { useApp } from "../../context/AppContext";
import Home from "./Home";
import ProfileForm from "./ProfileForm";
import Certificates from "./Certificates";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import "./animations.css";
import DashoBoardRouter from "./DashboardRouter/DashoBoardRouter";
import Reminders from "./Reminders";
import LeaveNotification from "./LeaveNotification";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Add custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(59, 130, 246, 0.5);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(59, 130, 246, 0.8);
  }
`;

const Dashboard = () => {
  // ...existing state...
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Fetch expenses and calculate total
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        // Use the same SUBADMIN_ID logic as Expenses.jsx
        const SUBADMIN_ID = 2;
        const API_BASE = `https://api.managifyhr.com/api/expenses/${SUBADMIN_ID}`;
        const res = await axios.get(`${API_BASE}/getAll`);
        setExpenses(res.data || []);
      } catch (err) {
        setExpenses([]);
      }
    };
    fetchExpenses();
    // Listen for expense updates (optional: you can dispatch a custom event on expense change)
    window.addEventListener('expensesUpdated', fetchExpenses);
    return () => window.removeEventListener('expensesUpdated', fetchExpenses);
  }, []);

  useEffect(() => {
    // Calculate total expenses whenever expenses change
    const total = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    setTotalExpenses(total);
  }, [expenses]);
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Update window dimensions when window is resized
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [birthdayEmployees, setBirthdayEmployees] = useState([]);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false);
  const { fetchAllEmp, emp, logoutUser, isDarkMode, toggleTheme } = useApp();
  
  // Add scrollbar styles to document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = scrollbarStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [attendanceDropdownOpen, setAttendanceDropdownOpen] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfitable, setIsProfitable] = useState(false);
  const [companyBudget] = useState(1000000); // 10 lakh budget
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalSalary: 0,
    activeSalary: 0,
    inactiveSalary: 0,
    profitLoss: 0
  });

  // Add user data state
  const [userData, setUserData] = useState({
    name: "",
    lastname: "",
    companylogo: "",
    registercompanyname: "WTL HRM Dashboard"
  });
  
  // Add image load tracking
  const [logoLoadAttempt, setLogoLoadAttempt] = useState(0);
  
  // Get backend URL
  const BACKEND_URL = useMemo(() => "https://api.managifyhr.com", []);
  
  // Default image
  const defaultImage = "/image/admin-profile.jpg";
  
  // Load user data from localStorage
  // Function to check if it's an employee's birthday
  const checkBirthdays = (employees) => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const birthdayPeople = employees.filter(emp => {
      if (!emp.birthDate) return false;
      const birthDate = new Date(emp.birthDate);
      const birthMonth = birthDate.getMonth() + 1;
      const birthDay = birthDate.getDate();
      return birthMonth === currentMonth && birthDay === currentDay;
    });

    if (birthdayPeople.length > 0) {
      setBirthdayEmployees(birthdayPeople);
      setShowBirthdayPopup(true);
    }
  };

  // Fetch employees and check birthdays
  useEffect(() => {
    const fetchEmployeesAndCheckBirthdays = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && user.id) {
        try {
          const response = await axios.get(
            `https://api.managifyhr.com/api/employee/${user.id}/employee/all`
          );
          checkBirthdays(response.data);
        } catch (error) {
          console.error("Error fetching employees:", error);
        }
      }
    };

    fetchEmployeesAndCheckBirthdays();
  }, []);

  // Check for due reminders
  const checkReminders = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) return;

      const response = await axios.get(`https://api.managifyhr.com/api/reminders/${user.id}`);
      const currentDate = new Date();
      
      const dueReminder = response.data.find(reminder => {
        const reminderDate = new Date(reminder.reminderDate);
        return (
          reminderDate.getDate() === currentDate.getDate() &&
          reminderDate.getMonth() === currentDate.getMonth() &&
          reminderDate.getFullYear() === currentDate.getFullYear()
        );
      });

      if (dueReminder) {
        setCurrentReminder(dueReminder);
        setShowReminderPopup(true);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  };

  // Check reminders daily at midnight
  useEffect(() => {
    checkReminders();
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow - now;

    // First check at midnight
    const timeout = setTimeout(() => {
      checkReminders();
      // Then check every 24 hours
      const interval = setInterval(checkReminders, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserData({
        name: user.name || "",
        lastname: user.lastname || "",
        companylogo: user.companylogo || "",
        registercompanyname: user.registercompanyname || "WTL HRM Dashboard"
      });
    }
  }, []);

  useEffect(() => {
    // Only fetch if the emp array is empty and user is present
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.id && (!emp || emp.length === 0)) {
      fetchAllEmp();
    }
  }, [emp, fetchAllEmp]);

  useEffect(() => {
    const calculateStats = () => {
      try {
        setLoading(true);
        
        const activeEmployees = emp.filter(employee => employee.status === "Active" || employee.status === "active");
        const inactiveEmployees = emp.filter(employee => employee.status === "Inactive" || employee.status === "inactive");
        
        const activeSalary = activeEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
        const inactiveSalary = inactiveEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
        const totalSalary = activeSalary + inactiveSalary;
        
        // Calculate profit/loss
        const profitLoss = companyBudget - totalSalary;
        const profitable = profitLoss > 0;
        setIsProfitable(profitable);
        
        setStats({
          totalEmployees: emp.length,
          activeEmployees: activeEmployees.length,
          inactiveEmployees: inactiveEmployees.length,
          totalSalary,
          activeSalary,
          inactiveSalary,
          profitLoss
        });
        setLoading(false);
      } catch (error) {
        console.error("Error calculating stats:", error);
        setLoading(false);
      }
    };
    
    calculateStats();
    
    // Add event listener for updates
    window.addEventListener('employeesUpdated', calculateStats);
    
    return () => {
      window.removeEventListener('employeesUpdated', calculateStats);
    };
  }, [emp, companyBudget]);

  // Prepare pie chart data for salary distribution
  const pieChartData = {
    labels: ['Active Salary', 'Inactive Salary'],
    datasets: [
      {
        data: [stats.activeSalary, stats.inactiveSalary],
        backgroundColor: [
          'rgba(56, 189, 248, 0.85)',   // Sky blue for active
          'rgba(251, 113, 133, 0.85)',  // Modern pink for inactive
        ],
        borderColor: [
          'rgba(56, 189, 248, 1)',
          'rgba(251, 113, 133, 1)',
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          'rgba(56, 189, 248, 1)',
          'rgba(251, 113, 133, 1)',
        ],
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 2,
        borderRadius: 6,
        spacing: 8,
        offset: 6,
      },
    ],
  };
  
  // Prepare pie chart data for employee status
  const employeeStatusData = {
    labels: ['Active Employees', 'Inactive Employees'],
    datasets: [
      {
        data: [stats.activeEmployees, stats.inactiveEmployees],
        backgroundColor: [
          'rgba(34, 197, 94, 0.85)',   // Green for active
          'rgba(239, 68, 68, 0.85)',   // Red for inactive
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 2,
        borderRadius: 6,
        spacing: 8,
        offset: 6,
      },
    ],
  };

  // Define yearlyData for the bar chart
  const yearlyData = [
    { year: '2020', profit: 80000, loss: 20000 },
    { year: '2021', profit: 90000, loss: 15000 },
    { year: '2022', profit: 120000, loss: 25000 },
    { year: '2023', profit: 150000, loss: 30000 },
    { year: '2024', profit: 200000, loss: 40000 },
  ];

  // Prepare bar chart data
  const barChartData = {
    labels: yearlyData.map(item => item.year),
    datasets: [
      {
        label: 'Profit',
        data: yearlyData.map(item => item.profit),
        backgroundColor: 'rgba(56, 189, 248, 0.85)',
        borderColor: 'rgba(56, 189, 248, 1)',
        borderWidth: 1,
      },
      {
        label: 'Loss',
        data: yearlyData.map(item => item.loss),
        backgroundColor: 'rgba(251, 113, 133, 0.85)',
        borderColor: 'rgba(251, 113, 133, 1)',
        borderWidth: 1,
      }
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    radius: '85%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: {
          size: 16,
          weight: 'bold'
        },
        bodyFont: {
          size: 14
        },
        padding: 15,
        cornerRadius: 8,
        caretSize: 0,
        borderColor: '#475569',
        borderWidth: 0,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          },
          labelTextColor: () => '#ffffff'
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
      easing: 'easeOutCirc',
      delay: (context) => context.dataIndex * 200
    },
    elements: {
      arc: {
        borderWidth: 0
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#475569',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff',
          callback: (value) => `₹${value.toLocaleString()}`
        }
      }
    }
  };

  // Count active and inactive employees
  const activeEmp = emp.filter((employee) => employee.status === "Active" || employee.status === "active");
  const inactiveEmp = emp.filter((employee) => employee.status === "Inactive" || employee.status === "inactive");
  const activeEmpCount = activeEmp.length;
  const inactiveEmpCount = inactiveEmp.length;

  // Group employees by job role and count active/inactive for each role
  const jobRoleSummary = emp.reduce((acc, employee) => {
    const role = employee.jobRole || 'Unassigned';
    if (!acc[role]) {
      acc[role] = { active: 0, inactive: 0 };
    }
    if (employee.status === "Active" || employee.status === "active") {
      acc[role].active += 1;
    } else {
      acc[role].inactive += 1;
    }
    return acc;
  }, {});
  
  // Prepare job role chart data
  const jobRoleLabels = Object.keys(jobRoleSummary);
  const activeJobRoleCounts = jobRoleLabels.map(role => jobRoleSummary[role].active);
  const inactiveJobRoleCounts = jobRoleLabels.map(role => jobRoleSummary[role].inactive);
  
  const jobRoleChartData = {
    labels: jobRoleLabels,
    datasets: [
      {
        label: 'Active Employees',
        data: activeJobRoleCounts,
        backgroundColor: 'rgba(34, 197, 94, 0.85)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Inactive Employees',
        data: inactiveJobRoleCounts,
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      }
    ],
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleAttendanceDropdown = () => {
    setAttendanceDropdownOpen(!attendanceDropdownOpen);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logoutUser();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Navigation links array for DRY code
  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <MdDashboard /> },
    { to: "/dashboard/profileform", label: "Profile", icon: <FaRegIdCard /> },
    { to: "/dashboard/addEmp", label: "Add Employee", icon: <IoIosPersonAdd /> },
    { 
      label: "Attendance",
      icon: <LuNotebookPen />,
      dropdown: true,
      children: [
        { to: "/dashboard/attendance", label: "Mark Attendance", icon: <FaCalendarAlt /> },
        { to: "/dashboard/viewAtt", label: "View Attendance", icon: <MdOutlinePageview /> },
      ]
    },
    { to: "/dashboard/salarysheet", label: "Salary Sheet", icon: <BiSolidSpreadsheet /> },
    { to: "/dashboard/salaryslip", label: "Salary Slip", icon: <FaReceipt /> },
    { 
      to: "/dashboard/certificates", 
      label: "Certificates", 
      icon: <FaFileAlt /> 
    },
    {
      to: "/dashboard/expenses",
      label: "Expenses",
      icon: <FaArrowDown />
    },
    {
      to: "/dashboard/reminders",
      label: "Set Reminder",
      icon: <FaBell />
    },
    {
      to: "/dashboard/leave-notification",
      label: "Leave Approval",
      icon: <FaExclamationTriangle />
    },
    {
      to: "/dashboard/track-employee",
      label: "Track Employee",
      icon: <FaUserCog />
    }
  ];

  // Handle logo error without infinite loops
  const handleLogoError = () => {
    console.log("Error loading dashboard logo, using fallback.");
    
    // Don't update state if we've already tried too many times
    if (logoLoadAttempt > 1) return;
    
    // Increment the attempt counter
    setLogoLoadAttempt(prev => prev + 1);
  };

  // Additional useEffect to log theme changes for debugging
  useEffect(() => {
    console.log("Dashboard: Theme changed to", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-slate-900 to-blue-900 text-gray-100' : 'bg-gradient-to-br from-blue-50 to-white text-gray-800'}`}>
      {/* Reminder Popup */}
      {showReminderPopup && currentReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`relative p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} max-w-md w-full mx-4`}>
            <button
              onClick={() => setShowReminderPopup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="mb-4">
                <FaBell className="text-4xl text-yellow-500 mx-auto animate-bounce" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Today's Festival : {currentReminder.functionName}
              </h3>
              <div className={`mt-4 p-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Date: {new Date(currentReminder.reminderDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Confetti Effect */}
      {showBirthdayPopup && birthdayEmployees.length > 0 && (
        <ReactConfetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          numberOfPieces={200}
          recycle={true}
          colors={['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']}
          tweenDuration={5000}
        />
      )}
      {/* Birthday Popup */}
      {showBirthdayPopup && birthdayEmployees.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`relative p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} max-w-md w-full mx-4`}>
            <button
              onClick={() => setShowBirthdayPopup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="mb-4">
                <span className="text-4xl">🎂</span>
              </div>
              {birthdayEmployees.map((emp, index) => (
                <div key={index} className="mb-4">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Today is {emp.firstName} {emp.lastName}'s Birthday!
                  </h3>
                  <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Let's make their day special! 🎉
                  </p>
                </div>
              ))}
              <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                  Don't forget to wish them a fantastic birthday! 🎈
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile menu button - only visible on small screens */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Header - only visible on small screens */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-center p-4 bg-slate-800 text-white shadow-md">
        <h1 className="text-xl font-bold animate-pulse-slow">{userData.registercompanyname || "TECH mahindra"}</h1>
      </div>

      {/* Sidebar */}
      <aside 
        className={`w-64 h-full ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-lg'} fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className={`flex flex-col items-center px-4 py-5 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-blue-50 border-blue-200'} border-b relative flex-shrink-0`}>
          <Link to="/dashboard/profileform" className="group transition-all duration-300">
            <div className={`w-24 h-24 rounded-full ${isDarkMode ? 'bg-slate-100 border-blue-800' : 'bg-white border-blue-500'} border-4 overflow-hidden mb-4 group-hover:border-blue-400 transition-all duration-300 shadow-lg group-hover:shadow-blue-900/40`}>
              {userData.companylogo && logoLoadAttempt < 1 ? (
                <img 
                  src={`https://api.managifyhr.com/images/profile/${userData.companylogo}`} 
                  alt="Company Logo" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                  onError={(e) => {
                    handleLogoError();
                    e.target.src = defaultImage;
                    e.target.onerror = null;
                  }}
                />
              ) : (
                <img 
                  src={defaultImage} 
                  alt="Admin" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                  onError={(e) => {
                    e.target.src = "/image/lap2.jpg"; 
                    e.target.onerror = null;
                  }}
                />
              )}
            </div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'} group-hover:text-blue-400 transition-all duration-300 text-center`}>
              {userData.registercompanyname || "TECH mahindra"}
            </h2>
            {userData.name && (
              <p className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} group-hover:text-blue-300 transition-all duration-300 text-center`}>
                Hrm Dashboard
              </p>
            )}
          </Link>
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700/50 transition-all duration-300"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <FaSun className="text-yellow-300 text-xl" />
            ) : (
              <FaMoon className="text-gray-600 text-xl" />
            )}
          </button>
        </div>

        <nav className="px-4 py-3 flex-grow overflow-y-auto custom-scrollbar">
          <div className="space-y-0">
            {navLinks.map((link, index) => (
              link.dropdown ? (
                <div key={index} className="mb-1 animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <button
                    onClick={link.label === "Attendance" ? toggleAttendanceDropdown : toggleCertificatesDropdown}
                    className="flex items-center justify-between w-full gap-2 p-2 rounded hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 menu-item ripple"
                  >
                    <div className="flex items-center gap-2">
                      {link.icon && <span className="text-blue-400 w-6">{link.icon}</span>} {link.label}
                    </div>
                    {(link.label === "Attendance" ? attendanceDropdownOpen : certificatesDropdownOpen) ? 
                      <MdKeyboardArrowDown className="transition-transform duration-300 text-blue-400" /> : 
                      <MdKeyboardArrowRight className="transition-transform duration-300 text-blue-400" />
                    }
                  </button>
                  {((link.label === "Attendance" && attendanceDropdownOpen) || 
                    (link.label === "Certificates" && certificatesDropdownOpen)) && (
                    <div className="pl-8 mt-1 space-y-1 animate-slideIn">
                      {link.children.map((child, childIndex) => (
                        <Link
                          key={childIndex}
                          to={child.to}
                          className="flex items-center gap-2 p-2 rounded hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 menu-item hover:translate-x-2"
                          onClick={closeMobileMenu}
                        >
                          {child.icon && <span className="text-blue-400 w-6">{child.icon}</span>} {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={index}
                  to={link.to}
                  className="flex items-center gap-2 p-2 my-1 rounded hover:bg-slate-700 hover:text-blue-400 transition-all duration-300 menu-item ripple animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={closeMobileMenu}
                >
                  {link.icon && <span className="text-blue-400 w-6">{link.icon}</span>} {link.label}
                </Link>
              )
            ))}
          </div>
        </nav>

        <div className="mt-auto px-4 pb-6 flex-shrink-0">
          {/* Theme Toggle Button */}
          
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center gap-2 p-3 w-full rounded bg-red-600 hover:bg-red-700 text-white transition-all duration-300 hover:translate-y-[-2px] hover:shadow-md btn-interactive"
          >
            <FaSignOutAlt className="text-white" /> Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile menu - only visible when menu is open on small screens */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-30"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {/* Only show dashboard cards on the main dashboard route */}
        {window.location.pathname === "/dashboard" || window.location.pathname === "/" ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total Employees Card */}
            <div className={`rounded-lg shadow-md p-6 flex flex-col items-center ${isDarkMode ? 'bg-slate-900 text-cyan-300' : 'bg-white text-cyan-700'}`}>
              <span className="text-4xl mb-2">👥</span>
              <div className="text-lg font-semibold mb-1">Total Employees</div>
              <div className="text-3xl font-bold">{stats.activeEmployees + stats.inactiveEmployees}</div>
            </div>
            {/* Active Employees Card */}
            <div className={`rounded-lg shadow-md p-6 flex flex-col items-center ${isDarkMode ? 'bg-slate-900 text-blue-300' : 'bg-white text-blue-700'}`}>
              <span className="text-4xl mb-2">👨‍💼</span>
              <div className="text-lg font-semibold mb-1">Active Employees</div>
              <div className="text-3xl font-bold">{stats.activeEmployees}</div>
            </div>
            {/* Inactive Employees Card */}
            <div className={`rounded-lg shadow-md p-6 flex flex-col items-center ${isDarkMode ? 'bg-slate-900 text-red-300' : 'bg-white text-red-600'}`}>
              <span className="text-4xl mb-2">🛑</span>
              <div className="text-lg font-semibold mb-1">Inactive Employees</div>
              <div className="text-3xl font-bold">{stats.inactiveEmployees}</div>
            </div>
            {/* Total Expenses Card */}
            <div className={`rounded-lg shadow-md p-6 flex flex-col items-center ${isDarkMode ? 'bg-slate-900 text-amber-300' : 'bg-white text-amber-600'}`}>
              <span className="text-4xl mb-2">💸</span>
              <div className="text-lg font-semibold mb-1">Total Expenses</div>
              <div className="text-3xl font-bold">₹{totalExpenses.toLocaleString()}</div>
            </div>
          </div>
        ) : null}
        {/* Add top padding on mobile to account for the fixed header */}
        <div className="pt-16 lg:pt-0 h-full page-transition-container animate-fadeIn">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="addEmp" element={<AddEmp />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="salarysheet" element={<SalarySheet />} />
            <Route path="salaryslip" element={<SalarySlip />} />
            <Route path="viewAtt" element={<ViewAttendance />} />
            <Route path="profileform" element={<ProfileForm />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="track-employee" element={<TrackEmployee />} />
            <Route path="*" element={<DashoBoardRouter />} />
          </Routes>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300" 
            onClick={cancelLogout}
          ></div>
          <div className="bg-slate-800 rounded-lg shadow-xl border border-orange-800 w-full max-w-md p-6 z-10 animate-scaleIn transform transition-all duration-300">
            <div className="flex items-center mb-4 text-orange-500">
              <FaExclamationTriangle className="text-2xl mr-3 animate-pulse" />
              <h3 className="text-xl font-semibold">Logout Confirmation</h3>
              <button 
                onClick={cancelLogout} 
                className="ml-auto p-1 hover:bg-slate-700 rounded-full transition-colors duration-200"
              >
                <FaTimes className="text-gray-400 hover:text-white" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="mb-2 text-gray-200">Are you sure you want to logout?</p>
              <p className="text-gray-400 text-sm">Your session will be ended and you'll need to log in again to access the dashboard.</p>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button 
                onClick={cancelLogout}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                <FaSignOutAlt className="transform group-hover:translate-x-[-2px] transition-transform duration-300" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
