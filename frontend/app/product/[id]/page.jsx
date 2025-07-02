'use client';

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProduct, deleteProduct, deleteProductImage, resetForm, populateFormData, fetchSellerOtherProducts } from "../../../store/slices/productSlice";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, HeartIcon, MessageSquareTextIcon, Trash2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import EditProductModal from "../../../components/EditProductModal";
import UserLink from "../../../components/UserLink";
import SellerOtherProductsCarousel from "../../../components/SellerOtherProductsCarousel";
import { saveProduct, unsaveProduct, checkIsSaved } from "../../../store/slices/savedProductsSlice";
import { useChatStore } from "../../../store/hooks";
import toast from "react-hot-toast";

// Save button component for product page
function SaveButton({ productId }) {
  const dispatch = useDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);
  const { savedProductIds } = useSelector((state) => state.savedProducts);
  
  // Derive saved status from Redux state
  const isSaved = savedProductIds.includes(parseInt(productId));
  
  // Update local state when redux state changes
  useEffect(() => {
    setLocalSaved(isSaved);
  }, [isSaved]);
  
  // Check initial saved status on mount
  useEffect(() => {
    dispatch(checkIsSaved(productId));
  }, [dispatch, productId]);
  
  const handleToggleSave = async () => {
    setIsSaving(true);
    try {
      if (localSaved) {
        await dispatch(unsaveProduct(productId)).unwrap();
        setLocalSaved(false);
      } else {
        await dispatch(saveProduct(productId)).unwrap();
        setLocalSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <button 
      className={`btn ${localSaved ? 'btn-secondary' : 'btn-primary'} flex justify-center items-center`}
      onClick={handleToggleSave}
      disabled={isSaving}
    >
      {isSaving ? (
        <span className="loading loading-spinner"></span>
      ) : (
        <>
          <HeartIcon className={`h-5 w-5 mr-1 ${localSaved ? 'fill-current' : ''}`} />
          <span>{localSaved ? 'Saved' : 'Save'}</span>
        </>
      )}
    </button>
  );
}

export default function ProductPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentProduct, loading, error, sellerOtherProducts, sellerOtherProductsLoading } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { createChat } = useChatStore();
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isContactingSeller, setIsContactingSeller] = useState(false);

  useEffect(() => {
    dispatch(fetchProduct(id));
  }, [dispatch, id]);

  // Fetch seller's other products when current product loads
  useEffect(() => {
    if (currentProduct && currentProduct.user_id) {
      dispatch(fetchSellerOtherProducts({ 
        userId: currentProduct.user_id, 
        excludeProductId: id 
      }));
    }
  }, [dispatch, currentProduct, id]);

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!currentProduct?.user_id) {
      toast.error('Seller information not available');
      return;
    }

    setIsContactingSeller(true);
    try {
      const chat = await createChat(currentProduct.user_id, currentProduct.id);
      router.push(`/inbox/${chat.id}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsContactingSeller(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      await dispatch(deleteProduct(id));
      router.push("/");
    }
  };

  const handleEdit = () => {
    dispatch(populateFormData());
    document.getElementById("edit_product_modal").showModal();
  };

  const handleDeleteImage = async (imageUrl) => {
    if (confirm("Are you sure you want to delete this image?")) {
      await dispatch(deleteProductImage({ productId: id, imageUrl }));
    }
  };

  // Set the main displayed image without opening gallery
  const setMainImage = (index) => {
    setActiveImage(index);
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
      <EditProductModal />

      <div className="mb-6">
        <button 
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }} 
          className="btn btn-ghost"
        >
          <ArrowLeftIcon className="size-4 mr-2" />
          Go Back
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Images */}
        <div className="md:w-1/2">
          {images.length > 0 ? (
            <div className="space-y-4">
              {/* Main image */}
              <div 
                className="relative rounded-lg overflow-hidden cursor-zoom-in aspect-square bg-gray-100"
                onClick={() => openGallery(activeImage)}
              >
                <img
                  src={images[activeImage]}
                  alt={currentProduct.name}
                  className="w-full h-full object-contain"
                />
                
                {/* Navigation arrows - only show if there are multiple images */}
                {images.length > 1 && (
                  <>
                    <button 
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening gallery
                        prevImage();
                      }}
                    >
                      <ChevronLeftIcon size={20} />
                    </button>
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening gallery
                        nextImage();
                      }}
                    >
                      <ChevronRightIcon size={20} />
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, index) => (
                    <div 
                      key={index}
                      className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${index === activeImage ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setMainImage(index)}
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
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <span className="text-gray-500 mr-2">Posted by:</span>
                <UserLink 
                  user={{ 
                    id: currentProduct.user_id, 
                    name: currentProduct.user_name,
                    user_name: currentProduct.user_name,
                    user_email: currentProduct.user_email,
                    user_profile_pic: currentProduct.user_profile_pic
                  }}
                  showProfilePic={true}
                  profilePicSize="w-8 h-8"
                  className="font-medium"
                />
              </div>
              {currentProduct.created_at && (
                <p className="text-xs text-gray-500">
                  Listed on {new Date(currentProduct.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2">
            {isAuthenticated && !isProductOwner ? (
              <SaveButton productId={currentProduct.id} />
            ) : (
              <button className="btn btn-primary" disabled={!isAuthenticated || isProductOwner}>
                <HeartIcon className="h-5 w-5 mr-1" />
                {isProductOwner ? "Your Product" : "Save"}
              </button>
            )}
            <button 
              className="btn btn-outline"
              onClick={handleContactSeller}
              disabled={isContactingSeller || !isAuthenticated || isProductOwner}
            >
              {isContactingSeller ? (
                <span className="loading loading-spinner loading-sm mr-1"></span>
              ) : (
                <MessageSquareTextIcon className="h-5 w-5 mr-1" />
              )}
              {isContactingSeller ? 'Creating Chat...' : 'Talk to Seller'}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Gallery Modal */}
      {galleryOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50"
            onClick={closeGallery}
          />
          
          {/* Content */}
          <div className="fixed inset-0 z-50 flex flex-col justify-center items-center">
            {/* Close button */}
            <button 
              className="absolute top-6 right-6 text-white bg-black bg-opacity-60 hover:bg-opacity-80 p-3 rounded-full z-50"
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
            
            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
              {activeImage + 1} / {images.length}
            </div>
          </div>
        </>
      )}

      {/* Seller Other Products Carousel */}
      {currentProduct && currentProduct.user_id && (
        <SellerOtherProductsCarousel 
          products={sellerOtherProducts}
          loading={sellerOtherProductsLoading}
          seller={{
            id: currentProduct.user_id,
            name: currentProduct.user_name,
            user_name: currentProduct.user_name,
            email: currentProduct.user_email,
            user_email: currentProduct.user_email,
            profile_pic: currentProduct.user_profile_pic,
            user_profile_pic: currentProduct.user_profile_pic
          }}
        />
      )}
    </div>
  );
} 