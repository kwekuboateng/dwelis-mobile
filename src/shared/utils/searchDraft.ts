export type SearchDraft = {
  /** What the guest typed or picked, shown in the search card. */
  where: string;
  /** City resolved from Places, used as the API filter. */
  city?: string;
  /** ISO `YYYY-MM-DD`. */
  checkIn?: string;
  checkOut?: string;
  adults: number;
  children: number;
  infants: number;
};

export const emptySearchDraft: SearchDraft = {
  where: '',
  city: undefined,
  checkIn: undefined,
  checkOut: undefined,
  adults: 0,
  children: 0,
  infants: 0,
};

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Local-time ISO date (`toISOString` would shift the day for negative offsets). */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function addDays(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
}

export function formatDateRange(checkIn?: string, checkOut?: string): string | null {
  if (!checkIn) return null;
  const start = fromIsoDate(checkIn);
  const startLabel = `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]}`;
  if (!checkOut) return startLabel;

  const end = fromIsoDate(checkOut);
  const endLabel = `${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
  return start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
    ? `${start.getDate()} – ${endLabel}`
    : `${startLabel} – ${endLabel}`;
}

export function totalGuests(draft: Pick<SearchDraft, 'adults' | 'children'>): number {
  return draft.adults + draft.children;
}

export function formatGuests(
  draft: Pick<SearchDraft, 'adults' | 'children' | 'infants'>,
): string | null {
  const guests = totalGuests(draft);
  if (guests === 0 && draft.infants === 0) return null;

  const parts: string[] = [];
  if (guests > 0) parts.push(`${guests} guest${guests === 1 ? '' : 's'}`);
  if (draft.infants > 0) parts.push(`${draft.infants} infant${draft.infants === 1 ? '' : 's'}`);
  return parts.join(', ');
}

export function isSearchDraftEmpty(draft: SearchDraft): boolean {
  return (
    !draft.where.trim() &&
    !draft.checkIn &&
    !draft.checkOut &&
    draft.adults === 0 &&
    draft.children === 0 &&
    draft.infants === 0
  );
}
