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
  reviewCount?: number | null;
  featured?: boolean | null;
  guestFavorite?: boolean | null;
  guestsCount?: number | null;
  bedroomCount?: number | null;
  bathroomCount?: number | null;
  bedsCount?: number | null;
  description?: string | null;
  bookingMode?: 'instant' | 'request' | null;
  photos?: { url: string; orderIndex?: number }[] | null;
  listingAmenities?: { amenity?: { name: string } | null }[] | null;
  houseRules?: string | null;
  host?: {
    fullName?: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean | null;
  } | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
};

export type HomepageCategory = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  image: string;
  listingCount: number;
};

export type Booking = {
  id: string;
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  guestsCount?: number | null;
  bookingRef?: string | null;
  referenceCode?: string | null;
  listing?: Listing | null;
};

export type ListingReview = {
  id: string;
  rating?: number | null;
  comment?: string | null;
  content?: string | null;
  createdAt?: string | null;
  guestName?: string | null;
  authorName?: string | null;
  guest?: { fullName?: string | null; avatarUrl?: string | null } | null;
  avatarUrl?: string | null;
  location?: string | null;
};
