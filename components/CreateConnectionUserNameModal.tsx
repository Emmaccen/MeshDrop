"use client";
import { useHostState } from "@/app/store/host";
import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
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

export const CreateConnectionUserNameModal = ({
  children,
}: {
  children: React.JSX.Element;
}) => {
  const { updateHostStatePartially, currentHostState } = useHostState();
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
      </DialogContent>
      <DialogFooter>
        <Button
          onClick={() => {
            if (!username.trim()) return;
            updateHostStatePartially({
              username: username,
            });
            createHost();
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
    </Dialog>
  );
};
