import * as React from "react";

import { useHostState } from "@/app/store/host";
import { DiscoveryMode } from "@/app/store/misc/types";
import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
import { usePeerState } from "@/app/store/peer";
import {
  CreateConnectionButton,
  JoinConnectionButton,
} from "@/components/ConnectionActionButtons";
import { DropDownSwitcher } from "@/components/dropdown-switcher";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { PWAInstallButton } from "@/components/ui/PWAInstallButton";
const data: {
  connectionMode: {
    mode: DiscoveryMode;
    enable: boolean;
  }[];
} = {
  connectionMode: [
    { mode: "offline", enable: true },
    { mode: "online", enable: true },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { showModal } = useVisibilityState();
  const { currentHostState } = useHostState();
  const { currentPeerState } = usePeerState();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <DropDownSwitcher mode={data.connectionMode} />
      </SidebarHeader>
      <SidebarContent>
        {(currentHostState.dataChannelReady ||
          currentPeerState.dataChannelReady) && (
          <SidebarGroup>
            <SidebarGroupLabel>Connected Peer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    {currentHostState.peerConnection
                      ? currentHostState.connectedUsers[0]
                      : currentPeerState.peerConnection
                      ? currentPeerState.connectedUsers[0]
                      : ""}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <PWAInstallButton />
        <div className="flex md:hidden flex-col gap-2 px-2">
          <CreateConnectionButton className="flex items-center gap-2 cursor-pointer" />
          <JoinConnectionButton className="flex items-center gap-2 cursor-pointer" />
          {(currentHostState.offer || currentPeerState.peerAnswer) && (
            <Button
              variant="outline"
              size="sm"
              className="flex cursor-pointer"
              onClick={() => showModal(ModalIds.qrCodeResultModal)}
            >
              Show QR Code
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
