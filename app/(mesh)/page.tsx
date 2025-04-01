"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, SendHorizontal } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

const UploadFileSelection = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-900/75 shrink-0 rounded-full bg-muted/50 p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed"
        title="Send a file"
        aria-label="Send a file"
      >
        <Paperclip className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start">
        <DropdownMenuItem>Image</DropdownMenuItem>
        <DropdownMenuItem>PDF</DropdownMenuItem>
        <DropdownMenuItem>Text</DropdownMenuItem>
        <DropdownMenuItem>Video</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default function Page() {
  return (
    <>
      <ScrollArea className="flex-1 overflow-y-auto py-6 px-5 w-full max-w-[800px] mx-auto">
        Content goes here
      </ScrollArea>
      <div className="w-full max-w-[800px] mx-auto mb-6 px-5">
        <div className="rounded-b-lg w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="relative flex w-full items-center gap-2"
          >
            <div className="absolute flex left-3 z-10">
              <UploadFileSelection />
            </div>
            <TextareaAutosize
              autoComplete="off"
              name="message"
              placeholder="Send message..."
              className="flex h-16 max-h-24 w-full resize-none border items-center overflow-hidden rounded-lg px-14 py-[22px] text-sm outline-none placeholder:text-primary/60 focus:ring-1 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed  disabled:opacity-50  sm:text-base"
            />
            <div className="absolute right-3 flex items-center">
              <button
                title="Send Message"
                type="submit"
                aria-label="Send Message"
                className="hover:bg-900/75 shrink-0 rounded-full bg-muted/50 p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
