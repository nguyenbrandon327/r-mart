'use client';

import { useState, useRef, useEffect } from "react";
import { DollarSignIcon, ImageIcon, Package2Icon, PlusCircleIcon, TagIcon, X, ArrowLeftIcon, UploadIcon, CheckCircleIcon, HomeIcon, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { addProduct, setFormData, resetForm } from '../../store/slices/productSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '../../components/AuthGuard';
import { motion } from 'framer-motion';

export default function AddListingPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { formData, loading } = useSelector((state) => state.products);
  
  // Image management for new products only
  const [images, setImages] = useState([]);
  const [draggedImage, setDraggedImage] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Reset form data when component mounts to ensure clean slate for new product
  useEffect(() => {
    dispatch(resetForm());
  }, [dispatch]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create a FormData object for submitting files
    const productFormData = new FormData();
    
    // Add all text fields
    productFormData.append('name', formData.name);
    productFormData.append('price', formData.price);
    productFormData.append('description', formData.description);
    productFormData.append('category', formData.category);
    
    // Add all images
    images.forEach((image) => {
      productFormData.append('productImages', image.data);
    });
    
    try {
      await dispatch(addProduct(productFormData)).unwrap();
      // Reset state and show success screen
      setImages([]);
      dispatch(resetForm());
      setShowSuccess(true);
      
      // Auto redirect to home after 4 seconds
      setTimeout(() => {
        router.push('/');
      }, 4000);
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(setFormData({ ...formData, [name]: value }));
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    if (e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      addImages(filesArray);
    }
  };

  // Add images helper function
  const addImages = (filesArray) => {
    if (images.length + filesArray.length > 10) {
      alert('You can only upload up to 10 images total.');
      return;
    }
    
    const newImages = filesArray.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      data: file
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  // Handle drag and drop for file upload
  const handleUploadDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(true);
  };

  const handleUploadDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOverUpload(false);
    }
  };

  const handleUploadDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUploadDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverUpload(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)
    );
    
    if (files.length > 0) {
      addImages(files);
    }
  };

  // Remove an image
  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // Handle drag start for reordering
  const handleDragStart = (e, index) => {
    setDraggedImage(index);
  };

  // Handle drag over for reordering
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(index);
  };

  // Handle drag leave for reordering
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear drop target if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  };

  // Handle drop for reordering
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedImage === null || draggedImage === dropIndex) {
      setDropTarget(null);
      return;
    }
    
    // Reorder the image array
    const newOrder = [...images];
    const [movedItem] = newOrder.splice(draggedImage, 1);
    newOrder.splice(dropIndex, 0, movedItem);
    setImages(newOrder);
    setDraggedImage(null);
    setDropTarget(null);
  };

  // Handle drag end for reordering
  const handleDragEnd = () => {
    setDraggedImage(null);
    setDropTarget(null);
  };

  // Helper function to get image URL for display
  const getImageUrl = (image) => {
    return URL.createObjectURL(image.data);
  };

  // Confetti component
  const ConfettiPiece = ({ delay, x, color }) => (
    <motion.div
      className={`absolute w-3 h-3 ${color}`}
      style={{ left: `${x}%`, top: '-10px' }}
      initial={{ y: -10, rotate: 0, opacity: 1 }}
      animate={{
        y: [0, window.innerHeight + 50],
        rotate: [0, 360, 720],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 3,
        delay: delay,
        ease: 'easeOut',
      }}
    />
  );

  const confettiColors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-indigo-500'
  ];

  // Generate confetti pieces
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: Math.random() * 100,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
  }));

  // Success screen component
  const SuccessScreen = () => (
    <div className="fixed inset-0 bg-base-100 z-50 flex items-center justify-center">
      {/* Confetti */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map((piece) => (
          <ConfettiPiece 
            key={piece.id}
            delay={piece.delay}
            x={piece.x}
            color={piece.color}
          />
        ))}
      </div>

      {/* Success content */}
      <div className="text-center z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
          className="mb-8"
        >
          <img 
            src="/source.gif" 
            alt="Success" 
            className="w-32 h-32 mx-auto rounded-lg"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-5xl font-bold text-primary mb-4"
        >
          Your Listing is Up! 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-xl text-gray-600 mb-8"
        >
          Congratulations! Be ready to receive messages from interested buyers in your inbox.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <p 
            onClick={() => router.push('/')}
            className="text-sm text-primary hover:text-primary-focus cursor-pointer underline hover:no-underline transition-all duration-200"
          >
            Redirecting to home in a few seconds... (Click here to go now)
          </p>
        </motion.div>
      </div>
    </div>
  );

  if (showSuccess) {
    return (
      <AuthGuard>
        <SuccessScreen />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-base-100 relative flex flex-col" data-theme="light">
      {/* Logo at top left - improved mobile positioning */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="flex items-center gap-1 sm:gap-2">
            <img 
              src="/logo-pic.png" 
              alt="R'mart Logo" 
              className="size-8 sm:size-12 object-contain"
            />
            <span
              className="font-black font-gt-america-expanded tracking-tighter text-lg sm:text-2xl 
                bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
            >
              r'mart
            </span>
          </div>
        </Link>
      </div>

      {/* Main content - improved mobile spacing */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 flex-1 flex flex-col justify-center py-2 sm:py-4">
        {/* Form */}
        <div className="card bg-white">
          <div className="card-body p-2 sm:p-4">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" encType="multipart/form-data">
              {/* Mobile-first responsive grid */}
              <div className="grid gap-3 sm:gap-4 xl:grid-cols-2 xl:gap-6">
                {/* LEFT COLUMN - Hero Image - hidden on mobile, shown on xl+ */}
                <div className="hidden xl:flex h-full">
                  <div className="relative flex-1">
                    <img 
                      src="/addlisting.jpg" 
                      alt="Add Listing" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN - Product Info, Description, and Images */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Title */}
                  <div className="text-center xl:text-left">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 flex items-center justify-center xl:justify-start gap-2">
                      <Sparkles className="size-5 sm:size-6 text-black" />
                      Add a Listing
                    </h1>
                  </div>

                  {/* Mobile hero image - shown only on smaller screens */}
                  <div className="xl:hidden mb-2">
                    <img 
                      src="/addlisting.jpg" 
                      alt="Add Listing" 
                      className="w-full h-32 sm:h-36 object-cover rounded-lg"
                    />
                  </div>

                  {/* PRODUCT NAME INPUT */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm sm:text-base font-medium">Product Name</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                        <Package2Icon className="size-4 sm:size-5" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter product name"
                        className="input input-bordered w-full pl-9 sm:pl-10 py-2 sm:py-3 text-sm sm:text-base focus:input-primary transition-colors duration-200"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* PRICE AND CATEGORY ROW - stack on very small screens */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {/* PRODUCT PRICE INPUT */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm sm:text-base font-medium">Price</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                          <DollarSignIcon className="size-4 sm:size-5" />
                        </div>
                        <input
                          type="number"
                          name="price"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="input input-bordered w-full pl-9 sm:pl-10 py-2 sm:py-3 text-sm sm:text-base focus:input-primary transition-colors duration-200"
                          value={formData.price}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    {/* PRODUCT CATEGORY */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-sm sm:text-base font-medium">Category</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                          <TagIcon className="size-4 sm:size-5" />
                        </div>
                        <select
                          name="category"
                          className="select select-bordered w-full pl-9 sm:pl-10 py-2 sm:py-3 text-sm sm:text-base focus:select-primary transition-colors duration-200"
                          value={formData.category || ""}
                          onChange={handleChange}
                          required
                        >
                          <option value="" disabled>Select a category</option>
                          <option value="clothes">Clothes</option>
                          <option value="tech">Tech</option>
                          <option value="textbooks">Textbooks</option>
                          <option value="furniture">Furniture</option>
                          <option value="kitchen">Kitchen</option>
                          <option value="food">Food</option>
                          <option value="vehicles">Vehicles</option>
                          <option value="housing">Housing</option>
                          <option value="rides">Rides</option>
                          <option value="renting">Renting</option>
                          <option value="merch">Merch</option>
                          <option value="tickets">Tickets</option>
                          <option value="other">Other</option>
                          <option value="in-searching-for">I'm searching for</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* PRODUCT DESCRIPTION */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm sm:text-base font-medium">Description</span>
                    </label>
                    <textarea
                      name="description"
                      placeholder="Enter product description"
                      className="textarea textarea-bordered w-full h-20 sm:h-24 text-sm sm:text-base focus:textarea-primary transition-colors duration-200"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* PRODUCT IMAGES - improved mobile layout */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-sm sm:text-base font-medium">Product Images</span>
                    </label>
                    
                    {/* Drag and Drop Upload Zone - improved mobile size */}
                    <div 
                      className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-all duration-200 cursor-pointer ${
                        isDragOverUpload 
                          ? 'border-primary bg-primary/5 scale-[1.02]' 
                          : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                      }`}
                      onDragEnter={handleUploadDragEnter}
                      onDragLeave={handleUploadDragLeave}
                      onDragOver={handleUploadDragOver}
                      onDrop={handleUploadDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-1 sm:gap-2">
                        <div className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                          isDragOverUpload ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          <UploadIcon className="size-4 sm:size-5" />
                        </div>
                        <div>
                          <p className={`font-medium text-sm sm:text-base ${isDragOverUpload ? 'text-primary' : 'text-gray-700'}`}>
                            {isDragOverUpload ? 'Drop images here!' : 'Upload Product Images'}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Drag and drop images, or upload from files
                          </p>
                        </div>
                      </div>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleImageSelect}
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        multiple
                      />
                    </div>

                    {/* Display images - improved mobile layout */}
                    <div className="mt-2 sm:mt-3">
                      <div className="text-xs sm:text-sm font-medium mb-1.5">
                        {images.length > 0 
                          ? `Uploaded Images (${images.length}/10) - First image will be the cover`
                          : ''
                        }
                      </div>
                      
                      {/* Responsive image grid */}
                      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 min-h-[50px] sm:min-h-[68px]">
                        {images.length > 0 ? (
                          images.map((image, index) => {
                            const isLastImage = index === images.length - 1;
                            const shouldShowBarAfter = dropTarget === index && draggedImage !== null && draggedImage !== index && 
                                                     isLastImage && draggedImage < index;
                            const shouldShowBarBefore = dropTarget === index && draggedImage !== null && draggedImage !== index && 
                                                       (!isLastImage || draggedImage > index);
                            
                            return (
                              <div key={`container-${image.id}`} className="flex items-center">
                                {/* Drop indicator bar - hidden on mobile for simplicity */}
                                {shouldShowBarBefore && (
                                  <div className="hidden sm:block w-1 h-20 bg-blue-500 rounded-full mr-3"></div>
                                )}
                                
                                <div 
                                  className={`relative group w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border-2 cursor-move transition-all duration-200 ${
                                    index === 0 ? 'border-primary' : 'border-gray-200'
                                  } ${
                                    draggedImage === index ? 'opacity-50 scale-95' : ''
                                  } ${
                                    dropTarget === index && draggedImage !== null && draggedImage !== index 
                                      ? 'border-blue-400 bg-blue-50 shadow-lg' 
                                      : ''
                                  }`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, index)}
                                  onDragOver={(e) => handleDragOver(e, index)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, index)}
                                  onDragEnd={handleDragEnd}
                                >
                                  <img 
                                    src={getImageUrl(image)} 
                                    alt={`Preview ${index}`} 
                                    className="w-full h-full object-cover" 
                                  />
                                  <button 
                                    type="button"
                                    className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white rounded-full p-0.5 sm:p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeImage(index)}
                                  >
                                    <X size={12} className="sm:size-[14px]" />
                                  </button>
                                  {/* Cover badge */}
                                  {index === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-[10px] sm:text-xs text-center py-0.5">
                                      Cover
                                    </div>
                                  )}
                                </div>

                                {/* Drop indicator bar - hidden on mobile */}
                                {shouldShowBarAfter && (
                                  <div className="hidden sm:block w-1 h-20 bg-blue-500 rounded-full ml-3"></div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-3 sm:col-span-1 flex items-center justify-center w-full h-16 sm:h-20 text-gray-400 text-xs sm:text-sm">
                            Images will appear here after upload
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 space-y-1">
                      <p>• <strong>Reorder:</strong> Once uploaded, drag and drop images to change their order</p>
                      <p>• <strong>Rules:</strong> Up to 10 images maximum; Formats: JPG, PNG, WEBP; Max 5MB per image</p>
                    </div>
                  </div>

                  {/* FORM ACTIONS - improved mobile layout */}
                  <div className="flex justify-center sm:justify-end gap-4 pt-2 sm:pt-3">
                    <button
                      type="submit"
                      className="btn btn-primary w-full sm:w-auto sm:min-w-[120px] text-sm sm:text-base"
                      disabled={!formData.name || !formData.price || !formData.category || loading || 
                                images.length === 0}
                    >
                      {loading ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <>
                          <PlusCircleIcon className="size-4 sm:size-5 mr-2" />
                          Publish Listing
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
