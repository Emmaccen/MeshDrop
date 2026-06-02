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
import { useEffect, useState } from "react";

const USERNAME_KEY = "meshdrop_username";

export const JoinConnectionUserNameModal = () => {
  const { updatePeerStatePartially, currentPeerState } = usePeerState();
  const { resetHostState } = useHostState();
  const [username, setUserName] = useState(currentPeerState.username ?? "");
  const { imVisible, hidePreviousThenShowNext, hideModal } =
    useVisibilityState();
  const { currentMiscState } = useMiscState();

  // Pre-fill from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(USERNAME_KEY);
    if (saved) setUserName(saved);
  }, []);

  // Auto-proceed when modal opens if username already saved
  useEffect(() => {
    if (!imVisible(ModalIds.joinConnectionUserNameModal)) return;
    const saved = localStorage.getItem(USERNAME_KEY);
    if (!saved) return;

    updatePeerStatePartially({
      username: saved,
      userId: crypto.randomUUID(),
    });
    hidePreviousThenShowNext(
      ModalIds.joinConnectionUserNameModal,
      currentMiscState.discoveryMode === "offline"
        ? ModalIds.qrScannerModal
        : ModalIds.joinOrShareWithRoomIdAutoDiscoveryModal,
    );
    resetHostState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imVisible(ModalIds.joinConnectionUserNameModal)]);

  const handleSave = () => {
    if (!username.trim()) return;
    localStorage.setItem(USERNAME_KEY, username.trim());
    updatePeerStatePartially({
      username: username.trim(),
      userId: crypto.randomUUID(),
    });
    hidePreviousThenShowNext(
      ModalIds.joinConnectionUserNameModal,
      currentMiscState.discoveryMode === "offline"
        ? ModalIds.qrScannerModal
        : ModalIds.joinOrShareWithRoomIdAutoDiscoveryModal,
    );
    resetHostState();
  };

  return (
    <Dialog
      open={imVisible(ModalIds.joinConnectionUserNameModal)}
      onOpenChange={() => hideModal(ModalIds.joinConnectionUserNameModal)}
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
          <Button onClick={handleSave} className="cursor-pointer">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
