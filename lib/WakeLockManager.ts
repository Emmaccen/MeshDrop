import { toast } from "sonner";

/**
 * WakeLockManager - A utility class to manage the Wake Lock API
 * Prevents the screen from turning off during WebRTC connections
 */

export class WakeLockManager {
  private wakeLock: WakeLockSentinel | null = null;
  private isWakeLockSupported: boolean = false;
  private isWakeLockActive: boolean = false;
  private visibilityChangeHandler: (() => void) | null = null;
  private autoReacquireWakeLock: boolean = true;

  /**
   * Initialize the WakeLockManager
   * @param autoReacquire - Whether to automatically reacquire the wake lock when the page becomes visible again
   */
  constructor(autoReacquire: boolean = true) {
    // Check if the Wake Lock API is supported
    this.isWakeLockSupported = "wakeLock" in navigator;
    this.autoReacquireWakeLock = autoReacquire;

    if (!this.isWakeLockSupported) {
      console.warn("Wake Lock API is not supported in this browser.");
      toast.info("Connections may be interrupted when the screen turns off");
    }
  }

  /**
   * Request a wake lock to prevent the screen from turning off
   * @returns Promise<boolean> - Whether the wake lock was successfully acquired
   */
  public async requestWakeLock(): Promise<boolean> {
    if (!this.isWakeLockSupported) {
      toast.error(
        "Application is unable to keep the screen on. Connections may be interrupted when the screen turns off"
      );
      return false;
    }

    try {
      // Request a screen wake lock
      this.wakeLock = await navigator.wakeLock.request("screen");
      this.isWakeLockActive = true;

      // Add event listener for wake lock release
      this.wakeLock.addEventListener("release", () => {
        this.isWakeLockActive = false;
        console.info("Wake lock has been released");
        toast.info("Connections may be interrupted when the screen turns off");
      });

      // Set up the visibility change listener to reacquire wake lock when page becomes visible
      if (this.autoReacquireWakeLock && !this.visibilityChangeHandler) {
        this.visibilityChangeHandler = this.handleVisibilityChange.bind(this);
        document.addEventListener(
          "visibilitychange",
          this.visibilityChangeHandler
        );
      }

      console.info("Wake lock acquired successfully");
      return true;
    } catch (error) {
      this.handleWakeLockError(error);
      return false;
    }
  }

  /**
   * Release the wake lock allowing the screen to turn off
   * @returns Promise<boolean> - Whether the wake lock was successfully released
   */
  public async releaseWakeLock(): Promise<boolean> {
    if (!this.wakeLock || !this.isWakeLockActive) {
      return false;
    }

    try {
      await this.wakeLock.release();
      this.wakeLock = null;
      this.isWakeLockActive = false;

      console.info("Wake lock released manually");
      return true;
    } catch (error) {
      console.error("Failed to release wake lock:", error);
      return false;
    }
  }

  /**
   * Get the current state of the wake lock
   * @returns boolean - Whether the wake lock is currently active
   */
  public isActive(): boolean {
    return this.isWakeLockActive;
  }

  /**
   * Check if the Wake Lock API is supported
   * @returns boolean - Whether the Wake Lock API is supported
   */
  public isSupported(): boolean {
    return this.isWakeLockSupported;
  }

  /**
   * Clean up the WakeLockManager by removing event listeners and releasing the wake lock
   */
  public cleanup(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler
      );
      this.visibilityChangeHandler = null;
    }

    if (this.isWakeLockActive && this.wakeLock) {
      this.wakeLock
        .release()
        .catch((error) =>
          console.error("Error releasing wake lock during cleanup:", error)
        );
    }
  }

  /**
   * Handle the visibility change event to reacquire the wake lock
   */
  private async handleVisibilityChange(): Promise<void> {
    if (
      document.visibilityState === "visible" &&
      !this.isWakeLockActive &&
      this.autoReacquireWakeLock
    ) {
      try {
        await this.requestWakeLock();
      } catch (error) {
        this.handleWakeLockError(error);
      }
    }
  }

  /**
   * Handle errors related to wake lock operations
   * @param error - The error that occurred
   */
  private handleWakeLockError(error: unknown): void {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === "NotAllowedError") {
        console.error(
          "Wake Lock request not allowed: The document is not fully active or permission was denied."
        );
      } else if (error.name === "AbortError") {
        console.error("Wake Lock operation was aborted.");
      } else {
        console.error("Wake Lock error:", error.message);
      }
    } else {
      console.error("Unknown Wake Lock error:", error);
    }
    toast.error(
      "Application is unable to keep the screen on. Connections may be interrupted when the screen turns off"
    );
    this.isWakeLockActive = false;
  }
}
