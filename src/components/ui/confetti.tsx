"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfettiProps {
  count?: number;
  duration?: number;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
}

const COLORS = [
  "hsl(45 93% 47%)", // Gold
  "hsl(142 70% 50%)", // Green
  "hsl(199 89% 50%)", // Blue
  "hsl(330 81% 60%)", // Pink
  "hsl(262 83% 58%)", // Purple
];

export function Confetti({ count = 50, duration = 3000, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: -10 - Math.random() * 20, // start above screen
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1,
    }));

    setParticles(newParticles);

    // Cleanup after duration
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [count, duration, onComplete]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            top: `${particle.y}%`,
            left: `${particle.x}%`,
            rotate: particle.rotation,
            scale: particle.scale,
            opacity: 1,
          }}
          animate={{
            top: "120%",
            left: `${particle.x + (Math.random() - 0.5) * 20}%`,
            rotate: particle.rotation + 360 + Math.random() * 360,
            opacity: 0,
          }}
          transition={{
            duration: 1.5 + Math.random() * 2, // 1.5s - 3.5s
            ease: [0.25, 0.1, 0.25, 1], // cubic-bezier
            delay: Math.random() * 0.5,
          }}
          className="absolute h-2 w-2 rounded-sm"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
}
