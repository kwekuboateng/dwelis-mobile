export type Listing = {
  id: string;
  title: string;
  city?: string | null;
  address?: string | null;
  location?: string | null;
  pricePerNight: string | number;
  discountPercent?: number | null;
  imageUrl?: string | null;
  propertyType?: string | null;
  rating?: number | null;
  guestsCount?: number | null;
  bedroomCount?: number | null;
  bathroomCount?: number | null;
  description?: string | null;
  bookingMode?: 'instant' | 'request' | null;
};

export type Booking = {
  id: string;
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  listing?: Listing | null;
};
