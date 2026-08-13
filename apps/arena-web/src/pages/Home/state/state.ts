export type HomeState = {
  name: string;
  roomCode: string;
  error: string;
  connecting: boolean;
  bodyType: string;
  hairStyle: string;
  showCustomize: boolean;
  showEquipmentViewer: boolean;
  mapId: string;
};

export const initialState: HomeState = {
  name: '',
  roomCode: '',
  error: '',
  connecting: false,
  bodyType: '#ffccaa',
  hairStyle: 'bald',
  showCustomize: false,
  showEquipmentViewer: false,
  mapId: 'test-grid',
};
