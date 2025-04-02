"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { Provider } from "jotai";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
export default function StoreFrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <Toaster />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <PageHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </Provider>
  );
}
