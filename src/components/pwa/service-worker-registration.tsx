"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ServiceWorkerRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
          setRegistration(reg);

          // Check for updates periodically
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New version available
                  toast.info("New version available!", {
                    description: "Refresh to update MindSync",
                    action: {
                      label: "Refresh",
                      onClick: () => window.location.reload(),
                    },
                    duration: 10000,
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}

// Hook to request push notification permission
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("Notifications enabled!", {
          description: "You'll receive task reminders and updates",
        });
        return true;
      } else if (result === "denied") {
        toast.error("Notifications blocked", {
          description: "Enable them in browser settings to receive reminders",
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error("[Push] Permission request failed:", error);
      return false;
    }
  };

  const sendLocalNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== "granted") return;

    try {
      new Notification(title, {
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        ...options,
      });
    } catch (error) {
      console.error("[Push] Failed to send notification:", error);
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendLocalNotification,
  };
}

// Hook for offline detection
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online!", { description: "Syncing your changes..." });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline", { description: "Changes will sync when you reconnect" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
