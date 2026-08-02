import type { Listing } from '@/shared/types/listing';
import {
  formatPriceAmount,
  getEffectiveNightlyPrice,
  hasListingDiscount,
} from '@/shared/utils/listingPricing';

export function listingLocation(listing: Listing): string {
  return [listing.city, listing.address].filter(Boolean).join(', ') || listing.location || '';
}

export function listingBadge(listing: Listing): string | null {
  if (listing.guestFavorite) return 'Guest Favourite';
  if (listing.featured) return 'Featured';
  if (listing.bookingMode === 'instant') return 'Instant Book';
  return null;
}

export function listingNightlyPrice(listing: Listing): string {
  const discounted = hasListingDiscount(listing.discountPercent);
  return formatPriceAmount(
    discounted
      ? getEffectiveNightlyPrice(listing.pricePerNight, listing.discountPercent)
      : listing.pricePerNight,
  );
}

export function formatGhs(amount: string | number): string {
  return `GHS ${formatPriceAmount(amount)}`;
}
