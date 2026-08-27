import type { NavigatorScreenParams } from '@react-navigation/native';

export type GuestTabParamList = {
  Explore: undefined;
  Saved: undefined;
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

export type SearchParams = {
  where?: string;
  city?: string;
  /** Human-readable summaries shown in the search chrome. */
  dates?: string;
  guests?: string;
  /** ISO `YYYY-MM-DD`, forwarded to the listings API as availability filters. */
  checkIn?: string;
  checkOut?: string;
  guestsCount?: number;
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
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
