import * as React from "react";

import { CreateConnectionUserNameModal } from "@/components/CreateConnectionUserNameModal";
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
import { Smile } from "lucide-react";
import { Button } from "./ui/button";
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
        <div className="flex md:hidden flex-col gap-2 px-2">
          <CreateConnectionUserNameModal>
            <Button
              size="sm"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Smile className="h-4 w-4" /> Create Connection
            </Button>
          </CreateConnectionUserNameModal>

          <Button variant="outline" size="sm" className="cursor-pointer">
            Join existing connection
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
