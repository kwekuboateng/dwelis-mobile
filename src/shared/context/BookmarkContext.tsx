import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api, useAuth } from './AuthContext';

type BookmarkSource =
  | 'property_card'
  | 'listing_details'
  | 'search_results'
  | 'homepage'
  | 'saved_stays';

type BookmarkContextValue = {
  bookmarkedIds: Set<string>;
  ready: boolean;
  isBookmarked: (listingId: string) => boolean;
  toggleBookmark: (
    listingId: string,
    options?: {
      title?: string;
      source?: BookmarkSource;
      initialBookmarked?: boolean;
    },
  ) => Promise<boolean>;
  refreshIds: () => Promise<void>;
};

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const pendingRef = useRef<Set<string>>(new Set());

  const refreshIds = useCallback(async () => {
    if (!token) {
      setIds(new Set());
      setReady(true);
      return;
    }
    try {
      const res = await api.get<{ ids: string[] }>('/me/bookmarks/ids');
      setIds(new Set(Array.isArray(res.data?.ids) ? res.data.ids : []));
    } catch {
      /* keep previous */
    } finally {
      setReady(true);
    }
  }, [token]);

  useEffect(() => {
    setReady(false);
    void refreshIds();
  }, [refreshIds, user?.id]);

  const isBookmarked = useCallback((listingId: string) => ids.has(listingId), [ids]);

  const setBookmarkedLocal = useCallback((listingId: string, value: boolean) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(listingId);
      else next.delete(listingId);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback(
    async (
      listingId: string,
      options?: {
        title?: string;
        source?: BookmarkSource;
        initialBookmarked?: boolean;
      },
    ): Promise<boolean> => {
      if (!listingId || !token) return false;
      if (pendingRef.current.has(listingId)) return ids.has(listingId);

      const currently =
        options?.initialBookmarked != null ? options.initialBookmarked : ids.has(listingId);
      const next = !currently;

      setBookmarkedLocal(listingId, next);
      pendingRef.current.add(listingId);

      try {
        if (next) {
          await api.post(`/listings/${listingId}/bookmark`);
        } else {
          await api.delete(`/listings/${listingId}/bookmark`);
        }
        return next;
      } catch {
        setBookmarkedLocal(listingId, currently);
        return currently;
      } finally {
        pendingRef.current.delete(listingId);
      }
    },
    [ids, setBookmarkedLocal, token],
  );

  const value = useMemo(
    () => ({
      bookmarkedIds: ids,
      ready,
      isBookmarked,
      toggleBookmark,
      refreshIds,
    }),
    [ids, ready, isBookmarked, toggleBookmark, refreshIds],
  );

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
