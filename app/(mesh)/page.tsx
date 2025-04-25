"use client";

import { hostState } from "@/app/store/host";
import { HostStateType } from "@/app/store/host/types";
import { useMessengerState } from "@/app/store/messenger";
import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
import { peerState } from "@/app/store/peer";
import { PeerStateType } from "@/app/store/peer/types";
import { Button } from "@/components/ui/button";
import {
  getFilePreviewComponent,
  selectAppropriateChatBubble,
} from "@/components/ui/chat/ChatBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConnectionStateManager } from "@/hooks/useConnectionStateManager";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useTransferFile } from "@/hooks/useTransferFile";
import { Paperclip, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Page() {
  const [message, setMessage] = useState("");
  const { sendMessage } = useSendMessage();
  const { values: host } = useConnectionStateManager<HostStateType>(hostState);
  const { values: peer } = useConnectionStateManager<PeerStateType>(peerState);
  const { currentMessengerState } = useMessengerState();
  const { showModal, imVisible, hideModal } = useVisibilityState();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [isWho, setIsWho] = useState<"host" | "peer" | "unknown">("unknown");
  const { startTransfer } = useTransferFile();

  const send = () => {
    const id = crypto.randomUUID();
    if (host.peerConnection)
      sendMessage(
        {
          id,
          message,
          timestamp: new Date().toISOString(),
          sender: host.username ?? "host",
          senderId: host.userId,
          messageType: "message",
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
          messageType: "message",
        },
        peer.dataChannel
      );
    setMessage("");
  };

  const sendFile = () => {
    const id = crypto.randomUUID();
    if (!selectedFile) return;
    const file = selectedFile;
    if (host.peerConnection)
      startTransfer(host.dataChannel, {
        id,
        message,
        timestamp: new Date().toISOString(),
        sender: host.username ?? "host",
        senderId: host.userId,
        messageType: "file",
        file: file,
      });
    else
      startTransfer(peer.dataChannel, {
        id,
        message,
        timestamp: new Date().toISOString(),
        sender: peer.username ?? "peer",
        senderId: peer.userId,
        messageType: "file",
        file: file,
      });
    setMessage("");
    hideModal(ModalIds.fileMessageCaptionModal);
    setSelectedFile(null);
  };

  useEffect(() => {
    if (selectedFile) {
      showModal(ModalIds.fileMessageCaptionModal);
    }
  }, [selectedFile]);

  const chatBubble = useMemo(
    () =>
      selectedFile &&
      getFilePreviewComponent({
        file: selectedFile,
        fileName: selectedFile?.name,
        size: selectedFile?.size,
        fileType: selectedFile?.type,
      }),
    [selectedFile]
  );

  if (!host.peerConnection && !peer.peerConnection) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-center text-muted-foreground">
            No connection established yet.
          </p>
          <p className="text-center text-muted-foreground">
            Please create or join a connection to start sharing files.
          </p>
        </div>
        <div className="md:hidden flex flex-col gap-2 px-2">
          <Button
            size="sm"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => showModal(ModalIds.createConnectionUserNameModal)}
          >
            Create Connection
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex cursor-pointer"
            onClick={() => showModal(ModalIds.joinConnectionUserNameModal)}
          >
            Join connection
          </Button>
        </div>
      </div>
    );
  }

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
                  {selectAppropriateChatBubble(message)}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <Dialog
        open={imVisible(ModalIds.fileMessageCaptionModal)}
        onOpenChange={() => {
          setSelectedFile(null);
          hideModal(ModalIds.fileMessageCaptionModal);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="truncate break-all text-xs">
              {selectedFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-hidden flex justify-center items-center">
            {chatBubble}
          </div>
          <Input
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            onKeyUp={(e) => {
              if (e.key !== "Enter") return;
              send();
            }}
            name="message"
            placeholder="Caption your file?"
          />
          <DialogFooter>
            <Button
              onClick={() => {
                sendFile();
              }}
              className="cursor-pointer"
            >
              Send File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
              <label
                title="upload a file"
                aria-label="upload a file"
                htmlFor="fileUpload"
                className="hover:bg-900/75 cursor-pointer shrink-0 rounded-full bg-muted/50 p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed"
              >
                <Paperclip aria-hidden className="h-4 w-4" />
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] || null);
                  }}
                />
              </label>
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
