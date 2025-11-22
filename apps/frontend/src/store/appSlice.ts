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
    setSoundsChange: (state, action) => {
      state.sounds = action.payload;
    },
    setBackgroundMusicIsPlay: (state, action) => {
      state.backgroundMusic = action.payload;
    },
    setMainVolume: (state, action) => {
      state.volume = action.payload;
    }
  }
})

export const { setSoundsChange, setBackgroundMusicIsPlay, setMainVolume } = appSlice.actions;
export default appSlice.reducer;