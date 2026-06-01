"use client";
import { useHostState } from "@/app/store/host";
import { useMiscState } from "@/app/store/misc";
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
import { useEffect, useState } from "react";

const USERNAME_KEY = "meshdrop_username";

export const CreateConnectionUserNameModal = () => {
  const { currentHostState } = useHostState();
  const { resetPeerState } = usePeerState();
  const [username, setUserName] = useState(currentHostState.username ?? "");
  const { createHost } = useCreateHostConnection();
  const { imVisible, hidePreviousThenShowNext, hideModal } =
    useVisibilityState();
  const { currentMiscState } = useMiscState();
  const [imLoading, setImLoading] = useState({ id: "" });

  // On mount: pre-fill from localStorage. If already set, auto-proceed when modal opens.
  useEffect(() => {
    const saved = localStorage.getItem(USERNAME_KEY);
    if (saved) setUserName(saved);
  }, []);

  // When modal becomes visible and we already have a saved username, skip it automatically
  useEffect(() => {
    if (!imVisible(ModalIds.createConnectionUserNameModal)) return;
    const saved = localStorage.getItem(USERNAME_KEY);
    if (!saved) return;

    // Auto-proceed with the saved username
    (async () => {
      setImLoading({ id: "creating-connection" });
      const userId = crypto.randomUUID();
      await createHost({ username: saved, userId });
      resetPeerState();
      hidePreviousThenShowNext(
        ModalIds.createConnectionUserNameModal,
        currentMiscState.discoveryMode === "offline"
          ? ModalIds.qrCodeResultModal
          : ModalIds.joinOrShareWithRoomIdAutoDiscoveryModal,
      );
      setImLoading({ id: "" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imVisible(ModalIds.createConnectionUserNameModal)]);

  const handleSave = async () => {
    if (!username.trim()) return;
    setImLoading({ id: "creating-connection" });
    const userId = crypto.randomUUID();
    await createHost({ username: username.trim(), userId });
    resetPeerState();
    localStorage.setItem(USERNAME_KEY, username.trim());
    hidePreviousThenShowNext(
      ModalIds.createConnectionUserNameModal,
      currentMiscState.discoveryMode === "offline"
        ? ModalIds.qrCodeResultModal
        : ModalIds.joinOrShareWithRoomIdAutoDiscoveryModal,
    );
    setImLoading({ id: "" });
  };

  return (
    <Dialog
      open={imVisible(ModalIds.createConnectionUserNameModal)}
      onOpenChange={() => hideModal(ModalIds.createConnectionUserNameModal)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What should we call you?</DialogTitle>
          <DialogDescription className="text-left">
            This name is shown to the other device so they know who is
            connecting. It&apos;s only stored on this device.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={username}
          onChange={(e) => setUserName(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && handleSave()}
          className="my-3"
          id="username"
          type="text"
          placeholder="e.g. My Laptop, John's Phone…"
          autoFocus
        />
        <DialogFooter>
          <Button
            loading={imLoading.id === "creating-connection"}
            onClick={handleSave}
            className="cursor-pointer"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
