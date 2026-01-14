"use client";

import { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  isActive?: boolean;
}

const SMOOTHING = 0.8;
const FFT_SIZE = 1024; // Better resolution

export function AudioVisualizer({ isActive = true }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isActive) return;

    async function startAudio() {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(audioStream);

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);

        source.connect(analyser);
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = SMOOTHING;

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;

        draw();
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    }

    startAudio();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isActive]);

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyserRef.current.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradient
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    gradient.addColorStop(0, "rgb(20, 20, 20)");
    gradient.addColorStop(0.5, "rgb(100, 100, 255)"); // Blueish
    gradient.addColorStop(1, "rgb(200, 50, 255)"); // Purpleish
    ctx.fillStyle = gradient;

    // Draw bars - Focus on lower half of spectrum (Voice range mainly)
    // FFT 1024 -> 512 bins. At 48kHz, max freq 24kHz.
    // Human voice maxes out interest around 4kHz usually for speech intelligibility/presence.
    // 4kHz is roughly index 85 (4000 / (48000/1024)). Let's show up to index 150.

    const relevantBins = 150;
    const barWidth = (canvas.width / relevantBins) * 0.8;
    let x = 0;

    for (let i = 0; i < relevantBins; i++) {
      // Boost values slightly
      const value = dataArray[i];
      const barHeight = (value / 255) * canvas.height;

      // Round caps
      ctx.beginPath();
      ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      x += barWidth + 2;
    }

    animationRef.current = requestAnimationFrame(draw);
  };

  return (
    <div className="border-border/50 flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border bg-black/90 shadow-inner">
      <canvas ref={canvasRef} width={600} height={128} className="h-full w-full" />
    </div>
  );
}
