import { createSlice } from '@reduxjs/toolkit';

// 1. Initial State: Think of this as the default values for your auth data
const initialState = {
  user: {
    firstName: 'Tabsheer',
    lastName: 'User',
    email: 'tabsheer@example.com'
  }
};

// 2. Create Slice: This creates the reducers (functions to update state) and actions
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action to set or update the user
    setUser: (state, action) => {
      // With Redux Toolkit, we can "mutate" the state directly like this
      state.user = action.payload;
    },
    // Action to clear the user (e.g., on logout)
    logoutUser: (state) => {
      state.user = null;
    }
  }
});

// 3. Export Actions: We export these so our components can use them via useDispatch()
export const { setUser, logoutUser } = authSlice.actions;

// 4. Export Reducer: The store needs this to know how to handle the state
export default authSlice.reducer;
