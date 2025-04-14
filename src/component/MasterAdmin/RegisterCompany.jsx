
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  FaUser, 
  FaBuilding, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaFileSignature, 
  FaStamp, 
  FaCheck, 
  FaTimes, 
  FaArrowLeft,
  FaUpload
} from "react-icons/fa";
import "../DashoBoard/animations.css";

const RegisterCompany = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = new URLSearchParams(location.search).get('mode') === 'edit';
  
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Preview states for uploaded files
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);

  const initialFormState = {
    id: Date.now(),
    name: "",
    lastName: "",
    registerCompanyName: "",
    email: "",
    phoneno: "",
    address: "",
    logo: null,
    signature: null,
    stampImage: null,
    hasSignature: false,
    hasStamp: false,
    status: "Active",
    gstno: ""
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isEditMode) {
      const companyToEdit = JSON.parse(localStorage.getItem('companyToEdit') || 'null');
      if (companyToEdit) {
        setFormData(companyToEdit);
        
        // Set preview images if they exist in the company data
        if (companyToEdit.logo && typeof companyToEdit.logo === 'string') {
          setLogoPreview(companyToEdit.logo);
        }
        
        if (companyToEdit.signature && typeof companyToEdit.signature === 'string') {
          setSignaturePreview(companyToEdit.signature);
        }
        
        if (companyToEdit.stampImage && typeof companyToEdit.stampImage === 'string') {
          setStampPreview(companyToEdit.stampImage);
        }
      }
    }
  }, [isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };
  
  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        [fileType]: file,
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fileType === 'logo') {
          setLogoPreview(reader.result);
        } else if (fileType === 'signature') {
          setSignaturePreview(reader.result);
          setFormData(prev => ({ ...prev, hasSignature: true }));
        } else if (fileType === 'stampImage') {
          setStampPreview(reader.result);
          setFormData(prev => ({ ...prev, hasStamp: true }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditMode) {
        // Update existing company using the API
        const apiUrl = `http://localhost:8282/api/subadmin/update-fields/${formData.id}`;
        
        // Create FormData and append text fields and file fields
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("lastname", formData.lastName);
        formDataToSend.append("registercompanyname", formData.registerCompanyName);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("phoneno", formData.phoneno);
        formDataToSend.append("gstno", formData.gstno);
        formDataToSend.append("status", formData.status);
        
        // Append the files if they exist
        if (formData.logo) {
          formDataToSend.append("companylogo", formData.logo);
        }
        if (formData.signature) {
          formDataToSend.append("signature", formData.signature);
        }
        if (formData.stampImage) {
          formDataToSend.append("stampImg", formData.stampImage);
        }
        
        const response = await fetch(apiUrl, {
          method: "PUT",
          body: formDataToSend
        });
        
        if (!response.ok) {
          throw new Error("Failed to update company");
        }
        
        localStorage.removeItem('companyToEdit');
        setSuccessMessage("Company updated successfully!");
      } else {
        // Add new company using the API with multipart/form-data
        // Use the correct Master Admin ID (1) in the URL
        const apiUrl = `http://localhost:8282/masteradmin/addSubAdmin/1`;
        
        // Create FormData and append text fields and file fields
        const formDataToSend = new FormData();
        formDataToSend.append("id", formData.id);
        formDataToSend.append("name", formData.name);
        formDataToSend.append("lastname", formData.lastName);
        formDataToSend.append("registercompanyname", formData.registerCompanyName);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("phoneno", formData.phoneno);
        formDataToSend.append("password", formData.phoneno); // Use phone number as password
        formDataToSend.append("gstno", formData.gstno);
        formDataToSend.append("status", formData.status);
        
        // Append the files if they exist
        if (formData.logo) {
          formDataToSend.append("companylogo", formData.logo); // fixed key
        }
        if (formData.signature) {
          formDataToSend.append("signature", formData.signature);
        }
        if (formData.stampImage) {
          formDataToSend.append("stampImg", formData.stampImage); // fixed key
        }
        
        const response = await fetch(apiUrl, {
          method: "POST",
          body: formDataToSend
        });
        
        if (!response.ok) {
          throw new Error("Failed to register company");
        }
        setSuccessMessage("Company registered successfully!");
      }
      
      // Show success message
      setShowSuccessPopup(true);
      
      // Dispatch custom event to update dashboard
      window.dispatchEvent(new Event('companiesUpdated'));
      
      if (!isEditMode) {
        // Only clear form when creating new company
        setFormData(initialFormState);
        setLogoPreview(null);
        setSignaturePreview(null);
        setStampPreview(null);
      }
      
      // Hide success popup after 3 seconds and redirect if in edit mode
      setTimeout(() => {
        setShowSuccessPopup(false);
        if (isEditMode) {
          navigate('/masteradmin/view-company');
        }
      }, 3000);
    } catch (error) {
      console.error("Error saving company data:", error);
      alert("Failed to save company data. Please try again.");
    }
  };

  const handleClear = () => {
    if (isEditMode) {
      const companyToEdit = JSON.parse(localStorage.getItem('companyToEdit') || 'null');
      if (companyToEdit) {
        setFormData(companyToEdit);
      }
    } else {
      setFormData(initialFormState);
      setLogoPreview(null);
      setSignaturePreview(null);
      setStampPreview(null);
    }
  };

  const handleCancel = () => {
    if (isEditMode) {
      localStorage.removeItem('companyToEdit');
      navigate('/masteradmin/view-company');
    } else {
      setFormData(initialFormState);
      setLogoPreview(null);
      setSignaturePreview(null);
      setStampPreview(null);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-800/90 backdrop-blur-md rounded-lg shadow-lg border border-slate-700 animate-fadeIn text-gray-100">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed top-16 right-4 z-50 bg-gradient-to-r from-green-900 to-green-800 text-green-100 px-4 py-3 rounded-lg shadow-xl border border-green-700 animate-fadeIn flex items-center">
          <FaCheck className="mr-2 text-green-300" />
          <span>{successMessage}</span>
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-900/50 rounded-full text-blue-400">
          <FaBuilding className="text-xl md:text-2xl" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold">{isEditMode ? "Update Company" : "Register Company"}</h2>
        
        {isEditMode && (
          <button
            onClick={handleCancel}
            className="ml-auto flex items-center gap-1 text-sm bg-slate-700 hover:bg-slate-600 text-gray-100 px-3 py-1.5 rounded-md transition-all duration-300 shadow-sm"
          >
            <FaArrowLeft size={14} />
            <span>Back</span>
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Contact Person Info */}
          <div className="space-y-4 bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
            <h3 className="text-lg font-medium text-blue-400 border-b border-slate-700 pb-2">Contact Person</h3>
            
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium">
                First Name <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="John"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium">
                Last Name <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>
          
          {/* Company Info */}
          <div className="space-y-4 bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
            <h3 className="text-lg font-medium text-blue-400 border-b border-slate-700 pb-2">Company Details</h3>
            
            <div className="space-y-2">
              <label htmlFor="registerCompanyName" className="block text-sm font-medium">
                Company Name <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="registerCompanyName"
                  name="registerCompanyName"
                  value={formData.registerCompanyName}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="ABC Corporation"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-blue-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="company@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="gstno" className="block text-sm font-medium">
                GST Number <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaBuilding className="text-blue-400" />
                </div>
                <input
                  type="text"
                  id="gstno"
                  name="gstno"
                  value={formData.gstno}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="space-y-4 bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
            <h3 className="text-lg font-medium text-blue-400 border-b border-slate-700 pb-2">Contact Information</h3>
            
            <div className="space-y-2">
              <label htmlFor="phoneno" className="block text-sm font-medium">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="text-blue-400" />
                </div>
                <input
                  type="tel"
                  id="phoneno"
                  name="phoneno"
                  value={formData.phoneno}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="123-456-7890"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium">
                Address <span className="text-red-400">*</span>
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 pt-2 pointer-events-none">
                  <FaMapMarkerAlt className="text-blue-400" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="2"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-100"
                  placeholder="123 Business St, City, Country"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
        
        {/* File Uploads Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Company Logo */}
          <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Logo
            </label>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-full h-32 border-2 border-dashed border-blue-700/50 rounded-lg flex flex-col justify-center items-center p-2 hover:border-blue-500 transition-all duration-300 relative overflow-hidden bg-slate-800/50 shadow-sm">
                {logoPreview ? (
                  <div className="w-full h-full flex justify-center items-center">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="max-h-full max-w-full object-contain" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setFormData({...formData, logo: null});
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-300 shadow-md"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <FaUpload className="text-blue-500 text-xl mb-2" />
                    <p className="text-xs text-gray-400 text-center">Click to upload logo</p>
                  </>
                )}
                <input
                  type="file"
                  name="logo"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'logo')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
          
          {/* Signature */}
          <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Signature
            </label>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-full h-32 border-2 border-dashed border-blue-700/50 rounded-lg flex flex-col justify-center items-center p-2 hover:border-blue-500 transition-all duration-300 relative overflow-hidden bg-slate-800/50 shadow-sm">
                {signaturePreview ? (
                  <div className="w-full h-full flex justify-center items-center">
                    <img 
                      src={signaturePreview} 
                      alt="Signature Preview" 
                      className="max-h-full max-w-full object-contain" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSignaturePreview(null);
                        setFormData({...formData, signature: null, hasSignature: false});
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-300 shadow-md"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <FaFileSignature className="text-blue-500 text-xl mb-2" />
                    <p className="text-xs text-gray-400 text-center">Click to upload signature</p>
                  </>
                )}
                <input
                  type="file"
                  name="signature"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'signature')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
          
          {/* Company Stamp */}
          <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Stamp
            </label>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-full h-32 border-2 border-dashed border-blue-700/50 rounded-lg flex flex-col justify-center items-center p-2 hover:border-blue-500 transition-all duration-300 relative overflow-hidden bg-slate-800/50 shadow-sm">
                {stampPreview ? (
                  <div className="w-full h-full flex justify-center items-center">
                    <img 
                      src={stampPreview} 
                      alt="Stamp Preview" 
                      className="max-h-full max-w-full object-contain" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setStampPreview(null);
                        setFormData({...formData, stampImage: null, hasStamp: false});
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-all duration-300 shadow-md"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <FaStamp className="text-blue-500 text-xl mb-2" />
                    <p className="text-xs text-gray-400 text-center">Click to upload company stamp</p>
                  </>
                )}
                <input
                  type="file"
                  name="stampImage"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'stampImage')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Status - Only shown in edit mode */}
          {isEditMode && (
            <div className="space-y-4 bg-slate-900/30 p-4 rounded-lg border border-slate-700 shadow-sm">
              <h3 className="text-lg font-medium text-blue-400 border-b border-slate-700 pb-2">Company Status</h3>
              
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={formData.status === "Active"}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 border-slate-600 focus:ring-blue-500 bg-slate-700"
                  />
                  <span className="ml-2 text-sm flex items-center">
                    <FaCheck className="mr-1 text-green-400" />
                    Active
                  </span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value="Inactive"
                    checked={formData.status === "Inactive"}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 border-slate-600 focus:ring-blue-500 bg-slate-700"
                  />
                  <span className="ml-2 text-sm flex items-center">
                    <FaTimes className="mr-1 text-red-400" />
                    Inactive
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClear}
            className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-md shadow-sm transition-all duration-300 flex items-center"
          >
            <span>{isEditMode ? "Reset Form" : "Clear"}</span>
          </button>
          
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white py-2 px-4 rounded-md shadow-md transition-all duration-300 font-medium flex items-center"
          >
            <span>{isEditMode ? "Update Information" : "Register Company"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterCompany;
