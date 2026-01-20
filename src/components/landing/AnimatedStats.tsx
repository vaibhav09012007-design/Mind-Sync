'use client';

import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface StatProps {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

function AnimatedStat({ value, label, suffix = '', prefix = '' }: StatProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: 'easeOut' });
    }
  }, [isInView, value, count]);

  return (
    <div ref={ref} className="text-center">
      <div className="flex items-baseline justify-center gap-1">
        {prefix && (
          <span className="text-3xl md:text-5xl font-bold text-muted-foreground">{prefix}</span>
        )}
        <motion.span className="text-4xl md:text-6xl font-bold gradient-text">
          {rounded}
        </motion.span>
        {suffix && (
          <span className="text-2xl md:text-4xl font-bold text-muted-foreground">{suffix}</span>
        )}
      </div>
      <p className="mt-2 text-muted-foreground text-sm md:text-base">{label}</p>
    </div>
  );
}

export function AnimatedStats() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        >
          <AnimatedStat value={10} suffix="K+" label="Active Users" />
          <AnimatedStat value={1} suffix="M+" label="Tasks Completed" />
          <AnimatedStat value={99} suffix="%" label="Uptime" />
          <AnimatedStat value={4.9} suffix="/5" label="User Rating" />
        </motion.div>
      </div>
    </section>
  );
}
