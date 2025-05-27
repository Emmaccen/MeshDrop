import { FirestoreSignaling } from "@/lib/FirestoreSignaling";
import { getPWADisplayMode } from "@/lib/utils";
import { useEffect } from "react";

export interface BeforeInstallPromptEvent extends Event {
  platforms: string[];
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAInstallTracking = () => {
  useEffect(() => {
    const signaling = FirestoreSignaling.getInstance();
    const analytics = signaling.getAnalytics();

    if (!analytics || typeof window === "undefined") return;

    const handleBeforeInstallPrompt = async (e: BeforeInstallPromptEvent) => {
      // Log that install prompt was shown
      const { logEvent } = await import("firebase/analytics");
      logEvent(analytics, "pwa_install_prompt_shown", {
        platforms: e.platforms.join(","),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });

      e.userChoice.then(async (choiceResult) => {
        logEvent(analytics, "pwa_install_prompt_result", {
          outcome: choiceResult.outcome,
          platform: choiceResult.platform,
          timestamp: new Date().toISOString(),
        });

        if (choiceResult.outcome === "accepted") {
          logEvent(analytics, "pwa_install_accepted", {
            platform: choiceResult.platform,
          });
        } else {
          logEvent(analytics, "pwa_install_dismissed", {
            platform: choiceResult.platform,
          });
        }
      });
    };

    // Track when PWA is actually installed
    const handleAppInstalled = async () => {
      const { logEvent } = await import("firebase/analytics");
      logEvent(analytics, "pwa_installed", {
        method: "browser_prompt", // vs manual_add_to_homescreen
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    };

    const trackInstalledMode = async () => {
      const displayMode = getPWADisplayMode();
      if (displayMode === "standalone" || displayMode === "fullscreen") {
        const { logEvent } = await import("firebase/analytics");
        logEvent(analytics, "pwa_launched_installed", {
          display_mode: displayMode,
          timestamp: new Date().toISOString(),
        });
      }
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as unknown as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    trackInstalledMode();

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as unknown as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);
};

export const isPWAInstalled = () => {
  return getPWADisplayMode() !== "browser";
};

export const trackPWAUsage = async () => {
  const signaling = FirestoreSignaling.getInstance();
  const analytics = signaling.getAnalytics();

  if (!analytics) return;

  const { logEvent } = await import("firebase/analytics");

  logEvent(analytics, "pwa_session_start", {
    display_mode: getPWADisplayMode(),
    is_installed: isPWAInstalled(),
    user_agent: navigator.userAgent,
    screen_size: `${window.screen.width}x${window.screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
  });
};
