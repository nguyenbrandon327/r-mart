'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Camera, X, ArrowLeft, ArrowRight, Search, MapPin, Home } from 'lucide-react';
import { checkAuth } from '../../../store/slices/authSlice';
import { CAMPUS_LOCATIONS } from '../../../constants/campusLocations';

// Always use relative URLs so the frontend domain (Vercel) can proxy to the backend via rewrites.
const API_URL = '/api/users';

const MAJORS = [
  'Actuarial Science',
  'African American Studies',
  'Anthropology',
  'Art (Studio)',
  'Art History',
  'Art History/Administrative Studies',
  'Art History/Religious Studies',
  'Asian American Studies',
  'Biochemistry',
  'Bioengineering',
  'Biology',
  'Black Study',
  'Business Administration - Accounting & Auditing',
  'Business Administration - Finance',
  'Business Administration - Information Systems',
  'Business Administration - Management',
  'Business Administration - Marketing',
  'Business Administration - Operations and Supply Chain Management',
  'Business Analytics',
  'Business Economics',
  'Cell, Molecular, and Developmental Biology',
  'Chemical Engineering',
  'Chemistry',
  'Chicano Studies',
  'Computer Engineering',
  'Computer Science and Business Applications',
  'Computer Science',
  'Creative Writing',
  'Dance',
  'Data Science',
  'Earth and Planetary Sciences',
  'Economics',
  'Economics/Administrative Studies',
  'Education, Society, and Human Development',
  'Electrical Engineering',
  'English',
  'Entomology',
  'Environmental Engineering',
  'Environmental Sciences',
  'Ethnic Studies',
  'Gender and Sexuality Studies',
  'Geology',
  'Geophysics',
  'Global and Community Health',
  'Global Studies',
  'History',
  'History/Administrative Studies',
  'Languages and Literatures - Chinese',
  'Languages and Literatures - Classical Studies',
  'Languages and Literatures - Comparative Ancient Civilizations',
  'Languages and Literatures - Comparative Literature',
  'Languages and Literatures - French',
  'Languages and Literatures - Germanic Studies',
  'Languages and Literatures - Japanese',
  'Languages and Literatures - Languages',
  'Languages and Literatures - Linguistics',
  'Languages and Literatures - Russian Studies',
  'Learning and Behavioral Studies',
  'Liberal Studies',
  'Materials Science and Engineering',
  'Mathematics',
  'Mathematics for Secondary School Teachers',
  'Mechanical Engineering',
  'Media and Cultural Studies',
  'Microbiology',
  'Middle East and Islamic Studies',
  'Music',
  'Music and Culture',
  'Native American Studies',
  'Neuroscience',
  'Philosophy',
  'Physics',
  'Plant Biology',
  'Political Science',
  'Political Science/Administrative Studies',
  'Political Science/International Affairs',
  'Political Science/Public Service',
  'Psychology',
  'Public Policy',
  'Religious Studies/Administrative Studies',
  'Robotics',
  'Sociology',
  'Sociology/Administrative Studies',
  'Spanish',
  'Statistics',
  'Theatre, Film and Digital Production',
  'Undeclared'
];

export default function Onboarding() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    year: '',
    major: '',
    description: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Location-related state
  const [locationData, setLocationData] = useState({
    locationType: '',
    campusLocationName: '',
    customAddress: '',
    customCity: '',
    customState: '',
    showLocationInProfile: false
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [addressError, setAddressError] = useState(''); // Add address error state
  
  // Username validation state
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  // Major dropdown states
  const [majorSearchTerm, setMajorSearchTerm] = useState('');
  const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);
  const [filteredMajors, setFilteredMajors] = useState(MAJORS);
  const majorDropdownRef = useRef(null);

  useEffect(() => {
    // Redirect if not authenticated or already onboarded
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (user?.isOnboarded) {
      router.push('/');
    }
  }, [isAuthenticated, user, router]);



  useEffect(() => {
    // Filter majors based on search term
    const filtered = MAJORS.filter(major =>
      major.toLowerCase().includes(majorSearchTerm.toLowerCase())
    );
    setFilteredMajors(filtered);
  }, [majorSearchTerm]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(event.target)) {
        setIsMajorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad Student'];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePic = () => {
    setProfilePic(null);
    setProfilePicPreview(null);
  };

  const handleMajorSelect = (major) => {
    setFormData({ ...formData, major });
    setMajorSearchTerm('');
    setIsMajorDropdownOpen(false);
  };

  const handleMajorSearchChange = (e) => {
    setMajorSearchTerm(e.target.value);
    setIsMajorDropdownOpen(true);
  };

  // Username validation function
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameError('');
      setUsernameSuccess('');
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError('');
    setUsernameSuccess('');

    try {
      const response = await axios.post(`${API_URL}/check-username`, {
        username: username
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setUsernameSuccess('Username is available!');
        setUsernameError('');
      }
    } catch (error) {
      setUsernameError(error.response?.data?.message || 'Error checking username');
      setUsernameSuccess('');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Debounced username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.username.trim()) {
        checkUsernameAvailability(formData.username.trim().toLowerCase());
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  const validateStep1 = () => {
    if (!formData.username.trim() || !formData.year || !formData.major.trim()) {
      toast.error('Please fill in all required fields');
      return false;
    }
    
    if (formData.username.trim().length < 3) {
      toast.error('Username must be at least 3 characters long');
      return false;
    }
    
    if (usernameError) {
      toast.error('Please fix the username error before continuing');
      return false;
    }
    
    if (!usernameSuccess && formData.username.trim()) {
      toast.error('Please wait for username validation to complete');
      return false;
    }
    
    return true;
  };

  // Geocoding function for off-campus addresses
  const geocodeAddress = async (addressObj) => {
    try {
      setIsGeocoding(true);
      
      // Concatenate address parts into a full address string
      const addressParts = [
        addressObj.address,
        addressObj.city,
        addressObj.state
      ].filter(part => part && part.trim() !== '');
      
      const fullAddress = addressParts.join(', ');
      
      // Using a free geocoding service - you might want to use Google Maps API or another service
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      } else {
        throw new Error('No coordinates found for this address');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) {
      return;
    }

    // Validate housing information if location type is selected
    if (locationData.locationType === 'on_campus' && !locationData.campusLocationName) {
      toast.error('Please select a residence hall');
      return;
    }

    if (locationData.locationType === 'off_campus') {
      if (!locationData.customAddress.trim() || !locationData.customCity.trim() || !locationData.customState.trim()) {
        toast.error('Please fill in all address fields for off-campus housing');
        return;
      }
    }

    setIsSubmitting(true);
    setAddressError(''); // Clear any previous address errors
    
    try {
      // First set the username
      await axios.put(`${API_URL}/username`, {
        username: formData.username.trim().toLowerCase()
      }, {
        withCredentials: true
      });

      // Complete onboarding with required fields
      await axios.put(`${API_URL}/onboarding`, {
        year: formData.year,
        major: formData.major
      }, {
        withCredentials: true
      });

      // Upload profile picture if provided
      if (profilePic) {
        const formDataImg = new FormData();
        formDataImg.append('profilePic', profilePic);
        
        await axios.post(`${API_URL}/profile-pic`, formDataImg, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Update description if provided
      if (formData.description.trim()) {
        await axios.put(`${API_URL}/profile`, {
          name: user.name, // Keep existing name
          description: formData.description.trim(),
          major: formData.major // Include major to prevent it from being set to null
        }, {
          withCredentials: true
        });
      }

      // Handle location data if provided
      if (locationData.locationType) {
        let locationPayload = {
          showLocationInProfile: locationData.showLocationInProfile
        };

        // Handle different location types
        if (locationData.locationType === 'on_campus' && locationData.campusLocationName) {
          locationPayload.locationType = 'on_campus';
          locationPayload.campusLocationName = locationData.campusLocationName;
        } else if (locationData.locationType === 'off_campus' && locationData.customAddress.trim()) {
          try {
            const coords = await geocodeAddress({
              address: locationData.customAddress,
              city: locationData.customCity,
              state: locationData.customState
            });
            locationPayload.locationType = 'off_campus';
            // Concatenate address parts for storage
            const addressParts = [
              locationData.customAddress.trim(),
              locationData.customCity.trim(),
              locationData.customState.trim()
            ].filter(part => part !== '');
            locationPayload.customAddress = addressParts.join(', ');
            locationPayload.customLatitude = coords.latitude;
            locationPayload.customLongitude = coords.longitude;
          } catch (error) {
            console.error('Geocoding failed:', error);
            setAddressError('Invalid address. Please check your address and try again.');
            return; // Stop form submission and keep modal open
          }
        } else {
          // Fallback to UCR Main Campus if no valid location is provided
          locationPayload.locationType = 'on_campus';
          const defaultLocation = CAMPUS_LOCATIONS.find(loc => loc.name.includes('UCR Main Campus'));
          if (defaultLocation) {
            locationPayload.campusLocationName = defaultLocation.name;
          }
        }

        // Submit location data
        try {
          await axios.put(`${API_URL}/location`, locationPayload, {
            withCredentials: true
          });
        } catch (error) {
          console.error('Location update failed:', error);
          // Don't fail the entire onboarding for location issues
        }
      }

      // Update auth state
      await dispatch(checkAuth());
      
      // Navigate to welcome screen
      router.push('/auth/onboarding/welcome');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl p-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hey, {user?.name ? user.name.split(' ')[0] : 'there'}!</h1>
          <p className="text-gray-600">Let's set up your profile</p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${currentStep > 1 ? 'bg-gray-300' : 'bg-gray-300'}`}
                style={{ backgroundColor: currentStep === 1 ? '#003DA5' : currentStep > 1 ? '#b3c7f0' : '' }}
              ></div>
              <div 
                className={`w-3 h-3 rounded-full ${currentStep > 2 ? 'bg-gray-300' : 'bg-gray-300'}`}
                style={{ backgroundColor: currentStep === 2 ? '#003DA5' : currentStep > 2 ? '#b3c7f0' : '' }}
              ></div>
              <div 
                className={`w-3 h-3 rounded-full bg-gray-300`}
                style={{ backgroundColor: currentStep === 3 ? '#003DA5' : '' }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Step {currentStep} of 3</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative" style={{ minHeight: '400px' }}>
            <AnimatePresence mode="wait" custom={currentStep}>
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  custom={currentStep}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="absolute inset-0 space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Required Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        setFormData({ ...formData, username: value });
                        // Clear previous messages when user starts typing
                        if (usernameError || usernameSuccess) {
                          setUsernameError('');
                          setUsernameSuccess('');
                        }
                      }}
                      placeholder="your_username"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition duration-200"
                      style={{ '--tw-ring-color': '#003DA5' }}
                      onFocus={(e) => e.target.style.borderColor = '#003DA5'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      maxLength={30}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      3-30 characters, letters, numbers, and underscores only
                    </p>
                    {isCheckingUsername && (
                      <p className="text-sm mt-1" style={{ color: '#003DA5' }}>Checking availability...</p>
                    )}
                    {usernameError && (
                      <p className="text-sm mt-1 text-red-600">{usernameError}</p>
                    )}
                    {usernameSuccess && (
                      <p className="text-sm mt-1 text-green-600">{usernameSuccess}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What year are you? *
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition duration-200"
                      style={{ '--tw-ring-color': '#003DA5' }}
                      onFocus={(e) => e.target.style.borderColor = '#003DA5'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      required
                    >
                      <option value="">Select your year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's your major? *
                    </label>
                    <div className="relative" ref={majorDropdownRef}>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.major || majorSearchTerm}
                          onChange={handleMajorSearchChange}
                          onFocus={(e) => {
                            setIsMajorDropdownOpen(true);
                            e.target.style.borderColor = '#003DA5';
                          }}
                          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          placeholder="Search for your major..."
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition duration-200"
                          style={{ '--tw-ring-color': '#003DA5' }}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {formData.major ? (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, major: '' });
                                setMajorSearchTerm('');
                                setIsMajorDropdownOpen(true);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : (
                            <Search className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {isMajorDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredMajors.length > 0 ? (
                            filteredMajors.map((major) => (
                              <button
                                key={major}
                                type="button"
                                onClick={() => handleMajorSelect(major)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition duration-200"
                              >
                                {major}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">
                              No majors found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  custom={currentStep}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="absolute inset-0 space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Customize your profile (Optional)</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="relative">
                      {profilePicPreview ? (
                        <div className="relative w-32 h-32 mx-auto">
                          <Image
                            src={profilePicPreview}
                            alt="Profile preview"
                            fill
                            className="rounded-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeProfilePic}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition duration-200">
                            <Camera className="w-8 h-8 text-gray-400" />
                          </div>
                          <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      About You
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Hobbies, interests, anything! Tell us a bit about yourself :)"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition duration-200 resize-none"
                      style={{ '--tw-ring-color': '#003DA5' }}
                      onFocus={(e) => e.target.style.borderColor = '#003DA5'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  custom={currentStep}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="absolute inset-0 space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Housing Information (Optional)</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Where do you live?
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="on_campus"
                          name="locationType"
                          value="on_campus"
                          checked={locationData.locationType === 'on_campus'}
                          onChange={(e) => {
                            setLocationData({ ...locationData, locationType: e.target.value, customAddress: '', customCity: '', customState: '', campusLocationName: '', showLocationInProfile: true });
                            setAddressError(''); // Clear address error when changing location type
                          }}
                          className="h-4 w-4"
                          style={{ accentColor: '#003DA5' }}
                        />
                        <label htmlFor="on_campus" className="ml-3 flex items-center">
                          <Home className="w-4 h-4 mr-2" style={{ color: '#003DA5' }} />
                          On-Campus
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="off_campus"
                          name="locationType"
                          value="off_campus"
                          checked={locationData.locationType === 'off_campus'}
                          onChange={(e) => {
                            setLocationData({ ...locationData, locationType: e.target.value, campusLocationName: '', customAddress: '', customCity: '', customState: '', showLocationInProfile: true });
                            setAddressError(''); // Clear address error when changing location type
                          }}
                          className="h-4 w-4"
                          style={{ accentColor: '#003DA5' }}
                        />
                        <label htmlFor="off_campus" className="ml-3 flex items-center">
                          <MapPin className="w-4 h-4 mr-2" style={{ color: '#003DA5' }} />
                          Off-Campus
                        </label>
                      </div>

                    </div>
                  </div>

                  {locationData.locationType === 'on_campus' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select your residence hall *
                      </label>
                      <select
                        value={locationData.campusLocationName}
                        onChange={(e) => setLocationData({ ...locationData, campusLocationName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition duration-200"
                        style={{ '--tw-ring-color': '#003DA5' }}
                        onFocus={(e) => e.target.style.borderColor = '#003DA5'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      >
                        <option value="">Select a residence hall</option>
                        {CAMPUS_LOCATIONS
                          .filter(location => !location.name.includes('UCR Main Campus'))
                          .map((location) => (
                            <option key={location.id} value={location.name}>
                              {location.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {locationData.locationType === 'off_campus' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          value={locationData.customAddress}
                          onChange={(e) => {
                            setLocationData({ ...locationData, customAddress: e.target.value });
                            setAddressError(''); // Clear address error when user modifies address
                          }}
                          placeholder="123 Main St"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition duration-200"
                          style={{ '--tw-ring-color': '#003DA5' }}
                          onFocus={(e) => e.target.style.borderColor = '#003DA5'}
                          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            value={locationData.customCity}
                            onChange={(e) => {
                              setLocationData({ ...locationData, customCity: e.target.value });
                              setAddressError(''); // Clear address error when user modifies city
                            }}
                            placeholder="City"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition duration-200"
                            style={{ '--tw-ring-color': '#003DA5' }}
                            onFocus={(e) => e.target.style.borderColor = '#003DA5'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                          </label>
                          <input
                            type="text"
                            value={locationData.customState}
                            onChange={(e) => {
                              setLocationData({ ...locationData, customState: e.target.value });
                              setAddressError(''); // Clear address error when user modifies state
                            }}
                            placeholder="State"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition duration-200"
                            style={{ '--tw-ring-color': '#003DA5' }}
                            onFocus={(e) => e.target.style.borderColor = '#003DA5'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                        </div>
                      </div>
                      
                      {isGeocoding && (
                        <p className="text-sm mt-1" style={{ color: '#003DA5' }}>Verifying address...</p>
                      )}
                      
                      {addressError && (
                        <p className="text-sm mt-1 text-red-600">{addressError}</p>
                      )}
                    </div>
                  )}

                  {/* Show location checkbox - only for on_campus and off_campus */}
                  {(locationData.locationType === 'on_campus' || locationData.locationType === 'off_campus') && (
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id="showLocation"
                        checked={locationData.showLocationInProfile}
                        onChange={(e) => setLocationData({ ...locationData, showLocationInProfile: e.target.checked })}
                        className="h-4 w-4 rounded"
                        style={{ accentColor: '#003DA5' }}
                      />
                      <label htmlFor="showLocation" className="ml-3 text-sm text-gray-700">
                        Show my general location in my profile (ex. Dundee, Glen Mor, Off-Campus)
                      </label>
                    </div>
                  )}



                  {/* Clear selection button */}
                  {locationData.locationType && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setLocationData({ 
                          ...locationData, 
                          locationType: '', 
                          campusLocationName: '', 
                          customAddress: '',
                          customCity: '',
                          customState: '',
                          showLocationInProfile: false 
                        })}
                        className="text-sm text-gray-600 hover:text-gray-800 underline transition duration-200"
                      >
                        Clear selection
                      </button>
                    </div>
                  )}

                  {/* General note */}
                  {!locationData.locationType && (
                    <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#f0f4ff' }}>
                      <p className="text-sm" style={{ color: '#003DA5' }}>
                        <strong>Note:</strong> If you don't select an option, your location will be set to UCR's campus for our location-based features. You can always update this later in your profile settings.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>

        {/* Navigation buttons - moved outside form */}
        <div className="flex justify-between pt-24">
          {currentStep === 1 ? (
            <div></div>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center px-6 py-3 text-white rounded-lg font-medium transition duration-200"
              style={{ backgroundColor: '#003DA5' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#002d7a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#003DA5'}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 text-white rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: isSubmitting ? '#003DA5' : '#003DA5' }}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#002d7a')}
              onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = '#003DA5')}
            >
              {isSubmitting ? 'Setting up your profile...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
} 