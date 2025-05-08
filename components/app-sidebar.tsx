import * as React from "react";

import { DropDownSwitcher } from "@/components/dropdown-switcher";
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

import { useHostState } from "@/app/store/host";
import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
import { usePeerState } from "@/app/store/peer";
import { Button } from "@/components/ui/button";
const data = {
  versions: ["Offline", "Automated"],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { showModal } = useVisibilityState();
  const { currentHostState } = useHostState();
  const { currentPeerState } = usePeerState();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <DropDownSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
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
        <div className="flex md:hidden flex-col gap-2 px-2">
          <Button
            size="sm"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => showModal(ModalIds.createConnectionUserNameModal)}
          >
            Create Connection
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex cursor-pointer"
            onClick={() => showModal(ModalIds.joinConnectionUserNameModal)}
          >
            Join connection
          </Button>
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
