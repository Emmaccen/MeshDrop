"use client";
import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
import { usePeerState } from "@/app/store/peer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConnect } from "@/hooks/useConnect";
import { useHandshakeQrScanner } from "@/hooks/useHandshakeQrScanner";
import { useEffect } from "react";

export const QrScannerModal = () => {
  const { currentPeerState } = usePeerState();
  const { imVisible, hideModal } = useVisibilityState();
  const { handshake, isScanning, startScanning, scannerRef, stopScanning } =
    useHandshakeQrScanner();
  const { requestConnection } = useConnect();

  useEffect(() => {
    if (!handshake) return;
    requestConnection(JSON.stringify(handshake));
  }, [handshake]);

  return (
    <Dialog
      open={imVisible(ModalIds.qrScannerModal)}
      onOpenChange={() => {
        stopScanning();
        hideModal(ModalIds.qrScannerModal);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Connection QR</DialogTitle>
          <DialogDescription className="text-left">
            Scan the QR provided by the other device to establish a connection.
          </DialogDescription>
        </DialogHeader>
        {!currentPeerState.peerConnection && (
          <div
            id="webrtc-scanner-container-peer"
            ref={scannerRef}
            className="w-full flex items-center justify-center"
          ></div>
        )}
        {!isScanning && (
          <Button
            onClick={() => startScanning()}
            className="px-4 py-2 cursor-pointer"
          >
            Scan connection QR to connect
          </Button>
        )}
        {isScanning && (
          <Button
            variant={"destructive"}
            onClick={() => stopScanning()}
            className="px-4 py-2 cursor-pointer"
          >
            Stop Scanning
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
