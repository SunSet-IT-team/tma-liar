import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type TimerState = {
  tickSeconds: number | null;
  time: number;
  isRunning: boolean;
};

const initialState: TimerState = {
  tickSeconds: null,
  time: 0,
  isRunning: false,
};

const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    // Старт таймера
    startTimer(state, action: PayloadAction<number>) {
      state.tickSeconds = action.payload;
      state.time = action.payload;
      state.isRunning = true;
    },
    // Отсчет таймера
    tick(state) {
      if (state.tickSeconds !== null && state.tickSeconds > 0) {
        state.tickSeconds -= 1;
      }
      if (state.tickSeconds === 0) {
        state.isRunning = false;
      }
    },
    // Остановить таймер
    stopTimer(state) {
      state.isRunning = false;
    },
    // Включить таймер
    playTimer(state) {
      state.isRunning = true;
    },
    // Обновить значение таймера
    updateTimer(state) {
      state.tickSeconds = state.time;
      state.isRunning = true;
    },
    // Очистить таймер
    resetTimer(state) {
      state.tickSeconds = null;
      state.time = 0;
      state.isRunning = false;
    },
  },
});

export const { startTimer, tick, stopTimer, updateTimer, playTimer, resetTimer } = timerSlice.actions;
export default timerSlice.reducer;