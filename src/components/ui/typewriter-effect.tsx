"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface TypewriterEffectProps {
  text: string;
  className?: string;
  cursorColor?: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export function TypewriterEffect({
  text,
  className,
  cursorColor = "hsl(var(--primary))",
  speed = 0.03,
  delay = 0,
  onComplete,
}: TypewriterEffectProps) {
  const count = useMotionValue(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    count.set(0);

    const controls = animate(count, text.length, {
      type: "tween",
      duration: text.length * speed,
      delay: delay,
      ease: "linear",
      onUpdate: (latest) => {
        setDisplayedText(text.slice(0, Math.round(latest)));
      },
      onComplete: () => {
        setIsComplete(true);
        if (onComplete) onComplete();
      },
    });

    return controls.stop;
  }, [text, count, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          style={{
            display: "inline-block",
            width: "2px",
            height: "1em",
            backgroundColor: cursorColor,
            marginLeft: "2px",
            verticalAlign: "middle"
          }}
        />
      )}
    </span>
  );
}
