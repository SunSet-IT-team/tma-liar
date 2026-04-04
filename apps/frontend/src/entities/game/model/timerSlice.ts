import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type TimerState = {
  tickSeconds: number | null;
  time: number;
  isRunning: boolean;
  /** Время dispatch startTimer — для плавного UI без привязки к секундному tick */
  anchorWallTimeMs: number | null;
};

const initialState: TimerState = {
  tickSeconds: null,
  time: 0,
  isRunning: false,
  anchorWallTimeMs: null,
};

type StartTimerPayload = {
  seconds: number;
  anchorMs: number;
};

const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    // Старт таймера (число секунд; anchorMs выставляется в prepare)
    startTimer: {
      reducer(state, action: PayloadAction<StartTimerPayload>) {
        const { seconds, anchorMs } = action.payload;
        state.tickSeconds = seconds;
        state.time = seconds;
        state.isRunning = seconds > 0;
        state.anchorWallTimeMs = anchorMs;
      },
      prepare(seconds: number): { payload: StartTimerPayload } {
        return { payload: { seconds, anchorMs: Date.now() } };
      },
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
      state.anchorWallTimeMs = Date.now();
    },
    // Очистить таймер
    resetTimer(state) {
      state.tickSeconds = null;
      state.time = 0;
      state.isRunning = false;
      state.anchorWallTimeMs = null;
    },
  },
});

export const { startTimer, tick, stopTimer, updateTimer, playTimer, resetTimer } = timerSlice.actions;
export default timerSlice.reducer;