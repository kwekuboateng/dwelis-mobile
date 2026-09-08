export type HostListing = {
  id: string;
  title: string;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  status?: string | null;
  propertyType?: string | null;
  guestsCount?: number | null;
  bedroomCount?: number | null;
  bathroomCount?: number | null;
  bedsCount?: number | null;
  pricePerNight?: string | number | null;
  description?: string | null;
  imageUrl?: string | null;
  photos?: { url?: string; orderIndex?: number; isCover?: boolean }[] | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
};

export type TodayBookingItem = {
  id: string;
  type?: 'check_in' | 'check_out' | string;
  checkInDate?: string;
  checkOutDate?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  guestCount?: number | null;
  status?: string;
  guest?: { fullName?: string | null; avatarUrl?: string | null } | null;
  listing?: {
    id?: string;
    title?: string;
    city?: string | null;
    photos?: { url?: string }[] | null;
    imageUrl?: string | null;
  } | null;
};

export type HostReservation = {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount?: number | null;
  totalPrice?: string | number | null;
  status: string;
  guestCount?: number | null;
  bookingRef?: string | null;
  referenceCode?: string | null;
  listing?: {
    id: string;
    title: string;
    city?: string | null;
    area?: string | null;
    photos?: { url?: string }[] | null;
    imageUrl?: string | null;
  } | null;
  guest?: {
    id?: string;
    fullName?: string | null;
    avatarUrl?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
  } | null;
};

export function coverUrl(listing?: {
  imageUrl?: string | null;
  photos?: { url?: string; isCover?: boolean; orderIndex?: number }[] | null;
} | null): string | undefined {
  if (!listing) return undefined;
  if (listing.imageUrl) return listing.imageUrl;
  const photos = listing.photos ?? [];
  if (!photos.length) return undefined;
  const cover = photos.find((p) => p.isCover) ?? [...photos].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))[0];
  return cover?.url;
}

export function mockHealth(seed: string): { label: string; percent: number; tone: 'good' | 'warn' | 'bad' } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i) * (i + 1)) % 97;
  const percent = 55 + (hash % 41);
  if (percent >= 85) return { label: 'Excellent', percent, tone: 'good' };
  if (percent >= 70) return { label: 'Good', percent, tone: 'good' };
  if (percent >= 60) return { label: 'At Risk', percent, tone: 'warn' };
  return { label: 'Needs Attention', percent, tone: 'bad' };
}
