"use client";
import { useHostState } from "@/app/store/host";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateHostConnection } from "@/hooks/useCreateHostConnection";
import { useState } from "react";

export const CreateConnectionUserNameModal = ({
  children,
}: {
  children: React.JSX.Element;
}) => {
  const { updateHostStatePartially } = useHostState();
  const [username, setUserName] = useState("");
  const [open, setOpen] = useState(false);
  const { createHost } = useCreateHostConnection();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Username</DialogTitle>
          <DialogDescription className="text-left">
            This is only used to identify your connection on other devices or
            peers
          </DialogDescription>
          <Input
            value={username}
            onChange={(e) => setUserName(e.target.value)}
            className="my-3"
            id="username"
            type="text"
          />
          <DialogFooter>
            <Button
              onClick={() => {
                if (!username.trim()) return;
                updateHostStatePartially({
                  username: username,
                });
                createHost();
                setOpen(false);
              }}
              className="cursor-pointer"
            >
              Save Username
            </Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
