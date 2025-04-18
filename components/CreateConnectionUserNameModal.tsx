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
import { nanoid } from "nanoid";

export const CreateConnectionUserNameModal = ({
  children,
}: {
  children: React.JSX.Element;
}) => {
  const { updateHostStatePartially, currentHostState } = useHostState();
  const { resetPeerState } = usePeerState();
  const [username, setUserName] = useState(currentHostState.username ?? "");
  const { createHost } = useCreateHostConnection();
  const { imVisible, hidePreviousThenShowNext, hideModal } =
    useVisibilityState();

  return (
    <Dialog
      open={imVisible(ModalIds.createConnectionUserNameModal)}
      onOpenChange={() => hideModal(ModalIds.createConnectionUserNameModal)}
    >
      {children}
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
            onClick={() => {
              if (!username.trim()) return;
              updateHostStatePartially({
                username: username,
                userId: nanoid(24),
              });
              createHost();
              resetPeerState();
              hidePreviousThenShowNext(
                ModalIds.createConnectionUserNameModal,
                ModalIds.qrCodeResultModal
              );
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
