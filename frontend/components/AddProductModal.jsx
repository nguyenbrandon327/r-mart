'use client';

import { useState, useRef } from "react";
import { DollarSignIcon, ImageIcon, Package2Icon, PlusCircleIcon, SaveIcon, TagIcon, X } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { addProduct, updateProduct, setFormData, resetForm } from '../store/slices/productSlice';

function AddProductModal({ isEditing = false }) {
  const dispatch = useDispatch();
  const { formData, loading, currentProduct } = useSelector((state) => state.products);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [draggedImage, setDraggedImage] = useState(null);
  const [existingImages, setExistingImages] = useState(isEditing && currentProduct?.images ? [...currentProduct.images] : []);
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
    
    // Add existing images if editing
    if (isEditing && existingImages.length > 0) {
      productFormData.append('existingImages', JSON.stringify(existingImages));
    }
    
    // Add files to form data
    if (uploadedImages.length > 0) {
      uploadedImages.forEach(file => {
        productFormData.append('productImages', file);
      });
    }
    
    if (isEditing && currentProduct) {
      await dispatch(updateProduct({ id: currentProduct.id, formData: productFormData }));
    } else {
      await dispatch(addProduct(productFormData));
    }
    
    // Reset state
    setUploadedImages([]);
    setExistingImages([]);
    dispatch(resetForm());
    document.getElementById("add_product_modal").close();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(setFormData({ ...formData, [name]: value }));
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    if (e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setUploadedImages(prev => [...prev, ...filesArray]);
    }
  };

  // Remove an uploaded image
  const removeUploadedImage = (index) => {
    setUploadedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // Remove an existing image
  const removeExistingImage = (index) => {
    setExistingImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // Handle drag start
  const handleDragStart = (e, index, isExisting) => {
    setDraggedImage({ index, isExisting });
  };

  // Handle drag over
  const handleDragOver = (e, index, isExisting) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drop
  const handleDrop = (e, dropIndex, isExistingTarget) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedImage === null) return;
    
    const { index: dragIndex, isExisting: isExistingSource } = draggedImage;
    
    // If dragging within the same list (both existing or both new)
    if (isExistingSource === isExistingTarget) {
      if (isExistingSource) {
        // Reorder existing images
        const newOrder = [...existingImages];
        const [movedItem] = newOrder.splice(dragIndex, 1);
        newOrder.splice(dropIndex, 0, movedItem);
        setExistingImages(newOrder);
      } else {
        // Reorder new uploaded images
        const newOrder = [...uploadedImages];
        const [movedItem] = newOrder.splice(dragIndex, 1);
        newOrder.splice(dropIndex, 0, movedItem);
        setUploadedImages(newOrder);
      }
    } else {
      // Cannot move between existing and new images
      // For simplicity and clarity of the API
    }
    
    setDraggedImage(null);
  };

  return (
    <dialog id="add_product_modal" className="modal">
      <div className="modal-box max-w-3xl">
        {/* CLOSE BUTTON */}
        <div>
          <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => {
              setUploadedImages([]);
              setExistingImages([]);
              dispatch(resetForm());
              document.getElementById("add_product_modal").close();
            }}
          >X</button>
        </div>

        {/* MODAL HEADER */}
        <h3 className="font-bold text-xl mb-8">
          {isEditing ? "Edit Product" : "Add New Product"}
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

              {/* Display selected images with reordering capability */}
              <div className="text-sm font-medium mb-2">
                The first image will be used as the cover image
              </div>
              
              <div className="mt-2 flex flex-wrap gap-3">
                {/* Existing images (if editing) */}
                {existingImages.length > 0 && (
                  <>
                    <div className="text-sm text-gray-500 w-full mb-1">Existing Images</div>
                    <div className="flex flex-wrap gap-3 w-full mb-4">
                      {existingImages.map((img, index) => (
                        <div 
                          key={`existing-${index}`}
                          className={`relative group w-24 h-24 rounded-md overflow-hidden border-2 ${index === 0 ? 'border-primary' : 'border-gray-200'}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index, true)}
                          onDragOver={(e) => handleDragOver(e, index, true)}
                          onDrop={(e) => handleDrop(e, index, true)}
                        >
                          <img 
                            src={img} 
                            alt={`Preview ${index}`} 
                            className="w-full h-full object-cover" 
                          />
                          <button 
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingImage(index)}
                          >
                            <X size={14} />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-xs text-center py-0.5">
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* New uploaded images */}
                {uploadedImages.length > 0 && (
                  <>
                    <div className="text-sm text-gray-500 w-full mb-1">New Images</div>
                    <div className="flex flex-wrap gap-3 w-full">
                      {uploadedImages.map((file, index) => (
                        <div 
                          key={`new-${index}`}
                          className={`relative group w-24 h-24 rounded-md overflow-hidden border-2 ${existingImages.length === 0 && index === 0 ? 'border-primary' : 'border-gray-200'}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index, false)}
                          onDragOver={(e) => handleDragOver(e, index, false)}
                          onDrop={(e) => handleDrop(e, index, false)}
                        >
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${index}`} 
                            className="w-full h-full object-cover" 
                          />
                          <button 
                            type="button"
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeUploadedImage(index)}
                          >
                            <X size={14} />
                          </button>
                          {existingImages.length === 0 && index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-primary text-white text-xs text-center py-0.5">
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                <p>• Drag and drop to reorder images</p>
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
                onClick={() => {
                  setUploadedImages([]);
                  setExistingImages([]);
                  dispatch(resetForm());
                  document.getElementById("add_product_modal").close();
                }}
              >
                Cancel
              </button>
            </div>
            <button
              type="submit"
              className="btn btn-primary min-w-[120px]"
              disabled={!formData.name || !formData.price || !formData.category || loading || 
                        (uploadedImages.length === 0 && existingImages.length === 0)}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : isEditing ? (
                <>
                  <SaveIcon className="size-5 mr-2" />
                  Save Changes
                </>
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

      {/* BACKDROP */}
      <div className="modal-backdrop" onClick={() => document.getElementById("add_product_modal").close()}>
        <button onClick={() => document.getElementById("add_product_modal").close()}>close</button>
      </div>
    </dialog>
  );
}

export default AddProductModal; 