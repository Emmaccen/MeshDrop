"use client";

import {
  ConnectionHealth,
  testP2PConnectivity,
} from "@/app/shared-functions/testConnection";
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
import { InfoIcon, QrCodeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const PageHeader = () => {
  // const connected = false;
  const { showModal } = useVisibilityState();
  const { currentHostState } = useHostState();
  const { currentPeerState } = usePeerState();
  const [connectionHealth, setConnectionHealth] =
    useState<ConnectionHealth | null>(null);
  useEffect(() => {
    const getConnectionHealth = async () => await testP2PConnectivity();
    getConnectionHealth().then((health) => {
      setConnectionHealth(health);
    });
  }, []);

  const ConnectionTooltipMessage = () => {
    if (!connectionHealth) return "Testing connection...";
    switch (connectionHealth.verdict) {
      case "p2p_possible":
        return "P2P connection possible";
      case "host_only":
        return "Connection might work only on same Wi-Fi";
      case "no_p2p":
        return "High chance of connection failure";
      default:
        return "Unknown connection state";
    }
  };

  const connectionColor = ["text-green-600", "text-yellow-600", "text-red-600"];

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
          {(connectionHealth?.verdict === "host_only" ||
            connectionHealth?.verdict === "no_p2p") && (
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon
                  className={` ${
                    connectionHealth?.verdict === "host_only"
                      ? connectionColor[1]
                      : connectionColor[2]
                  } w-4 h-4`}
                />
              </TooltipTrigger>
              <TooltipContent>{<ConnectionTooltipMessage />}</TooltipContent>
            </Tooltip>
          )}
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
