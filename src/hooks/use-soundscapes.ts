"use client";

import { useRef, useEffect, useCallback, useState } from "react";

export type NoiseType = "white" | "pink" | "brown";

export function useSoundscapes() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [activeType, setActiveType] = useState<NoiseType>("pink");

  // Initialize Audio Context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new Ctx();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = volume;
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  }, [volume]);

  const createNoiseBuffer = (type: NoiseType) => {
    if (!audioContextRef.current) return null;

    const bufferSize = 2 * audioContextRef.current.sampleRate; // 2 seconds buffer
    const buffer = audioContextRef.current.createBuffer(
      1,
      bufferSize,
      audioContextRef.current.sampleRate
    );
    const data = buffer.getChannelData(0);

    if (type === "white") {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === "pink") {
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // compensate to keep within -1.0 to 1.0
        b6 = white * 0.115926;
      }
    } else if (type === "brown") {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // compensate to keep within -1.0 to 1.0
      }
    }
    return buffer;
  };

  const play = useCallback(
    (type?: NoiseType) => {
      initAudio();
      if (!audioContextRef.current || !gainNodeRef.current) return;

      const targetType = type || activeType;

      // Stop existing noise if any
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
      }

      const buffer = createNoiseBuffer(targetType);
      if (!buffer) return;

      const noiseSource = audioContextRef.current.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;
      noiseSource.connect(gainNodeRef.current);
      noiseSource.start();

      noiseNodeRef.current = noiseSource;
      isPlayingRef.current = true;
      setIsPlaying(true);
      if (type) setActiveType(type);
    },
    [activeType, initAudio]
  );

  const stop = useCallback(() => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current.disconnect();
      noiseNodeRef.current = null;
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const setGlobalVolume = useCallback((val: number) => {
    setVolume(val);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(val, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      stop();
    } else {
      play();
    }
  }, [play, stop]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isPlaying,
    activeType,
    volume,
    play,
    stop,
    toggle,
    setVolume: setGlobalVolume,
  };
}
