import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import productReducer from './slices/productSlice';
import authReducer from './slices/authSlice';
import savedProductsReducer from './slices/savedProductsSlice';
import recentlyViewedReducer from './slices/recentlyViewedSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    products: productReducer,
    auth: authReducer,
    savedProducts: savedProductsReducer,
    recentlyViewed: recentlyViewedReducer,
  },
}); 