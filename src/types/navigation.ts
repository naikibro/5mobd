export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  CreateAddress: undefined;
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  MyAddresses: undefined;
  Profile: undefined;
};
