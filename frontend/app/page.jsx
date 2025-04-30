'use client';

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { PackageIcon, PlusCircleIcon, RefreshCwIcon, ShoppingBagIcon } from "lucide-react";
import { fetchProducts, resetForm } from '../store/slices/productSlice';
import ProductCard from "../components/ProductCard";
import AddProductModal from "../components/AddProductModal";

export default function HomePage() {
  const dispatch = useDispatch();
  const { products, loading, error } = useSelector((state) => state.products);
  const [activeSlide, setActiveSlide] = useState(1);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const goToSlide = (slideNumber) => {
    const slide = document.getElementById(`slide${slideNumber}`);
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      setActiveSlide(slideNumber);
    }
  };

  return (
    <div>
      {/* Carousel Banner */}
      <div className="w-full mb-8 overflow-hidden rounded-lg shadow-md">
        <div className="carousel w-full">
          <div id="slide1" className="carousel-item relative w-full">
            <div className="hero h-[300px] bg-cover bg-center" style={{ backgroundImage: 'url("/banner1.jpg")' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-blue-900/10 to-transparent" style={{ width: '90%' }}></div>
              <div className="hero-content justify-start w-full pl-20 pr-8">
                <div className="max-w-md">
                  <h2 className="text-4xl font-bold text-white">Made by students,<br />for students</h2>
                  <p className="py-4 text-white">Buy and sell goods with other verified UCR students</p>
                  <button className="btn btn-secondary">Join Now</button>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(3);
              }} className="btn btn-circle">❮</button> 
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(2);
              }} className="btn btn-circle">❯</button>
            </div>
          </div> 
          <div id="slide2" className="carousel-item relative w-full">
            <div className="hero h-[300px] bg-secondary text-secondary-content">
              <div className="hero-content text-center">
                <div className="max-w-lg">
                  <h2 className="text-4xl font-bold">New Arrivals</h2>
                  <p className="py-4">Check out our latest products just added to the store!</p>
                  <button className="btn btn-primary">Explore</button>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(1);
              }} className="btn btn-circle">❮</button> 
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(3);
              }} className="btn btn-circle">❯</button>
            </div>
          </div> 
          <div id="slide3" className="carousel-item relative w-full">
            <div className="hero h-[300px] bg-accent text-accent-content">
              <div className="hero-content text-center">
                <div className="max-w-lg">
                  <h2 className="text-4xl font-bold">Free Shipping</h2>
                  <p className="py-4">Free shipping on all orders above $50. Order now!</p>
                  <button className="btn btn-primary">Learn More</button>
                </div>
              </div>
            </div>
            <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(2);
              }} className="btn btn-circle">❮</button> 
              <button onClick={(e) => {
                e.preventDefault();
                goToSlide(1);
              }} className="btn btn-circle">❯</button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center mb-2">
            <ShoppingBagIcon className="size-7 mr-2" />
            All Products
          </h1>
          <p className="text-base-content/70">
            Browse all available products in our marketplace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              dispatch(resetForm());
              document.getElementById("add_product_modal").showModal();
            }}
          >
            <PlusCircleIcon className="size-5 mr-2" />
            Add Product
          </button>
          <button 
            className="btn btn-circle btn-ghost"
            onClick={() => dispatch(fetchProducts())}
          >
            <RefreshCwIcon className="size-5" />
          </button>
        </div>
      </div>

      <AddProductModal />

      {error && <div className="alert alert-error mb-8">{error}</div>}

      {products.length === 0 && !loading && (
        <div className="flex flex-col justify-center items-center h-80 space-y-4">
          <div className="bg-base-200 rounded-full p-6">
            <PackageIcon className="size-12" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">No products found</h3>
            <p className="text-base-content/70 max-w-sm">
              Get started by adding your first product to the marketplace
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
} 