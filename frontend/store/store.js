import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import productReducer from './slices/productSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    products: productReducer,
  },
}); 