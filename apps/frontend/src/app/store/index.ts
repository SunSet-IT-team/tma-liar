import { configureStore } from '@reduxjs/toolkit'
import appSlice from '../../entities/appSetting/model/slice'
import timerSlice from '../../entities/game/model/timerSlice';

export const store = configureStore({
    reducer: {
        appSettings: appSlice,
        timer: timerSlice
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;