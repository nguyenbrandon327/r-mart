'use client';

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProduct, deleteProduct, deleteProductImage, resetForm, populateFormData, fetchSellerOtherProducts, markProductAsSold, markProductAsAvailable } from "../../../store/slices/productSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, EditIcon, HeartIcon, MessageCircleMore, Trash2Icon, XIcon, CheckIcon } from "lucide-react";
import Link from "next/link";
import EditProductModal from "../../../components/EditProductModal";
import TalkToSellerModal from "../../../components/TalkToSellerModal";
import UserLink from "../../../components/UserLink";
import ProductCarousel from "../../../components/ProductCarousel";
import Breadcrumb, { createBreadcrumbs } from "../../../components/Breadcrumb";
import { saveProduct, unsaveProduct, checkIsSaved } from "../../../store/slices/savedProductsSlice";
import { useChatStore } from "../../../store/hooks";
import toast from "react-hot-toast";
import axios from "axios";
import { formatRelativeTime } from "../../../utils/timeUtils";

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
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { currentProduct, loading, error, sellerOtherProducts, sellerOtherProductsLoading } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { createChat, sendMessage } = useChatStore();
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isContactingSeller, setIsContactingSeller] = useState(false);
  const [cameFromHomepage, setCameFromHomepage] = useState(false);
  const viewRecordedRef = useRef(null); // Track which product we've recorded a view for

  useEffect(() => {
    dispatch(fetchProduct(id));
  }, [dispatch, id]);

  // Check if user came from homepage
  useEffect(() => {
    // First check URL parameter (most reliable)
    const fromParam = searchParams.get('from');
    if (fromParam === 'home') {
      setCameFromHomepage(true);
      return;
    }
    
    // Fallback to referrer detection
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;
    const homepageUrl = `${currentOrigin}/`;
    
    // User came from homepage if:
    // 1. Referrer exactly matches homepage URL
    // 2. Or referrer is the origin without path (covers both trailing slash cases)
    const cameFromHome = referrer === homepageUrl || 
                        referrer === currentOrigin ||
                        referrer === `${currentOrigin}/` ||
                        // Also handle cases where user navigated directly or refreshed
                        (referrer === '' && window.history.length === 1);
    
    setCameFromHomepage(cameFromHome);
  }, [searchParams]);

  // Record product view when page loads
  useEffect(() => {
    // Only record view if we haven't already recorded it for this product
    if (viewRecordedRef.current !== id) {
      viewRecordedRef.current = id;
      // fire-and-forget – ignore failures
      axios.post(`/api/products/${id}/view`, {}, { withCredentials: true }).catch(() => {});
    }
  }, [id]);

  // Fetch seller's other products when current product loads
  useEffect(() => {
    if (currentProduct && currentProduct.user_id) {
      dispatch(fetchSellerOtherProducts({ 
        userId: currentProduct.user_id, 
        excludeProductId: id 
      }));
    }
  }, [dispatch, currentProduct, id]);

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!currentProduct?.user_id) {
      toast.error('Seller information not available');
      return;
    }

    // Open the DaisyUI modal
    document.getElementById('talk_to_seller_modal')?.showModal();
  };

  const handleSendFirstMessage = async (message) => {
    setIsContactingSeller(true);
    try {
      // First create the chat
      const chatResult = await createChat(currentProduct.user_id, currentProduct.id);
      
      // Then send the first message
      const messageData = new FormData();
      messageData.append('text', message);
      
      await sendMessage(messageData, chatResult.id);
      
      // Close modal and redirect to chat
      document.getElementById('talk_to_seller_modal')?.close();
      router.push(`/inbox/${chatResult.id}`);
    } catch (error) {
      console.error('Failed to create chat or send message:', error);
      toast.error('Failed to send message. Please try again.');
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

  const handleMarkAsSold = async () => {
    if (confirm("Are you sure you want to mark this product as sold?")) {
      await dispatch(markProductAsSold(id));
    }
  };

  const handleMarkAsAvailable = async () => {
    if (confirm("Are you sure you want to mark this product as available?")) {
      await dispatch(markProductAsAvailable(id));
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

  // Get first name from user name
  const getFirstName = (fullName) => {
    if (!fullName) return 'this seller';
    return fullName.split(' ')[0];
  };

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
      <div className="max-w-7xl mx-auto px-4 py-0" data-theme="light">
        {/* Back button shimmer */}
        <div className="mb-2 -mt-2">
          <div className="h-10 w-24 shimmer rounded-lg"></div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Product Images Shimmer */}
          <div className="md:w-3/5">
            <div className="flex gap-4">
              {/* Thumbnail gallery shimmer */}
              <div className="flex flex-col gap-2 w-20">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="aspect-square shimmer rounded-md"></div>
                ))}
              </div>
              
              {/* Main image shimmer */}
              <div className="flex-1">
                <div className="aspect-square shimmer rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Product Details Shimmer */}
          <div className="md:w-2/5">
            {/* Title shimmer */}
            <div className="h-8 shimmer rounded-lg mb-4"></div>
            
            {/* Price shimmer */}
            <div className="h-6 w-24 shimmer rounded-lg mb-4"></div>
            
            {/* Divider */}
            <div className="h-px bg-gray-200 my-4"></div>
            
            {/* Description header shimmer */}
            <div className="h-6 w-20 shimmer rounded-lg mb-2"></div>
            
            {/* Description content shimmer */}
            <div className="space-y-2 mb-4">
              <div className="h-4 shimmer rounded"></div>
              <div className="h-4 shimmer rounded w-3/4"></div>
              <div className="h-4 shimmer rounded w-1/2"></div>
            </div>
            
            {/* Seller info shimmer */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 shimmer rounded-full"></div>
                <div className="h-4 w-32 shimmer rounded"></div>
              </div>
              <div className="h-3 w-40 shimmer rounded"></div>
            </div>
            
            {/* Action buttons shimmer */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <div className="h-10 shimmer rounded-lg"></div>
              <div className="h-10 shimmer rounded-lg"></div>
            </div>
          </div>
        </div>
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

  // Category mapping for breadcrumbs
  const categoryLabels = {
    'clothes': 'Clothes',
    'tech': 'Tech',
    'textbooks': 'Textbooks',
    'furniture': 'Furniture',
    'kitchen': 'Kitchen',
    'food': 'Food',
    'vehicles': 'Vehicles',
    'housing': 'Housing',
    'rides': 'Rides',
    'renting': 'Renting',
    'merch': 'Merch',
    'other': 'Other',
    'in-searching-for': 'I\'m searching for'
  };

  const getCategoryLabel = (category) => categoryLabels[category] || 'Other';

  return (
    <div className="max-w-7xl mx-auto px-4 py-0" data-theme="light">
      <EditProductModal />
      <TalkToSellerModal
        onClose={() => document.getElementById('talk_to_seller_modal')?.close()}
        onSendMessage={handleSendFirstMessage}
        sellerName={currentProduct?.user_name}
        productName={currentProduct?.name}
        isLoading={isContactingSeller}
      />

      {/* Breadcrumb */}
      {currentProduct && (
        <Breadcrumb 
          items={cameFromHomepage 
            ? createBreadcrumbs.productFromHome(currentProduct.name)
            : createBreadcrumbs.product(
                getCategoryLabel(currentProduct.category), 
                currentProduct.name,
                currentProduct.category
              )
          }
          className="mb-4 -mt-2"
        />
      )}



      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Images */}
        <div className="md:w-3/5">
          {images.length > 0 ? (
            <div className="flex gap-4">
              {/* Thumbnail gallery on the left */}
              {images.length > 1 && (
                <div className="flex flex-col gap-2 w-20">
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
              
              {/* Main image on the right */}
              <div className="flex-1">
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
              </div>
            </div>
          ) : (
            <div className="bg-base-200 rounded-lg flex justify-center items-center w-full h-96">
              <span className="text-lg">No image available</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="md:w-2/5">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{currentProduct.name}</h1>
            {currentProduct.is_sold && (
              <span className="badge badge-error text-white px-3 py-2 text-sm font-bold">
                SOLD
              </span>
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
                  Listed {formatRelativeTime(currentProduct.created_at)}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 space-y-2">
            {isProductOwner ? (
              // Product owner buttons
              <div className="grid grid-cols-1 gap-2">
                {currentProduct.is_sold ? (
                  <button 
                    className="btn btn-success"
                    onClick={handleMarkAsAvailable}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm mr-1"></span>
                    ) : (
                      <HeartIcon className="h-5 w-5 mr-1" />
                    )}
                    {loading ? 'Updating...' : 'Mark as Available'}
                  </button>
                ) : (
                  <button 
                    className="btn btn-outline hover:bg-[#003DA5] hover:!text-white hover:border-[#003DA5]"
                    style={{ 
                      borderColor: '#003DA5', 
                      color: '#003DA5' 
                    }}
                    onClick={handleMarkAsSold}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm mr-1"></span>
                    ) : (
                      <CheckIcon className="h-5 w-5 mr-1" />
                    )}
                    {loading ? 'Updating...' : 'Mark as Sold'}
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  onClick={handleEdit}
                >
                  <EditIcon className="size-4 mr-2" />
                  Edit Product
                </button>
                <button
                  className="btn btn-outline btn-error"
                  onClick={handleDelete}
                >
                  <Trash2Icon className="size-4 mr-2" />
                  Delete Product
                </button>
              </div>
            ) : (
              // Non-owner buttons
              <div className="grid grid-cols-2 gap-2">
                {isAuthenticated ? (
                  <SaveButton productId={currentProduct.id} />
                ) : (
                  <button className="btn btn-primary" disabled>
                    <HeartIcon className="h-5 w-5 mr-1" />
                    Save
                  </button>
                )}
                <button 
                  className="btn btn-outline"
                  onClick={handleContactSeller}
                  disabled={isContactingSeller || !isAuthenticated || currentProduct.is_sold}
                >
                  {isContactingSeller ? (
                    <span className="loading loading-spinner loading-sm mr-1"></span>
                  ) : (
                    <MessageCircleMore className="h-5 w-5 mr-1" />
                  )}
                  {currentProduct.is_sold ? 'Item Sold' : (isContactingSeller ? 'Creating Chat...' : 'Talk to Seller')}
                </button>
              </div>
            )}
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
        <ProductCarousel
          title={`More from ${getFirstName(currentProduct.user_name)}`}
          icon="📦"
          products={sellerOtherProducts}
          loading={sellerOtherProductsLoading}
          className="mt-16 mb-12"
        />
      )}
    </div>
  );
} 