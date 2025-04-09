"use client";
import { useHostState } from "@/app/store/host";
import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
import { usePeerState } from "@/app/store/peer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "react-qr-code";
export const QrCodeResultModal = ({
  children,
}: {
  children: React.JSX.Element;
}) => {
  const { currentHostState } = useHostState();
  const { currentPeerState } = usePeerState();
  const { imVisible, hideModal } = useVisibilityState();

  if (!currentHostState.offer && !currentPeerState.peerAnswer) return;
  return (
    <Dialog
      open={imVisible(ModalIds.qrCodeResultModal)}
      onOpenChange={() => hideModal(ModalIds.qrCodeResultModal)}
    >
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connection QR</DialogTitle>
          <DialogDescription className="text-left">
            Share and scan this QR Code to connect with other devices.
          </DialogDescription>
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
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
