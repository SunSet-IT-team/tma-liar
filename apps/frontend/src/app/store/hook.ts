import {useDispatch, useSelector} from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type {AppDispatch, RootState} from '.';

// Создаем типизированные хуки
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;