import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPrint, FaDownload, FaEnvelope, FaSearch, FaPalette, FaFont, FaCog } from 'react-icons/fa';
import axios from 'axios';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CompanyLetterhead = () => {
  const { isDarkMode } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [subadmin, setSubadmin] = useState(null);
  const letterRef = useRef(null);
  
  // Letterhead customization options
  const [letterheadConfig, setLetterheadConfig] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#fcd34d',
    fontFamily: 'Arial, sans-serif',
    showAddress: true,
    showContact: true,
    showGST: true,
    showSocials: true,
    showLogo: true,
    borderStyle: 'solid',
    headerLayout: 'centered' // centered, left-aligned, right-aligned
  });

  // Fetch subadmin data by email
  useEffect(() => {
    const fetchSubadminByEmail = async () => {
      try {
        setLoading(true);
        console.log("Fetching subadmin data...");
        
        // Get the logged-in user from localStorage
        const user = JSON.parse(localStorage.getItem("user")) || {};
        // Use the logged-in user's email or fallback to hardcoded one
        const email = user.email || "arbaj.shaikh2034@gmail.com";
        
        console.log("Fetching subadmin data for email:", email);
        const response = await axios.get(`http://localhost:8282/api/subadmin/subadmin-by-email/${email}`);
        console.log("Subadmin API Response:", response.data);
        setSubadmin(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching subadmin:', error);
        setApiError(true);
        toast.error('Failed to fetch company details. Please check API connection.');
        setLoading(false);
      }
    };

    fetchSubadminByEmail();
  }, []);

  const handleConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLetterheadConfig({
      ...letterheadConfig,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleColorChange = (name, value) => {
    setLetterheadConfig({
      ...letterheadConfig,
      [name]: value
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const letterElement = letterRef.current;
    
    if (!letterElement) return;
    
    toast.info('Preparing PDF download...');
    
    try {
      // First check and fix any image with missing dimensions
      const images = letterElement.querySelectorAll('img');
      
      // Create array of promises to ensure all images are loaded properly
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve, reject) => {
          // Skip if image is already loaded with valid dimensions
          if (img.complete && img.naturalWidth > 0) {
            img.crossOrigin = 'Anonymous';
            return resolve();
          }
          
          // Set crossOrigin before setting src
          img.crossOrigin = 'Anonymous';
          
          // Add event listeners for load and error
          img.onload = () => {
            console.log(`Image loaded: ${img.src}, dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
            resolve();
          };
          
          img.onerror = (err) => {
            console.error(`Error loading image: ${img.src}`, err);
            // Try to set a placeholder instead of failing
            img.src = 'https://via.placeholder.com/150x50?text=Image+Error';
            // Still resolve to not block the PDF generation
            resolve();
          };
          
          // If image src is relative path to profile image, convert to absolute URL
          if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
            const newSrc = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            console.log(`Converting relative URL to absolute: ${img.src} -> ${newSrc}`);
            img.src = newSrc;
          } else {
            // Force reload by setting the same src
            const currentSrc = img.src;
            img.src = currentSrc;
          }
        });
      });
      
      // Wait for all images to be properly loaded
      await Promise.all(imagePromises);
      console.log('All images loaded successfully');
      
      // Wait additional time to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set proper constraints on images to prevent them from being too large in PDF
      letterElement.querySelectorAll('img').forEach(img => {
        if (img.classList.contains('h-20')) {
          // Company logo
          img.style.maxHeight = '80px';
          img.style.height = 'auto';
          img.style.width = 'auto';
          img.style.maxWidth = '200px';
          img.style.objectFit = 'contain';
        }
      });
      
      // Generate the PDF with html2canvas using high quality settings
      const options = {
        scale: 3, // Higher scale for better image quality
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging for production
        imageTimeout: 15000,
        removeContainer: false,
        foreignObjectRendering: false,
        letterRendering: true,
        backgroundColor: '#FFFFFF',
        imageRendering: 'high-quality',
        onclone: (clonedDoc) => {
          // Process all images in the cloned document to ensure proper sizing
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach(img => {
            img.crossOrigin = 'Anonymous';
            
            // Make sure the cloned document has the same image size constraints
            if (img.classList.contains('h-20')) {
              img.style.maxHeight = '80px';
              img.style.height = 'auto';
              img.style.width = 'auto';
              img.style.maxWidth = '200px';
            }
            
            // Ensure any remaining images with no dimensions get defaults
            if (!img.style.width && !img.hasAttribute('width') && img.naturalWidth) {
              const maxWidth = Math.min(img.naturalWidth, 200);
              img.style.width = `${maxWidth}px`;
            }
            if (!img.style.height && !img.hasAttribute('height') && img.naturalHeight) {
              const maxHeight = Math.min(img.naturalHeight, 100);
              img.style.height = `${maxHeight}px`;
            }
            
            // Fix image URLs for server resources
            if (img.src.includes('/images/profile/') && !img.src.startsWith('http')) {
              img.src = `http://localhost:8282${img.src.startsWith('/') ? '' : '/'}${img.src}`;
            }
          });
        }
      };
      
      const canvas = await html2canvas(letterElement, options);
      
      // Check if canvas has valid dimensions
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas has invalid dimensions (width or height is 0)');
      }
      
      // Create PDF with precise A4 sizing and high quality settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        precision: 16 // Higher precision for better quality
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Convert the canvas to an image with maximum quality
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Calculate dimensions to maintain aspect ratio but fit on A4
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multi-page if content is long
      if (imgHeight <= pdfHeight) {
        // Content fits on one page - add with centering
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          0,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
      } else {
        // Content needs multiple pages
        let heightLeft = imgHeight;
        let position = 0;
        let page = 0;
        
        while (heightLeft > 0) {
          if (page > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(
            imgData,
            'JPEG',
            0,
            position,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
          );
          
          heightLeft -= pdfHeight;
          position -= pdfHeight;
          page++;
        }
      }
      
      pdf.save(`${subadmin?.registercompanyname || 'Company'}_Letterhead.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download PDF: ' + error.message);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard/certificates');
    console.log("Navigating back to certificates page");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`p-4 ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-800'}`}
    >
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-blue-500 hover:text-blue-700 transition duration-300"
          >
            <FaArrowLeft className="mr-2" /> Back to Certificates
          </button>
          
          <div className="flex space-x-3">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition duration-300 flex items-center"
            >
              <FaPrint className="mr-2" /> Print
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300 flex items-center"
            >
              <FaDownload className="mr-2" /> Download
            </button>
          </div>
        </div>

        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded">
            <p>Failed to connect to the API. Some features might be limited.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Letterhead Preview */}
          <div className="col-span-1">
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-slate-700' : 'bg-white'} mb-4`}>
              <h2 className="text-xl font-bold mb-4">Letterhead Preview</h2>
              
              <div 
                ref={letterRef}
                className="bg-white shadow-lg"
                style={{ 
                  minHeight: '29.7cm', 
                  width: '21cm', 
                  margin: '0 auto',
                  fontFamily: letterheadConfig.fontFamily,
                  border: letterheadConfig.borderStyle !== 'none' ? `1px ${letterheadConfig.borderStyle} ${letterheadConfig.secondaryColor}` : 'none',
                  padding: '2cm 1.5cm',
                  position: 'relative'
                }}
              >
                {/* Decorative Elements */}
                <div 
                  className="absolute top-0 left-0 right-0" 
                  style={{ height: '1cm', backgroundColor: letterheadConfig.primaryColor }}
                ></div>
                <div 
                  className="absolute bottom-0 left-0 right-0" 
                  style={{ height: '1cm', backgroundColor: letterheadConfig.primaryColor }}
                ></div>
                
                {/* Company Header */}
                <div className="mt-8 mb-12">
                  <div className={`flex ${
                    letterheadConfig.headerLayout === 'centered' 
                      ? 'justify-center text-center flex-col items-center' 
                      : letterheadConfig.headerLayout === 'left-aligned' 
                        ? 'justify-start text-left' 
                        : 'justify-end text-right flex-col items-end'
                  }`}>
                    {/* Company Logo */}
                    {letterheadConfig.showLogo && subadmin && subadmin.companylogo && (
                      <div className="mb-4">
                        <img 
                          src={`http://localhost:8282/images/profile/${subadmin.companylogo}`} 
                          alt="Company Logo" 
                          className="h-20 object-contain" 
                          onError={(e) => {
                            console.error('Error loading logo:', e);
                            e.target.src = 'https://via.placeholder.com/200x80?text=Company+Logo';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Company Name */}
                    <h1 
                      className="text-3xl font-bold mb-2" 
                      style={{ color: letterheadConfig.secondaryColor }}
                    >
                      {subadmin?.registercompanyname || "Your Company Name"}
                    </h1>
                    
                    {/* Tagline or Slogan */}
                    <p className="text-sm italic mb-3" style={{ color: letterheadConfig.primaryColor }}>
                      Excellence in Business Solutions
                    </p>
                    
                    {/* Address and Contact */}
                    <div className="space-y-1 text-sm text-gray-600">
                      {letterheadConfig.showAddress && (
                        <p>{subadmin?.address || "123 Business Avenue, City, Country"}</p>
                      )}
                      
                      {letterheadConfig.showContact && (
                        <p>
                          {subadmin?.email || "info@yourcompany.com"} | 
                          {subadmin?.contact || " +1-234-567-8900"}
                        </p>
                      )}
                      
                      {letterheadConfig.showGST && (
                        <p>GST: {subadmin?.gstno || "XXXXXXXXXXXX"}</p>
                      )}
                      
                      {letterheadConfig.showSocials && (
                        <p>
                          {subadmin?.companyurl ? (
                            <span className="text-blue-600">
                              {subadmin.companyurl}
                            </span>
                          ) : (
                            "www.yourcompany.com"
                          )}
                          {subadmin?.companyurl ? " | " : ""}
                          <span>LinkedIn/Social Media</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Decorative Line */}
                <div 
                  className="my-6" 
                  style={{ 
                    height: '2px', 
                    background: `linear-gradient(to right, ${letterheadConfig.primaryColor}, ${letterheadConfig.accentColor}, ${letterheadConfig.secondaryColor})` 
                  }}
                ></div>
                
                {/* Sample Content Area */}
                <div className="text-gray-400 min-h-[400px] flex flex-col justify-center items-center">
                  <p className="text-center italic">This area will contain your letter content</p>
                  <p className="text-center italic">Your letterhead design will appear at the top of all your documents</p>
                </div>
                
                {/* Footer */}
                <div 
                  className="absolute bottom-[1.5cm] left-[1.5cm] right-[1.5cm]"
                >
                  <div 
                    className="h-[1px] mb-4"
                    style={{ 
                      background: `linear-gradient(to right, ${letterheadConfig.secondaryColor}, ${letterheadConfig.accentColor}, ${letterheadConfig.secondaryColor})` 
                    }}
                  ></div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div>
                      <p>© {new Date().getFullYear()} {subadmin?.registercompanyname || "Your Company"}. All Rights Reserved.</p>
                      {subadmin?.cinno && <p className="mt-1">CIN: {subadmin.cinno}</p>}
                    </div>
                    <div className="flex items-center">
                      {subadmin?.phoneno && <span className="ml-2">{subadmin.phoneno}</span>}
                      <span className="mx-2">|</span>
                      <span>Page 1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompanyLetterhead; 