import { BeforeInstallPromptEvent } from "@/hooks/usePWAInstallTracking";
import { FirestoreSignaling } from "@/lib/FirestoreSignaling";
import { getPWADisplayMode } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const displayMode = getPWADisplayMode();
    if (displayMode === "fullscreen" || displayMode === "standalone") {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    const signaling = FirestoreSignaling.getInstance();
    const analytics = signaling.getAnalytics();

    if (analytics) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(analytics, "pwa_install_button_clicked", {
        timestamp: new Date().toISOString(),
      });
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (analytics) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(analytics, "pwa_manual_install_result", {
        outcome,
        timestamp: new Date().toISOString(),
      });
    }

    setDeferredPrompt(null);
  };

  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <Button
      variant={"ghost"}
      className="flex gap-2 items-center"
      onClick={handleInstallClick}
    >
      <span>Install App</span>
      <DownloadIcon className="w-5 h-5" />
    </Button>
  );
};
