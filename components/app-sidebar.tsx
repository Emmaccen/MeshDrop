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
import { Button } from "./ui/button";
import { Frown, Smile } from "lucide-react";

const data = {
  versions: ["Offline", "Automated"],
  navMain: [
    {
      title: "Connected Peers",
      items: [
        {
          title: "IPhone 14",
          isActive: false,
        },
        {
          title: "Parlor TV",
          isActive: false,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const connected = false;

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <DropDownSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={item.isActive}>
                      {item.title}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <div className="flex sm:hidden flex-col gap-2 px-2">
          <Button
            variant={connected ? "destructive" : "default"}
            size="sm"
            className="flex items-center gap-2 cursor-pointer"
          >
            {connected ? (
              <>
                <Frown className="h-4 w-4" /> Disconnect
              </>
            ) : (
              <>
                <Smile className="h-4 w-4" /> Create Connection
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="cursor-pointer">
            Join existing connection
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
