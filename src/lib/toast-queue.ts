/**
 * Toast Queue Manager
 * Prevents toast spam by deduplicating and rate-limiting toasts
 */

import { toast, ExternalToast } from "sonner";

interface QueuedToast {
  message: string;
  type: "success" | "error" | "warning" | "info";
  options?: ExternalToast;
  timestamp: number;
}

interface ToastQueueConfig {
  maxToasts: number;
  dedupeWindowMs: number;
  rateWindowMs: number;
  maxPerWindow: number;
}

const DEFAULT_CONFIG: ToastQueueConfig = {
  maxToasts: 3,
  dedupeWindowMs: 2000,
  rateWindowMs: 5000,
  maxPerWindow: 5,
};

class ToastQueueManager {
  private recentToasts: QueuedToast[] = [];
  private config: ToastQueueConfig;
  private dismissedIds = new Set<string | number>();

  constructor(config: Partial<ToastQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private cleanupOldToasts() {
    const now = Date.now();
    this.recentToasts = this.recentToasts.filter(
      (t) => now - t.timestamp < this.config.rateWindowMs
    );
  }

  private isDuplicate(message: string): boolean {
    const now = Date.now();
    return this.recentToasts.some(
      (t) =>
        t.message === message &&
        now - t.timestamp < this.config.dedupeWindowMs
    );
  }

  private isRateLimited(): boolean {
    this.cleanupOldToasts();
    return this.recentToasts.length >= this.config.maxPerWindow;
  }

  private showToast(
    message: string,
    type: "success" | "error" | "warning" | "info",
    options?: ExternalToast
  ) {
    const queuedToast: QueuedToast = {
      message,
      type,
      options,
      timestamp: Date.now(),
    };
    this.recentToasts.push(queuedToast);

    switch (type) {
      case "success":
        return toast.success(message, options);
      case "error":
        return toast.error(message, options);
      case "warning":
        return toast.warning(message, options);
      case "info":
        return toast.info(message, options);
    }
  }

  success(message: string, options?: ExternalToast) {
    if (this.isDuplicate(message)) return;
    if (this.isRateLimited()) {
      // Show a summary toast instead
      if (!this.isDuplicate("Multiple notifications...")) {
        toast.info("Multiple notifications...", { duration: 2000 });
        this.recentToasts.push({
          message: "Multiple notifications...",
          type: "info",
          timestamp: Date.now(),
        });
      }
      return;
    }
    return this.showToast(message, "success", options);
  }

  error(message: string, options?: ExternalToast) {
    // Errors are never deduplicated or rate-limited for safety
    return toast.error(message, options);
  }

  warning(message: string, options?: ExternalToast) {
    if (this.isDuplicate(message)) return;
    return this.showToast(message, "warning", options);
  }

  info(message: string, options?: ExternalToast) {
    if (this.isDuplicate(message)) return;
    if (this.isRateLimited()) return;
    return this.showToast(message, "info", options);
  }

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) {
    return toast.promise(promise, messages);
  }

  dismiss(toastId?: string | number) {
    if (toastId) {
      this.dismissedIds.add(toastId);
    }
    toast.dismiss(toastId);
  }

  dismissAll() {
    toast.dismiss();
    this.recentToasts = [];
  }
}

// Export singleton instance
export const toastQueue = new ToastQueueManager();

// Export convenience functions
export const showToast = {
  success: (message: string, options?: ExternalToast) =>
    toastQueue.success(message, options),
  error: (message: string, options?: ExternalToast) =>
    toastQueue.error(message, options),
  warning: (message: string, options?: ExternalToast) =>
    toastQueue.warning(message, options),
  info: (message: string, options?: ExternalToast) =>
    toastQueue.info(message, options),
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => toastQueue.promise(promise, messages),
  dismiss: (toastId?: string | number) => toastQueue.dismiss(toastId),
  dismissAll: () => toastQueue.dismissAll(),
};
