'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface GradientButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ children, variant = 'primary', size = 'default', className, ...props }, ref) => {
    const sizeClasses = {
      default: 'px-6 py-2.5 text-sm',
      sm: 'px-4 py-2 text-xs',
      lg: 'px-8 py-3 text-base',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative rounded-full font-medium overflow-hidden',
          'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600',
          'text-white shadow-lg shadow-purple-500/25',
          'hover:shadow-xl hover:shadow-purple-500/40',
          'transition-shadow duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {/* Animated shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      </motion.button>
    );
  }
);

GradientButton.displayName = 'GradientButton';
