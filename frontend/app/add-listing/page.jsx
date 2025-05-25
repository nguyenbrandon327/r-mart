'use client';

import { useState, useRef, useEffect } from "react";
import { DollarSignIcon, ImageIcon, Package2Icon, PlusCircleIcon, TagIcon, X, ArrowLeftIcon } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { addProduct, setFormData, resetForm } from '../../store/slices/productSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddListingPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { formData, loading } = useSelector((state) => state.products);
  
  // Reset form data when component mounts to ensure clean slate for new product
  useEffect(() => {
    dispatch(resetForm());
  }, [dispatch]);
  
  // Image management for new products only
  const [images, setImages] = useState([]);
  const [draggedImage, setDraggedImage] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const fileInputRef = useRef(null);

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
      // Reset state and redirect
      setImages([]);
      dispatch(resetForm());
      router.push('/'); // Redirect to home page after successful add
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
      const newImages = filesArray.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        data: file
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  // Remove an image
  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedImage(index);
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(index);
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear drop target if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  };

  // Handle drop
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

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedImage(null);
    setDropTarget(null);
  };

  // Helper function to get image URL for display
  const getImageUrl = (image) => {
    return URL.createObjectURL(image.data);
  };

  return (
    <div className="min-h-screen bg-base-100" data-theme="light">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add New Listing</h1>
          <p className="text-gray-600 mt-2">Create a new product listing to sell your items</p>
        </div>

        {/* Form */}
        <div className="card bg-white shadow-lg">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
              <div className="grid gap-6">
                {/* PRODUCT NAME INPUT */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-base font-medium">Product Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                      <Package2Icon className="size-5" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter product name"
                      className="input input-bordered w-full pl-10 py-3 focus:input-primary transition-colors duration-200"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* PRODUCT PRICE INPUT */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-base font-medium">Price</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                      <DollarSignIcon className="size-5" />
                    </div>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="input input-bordered w-full pl-10 py-3 focus:input-primary transition-colors duration-200"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* PRODUCT CATEGORY */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-base font-medium">Category</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                      <TagIcon className="size-5" />
                    </div>
                    <select
                      name="category"
                      className="select select-bordered w-full pl-10 py-3 focus:select-primary transition-colors duration-200"
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
                      <option value="merch">Merch</option>
                      <option value="other">Other</option>
                      <option value="in-searching-for">I'm searching for</option>
                    </select>
                  </div>
                </div>

                {/* PRODUCT IMAGES */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-base font-medium">Product Images</span>
                  </label>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                      <ImageIcon className="size-5" />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="file-input file-input-bordered w-full pl-10 py-3 focus:file-input-primary transition-colors duration-200"
                      onChange={handleImageSelect}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      multiple
                    />
                  </div>

                  {/* Display images */}
                  <div className="text-sm font-medium mb-2">
                    The first image will be used as the cover image
                  </div>
                  
                  {images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3">
                      {images.map((image, index) => (
                        <div 
                          key={image.id}
                          className={`relative group w-24 h-24 rounded-md overflow-hidden border-2 cursor-move transition-all duration-200 ${
                            index === 0 ? 'border-primary' : 'border-gray-200'
                          } ${
                            draggedImage === index ? 'opacity-50 scale-95' : ''
                          } ${
                            dropTarget === index && draggedImage !== null && draggedImage !== index 
                              ? 'border-blue-400 bg-blue-50 scale-105 shadow-lg' 
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
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X size={14} />
                          </button>
                          {/* Cover badge */}
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-xs text-center py-0.5">
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    <p>• Drag and drop to reorder images freely</p>
                    <p>• Up to 5 images can be uploaded</p>
                    <p>• Supported formats: JPG, PNG, WEBP</p>
                    <p>• Maximum size: 5MB per image</p>
                  </div>
                </div>

                {/* PRODUCT DESCRIPTION */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-base font-medium">Description</span>
                  </label>
                  <textarea
                    name="description"
                    placeholder="Enter product description"
                    className="textarea textarea-bordered w-full h-32 focus:textarea-primary transition-colors duration-200"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="flex justify-end gap-4 pt-6">
                <Link href="/" className="btn btn-ghost">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary min-w-[120px]"
                  disabled={!formData.name || !formData.price || !formData.category || loading || 
                            images.length === 0}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <>
                      <PlusCircleIcon className="size-5 mr-2" />
                      Add Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
