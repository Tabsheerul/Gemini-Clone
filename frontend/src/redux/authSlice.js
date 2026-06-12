import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    updateAvatar: (state, action) => {
      if (state.user) {
        state.user.avatar = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    updateProfileSuccess: (state, action) => {
      if (state.user) {
        state.user.username = action.payload.username;
        state.user.email = action.payload.email;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
});

export const { setCredentials, logoutUser, updateAvatar, updateProfileSuccess } = authSlice.actions;
export default authSlice.reducer;
