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
import { useCreateHostConnection } from "@/hooks/useCreateHostConnection";
import { useState } from "react";
import { useMiscState } from "@/app/store/misc";

export const CreateConnectionUserNameModal = () => {
  const { currentHostState } = useHostState();
  const { resetPeerState } = usePeerState();
  const [username, setUserName] = useState(currentHostState.username ?? "");
  const { createHost } = useCreateHostConnection();
  const { imVisible, hidePreviousThenShowNext, hideModal } =
    useVisibilityState();
  const { currentMiscState } = useMiscState();
  const [imLoading, setImLoading] = useState({
    id: "",
  });
  return (
    <Dialog
      open={imVisible(ModalIds.createConnectionUserNameModal)}
      onOpenChange={() => hideModal(ModalIds.createConnectionUserNameModal)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Username</DialogTitle>
          <DialogDescription className="text-left">
            This is only used to identify your connection on other devices or
            peers
          </DialogDescription>
        </DialogHeader>
        <Input
          value={username}
          onChange={(e) => setUserName(e.target.value)}
          className="my-3"
          id="username"
          type="text"
        />
        <DialogFooter>
          <Button
            loading={imLoading.id === "creating-connection"}
            onClick={async () => {
              if (!username.trim()) return;
              setImLoading({ id: "creating-connection" });
              const userId = crypto.randomUUID();
              await createHost({
                username: username,
                userId,
              });
              resetPeerState();
              hidePreviousThenShowNext(
                ModalIds.createConnectionUserNameModal,
                currentMiscState.discoveryMode === "offline"
                  ? ModalIds.qrCodeResultModal
                  : ModalIds.joinOrShareWithRoomIdAutoDiscoveryModal
              );
              setImLoading({ id: "" });
            }}
            className="cursor-pointer"
          >
            Save Username
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
