'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface FloatingElement {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
}

export function FloatingElements() {
  const elements = useMemo<FloatingElement[]>(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      size: Math.random() * 80 + 40,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute rounded-full bg-gradient-to-br from-purple-500/5 to-blue-500/5 backdrop-blur-[1px]"
          style={{
            width: el.size,
            height: el.size,
            left: `${el.x}%`,
            top: `${el.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: el.delay,
          }}
        />
      ))}
    </div>
  );
}
