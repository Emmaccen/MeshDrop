import { useCallback, useEffect, useRef } from "react";

/**
 * Silent Audio Keep-Alive Hook
 *
 * Plays a near-silent audio oscillator to prevent browsers from
 * throttling/suspending the tab when the screen goes off.
 * This is more reliable than Wake Lock API I implemented before.
 *
 * The Web Audio API keeps the tab "active" because the browser
 * thinks it's producing audio output.
 */
export function useSilentAudioKeepAlive() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const isActiveRef = useRef(false);

  const start = useCallback(() => {
    if (isActiveRef.current) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Create a silent oscillator (gain = nearly 0)
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Set gain to a near-inaudible level
      // Some browsers ignore truly zero gain, so use a tiny value
      gainNode.gain.value = 0.001;

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Use a very low frequency that won't be noticeable even at low gain
      oscillator.frequency.value = 1;
      oscillator.type = "sine";

      oscillator.start();
      oscillatorRef.current = oscillator;
      isActiveRef.current = true;

      console.log("[KeepAlive] Silent audio started");
    } catch (err) {
      console.warn("[KeepAlive] Failed to start silent audio:", err);
    }
  }, []);

  const stop = useCallback(() => {
    if (!isActiveRef.current) return;

    try {
      oscillatorRef.current?.stop();
      oscillatorRef.current?.disconnect();
      audioContextRef.current?.close();
    } catch {
      // Ignore cleanup errors
    }

    oscillatorRef.current = null;
    audioContextRef.current = null;
    isActiveRef.current = false;

    console.log("[KeepAlive] Silent audio stopped");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop, isActive: isActiveRef.current };
}
