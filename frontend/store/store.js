import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import productReducer from './slices/productSlice';
import authReducer from './slices/authSlice';
import savedProductsReducer from './slices/savedProductsSlice';
import recentlyViewedReducer from './slices/recentlyViewedSlice';
import userReducer from './slices/userSlice';
import chatReducer from './slices/chatSlice';
import searchReducer from './slices/searchSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    products: productReducer,
    auth: authReducer,
    savedProducts: savedProductsReducer,
    recentlyViewed: recentlyViewedReducer,
    user: userReducer,
    chat: chatReducer,
    search: searchReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setSocket'],
        ignoredPaths: ['auth.socket'],
      },
    }),
}); 