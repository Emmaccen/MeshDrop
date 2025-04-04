"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Frown, Smile } from "lucide-react";
import { CreateConnectionUserNameModal } from "@/components/CreateConnectionUserNameModal";
interface FileTransferConnectionStatusProps {
  connected: boolean;
}

const FileTransferConnectionStatus = ({
  connected,
}: FileTransferConnectionStatusProps) => {
  if (connected)
    return (
      <Alert className="rounded-none border-y border-t-0 bg-primary/10 text-primary">
        <Smile className="h-4 w-4" />
        <AlertDescription>
          Connected and ready to transfer files
        </AlertDescription>
      </Alert>
    );

  return (
    <Alert className="rounded-none border-y border-t-0 bg-sidebar">
      <Frown className="h-4 w-4" />
      <AlertDescription className="flex text-xs sm:text-sm">
        Not connected. Click Connect to start transferring files.
      </AlertDescription>
    </Alert>
  );
};

export const PageHeader = () => {
  const connected = false;

  return (
    <>
      <header className="flex h-16 shrink-0 justify-between items-center border-b px-4 w-full">
        <div className="flex shrink-0 items-center gap-2 h-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-bold">MeshDrop</h1>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <CreateConnectionUserNameModal>
            <Button
              size="sm"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Smile className="h-4 w-4" /> Create Connection
            </Button>
          </CreateConnectionUserNameModal>
          <Button variant="outline" size="sm" className="cursor-pointer">
            Join connection
          </Button>
        </div>
      </header>
      <FileTransferConnectionStatus connected={connected} />
    </>
  );
};
