import { toast } from "sonner";

export class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;
  private static instance: WakeLockManager | null = null;
  private static isCreating = false; // Prevent race conditions

  isWakeLockActive = false;
  isWakeLockSupported =
    typeof navigator !== "undefined" && "wakeLock" in navigator;
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isRequesting = false;
  private hasShownWakeLockToast = false;
  private destroyed = false;

  // Private cuz... We don't like funny biz
  private constructor() {
    if (WakeLockManager.instance) {
      throw new Error(
        "Use WakeLockManager.getInstance() instead of new WakeLockManager()"
      );
    }

    if (this.isWakeLockSupported) {
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange
      );
    }
  }

  public static getInstance(): WakeLockManager {
    // Double-checked locking pattern for thread safety
    if (!WakeLockManager.instance && !WakeLockManager.isCreating) {
      WakeLockManager.isCreating = true;

      if (!WakeLockManager.instance) {
        WakeLockManager.instance = new WakeLockManager();
      }

      WakeLockManager.isCreating = false;
    }

    return WakeLockManager.instance!;
  }

  public async requestWakeLock(): Promise<boolean> {
    if (
      !this.isWakeLockSupported ||
      this.isRequesting ||
      this.isWakeLockActive ||
      this.destroyed
    )
      return false;

    try {
      this.isRequesting = true;
      const lock = await navigator.wakeLock.request("screen");

      this.wakeLock = lock;
      this.isWakeLockActive = true;

      this.wakeLock.removeEventListener("release", this.handleWakeLockRelease);
      this.wakeLock.addEventListener("release", this.handleWakeLockRelease);

      return true;
    } catch (error: unknown) {
      this.handleWakeLockError(error);
      return false;
    } finally {
      this.isRequesting = false;
    }
  }

  private handleWakeLockRelease = () => {
    this.isWakeLockActive = false;
  };

  private handleWakeLockError(error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError"
    ) {
      return;
    }

    if (!this.hasShownWakeLockToast) {
      toast.error(
        "Unable to keep screen awake. Connection may terminate when screen goes off"
      );
      this.hasShownWakeLockToast = true;
    }

    this.scheduleReacquire();
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      this.scheduleReacquire();
    }
  };

  private scheduleReacquire(delay: number = 500) {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.retryTimeoutId = setTimeout(() => {
      if (!this.isWakeLockActive && !this.isRequesting && !this.destroyed) {
        this.requestWakeLock();
      }
    }, delay);
  }

  public async stop(): Promise<void> {
    this.destroyed = false; // Allow reuse

    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    if (this.wakeLock) {
      this.wakeLock.removeEventListener("release", this.handleWakeLockRelease);
      try {
        await this.wakeLock.release();
      } catch {
        // ignore errors on cleanup
      }
      this.wakeLock = null;
    }

    this.isWakeLockActive = false;
    this.isRequesting = false;
    this.hasShownWakeLockToast = false;
  }

  // Complete cleanup - watch out!
  public async destroy(): Promise<void> {
    this.destroyed = true;

    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange
    );

    await this.stop();
  }

  public static createNewInstance(): WakeLockManager {
    const oldInstance = WakeLockManager.instance;
    WakeLockManager.instance = null;
    WakeLockManager.isCreating = false;

    if (oldInstance) {
      oldInstance.destroy();
    }

    return WakeLockManager.getInstance();
  }
}
