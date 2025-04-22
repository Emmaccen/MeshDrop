"use client";
import { useHostState } from "@/app/store/host";
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
import QRCode from "react-qr-code";

export const QrCodeResultModal = () => {
  const { currentHostState } = useHostState();
  const { currentPeerState } = usePeerState();
  const { imVisible, hideModal, hidePreviousThenShowNext } =
    useVisibilityState();

  if (!currentHostState.offer && !currentPeerState.peerAnswer) return;
  return (
    <Dialog
      open={imVisible(ModalIds.qrCodeResultModal)}
      onOpenChange={() => hideModal(ModalIds.qrCodeResultModal)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connection QR</DialogTitle>
          <DialogDescription className="text-left">
            Share and scan this QR Code to connect with other devices.
          </DialogDescription>
        </DialogHeader>
        {currentHostState.offer && (
          <div className="bg-white p-2">
            <QRCode
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={currentHostState.offer}
            />
          </div>
        )}
        {currentPeerState.peerAnswer && (
          <div className="bg-white p-2">
            <QRCode
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={currentPeerState.peerAnswer}
            />
          </div>
        )}
        {!currentPeerState.peerAnswer ? (
          <>
            <p className="py-2 text-sm">
              Finished scanning this QR? Click the button below to scan the QR
              of the other device
            </p>
            <Button
              onClick={() =>
                hidePreviousThenShowNext(
                  ModalIds.qrCodeResultModal,
                  ModalIds.qrScannerModal
                )
              }
              className="px-4 py-2 cursor-pointer"
            >
              {`Scan the other device's QR`}
            </Button>{" "}
          </>
        ) : (
          <p className="py-2 text-sm">
            Close this modal once scanning is done on the other device
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
