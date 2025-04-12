'use client';

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Keep an empty reducer for compatibility with existing code
    setTheme: (state) => {
      // Always keep it light mode
      state.theme = 'light';
    },
    initTheme: (state) => {
      // Always initialize to light mode
      state.theme = 'light';
    }
  },
});

export const { setTheme, initTheme } = themeSlice.actions;
export default themeSlice.reducer; 