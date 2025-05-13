'use client';

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProduct, deleteProduct, resetForm } from "../../../store/slices/productSlice";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, EditIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import AddProductModal from "../../../components/AddProductModal";

export default function ProductPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const dispatch = useDispatch();
  const { currentProduct, loading, error } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

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

  // Check if the current user is the creator of the product
  const isProductOwner = user && currentProduct && user.id === currentProduct.user_id;

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
        {/* Product Image */}
        <div className="md:w-1/2">
          {currentProduct.image ? (
            <img
              src={currentProduct.image}
              alt={currentProduct.name}
              className="rounded-lg object-cover w-full h-96"
            />
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
    </div>
  );
} 