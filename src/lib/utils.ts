import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Brand color palette definition for programmatic usage - Black Gold Theme
 */
export const brandColors = {
  gold: {
    50: 'hsl(48, 100%, 96%)',
    100: 'hsl(48, 100%, 88%)',
    200: 'hsl(48, 100%, 75%)',
    300: 'hsl(48, 100%, 60%)',
    400: 'hsl(45, 93%, 53%)',
    500: 'hsl(45, 93%, 47%)', // Main Gold
    600: 'hsl(42, 93%, 40%)',
    700: 'hsl(38, 92%, 32%)',
    800: 'hsl(35, 85%, 26%)',
    900: 'hsl(32, 80%, 20%)',
    950: 'hsl(30, 85%, 12%)',
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
