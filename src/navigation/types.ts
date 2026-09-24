import type { NavigatorScreenParams } from '@react-navigation/native';

export type GuestTabParamList = {
  Explore: undefined;
  Saved: undefined;
  Trips: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type HostTabParamList = {
  Overview: undefined;
  Calendar: undefined;
  Bookings: undefined;
  Messages: undefined;
  More: undefined;
};

export type SearchParams = {
  where?: string;
  city?: string;
  dates?: string;
  guests?: string;
  featured?: boolean;
  category?: string;
  title?: string;
};

export type RootStackParamList = {
  GuestTabs: NavigatorScreenParams<GuestTabParamList> | undefined;
  HostTabs: NavigatorScreenParams<HostTabParamList> | undefined;
  Login: undefined;
  Signup: undefined;
  VerifyEmail: { email: string };
  VerifyPhone: { phoneNumber: string; codeAlreadySent?: boolean };
  ListingDetail: { id: string };
  HandpickedCollection: undefined;
  BrowseCityStays: { city?: string };
  SearchResults: SearchParams | undefined;
  ChatThread: {
    conversationId: string;
    kind: 'reservation' | 'inquiry';
    title?: string;
    subtitle?: string;
    hostName?: string;
    role?: 'guest' | 'host';
  };
  HostProperties: undefined;
  HostEditProperty: { id?: string } | undefined;
  HostGuests: undefined;
  HostGuestProfile: { guestKey: string; guestName?: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
