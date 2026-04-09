import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVirtualList } from "../useVirtualList";

describe("useVirtualList", () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns virtualItems, totalHeight, containerRef, and scrollToIndex", () => {
    const { result } = renderHook(() =>
      useVirtualList({ items, itemHeight: 40 })
    );

    expect(result.current).toHaveProperty("virtualItems");
    expect(result.current).toHaveProperty("totalHeight");
    expect(result.current).toHaveProperty("containerRef");
    expect(result.current).toHaveProperty("scrollToIndex");
  });

  it("calculates totalHeight based on items length and itemHeight", () => {
    const { result } = renderHook(() =>
      useVirtualList({ items, itemHeight: 40 })
    );

    expect(result.current.totalHeight).toBe(100 * 40);
  });

  it("calculates correct totalHeight for different itemHeight", () => {
    const { result } = renderHook(() =>
      useVirtualList({ items, itemHeight: 60 })
    );

    expect(result.current.totalHeight).toBe(100 * 60);
  });

  it("handles empty items array", () => {
    const { result } = renderHook(() =>
      useVirtualList({ items: [], itemHeight: 40 })
    );

    expect(result.current.virtualItems).toHaveLength(0);
    expect(result.current.totalHeight).toBe(0);
  });

  it("virtual items have correct style positions", () => {
    const { result } = renderHook(() =>
      useVirtualList({ items: items.slice(0, 5), itemHeight: 40, overscan: 0 })
    );

    // Without a container, scrollTop=0, containerHeight=0
    // With overscan=0 and no container, startIndex=0, endIndex depends on containerHeight
    for (const vItem of result.current.virtualItems) {
      expect(vItem.style.position).toBe("absolute");
      expect(vItem.style.top).toBe(vItem.index * 40);
      expect(vItem.style.height).toBe(40);
    }
  });

  it("scrollToIndex is a callable function", () => {
    const { result } = renderHook(() =>
      useVirtualList({ items, itemHeight: 40 })
    );

    expect(typeof result.current.scrollToIndex).toBe("function");
  });

  it("re-renders when items change", () => {
    const { result, rerender } = renderHook(
      ({ items: hookItems }) => useVirtualList({ items: hookItems, itemHeight: 40 }),
      { initialProps: { items } }
    );

    const initialHeight = result.current.totalHeight;
    const smallerItems = items.slice(0, 50);

    rerender({ items: smallerItems });

    expect(result.current.totalHeight).toBe(50 * 40);
    expect(result.current.totalHeight).toBeLessThan(initialHeight);
  });
});
