"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { Provider } from "jotai";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/header";
export default function StoreFrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="">
          <PageHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </Provider>
  );
}
