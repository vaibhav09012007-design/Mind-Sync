"use client";

import { useEffect, useRef, useState } from "react";

export function AudioVisualizer({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();
  const sourceRef = useRef<MediaStreamAudioSourceNode>();

  useEffect(() => {
    if (isActive) {
      startListening();
    } else {
      stopListening();
    }

    return () => stopListening();
  }, [isActive]);

  const startListening = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);

      source.connect(analyser);
      analyser.fftSize = 64; // Low for simple bars

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      draw();
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopListening = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = undefined;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const draw = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw 8 bars roughly
    const barWidth = 6;
    const gap = 4;
    const bars = 8;
    const step = Math.floor(bufferLength / bars);

    for (let i = 0; i < bars; i++) {
        const value = dataArray[i * step];
        const percent = value / 255;
        const height = Math.max(percent * canvas.height, 4); // Min height 4px
        
        ctx.fillStyle = `rgb(${99 + (value/2)}, 102, 241)`; // Indigoish dynamic
        
        // Center vertically
        const y = (canvas.height - height) / 2;
        const x = i * (barWidth + gap);

        // Draw rounded rect equivalent
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 4);
        ctx.fill();
    }

    animationRef.current = requestAnimationFrame(draw);
  };

  // If not active or denied, show placeholder or nothing
  if (!isActive) {
      return (
         <div className="flex items-center justify-center gap-1 h-8 w-[80px] opacity-30">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full" />
            ))}
         </div>
      );
  }

  return (
    <canvas 
        ref={canvasRef} 
        width={80} 
        height={40} 
        className="block"
    />
  );
}
