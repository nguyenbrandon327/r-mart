'use client';

import { DollarSignIcon, ImageIcon, Package2Icon, PlusCircleIcon, SaveIcon, TagIcon } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { addProduct, updateProduct, setFormData, resetForm } from '../store/slices/productSlice';

function AddProductModal({ isEditing = false }) {
  const dispatch = useDispatch();
  const { formData, loading, currentProduct } = useSelector((state) => state.products);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing && currentProduct) {
      await dispatch(updateProduct({ id: currentProduct.id, formData }));
    } else {
      await dispatch(addProduct(formData));
    }
    dispatch(resetForm());
    document.getElementById("add_product_modal").close();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(setFormData({ ...formData, [name]: value }));
  };

  return (
    <dialog id="add_product_modal" className="modal">
      <div className="modal-box">
        {/* CLOSE BUTTON */}
        <div>
          <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => {
              dispatch(resetForm());
              document.getElementById("add_product_modal").close();
            }}
          >X</button>
        </div>

        {/* MODAL HEADER */}
        <h3 className="font-bold text-xl mb-8">
          {isEditing ? "Edit Product" : "Add New Product"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* PRODUCT IMAGE */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-medium">Image URL</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <ImageIcon className="size-5" />
                </div>
                <input
                  type="url"
                  name="image"
                  placeholder="https://example.com/image.jpg"
                  className="input input-bordered w-full pl-10 py-3 focus:input-primary transition-colors duration-200"
                  value={formData.image}
                  onChange={handleChange}
                />
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
              disabled={!formData.name || !formData.price || !formData.image || loading}
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