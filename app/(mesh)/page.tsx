"use client";

import { hostState } from "@/app/store/host";
import { HostStateType } from "@/app/store/host/types";
import { useMessengerState } from "@/app/store/messenger";
import { peerState } from "@/app/store/peer";
import { PeerStateType } from "@/app/store/peer/types";
import { ChatBubble } from "@/components/ui/chat/ChatBubble";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConnectionStateManager } from "@/hooks/useConnectionStateManager";
import { useSendMessage } from "@/hooks/useSendMessage";
import { Paperclip, SendHorizontal } from "lucide-react";
import { nanoid } from "nanoid";
import { useState } from "react";
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
  const [message, setMessage] = useState("");
  const { sendMessage } = useSendMessage();
  const { values: host } = useConnectionStateManager<HostStateType>(hostState);
  const { values: peer } = useConnectionStateManager<PeerStateType>(peerState);
  const { currentMessengerState } = useMessengerState();
  // const [isWho, setIsWho] = useState<"host" | "peer" | "unknown">("unknown");

  const send = () => {
    const id = nanoid(24);
    if (host.peerConnection)
      sendMessage(
        {
          id,
          message,
          timestamp: new Date().toISOString(),
          sender: host.username ?? "host",
          senderId: host.userId,
          type: "message",
        },
        host.dataChannel
      );
    else
      sendMessage(
        {
          id,
          message,
          timestamp: new Date().toISOString(),
          sender: peer.username ?? "peer",
          senderId: peer.userId,
          type: "message",
        },
        peer.dataChannel
      );
    setMessage("");
  };

  // useEffect(() => {
  //   if (host.peerConnection) setIsWho("host");
  //   else if (peer.peerConnection) setIsWho("peer");
  //   else setIsWho("unknown");
  // }, [host.peerConnection, peer.peerConnection]);

  return (
    <>
      <ScrollArea className="flex-1 overflow-y-auto py-6 px-5 w-full max-w-[800px] mx-auto">
        {currentMessengerState.messages.length > 0 && (
          <div className="flex flex-col gap-2">
            {currentMessengerState.messages.map((message) => {
              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === (host.userId || peer.userId)
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <ChatBubble {...message} />
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <div className="w-full max-w-[800px] mx-auto mb-6 px-5">
        <div className="rounded-b-lg w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="relative flex w-full items-center gap-2"
          >
            <div className="absolute flex left-3 z-10">
              <UploadFileSelection />
            </div>
            <TextareaAutosize
              onChange={(e) => setMessage(e.target.value)}
              value={message}
              onKeyUp={(e) => {
                if (e.key !== "Enter") return;
                send();
              }}
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
