import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// The Store is like the global database for your React app
export const store = configureStore({
  reducer: {
    // We add our auth reducer here so the store knows about the auth state
    auth: authReducer,
  },
});
