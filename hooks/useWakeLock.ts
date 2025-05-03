import { WakeLockManager } from "@/lib/WakeLockManager";
import { useEffect, useState } from "react";

export function useWakeLock(autoAcquire = false) {
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(false);
  const [wakeLockManager] = useState(() => new WakeLockManager());

  useEffect(() => {
    setWakeLockSupported(wakeLockManager.isSupported());

    if (autoAcquire && wakeLockManager.isSupported()) {
      wakeLockManager.requestWakeLock().then((acquired) => {
        setWakeLockActive(acquired);
      });
    }

    return () => {
      wakeLockManager.cleanup();
    };
  }, [autoAcquire]);

  const requestWakeLock = async () => {
    const acquired = await wakeLockManager.requestWakeLock();
    setWakeLockActive(acquired);
    return acquired;
  };

  const releaseWakeLock = async () => {
    const released = await wakeLockManager.releaseWakeLock();
    setWakeLockActive(!released);
    return released;
  };

  return {
    wakeLockActive,
    wakeLockSupported,
    requestWakeLock,
    releaseWakeLock,
  };
}
