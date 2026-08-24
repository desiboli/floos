import { type RefObject, useEffect } from "react";

interface UseInfiniteScrollProps<TScrollElement extends HTMLElement = HTMLElement> {
  scrollRef: RefObject<TScrollElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  enabled?: boolean;
  /** Distance in pixels from the bottom of the scroll container. */
  threshold?: number;
}

/**
 * Fetches the next page while the scroll container is within `threshold` pixels
 * of its bottom.
 *
 * The trigger is based on scroll distance rather than rendered row count so that
 * a client-side filter, which can shrink the rendered rows to a handful, cannot
 * keep the condition permanently true and drain every remaining page.
 */
export function useInfiniteScroll<TScrollElement extends HTMLElement = HTMLElement>({
  scrollRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true,
  threshold = 400,
}: UseInfiniteScrollProps<TScrollElement>) {
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !enabled || !hasNextPage || isFetchingNextPage) return;

    const maybeFetchNextPage = () => {
      // A container that has not been laid out yet would otherwise report a
      // distance of zero and pull every remaining page.
      if (scrollElement.clientHeight === 0) return;

      const distanceToBottom =
        scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight;
      if (distanceToBottom > threshold) return;
      fetchNextPage();
    };

    // Covers the case where the loaded pages do not fill the container yet.
    maybeFetchNextPage();

    scrollElement.addEventListener("scroll", maybeFetchNextPage, { passive: true });
    const resizeObserver = new ResizeObserver(maybeFetchNextPage);
    resizeObserver.observe(scrollElement);

    return () => {
      scrollElement.removeEventListener("scroll", maybeFetchNextPage);
      resizeObserver.disconnect();
    };
  }, [scrollRef, hasNextPage, isFetchingNextPage, fetchNextPage, enabled, threshold]);
}
