import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import repositorySlice from './slices/repositorySlice'
import readmeSlice from './slices/readmeSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    repository: repositorySlice,
    readme: readmeSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
