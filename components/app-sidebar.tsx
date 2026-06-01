import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { PWAInstallButton } from "@/components/ui/PWAInstallButton";
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
import { MessageSquare, Pencil, Zap } from "lucide-react";

const USERNAME_KEY = "meshdrop_username";

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
  const pathname = usePathname();

  const [savedUsername, setSavedUsername] = React.useState<string>("");
  const [editingUsername, setEditingUsername] = React.useState(false);
  const [tempUsername, setTempUsername] = React.useState("");

  React.useEffect(() => {
    const saved = localStorage.getItem(USERNAME_KEY) ?? "";
    setSavedUsername(saved);
    setTempUsername(saved);
  }, []);

  const saveUsername = () => {
    if (tempUsername.trim()) {
      localStorage.setItem(USERNAME_KEY, tempUsername.trim());
      setSavedUsername(tempUsername.trim());
    }
    setEditingUsername(false);
  };

  const isOnFastPage = pathname === "/fast";

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <DropDownSwitcher mode={data.connectionMode} />
      </SidebarHeader>
      <SidebarContent>
        {/* Connected peer */}
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

        {/* Fast Send navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Modes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={!isOnFastPage}>
                  <Link href="/" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Standard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isOnFastPage}>
                  <Link href="/fast" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Fast Send</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        {/* Username chip */}
        <div className="px-2 pb-1">
          {editingUsername ? (
            <div className="flex gap-1">
              <input
                autoFocus
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") saveUsername();
                  if (e.key === "Escape") setEditingUsername(false);
                }}
                className="flex-1 text-xs border rounded px-2 py-1 bg-background outline-none focus:ring-1 focus:ring-primary"
                placeholder="Your name…"
              />
              <button
                onClick={saveUsername}
                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingUsername(true)}
              className="flex items-center gap-1.5 w-full text-xs text-muted-foreground hover:text-foreground transition-colors px-1 py-1 rounded hover:bg-muted/50 group"
              title="Edit your name"
            >
              <span className="truncate">
                {savedUsername ? savedUsername : "Set your name…"}
              </span>
              <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        <PWAInstallButton />
        {!isOnFastPage && (
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
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
