'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Camera, X, ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { checkAuth } from '../../../store/slices/authSlice';

const API_URL = process.env.NODE_ENV === "development" ? "http://localhost:3000/api/users" : "/api/users";

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
    year: '',
    major: '',
    description: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const validateStep1 = () => {
    if (!formData.year || !formData.major.trim()) {
      toast.error('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
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
          description: formData.description.trim()
        }, {
          withCredentials: true
        });
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
        className="bg-white rounded-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hey, {user?.name || 'there'}!</h1>
          <p className="text-gray-600">Let's set up your profile</p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${currentStep === 1 ? 'bg-blue-600' : 'bg-blue-200'}`}></div>
              <div className={`w-3 h-3 rounded-full ${currentStep === 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Step {currentStep} of 2</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative overflow-hidden" style={{ minHeight: '400px' }}>
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
                      What year are you? *
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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
                          onFocus={() => setIsMajorDropdownOpen(true)}
                          placeholder="Search for your major..."
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Optional Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="relative">
                      {profilePicPreview ? (
                        <div className="relative w-32 h-32 mx-auto">
                          <img
                            src={profilePicPreview}
                            alt="Profile preview"
                            className="w-full h-full rounded-full object-cover"
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
                      placeholder="Tell us a bit about yourself..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>

        {/* Navigation buttons - moved outside form */}
        <div className="flex justify-between pt-6">
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

          {currentStep === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition duration-200"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Setting up your profile...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
} 