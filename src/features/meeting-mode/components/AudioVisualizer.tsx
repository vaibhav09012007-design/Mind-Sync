"use client";

import { useEffect, useRef, useState } from "react";

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {       
    async function startAudio() {
      try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setStream(audioStream);

          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioContext.createAnalyser();
          const source = audioContext.createMediaStreamSource(audioStream);

          source.connect(analyser);
          analyser.fftSize = 256;

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
            stream.getTracks().forEach(track => track.stop());
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;

          ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
  };

  return (
    <div className="h-32 w-full bg-black/90 rounded-lg overflow-hidden border border-border/50 shadow-inner flex items-center justify-center">
        <canvas ref={canvasRef} width={600} height={128} className="w-full h-full" />
    </div>
  );
}
