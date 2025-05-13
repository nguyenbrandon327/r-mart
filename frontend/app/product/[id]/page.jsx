'use client';

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProduct, deleteProduct, deleteProductImage, resetForm } from "../../../store/slices/productSlice";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, Trash2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import AddProductModal from "../../../components/AddProductModal";

export default function ProductPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentProduct, loading, error } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProduct(id));
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      await dispatch(deleteProduct(id));
      router.push("/");
    }
  };

  const handleEdit = () => {
    document.getElementById("add_product_modal").showModal();
  };

  const handleDeleteImage = async (imageUrl) => {
    if (confirm("Are you sure you want to delete this image?")) {
      await dispatch(deleteProductImage({ productId: id, imageUrl }));
    }
  };

  // Open fullscreen gallery
  const openGallery = (index = 0) => {
    setActiveImage(index);
    setGalleryOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when gallery is open
  };

  // Close fullscreen gallery
  const closeGallery = () => {
    setGalleryOpen(false);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  // Navigate to next image in gallery
  const nextImage = () => {
    if (!currentProduct?.images?.length) return;
    setActiveImage((prev) => (prev + 1) % currentProduct.images.length);
  };

  // Navigate to previous image in gallery
  const prevImage = () => {
    if (!currentProduct?.images?.length) return;
    setActiveImage((prev) => (prev - 1 + currentProduct.images.length) % currentProduct.images.length);
  };

  // Handle keyboard navigation in gallery
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!galleryOpen) return;
      
      switch (e.key) {
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'Escape':
          closeGallery();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryOpen, currentProduct]);

  // Check if the current user is the creator of the product
  const isProductOwner = user && currentProduct && user.id === currentProduct.user_id;

  // Get product images or fallback
  const getProductImages = () => {
    if (currentProduct?.images && currentProduct.images.length > 0) {
      return currentProduct.images;
    } else if (currentProduct?.image) {
      // Legacy support for old products with single image
      return [currentProduct.image];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" data-theme="light">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8" data-theme="light">
        <div className="alert alert-error">{error}</div>
        <div className="mt-4">
          <Link href="/" className="btn btn-primary">
            <ArrowLeftIcon className="size-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8" data-theme="light">
        <div className="alert alert-warning">Product not found</div>
        <div className="mt-4">
          <Link href="/" className="btn btn-primary">
            <ArrowLeftIcon className="size-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const images = getProductImages();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-theme="light">
      <AddProductModal isEditing={true} />

      <div className="mb-6">
        <Link href="/" className="btn btn-ghost">
          <ArrowLeftIcon className="size-4 mr-2" />
          Back to Products
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Images */}
        <div className="md:w-1/2">
          {images.length > 0 ? (
            <div className="space-y-4">
              {/* Main image */}
              <div 
                className="relative rounded-lg overflow-hidden cursor-pointer aspect-square bg-gray-100"
                onClick={() => openGallery(0)}
              >
                <img
                  src={images[0]}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Thumbnail gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, index) => (
                    <div 
                      key={index}
                      className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${index === 0 ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => openGallery(index)}
                    >
                      <img
                        src={img}
                        alt={`${currentProduct.name} - image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-base-200 rounded-lg flex justify-center items-center w-full h-96">
              <span className="text-lg">No image available</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="md:w-1/2">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold">{currentProduct.name}</h1>
            {isProductOwner && (
              <div className="flex gap-2">
                <button
                  className="btn btn-circle btn-outline btn-sm"
                  onClick={handleEdit}
                >
                  <EditIcon className="size-4" />
                </button>
                <button
                  className="btn btn-circle btn-outline btn-error btn-sm"
                  onClick={handleDelete}
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div className="my-4">
            <span className="text-2xl font-semibold text-primary">
              ${Number(currentProduct.price).toFixed(2)}
            </span>
          </div>

          <div className="divider"></div>

          <div className="prose">
            <h3>Description</h3>
            <p>{currentProduct.description || "No description available."}</p>
          </div>

          {currentProduct.user_name && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Posted by: <span className="font-medium">{currentProduct.user_name}</span>
              </p>
            </div>
          )}

          <div className="mt-6">
            <button className="btn btn-primary w-full">Add to Cart</button>
          </div>
        </div>
      </div>

      {/* Fullscreen Gallery Modal */}
      {galleryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col justify-center items-center">
          {/* Close button */}
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={closeGallery}
          >
            <XIcon size={24} />
          </button>
          
          {/* Main image container */}
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-10">
            <img 
              src={images[activeImage]}
              alt={`${currentProduct.name} - fullscreen view`}
              className="max-h-full max-w-full object-contain"
            />
            
            {/* Previous/Next navigation */}
            {images.length > 1 && (
              <>
                <button 
                  className="absolute left-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2"
                  onClick={prevImage}
                >
                  <ChevronLeftIcon size={24} />
                </button>
                <button 
                  className="absolute right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2"
                  onClick={nextImage}
                >
                  <ChevronRightIcon size={24} />
                </button>
              </>
            )}
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="p-4 flex justify-center gap-2 mb-4">
              {images.map((img, index) => (
                <button
                  key={index}
                  className={`h-16 w-16 border-2 ${index === activeImage ? 'border-white' : 'border-transparent'} rounded-md overflow-hidden`}
                  onClick={() => setActiveImage(index)}
                >
                  <img 
                    src={img} 
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
          
          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
            {activeImage + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
} 