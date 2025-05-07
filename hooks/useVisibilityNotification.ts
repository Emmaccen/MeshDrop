import { useEffect, useRef } from "react";

type NotifyOptions = {
  title: string;
  body?: string;
  icon?: string;
};

export function useVisibilityNotification() {
  const shouldNotify = useRef(false);

  useEffect(() => {
    const handleVisibility = () => {
      shouldNotify.current = document.visibilityState === "hidden";
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const notifyIfPageHiddenOrInBackground = ({
    title,
    body = "",
    icon = "/favicon.ico",
  }: NotifyOptions) => {
    if (!("Notification" in window)) return;

    if (shouldNotify.current && Notification.permission === "granted") {
      const truncatedMessage =
        body?.length > 50 ? body.slice(0, 50) + "..." : body;
      new Notification(title, { body: truncatedMessage, icon });
    }
  };

  // Optional: one-time permission prompt
  const requestPermissionToShowNotification = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  return {
    notifyIfPageHiddenOrInBackground,
    requestPermissionToShowNotification,
  };
}
