import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: {
    id: null,
    photo: null,
    name: ''
  },
  sounds: true,
  backgroundMusic: false,
  volume: 50,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Изменение значения звуков вкл/выкл
    setSoundsChange: (state, action) => {
      state.sounds = action.payload;
    },
    // Изменение значения музыки вкл/выкл
    setBackgroundMusicIsPlay: (state, action) => {
      state.backgroundMusic = action.payload;
    },
    // Изменение громкости звуков в игре
    setMainVolume: (state, action) => {
      state.volume = action.payload;
    }
  }
})

export const { setSoundsChange, setBackgroundMusicIsPlay, setMainVolume } = appSlice.actions;
export default appSlice.reducer;