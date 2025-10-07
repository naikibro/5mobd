import { Address, Review } from "./address";

export type RootStackParamList = {
  AddressList: undefined;
  AddressDetails: { address: Address };
  CreateAddress: undefined;
  EditAddress: { address: Address };
  MapView: undefined;
  PublicAddresses: undefined;
  MyAddresses: undefined;
  Reviews: { address: Address };
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Addresses: undefined;
  Map: undefined;
  MyAddresses: undefined;
  Profile: undefined;
};
