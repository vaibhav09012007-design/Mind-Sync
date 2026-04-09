import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AudioContext and related APIs
const mockGainNode = {
  connect: vi.fn(),
  gain: {
    value: 1,
    setTargetAtTime: vi.fn(),
  },
};

const mockBufferSource = {
  buffer: null as AudioBuffer | null,
  loop: false,
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  disconnect: vi.fn(),
};

const mockAudioBuffer = {
  getChannelData: vi.fn(() => new Float32Array(88200)),
};

const mockAudioContext = {
  sampleRate: 44100,
  state: "running" as AudioContextState,
  currentTime: 0,
  createGain: vi.fn(() => mockGainNode),
  createBuffer: vi.fn(() => mockAudioBuffer),
  createBufferSource: vi.fn(() => ({ ...mockBufferSource })),
  resume: vi.fn(),
  close: vi.fn(),
  destination: {},
};

class MockAudioContext {
  sampleRate = mockAudioContext.sampleRate;
  state = mockAudioContext.state;
  currentTime = mockAudioContext.currentTime;
  destination = mockAudioContext.destination;
  createGain = mockAudioContext.createGain;
  createBuffer = mockAudioContext.createBuffer;
  createBufferSource = mockAudioContext.createBufferSource;
  resume = mockAudioContext.resume;
  close = mockAudioContext.close;
}

// @ts-expect-error - Mock AudioContext in JSDOM
window.AudioContext = MockAudioContext;

// Import after mocks
import { useSoundscapes } from "../use-soundscapes";

describe("useSoundscapes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAudioContext.state = "running";
    // Reset createBufferSource to return fresh mock each call
    mockAudioContext.createBufferSource.mockReturnValue({ ...mockBufferSource });
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useSoundscapes());

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeType).toBe("pink");
    expect(result.current.volume).toBe(0.5);
  });

  it("exposes play, stop, toggle, and setVolume functions", () => {
    const { result } = renderHook(() => useSoundscapes());

    expect(typeof result.current.play).toBe("function");
    expect(typeof result.current.stop).toBe("function");
    expect(typeof result.current.toggle).toBe("function");
    expect(typeof result.current.setVolume).toBe("function");
  });

  it("starts playing when play() is called", () => {
    const { result } = renderHook(() => useSoundscapes());

    act(() => {
      result.current.play();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockAudioContext.createBuffer).toHaveBeenCalled();
  });

  it("stops playing when stop() is called", () => {
    const { result } = renderHook(() => useSoundscapes());

    act(() => {
      result.current.play();
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.stop();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it("toggles play state", () => {
    const { result } = renderHook(() => useSoundscapes());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it("updates volume", () => {
    const { result } = renderHook(() => useSoundscapes());

    act(() => {
      result.current.setVolume(0.8);
    });

    expect(result.current.volume).toBe(0.8);
  });

  it("can play with a specific noise type", () => {
    const { result } = renderHook(() => useSoundscapes());

    act(() => {
      result.current.play("white");
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.activeType).toBe("white");
  });

  it("can play brown noise", () => {
    const { result } = renderHook(() => useSoundscapes());

    act(() => {
      result.current.play("brown");
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.activeType).toBe("brown");
  });

  it("resumes suspended audio context", () => {
    mockAudioContext.state = "suspended";

    const { result } = renderHook(() => useSoundscapes());

    act(() => {
      result.current.play();
    });

    expect(mockAudioContext.resume).toHaveBeenCalled();
  });
});
