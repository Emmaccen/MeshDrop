"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { DiscoveryMode } from "@/app/store/misc/types";
import { useMiscState } from "@/app/store/misc";

type Mode = {
  mode: DiscoveryMode;
  enable: boolean;
};
export function DropDownSwitcher({ mode }: { mode: Mode[] }) {
  const { currentMiscState, updateMiscStatePartially } = useMiscState();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex flex-col gap-1 leading-none">
                <span className="font-medium">Discovery Mode</span>
                <span className="capitalize text-xs">
                  {currentMiscState.discoveryMode}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {mode.map((mode) => (
              <DropdownMenuItem
                disabled={!mode.enable}
                key={mode.mode}
                onSelect={() =>
                  updateMiscStatePartially({
                    discoveryMode: mode.mode,
                  })
                }
              >
                {mode.mode}{" "}
                {mode.mode === currentMiscState.discoveryMode && (
                  <Check className="ml-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
