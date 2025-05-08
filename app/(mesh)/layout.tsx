"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { Provider } from "jotai";

import { CreateConnectionUserNameModal } from "@/components/CreateConnectionUserNameModal";
import { PageHeader } from "@/components/header";
import { JoinConnectionUserNameModal } from "@/components/JoinConnectionUserNameModal";
import { QrCodeResultModal } from "@/components/QrCodeResultModal";
import { QrScannerModal } from "@/components/QrScannerModal";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import * as React from "react";
export default function StoreFrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <Toaster />
      <QrScannerModal />
      <CreateConnectionUserNameModal />
      <JoinConnectionUserNameModal />
      <QrCodeResultModal />
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
