import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The hook evaluates SpeechRecognition constructor at module-load time.
// In JSDOM, neither SpeechRecognition nor webkitSpeechRecognition exists,
// so isBrowserSpeechSupported = false. We test the unsupported path 
// and the returned API shape.

describe("useBrowserSpeechRecognition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns correct shape", async () => {
    const { useBrowserSpeechRecognition } = await import("../useBrowserSpeechRecognition");
    const { result } = renderHook(() => useBrowserSpeechRecognition(false));

    expect(result.current).toHaveProperty("segments");
    expect(result.current).toHaveProperty("interimResult");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("startSystemAudio");
    expect(result.current).toHaveProperty("isSupported");
  });

  it("returns empty segments by default", async () => {
    const { useBrowserSpeechRecognition } = await import("../useBrowserSpeechRecognition");
    const { result } = renderHook(() => useBrowserSpeechRecognition(false));

    expect(result.current.segments).toEqual([]);
    expect(result.current.interimResult).toBe("");
  });

  it("reports unsupported in JSDOM environment", async () => {
    const { useBrowserSpeechRecognition } = await import("../useBrowserSpeechRecognition");
    const { result } = renderHook(() => useBrowserSpeechRecognition(false));

    // JSDOM doesn't have SpeechRecognition
    expect(result.current.isSupported).toBe(false);
    expect(result.current.error).toContain("not supported");
  });

  it("does not start recognition in unsupported env", async () => {
    const { useBrowserSpeechRecognition } = await import("../useBrowserSpeechRecognition");
    const { result } = renderHook(() => useBrowserSpeechRecognition(true));

    // Even when isRecording=true, no crash occurs — just unsupported error
    expect(result.current.isSupported).toBe(false);
    expect(result.current.segments).toEqual([]);
  });

  it("startSystemAudio is callable and does not throw", async () => {
    const { useBrowserSpeechRecognition } = await import("../useBrowserSpeechRecognition");
    const { result } = renderHook(() => useBrowserSpeechRecognition(false));

    expect(typeof result.current.startSystemAudio).toBe("function");
    // Should not throw
    await result.current.startSystemAudio();
  });

  it("maintains stable references across re-renders", async () => {
    const { useBrowserSpeechRecognition } = await import("../useBrowserSpeechRecognition");
    const { result, rerender } = renderHook(
      ({ recording }) => useBrowserSpeechRecognition(recording),
      { initialProps: { recording: false } }
    );

    const firstIsSupported = result.current.isSupported;
    rerender({ recording: false });
    expect(result.current.isSupported).toBe(firstIsSupported);
  });
});
