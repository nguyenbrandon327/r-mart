'use client';

import { useState, useRef, useEffect } from "react";
import { DollarSignIcon, ImageIcon, Package2Icon, SaveIcon, TagIcon, X } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { updateProduct, setFormData, resetForm, populateFormData } from '../store/slices/productSlice';

function EditProductModal() {
  const dispatch = useDispatch();
  const { formData, loading, currentProduct } = useSelector((state) => state.products);
  
  // Unified image management - each image has { id, type: 'existing'|'new', data: url|file }
  const [allImages, setAllImages] = useState([]);
  
  const [draggedImage, setDraggedImage] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize images when currentProduct is available
  useEffect(() => {
    if (currentProduct?.images) {
      setAllImages(currentProduct.images.map((url, index) => ({
        id: `existing-${index}-${Date.now()}`,
        type: 'existing',
        data: url
      })));
    } else {
      setAllImages([]);
    }
  }, [currentProduct?.images]);

  // Reinitialize images when modal is reopened (currentProduct exists but allImages is empty)
  useEffect(() => {
    if (currentProduct?.images && allImages.length === 0) {
      setAllImages(currentProduct.images.map((url, index) => ({
        id: `existing-${index}-${Date.now()}`,
        type: 'existing',
        data: url
      })));
    }
  }, [currentProduct, allImages.length]);

  // Populate form data when currentProduct changes
  useEffect(() => {
    if (currentProduct) {
      dispatch(populateFormData());
    }
  }, [currentProduct, dispatch]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentProduct) {
      console.error('No current product to update');
      return;
    }
    
    // Create a FormData object for submitting files
    const productFormData = new FormData();
    
    // Add all text fields
    productFormData.append('name', formData.name);
    productFormData.append('price', formData.price);
    productFormData.append('description', formData.description);
    productFormData.append('category', formData.category);
    
    // Separate existing images and new images while maintaining order
    const existingImages = [];
    const newImagePositions = [];
    
    allImages.forEach((image, index) => {
      if (image.type === 'existing') {
        existingImages.push(image.data);
      } else {
        // For new images, we'll append them and track their intended positions
        newImagePositions.push(index);
        productFormData.append('productImages', image.data);
      }
    });
    
    // Send the ordered existing images
    productFormData.append('existingImages', JSON.stringify(existingImages));
    // Send position information for new images
    if (newImagePositions.length > 0) {
      productFormData.append('newImagePositions', JSON.stringify(newImagePositions));
    }
    
    await dispatch(updateProduct({ id: currentProduct.id, formData: productFormData }));
    
    // Reset state and close modal
    setAllImages([]);
    dispatch(resetForm());
    document.getElementById("edit_product_modal").close();
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
        type: 'new',
        data: file
      }));
      setAllImages(prev => [...prev, ...newImages]);
    }
  };

  // Remove an image
  const removeImage = (index) => {
    setAllImages(prevImages => prevImages.filter((_, i) => i !== index));
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
    
    // Reorder the unified image array
    const newOrder = [...allImages];
    const [movedItem] = newOrder.splice(draggedImage, 1);
    newOrder.splice(dropIndex, 0, movedItem);
    setAllImages(newOrder);
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
    if (image.type === 'existing') {
      return image.data;
    } else {
      return URL.createObjectURL(image.data);
    }
  };

  const handleCloseModal = () => {
    setAllImages([]);
    dispatch(resetForm());
    document.getElementById("edit_product_modal").close();
  };

  return (
    <dialog id="edit_product_modal" className="modal">
      <div className="modal-box max-w-3xl">
        {/* CLOSE BUTTON */}
        <div>
          <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={handleCloseModal}
          >X</button>
        </div>

        {/* MODAL HEADER */}
        <h3 className="font-bold text-xl mb-8">
          Edit Product
        </h3>

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

            {/* PRICE AND CATEGORY ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <option value="renting">Renting</option>
                    <option value="merch">Merch</option>
                    <option value="tickets">Tickets</option>
                    <option value="other">Other</option>
                    <option value="in-searching-for">I'm searching for</option>
                  </select>
                </div>
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

              {/* Display all images in one unified section */}
              <div className="text-sm font-medium mb-2">
                The first image will be used as the cover image
              </div>
              
              {allImages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {allImages.map((image, index) => {
                    const isLastImage = index === allImages.length - 1;
                    const shouldShowBarAfter = dropTarget === index && draggedImage !== null && draggedImage !== index && 
                                             isLastImage && draggedImage < index;
                    const shouldShowBarBefore = dropTarget === index && draggedImage !== null && draggedImage !== index && 
                                               (!isLastImage || draggedImage > index);
                    
                    return (
                      <div key={`container-${image.id}`} className="flex items-center">
                        {/* Drop indicator bar */}
                        {shouldShowBarBefore && (
                          <div className="w-1 h-24 bg-blue-500 rounded-full mr-3"></div>
                        )}
                        
                        <div 
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

                        {/* Drop indicator bar */}
                        {shouldShowBarAfter && (
                          <div className="w-1 h-24 bg-blue-500 rounded-full ml-3"></div>
                        )}
                      </div>
                    );
                  })}
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
              disabled={!formData.name || !formData.price || !formData.category || loading || 
                        allImages.length === 0}
            >
              {loading ? (
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

export default EditProductModal; 