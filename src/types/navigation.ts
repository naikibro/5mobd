export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList; params?: any } | undefined;
  CreateAddress: undefined;
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Map: { addressId?: string } | undefined;
  MyAddresses: undefined;
  Profile: undefined;
};
