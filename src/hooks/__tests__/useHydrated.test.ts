import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useHydrated } from "../useHydrated";

describe("useHydrated", () => {
  it("returns true on client (JSDOM environment)", () => {
    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(true);
  });

  it("returns a boolean value", () => {
    const { result } = renderHook(() => useHydrated());
    expect(typeof result.current).toBe("boolean");
  });

  it("returns consistent value across re-renders", () => {
    const { result, rerender } = renderHook(() => useHydrated());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
