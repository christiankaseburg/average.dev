export type HomeState = {
  name: string;
  roomCode: string;
  error: string;
  connecting: boolean;
  bodyType: string;
  hairStyle: string;
  showCustomize: boolean;
};

export const initialState: HomeState = {
  name: '',
  roomCode: '',
  error: '',
  connecting: false,
  bodyType: 'human_light',
  hairStyle: 'short_brown',
  showCustomize: false,
};
