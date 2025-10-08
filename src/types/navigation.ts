import { Address, Review } from "./address";

export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  CreateAddress: undefined;
  Login: undefined;
  Signup: undefined;
};

export type AddressStackParamList = {
  AddressList: undefined;
  AddressDetails: { address: Address };
  CreateAddress: undefined;
  EditAddress: { address: Address };
  Reviews: { address: Address };
};

export type MainTabParamList = {
  Addresses: undefined;
  Map: undefined;
  MyAddresses: undefined;
  Profile: undefined;
};
