/** Synced from dwelis-frontend/app/utils/listingPricing.ts */
export function getEffectiveNightlyPrice(
  listPrice: number | string,
  discountPercent?: number | null,
): number {
  const base = Math.max(0, Number(listPrice) || 0);
  const pct = discountPercent;
  if (pct == null || pct <= 0) return base;
  if (pct >= 100) return 0;
  return Math.round(base * (1 - pct / 100) * 100) / 100;
}

export function hasListingDiscount(discountPercent?: number | null): boolean {
  return discountPercent != null && discountPercent > 0;
}

export function formatPriceAmount(value: number | string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}
