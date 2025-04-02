"use client";
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
import { Button } from "@/components/ui/button";

export const CreateConnectionUserNameModal = ({
  children,
}: {
  children: React.JSX.Element;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Username</DialogTitle>
          <DialogDescription className="text-left">
            This is only used to identify your connection on other devices or
            peers
          </DialogDescription>
          <Input className="my-3" id="username" type="text" />
          <DialogFooter>
            <Button className="cursor-pointer">Save Username</Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
