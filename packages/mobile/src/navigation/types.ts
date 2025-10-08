import { Launch } from '@bermuda/shared';

export type RootStackParamList = {
  MainTabs: undefined;
  LaunchDetail: { launchId: string; launch: Launch };
};

export type MainTabParamList = {
  Launches: undefined;
  Notifications: undefined;
  Settings: undefined;
};
