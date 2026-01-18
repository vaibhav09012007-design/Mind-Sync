/**
 * Virtual List Hook for efficient rendering of long lists
 * Uses windowing to only render visible items
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

interface VirtualItem<T> {
  item: T;
  index: number;
  style: React.CSSProperties;
}

interface UseVirtualListResult<T> {
  virtualItems: VirtualItem<T>[];
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
}

export function useVirtualList<T>({
  items,
  itemHeight,
  overscan = 3,
  getItemKey,
}: UseVirtualListOptions<T>): UseVirtualListResult<T> {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + 2 * overscan);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  // Create virtual items
  const virtualItems = useMemo(() => {
    const result: VirtualItem<T>[] = [];
    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      result.push({
        item: items[i],
        index: i,
        style: {
          position: "absolute",
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      });
    }
    return result;
  }, [items, startIndex, endIndex, itemHeight]);

  const totalHeight = items.length * itemHeight;

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: index * itemHeight,
          behavior,
        });
      }
    },
    [itemHeight]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
  };
}

/**
 * Dynamic height virtual list hook
 * For items with variable heights
 */
interface UseDynamicVirtualListOptions<T> {
  items: T[];
  estimatedItemHeight: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

interface DynamicVirtualItem<T> {
  item: T;
  index: number;
  measureRef: (el: HTMLElement | null) => void;
  style: React.CSSProperties;
}

export function useDynamicVirtualList<T>({
  items,
  estimatedItemHeight,
  overscan = 3,
}: UseDynamicVirtualListOptions<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const measuredHeights = useRef<Map<number, number>>(new Map());

  // Get item offset and height
  const getItemMetrics = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += measuredHeights.current.get(i) ?? estimatedItemHeight;
      }
      const height = measuredHeights.current.get(index) ?? estimatedItemHeight;
      return { offset, height };
    },
    [estimatedItemHeight]
  );

  // Calculate total height
  const totalHeight = useMemo(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += measuredHeights.current.get(i) ?? estimatedItemHeight;
    }
    return height;
  }, [items.length, estimatedItemHeight]);

  // Find visible range
  const { startIndex, endIndex } = useMemo(() => {
    let start = 0;
    let offset = 0;

    // Find start index
    while (start < items.length - 1) {
      const height = measuredHeights.current.get(start) ?? estimatedItemHeight;
      if (offset + height > scrollTop) break;
      offset += height;
      start++;
    }
    start = Math.max(0, start - overscan);

    // Find end index
    let end = start;
    offset = getItemMetrics(start).offset;
    const viewEnd = scrollTop + containerHeight;
    while (end < items.length - 1 && offset < viewEnd) {
      offset += measuredHeights.current.get(end) ?? estimatedItemHeight;
      end++;
    }
    end = Math.min(items.length - 1, end + overscan);

    return { startIndex: start, endIndex: end };
  }, [scrollTop, containerHeight, items.length, estimatedItemHeight, overscan, getItemMetrics]);

  // Create measure callback
  const createMeasureRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      if (el) {
        const height = el.getBoundingClientRect().height;
        if (measuredHeights.current.get(index) !== height) {
          measuredHeights.current.set(index, height);
        }
      }
    },
    []
  );

  // Create virtual items
  const virtualItems: DynamicVirtualItem<T>[] = useMemo(() => {
    const result: DynamicVirtualItem<T>[] = [];
    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      const { offset, height } = getItemMetrics(i);
      result.push({
        item: items[i],
        index: i,
        measureRef: createMeasureRef(i),
        style: {
          position: "absolute",
          top: offset,
          left: 0,
          right: 0,
          minHeight: height,
        },
      });
    }
    return result;
  }, [items, startIndex, endIndex, getItemMetrics, createMeasureRef]);

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => setScrollTop(container.scrollTop);
    const handleResize = () => setContainerHeight(container.clientHeight);

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return {
    virtualItems,
    totalHeight,
    containerRef,
  };
}
