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
import { useCallback, useEffect, useRef } from "react";

// Global state for the Web Audio API workaround
let globalAudioCtx: AudioContext | null = null;
let globalGainNode: GainNode | null = null;
let globalOscillator: OscillatorNode | null = null;
let isUnlocked = false;

const unlockAudio = () => {
  if (isUnlocked || typeof window === "undefined") return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioCtx) return;

    if (!globalAudioCtx) {
      globalAudioCtx = new AudioCtx();
    }

    if (globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume();
    }

    if (!globalOscillator) {
      globalOscillator = globalAudioCtx.createOscillator();
      globalGainNode = globalAudioCtx.createGain();

      // Start muted
      globalGainNode.gain.value = 0;
      globalOscillator.connect(globalGainNode);
      globalGainNode.connect(globalAudioCtx.destination);

      globalOscillator.frequency.value = 1;
      globalOscillator.type = "sine";
      globalOscillator.start();
    }

    isUnlocked = true;
    console.log("[KeepAlive] AudioContext globally unlocked");

    // Remove event listeners once unlocked
    document.removeEventListener("touchstart", unlockAudio);
    document.removeEventListener("click", unlockAudio);
  } catch (err) {
    console.warn("[KeepAlive] Failed to unlock audio", err);
  }
};

// Bind early to catch the very first user interaction
if (typeof document !== "undefined") {
  document.addEventListener("touchstart", unlockAudio, { once: true });
  document.addEventListener("click", unlockAudio, { once: true });
}

/**
 * Silent Audio Keep-Alive Hook
 *
 * Plays a near-silent audio oscillator to prevent browsers from
 * throttling/suspending the tab when the screen goes off.
 *
 * It uses a globally unlocked AudioContext so it can be activated
 * (unmuted) even when triggered by an incoming network message
 * (without a direct user gesture at that exact moment).
 */
export function useSilentAudioKeepAlive() {
  const isActiveRef = useRef(false);

  const start = useCallback(() => {
    if (isActiveRef.current) return;

    // Fallback if not unlocked yet
    if (!isUnlocked) {
      unlockAudio();
    }

    if (globalGainNode && globalAudioCtx) {
      // Set to near-inaudible (0.001) instead of 0
      globalGainNode.gain.setTargetAtTime(0.001, globalAudioCtx.currentTime, 0.01);
      isActiveRef.current = true;
      console.log("[KeepAlive] Silent audio unmuted (started)");
    }
  }, []);

  const stop = useCallback(() => {
    if (!isActiveRef.current) return;

    if (globalGainNode && globalAudioCtx) {
      // Mute again
      globalGainNode.gain.setTargetAtTime(0, globalAudioCtx.currentTime, 0.01);
      isActiveRef.current = false;
      console.log("[KeepAlive] Silent audio muted (stopped)");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop, isActive: isActiveRef.current };
}
