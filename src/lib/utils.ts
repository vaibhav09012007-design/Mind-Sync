import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Brand color palette definition for programmatic usage
 */
export const brandColors = {
  purple: {
    50: 'hsl(265, 100%, 97%)',
    100: 'hsl(265, 100%, 94%)',
    200: 'hsl(265, 100%, 89%)',
    300: 'hsl(265, 100%, 82%)',
    400: 'hsl(265, 98%, 72%)',
    500: 'hsl(265, 83%, 58%)', // Main
    600: 'hsl(265, 74%, 48%)',
    700: 'hsl(265, 74%, 39%)',
    800: 'hsl(265, 71%, 32%)',
    900: 'hsl(265, 65%, 26%)',
    950: 'hsl(265, 74%, 16%)',
  },
  semantic: {
    success: { bg: 'hsl(142, 70%, 95%)', text: 'hsl(142, 76%, 36%)' },
    warning: { bg: 'hsl(38, 92%, 95%)', text: 'hsl(38, 92%, 40%)' },
    error: { bg: 'hsl(0, 84%, 95%)', text: 'hsl(0, 84%, 60%)' },
    info: { bg: 'hsl(199, 89%, 95%)', text: 'hsl(199, 89%, 48%)' },
  }
};

/**
 * Returns a variant-based status badge class
 */
export function getStatusBadgeClass(status: 'success' | 'warning' | 'error' | 'info' | 'default') {
  const styles = {
    success: 'bg-[hsl(var(--color-success-bg))] text-[hsl(var(--color-success-text))] border-green-200',
    warning: 'bg-[hsl(var(--color-warning-bg))] text-[hsl(var(--color-warning-text))] border-orange-200',
    error: 'bg-[hsl(var(--color-error-bg))] text-[hsl(var(--color-error-text))] border-red-200',
    info: 'bg-[hsl(var(--color-info-bg))] text-[hsl(var(--color-info-text))] border-blue-200',
    default: 'bg-muted text-muted-foreground border-border',
  };
  return styles[status] || styles.default;
}
