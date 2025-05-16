import React, { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import axios from "axios";
import "./animations.css";
import { FaUsers, FaUserCheck, FaUserMinus, FaBriefcase, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Home = () => {
  const { emp, isDarkMode } = useApp();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subadminId, setSubadminId] = useState(null);
  
  // Fetch the actual employee data from API
  useEffect(() => {
    // Get the subadmin data from localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.id) {
      setSubadminId(userData.id);
      fetchEmployees(userData.id);
    } else {
      setError("No user data found in localStorage or missing ID");
      setLoading(false);
    }
  }, []);
  
  const fetchEmployees = async (id) => {
    try {
      console.log(`Fetching employees for subadmin ID: ${id}`);
      const response = await axios.get(`https://api.managifyhr.com/api/employee/${id}/employee/all`);
      console.log("Employee data received:", response.data);
      setEmployees(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to fetch employees");
      setLoading(false);
    }
  };
  
  // Calculate stats based on actual data
  const activeEmp = employees.filter((employee) => employee.status === "Active" || employee.status === "active");
  const inactiveEmp = employees.filter((employee) => employee.status === "Inactive" || employee.status === "inactive");
  const activeEmpCount = activeEmp.length;
  const inactiveEmpCount = inactiveEmp.length;
  
  // Listen for employee updates
  useEffect(() => {
    const handleEmployeesUpdated = () => {
      console.log('Employees updated event received, refreshing data...');
      if (subadminId) {
        fetchEmployees(subadminId);
      }
    };
    
    window.addEventListener('employeesUpdated', handleEmployeesUpdated);
    
    return () => {
      window.removeEventListener('employeesUpdated', handleEmployeesUpdated);
    };
  }, [subadminId]);
  
  // For salary calculations using actual data
  const activeSalary = activeEmp.reduce((sum, emp) => sum + (parseFloat(emp.salary) || 0), 0);
  const inactiveSalary = inactiveEmp.reduce((sum, emp) => sum + (parseFloat(emp.salary) || 0), 0);
  const totalSalary = activeSalary + inactiveSalary;
  const companyBudget = 1000000; // 10 lakh budget
  const profitLoss = companyBudget - totalSalary;
  const isProfitable = profitLoss > 0;
  
  const stats = {
    totalEmployees: employees.length,
    activeEmployees: activeEmpCount,
    inactiveEmployees: inactiveEmpCount,
    totalSalary,
    activeSalary,
    inactiveSalary,
    profitLoss
  };

  // Prepare pie chart data with actual salary info
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
  
  // Calculate percentages for active and inactive employees
  const activePercentage = stats.totalEmployees > 0 ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0;
  const inactivePercentage = stats.totalEmployees > 0 ? Math.round((stats.inactiveEmployees / stats.totalEmployees) * 100) : 0;
  
  // Prepare pie chart data for employee status
  const employeeStatusData = {
    labels: [`Active Employees (${activePercentage}%)`, `Inactive Employees (${inactivePercentage}%)`],
    datasets: [
      {
        data: [stats.activeEmployees, stats.inactiveEmployees],
        backgroundColor: [
          'rgba(59, 130, 246, 0.85)',   // Blue for active
          'rgba(239, 68, 68, 0.85)',   // Red for inactive
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 0,
        hoverBackgroundColor: [
          'rgba(59, 130, 246, 1)',
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


  


  // Update chart options based on theme
  useEffect(() => {
    console.log("Dashboard home: Theme changed to", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

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
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
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
        borderColor: isDarkMode ? '#475569' : '#cbd5e1',
        borderWidth: 0,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}`;
          },
          labelTextColor: () => '#ffffff'
        }
      }
    }
  };



  // Group employees by job role and count active/inactive for each role using actual data
  const jobRoleSummary = employees.reduce((acc, employee) => {
    // Normalize job role names to handle case sensitivity and trailing spaces
    let role = employee.jobRole || "Undefined";
    
    // Normalize MERN STACK DEVELOPER variations
    if (role.toUpperCase().includes("MERN") && role.toUpperCase().includes("STACK") && role.toUpperCase().includes("DEVELOPER")) {
      role = "MERN STACK DEVELOPER";
    }
    
    // Handle other common role normalizations
    if (role.toUpperCase().includes("JAVA") && role.toUpperCase().includes("FULL") && role.toUpperCase().includes("STACK")) {
      role = "JAVA FULL STACK";
    }
    
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

  // Create a table-like data structure for job roles and their statuses
  const jobRoleTable = Object.entries(jobRoleSummary).map(([role, counts]) => ({
    role,
    active: counts.active,
    inactive: counts.inactive,
    total: counts.active + counts.inactive
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 rounded-lg p-4 text-red-200">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'text-white' : 'text-gray-800'} animate-fadeIn`}>
      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Employees */}
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:scale-[1.01] cursor-pointer`}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Employees</h3>
                <h2 className={`text-4xl font-bold mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{employees.length}</h2>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <FaUsers className={`text-2xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Active Employees */}
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:scale-[1.01] cursor-pointer`}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Active Employees</h3>
                <h2 className={`text-4xl font-bold mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{activeEmpCount}</h2>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <FaUserCheck className={`text-2xl ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Inactive Employees */}
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:scale-[1.01] cursor-pointer`}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Inactive Employees</h3>
                <h2 className={`text-4xl font-bold mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{inactiveEmpCount}</h2>
              </div>
              <div className={`p-3 rounded-full ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                <FaUserMinus className={`text-2xl ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Employee Status and Role Distribution Section */}
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} p-6 rounded-lg shadow-lg mt-6`}>
        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-6`}>Employee Overview</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Employee Status Pie Chart */}
          <div>
            <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>Status Distribution</h4>
            <div className="h-72">
              <Pie data={employeeStatusData} options={chartOptions} />
            </div>
            <div className="mt-4 flex justify-center space-x-8">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Active ({stats.activeEmployees}) 
                  <span className="ml-1 font-medium">{activePercentage}%</span>
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Inactive ({stats.inactiveEmployees})
                  <span className="ml-1 font-medium">{inactivePercentage}%</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Employee Role Distribution */}
          <div>
            <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>Role Distribution</h4>
            <div className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg p-4 h-72 overflow-auto`}>
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <th className={`text-left py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Role</th>
                    <th className={`text-center py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</th>
                    <th className={`text-center py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Active</th>
                    <th className={`text-center py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Inactive</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(jobRoleSummary)
                    .sort((a, b) => (b[1].active + b[1].inactive) - (a[1].active + a[1].inactive))
                    .map(([role, counts], index) => (
                      <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                        <td className={`py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{role || 'Undefined'}</td>
                        <td className={`text-center py-2 px-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{counts.active + counts.inactive}</td>
                        <td className="py-2 px-2 text-center">
                          <span className="flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{counts.active}</span>
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="flex items-center justify-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{counts.inactive}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>



      {/* Show loading state */}
      {loading && (
        <div className={`flex justify-center items-center h-40 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-current"></div>
        </div>
      )}

      {/* Show error state */}
      {error && (
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-white' : 'bg-red-100 text-red-600'} animate-fadeIn`}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Home; 