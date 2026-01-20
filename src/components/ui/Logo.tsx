'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  href?: string;
}

export function Logo({ 
  className, 
  size = 'md', 
  showText = true, 
  animated = false,
  href = '/' 
}: LogoProps) {
  const sizeClasses = {
    sm: { icon: 'h-6 w-6', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-xl' },
    lg: { icon: 'h-12 w-12', text: 'text-3xl' },
    xl: { icon: 'h-20 w-20', text: 'text-5xl' },
  };

  const LogoIcon = () => (
    <div className={cn(
      "relative rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center text-white shadow-glow",
      sizeClasses[size].icon,
      animated && "animate-pulse-glow"
    )}>
      <span className={cn(
        "font-bold leading-none", 
        size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-3xl'
      )}>M</span>
      
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-xl pointer-events-none" />
    </div>
  );

  const LogoContent = () => (
    <div className={cn("flex items-center gap-3", className)}>
      {animated ? (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogoIcon />
        </motion.div>
      ) : (
        <LogoIcon />
      )}

      {showText && (
        <span className={cn(
          "font-bold tracking-tight",
          sizeClasses[size].text,
          animated ? "gradient-text-animated" : "text-foreground"
        )}>
          Mind-Sync
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block focus-ring rounded-lg">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}
