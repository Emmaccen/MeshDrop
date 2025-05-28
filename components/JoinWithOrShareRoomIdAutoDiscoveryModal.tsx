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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useConnect } from "@/hooks/useConnect";
import { FirestoreSignaling } from "@/lib/FirestoreSignaling";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PeerContent = () => {
  const [roomId, setRoomId] = useState("");
  const firestore = FirestoreSignaling.getInstance();
  const { requestConnectionFromHost } = useConnect();
  const [imLoading, setImLoading] = useState({
    id: "",
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Join With Room-Id</DialogTitle>
        <DialogDescription className="text-left">
          Please type in the Room-Id provided by the other device to auto
          connect
        </DialogDescription>
      </DialogHeader>
      <Input
        value={roomId}
        onChange={(e) => setRoomId(e.target.value.toLowerCase())}
        className="my-3"
        id="roomid"
        type="text"
      />
      <DialogFooter>
        <Button
          loading={imLoading.id === "processing-room-id"}
          onClick={async () => {
            if (!roomId.trim()) return;
            setImLoading({
              id: "processing-room-id",
            });
            const hostOffer = await firestore.getHostOffer(roomId.trim());
            if (hostOffer !== null) {
              requestConnectionFromHost(JSON.stringify(hostOffer));
            } else {
              toast.error(
                "Room-Id not found. Please create a new one on the other device"
              );
            }
            setImLoading({
              id: "",
            });
          }}
          className="cursor-pointer"
        >
          Join Connection
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export const JoinWithOrShareRoomIdAutoDiscoveryModal = () => {
  const { currentHostState } = useHostState();
  const { currentPeerState } = usePeerState();

  const { imVisible, hideModal } = useVisibilityState();

  useEffect(() => {
    if (currentHostState.peerConnection?.connectionState === "connected")
      hideModal(ModalIds.joinOrShareWithRoomIdAutoDiscoveryModal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHostState.peerConnection?.connectionState]);

  useEffect(() => {
    if (currentPeerState.peerConnection?.connectionState === "connected")
      hideModal(ModalIds.joinOrShareWithRoomIdAutoDiscoveryModal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPeerState.peerConnection?.connectionState]);

  return (
    <Dialog
      open={imVisible(ModalIds.joinOrShareWithRoomIdAutoDiscoveryModal)}
      onOpenChange={() => {
        hideModal(ModalIds.joinOrShareWithRoomIdAutoDiscoveryModal);
      }}
    >
      {currentHostState.roomId ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Room-Id</DialogTitle>
            <DialogDescription className="text-left">
              Your discovery is set to{" "}
              <span className="bold underline">Online</span>. Please share this
              Room-Id with the other device.
            </DialogDescription>
          </DialogHeader>
          <h3 className="font-bold tracking-[0.5rem] text-center text-4xl p-2">
            {currentHostState.roomId}
          </h3>
          <DialogFooter className="sm:justify-start">
            <p className="text-sm text-muted-foreground">
              Devices will auto connect once Room-Id is processed.
            </p>
          </DialogFooter>
        </DialogContent>
      ) : (
        <PeerContent />
      )}
    </Dialog>
  );
};
