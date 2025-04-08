"use client";
import { useHostState } from "@/app/store/host";
import { usePeerState } from "@/app/store/peer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import QRCode from "react-qr-code";
export const QrCodeResultModal = ({
  children,
}: {
  children: React.JSX.Element;
}) => {
  const { currentHostState } = useHostState();
  const { currentPeerState } = usePeerState();
  const [open, setOpen] = useState(false);

  if (!currentHostState.offer && !currentPeerState.peerAnswer) return;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
