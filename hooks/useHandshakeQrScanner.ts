"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

interface WebRTCHandshake {
  type: "offer" | "answer";
  sdp: string;
}

export const useHandshakeQrScanner = () => {
  const [handshake, setHandshake] = useState<WebRTCHandshake | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const scannerRef = useRef<HTMLDivElement | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Parse WebRTC handshake from QR code
  const parseWebRTCHandshake = useCallback(
    (decodedText: string): WebRTCHandshake | null => {
      try {
        // Basic validation for WebRTC handshake
        const parsedData = JSON.parse(decodedText);

        if (!parsedData.type || !parsedData.sdp) {
          toast.error("Invalid connection format");
          throw new Error("Invalid WebRTC handshake format");
        }

        if (parsedData.type !== "offer" && parsedData.type !== "answer") {
          toast.error("Invalid connection type");
          throw new Error("Invalid handshake type");
        }

        return {
          type: parsedData.type,
          sdp: parsedData.sdp,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid QR code format");
        toast.error("Invalid QR code format");
        return null;
      }
    },
    []
  );

  // Start scanning
  const startScanning = useCallback(
    async (containerRef?: React.RefObject<HTMLDivElement>) => {
      // Use provided ref or fallback to internal ref
      const targetRef = containerRef?.current || scannerRef.current;

      if (!targetRef) {
        setError("No scanner container found");

        return;
      }

      try {
        const html5QrCode = new Html5Qrcode(targetRef.id);
        html5QrcodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: 250,
          },
          (decodedText) => {
            stopScanning();
            const parsedHandshake = parseWebRTCHandshake(decodedText);
            if (parsedHandshake) {
              setHandshake(parsedHandshake);
              console.log("handshake parsed successfully");
              toast.success("QR connection processed successfully");
            } else {
              // Handle error parsing handshake
              console.error("Error parsing handshake");
            }
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (errorMessage) => {}
        );

        setIsScanning(true);
        setError(null);
      } catch (err) {
        setError(
          "Error starting camera: " +
            (err instanceof Error ? err.message : String(err))
        );
        console.log(err);
        toast.error("Error starting camera");
        setIsScanning(false);
      }
    },
    [parseWebRTCHandshake]
  );

  // Stop scanning
  const stopScanning = useCallback(async () => {
    try {
      if (html5QrcodeRef.current) {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
        html5QrcodeRef.current = null;
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Error stopping scanner:", err);
      toast.error("Unable to stop scanner");
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setHandshake(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return {
    handshake,
    error,
    isScanning,
    startScanning,
    stopScanning,
    reset,
    scannerRef,
  };
};
