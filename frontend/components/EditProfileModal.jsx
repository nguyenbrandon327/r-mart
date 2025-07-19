'use client';

import { useState, useRef, useEffect } from "react";
import { UserIcon, ImageIcon, SaveIcon, X, CameraIcon, Trash2Icon, GraduationCapIcon, Search } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, uploadProfilePic, deleteProfilePic, clearMessage, clearError } from '../store/slices/userSlice';
import toast from 'react-hot-toast';

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

function EditProfileModal() {
  const dispatch = useDispatch();
  const { currentUserProfile, isLoading, message, error } = useSelector((state) => state.user);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    major: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Major dropdown states
  const [majorSearchTerm, setMajorSearchTerm] = useState('');
  const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);
  const [filteredMajors, setFilteredMajors] = useState(MAJORS);
  const majorDropdownRef = useRef(null);

  // Initialize form data when currentUserProfile is available
  useEffect(() => {
    if (currentUserProfile) {
      setFormData({
        name: currentUserProfile.name || '',
        description: currentUserProfile.description || '',
        major: currentUserProfile.major || ''
      });
    }
  }, [currentUserProfile]);

  // Filter majors based on search term
  useEffect(() => {
    const filtered = MAJORS.filter(major =>
      major.toLowerCase().includes(majorSearchTerm.toLowerCase())
    );
    setFilteredMajors(filtered);
  }, [majorSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
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

  // Handle error messages only
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let hasUpdates = false;
      
      // Update profile info (name, description, and major)
      if (formData.name.trim() !== currentUserProfile?.name || 
          formData.description !== (currentUserProfile?.description || '') ||
          formData.major !== (currentUserProfile?.major || '')) {
        await dispatch(updateUserProfile({
          name: formData.name.trim(),
          description: formData.description.trim(),
          major: formData.major.trim()
        })).unwrap();
        hasUpdates = true;
      }
      
      // Upload new profile picture if selected
      if (selectedImage) {
        const formDataImage = new FormData();
        formDataImage.append('profilePic', selectedImage);
        await dispatch(uploadProfilePic(formDataImage)).unwrap();
        hasUpdates = true;
      }
      
      // Clear any existing success messages from Redux state
      dispatch(clearMessage());
      
      // Show single success message if any updates were made
      if (hasUpdates) {
        toast.success('Profile updated successfully');
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Error updating profile:', error);
      // Error messages will still be handled by the useEffect
    }
  };

  const handleDeleteProfilePic = async () => {
    if (confirm('Are you sure you want to delete your profile picture?')) {
      try {
        await dispatch(deleteProfilePic()).unwrap();
      } catch (error) {
        console.error('Error deleting profile picture:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setFormData({
      name: currentUserProfile?.name || '',
      description: currentUserProfile?.description || '',
      major: currentUserProfile?.major || ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setMajorSearchTerm('');
    setIsMajorDropdownOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    document.getElementById("edit_profile_modal").close();
  };

  const getCurrentProfilePic = () => {
    if (imagePreview) return imagePreview;
    if (currentUserProfile?.profile_pic) return currentUserProfile.profile_pic;
    return null;
  };

  return (
    <dialog id="edit_profile_modal" className="modal">
      <div className="modal-box max-w-2xl">
        {/* CLOSE BUTTON */}
        <div>
          <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={handleCloseModal}
          >
            <X size={16} />
          </button>
        </div>

        {/* MODAL HEADER */}
        <h3 className="font-bold text-xl mb-8">
          Edit Profile
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PROFILE PICTURE SECTION */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium">Profile Picture</span>
            </label>
            
            <div className="flex flex-col items-center gap-4">
              {/* Current/Preview Image */}
              <div className="relative">
                {getCurrentProfilePic() ? (
                  <img
                    src={getCurrentProfilePic()}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-200">
                    <UserIcon className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                
                {/* Camera overlay button */}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 hover:bg-primary-focus transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CameraIcon size={16} />
                </button>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="size-4 mr-1" />
                  {getCurrentProfilePic() ? 'Change Photo' : 'Upload Photo'}
                </button>
                
                {currentUserProfile?.profile_pic && (
                  <button
                    type="button"
                    className="btn btn-outline btn-error btn-sm"
                    onClick={handleDeleteProfilePic}
                  >
                    <Trash2Icon className="size-4 mr-1" />
                    Remove
                  </button>
                )}
              </div>
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageSelect}
                accept="image/jpeg,image/png,image/webp,image/jpg"
              />
              
              <div className="text-xs text-gray-500 text-center">
                <p>Supported formats: JPG, PNG, WEBP</p>
                <p>Maximum size: 5MB</p>
              </div>
            </div>
          </div>

          {/* NAME INPUT */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium">Display Name</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                <UserIcon className="size-5" />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Enter your display name"
                className="input input-bordered w-full pl-10 py-3 focus:input-primary transition-colors duration-200"
                value={formData.name}
                onChange={handleChange}
                required
                maxLength={50}
              />
            </div>
          </div>

          {/* MAJOR INPUT */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium">Major</span>
            </label>
            <div className="relative" ref={majorDropdownRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <GraduationCapIcon className="size-5" />
                </div>
                <input
                  type="text"
                  value={formData.major || majorSearchTerm}
                  onChange={handleMajorSearchChange}
                  onFocus={() => setIsMajorDropdownOpen(true)}
                  placeholder="Search for your major..."
                  className="input input-bordered w-full pl-10 pr-10 py-3 focus:input-primary transition-colors duration-200"
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
                      <X className="size-4" />
                    </button>
                  ) : (
                    <Search className="size-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              {isMajorDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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

          {/* DESCRIPTION INPUT */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-base font-medium">Bio</span>
            </label>
            <textarea
              name="description"
              placeholder="Tell others about yourself..."
              className="textarea textarea-bordered w-full h-32 focus:textarea-primary transition-colors duration-200"
              value={formData.description}
              onChange={handleChange}
              maxLength={500}
            />
            <div className="label">
              <span className="label-text-alt text-gray-500">
                {formData.description.length}/500 characters
              </span>
            </div>
          </div>

          {/* MODAL ACTIONS */}
          <div className="modal-action">
            <div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
            </div>
            <button
              type="submit"
              className="btn btn-primary min-w-[120px]"
              disabled={!formData.name.trim() || isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <SaveIcon className="size-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* BACKDROP */}
      <div className="modal-backdrop" onClick={handleCloseModal}>
        <button onClick={handleCloseModal}>close</button>
      </div>
    </dialog>
  );
}

export default EditProfileModal; 