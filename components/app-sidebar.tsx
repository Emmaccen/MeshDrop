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

import { hostState } from "@/app/store/host";
import { HostStateType } from "@/app/store/host/types";
import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
import { peerState } from "@/app/store/peer";
import { PeerStateType } from "@/app/store/peer/types";
import { Button } from "@/components/ui/button";
import { useConnectionStateManager } from "@/hooks/useConnectionStateManager";
const data = {
  versions: ["Offline", "Automated"],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { showModal } = useVisibilityState();
  const { values: host } = useConnectionStateManager<HostStateType>(hostState);
  const { values: peer } = useConnectionStateManager<PeerStateType>(peerState);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <DropDownSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
      </SidebarHeader>
      <SidebarContent>
        {host.dataChannelReady ||
          (peer.dataChannelReady && (
            <SidebarGroup>
              <SidebarGroupLabel>Connected Peer</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      {host.peerConnection
                        ? peer.username
                        : peer.peerAnswer
                        ? host.username
                        : ""}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
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
          <Button
            variant="outline"
            size="sm"
            className="flex cursor-pointer"
            onClick={() => showModal(ModalIds.qrCodeResultModal)}
          >
            Show QR Code
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
