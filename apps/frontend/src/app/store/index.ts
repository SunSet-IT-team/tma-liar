import { configureStore } from '@reduxjs/toolkit'
import appSlice from '../../entities/appSetting/model/slice'

export const store = configureStore({
    reducer: {
        appSettings: appSlice
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;