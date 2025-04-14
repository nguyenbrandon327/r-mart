'use client';

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state) => {
      state.theme = 'light';
    },
    initTheme: (state) => {
      state.theme = 'light';
    }
  },
});

export const { setTheme, initTheme } = themeSlice.actions;
export default themeSlice.reducer; 