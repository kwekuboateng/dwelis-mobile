import type { NavigatorScreenParams } from '@react-navigation/native';

export type GuestTabParamList = {
  Explore: undefined;
  Trips: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type HostTabParamList = {
  Today: undefined;
  Listings: undefined;
  Calendar: undefined;
  More: undefined;
};

export type RootStackParamList = {
  GuestTabs: NavigatorScreenParams<GuestTabParamList> | undefined;
  HostTabs: NavigatorScreenParams<HostTabParamList> | undefined;
  Login: undefined;
  Signup: undefined;
  VerifyEmail: { email: string };
  VerifyPhone: { phoneNumber: string; codeAlreadySent?: boolean };
  ListingDetail: { id: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
