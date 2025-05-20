"use client";

import { useHostState } from "@/app/store/host";
import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
import { usePeerState } from "@/app/store/peer";
import {
  CreateConnectionButton,
  JoinConnectionButton,
} from "@/components/ConnectionActionButtons";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { QrCodeIcon } from "lucide-react";

export const PageHeader = () => {
  // const connected = false;
  const { showModal } = useVisibilityState();
  const { currentHostState } = useHostState();
  const { currentPeerState } = usePeerState();
  return (
    <>
      <header className="flex h-16 shrink-0 justify-between items-center border-b px-4 w-full">
        <div className="flex shrink-0 items-center gap-2 h-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-bold">MeshDrop</h1>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(currentHostState.offer || currentPeerState.peerAnswer) && (
            <QrCodeIcon
              role="button"
              aria-label="View Connection QR Code"
              className="h-6 w-6 cursor-pointer"
              onClick={() => showModal(ModalIds.qrCodeResultModal)}
            />
          )}
          <CreateConnectionButton />
          <JoinConnectionButton />
        </div>
      </header>
    </>
  );
};
