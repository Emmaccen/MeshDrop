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
import { useState } from "react";
import { nanoid } from "nanoid";

export const JoinConnectionUserNameModal = ({
  children,
}: {
  children: React.JSX.Element;
}) => {
  const { updatePeerStatePartially, currentPeerState } = usePeerState();
  const { resetHostState } = useHostState();
  const [username, setUserName] = useState(currentPeerState.username ?? "");
  const { imVisible, hidePreviousThenShowNext, hideModal } =
    useVisibilityState();

  return (
    <Dialog
      open={imVisible(ModalIds.joinConnectionUserNameModal)}
      onOpenChange={() => hideModal(ModalIds.joinConnectionUserNameModal)}
    >
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Username</DialogTitle>
          <DialogDescription className="text-left">
            This is only used to identify your connection on other devices
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
            onClick={() => {
              if (!username.trim()) return;
              updatePeerStatePartially({
                username: username,
                userId: nanoid(24),
              });
              hidePreviousThenShowNext(
                ModalIds.joinConnectionUserNameModal,
                ModalIds.qrScannerModal
              );
              resetHostState();
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
