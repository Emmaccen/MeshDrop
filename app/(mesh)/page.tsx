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
import { useSilentAudioKeepAlive } from "@/hooks/useSilentAudioKeepAlive";
import { useTransferFile } from "@/hooks/useTransferFile";
import { Paperclip, SendHorizontal, Wifi, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import {
  CreateConnectionButton,
  JoinConnectionButton,
} from "@/components/ConnectionActionButtons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trackPWAUsage } from "@/hooks/usePWAInstallTracking";

const USERNAME_KEY = "meshdrop_username";

export default function Page() {
  const [message, setMessage] = useState("");
  const { sendMessage } = useSendMessage();
  const { values: host } = useConnectionStateManager<HostStateType>(hostState);
  const { values: peer } = useConnectionStateManager<PeerStateType>(peerState);
  const { currentMessengerState } = useMessengerState();
  const { showModal, imVisible, hideModal } = useVisibilityState();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { startTransfer } = useTransferFile();

  const { start: startKeepAlive, stop: stopKeepAlive } =
    useSilentAudioKeepAlive();

  const isConnected =
    host.connectionState === "connected" ||
    peer.connectionState === "connected";

  const savedUsername =
    typeof window !== "undefined"
      ? (localStorage.getItem(USERNAME_KEY) ?? "")
      : "";

  useEffect(() => {
    trackPWAUsage();
  }, []);

  // Keep-alive: start when connected, stop when not
  useEffect(() => {
    if (isConnected) {
      startKeepAlive();
    } else {
      stopKeepAlive();
    }
  }, [isConnected, startKeepAlive, stopKeepAlive]);

  // Scroll to bottom using sentinel element (reliable with Radix ScrollArea)
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [currentMessengerState.messages.length]);

  const send = () => {
    if (!message.trim()) return;
    const id = crypto.randomUUID();
    const senderName =
      savedUsername ||
      (host.peerConnection
        ? (host.username ?? "host")
        : (peer.username ?? "peer"));

    if (host.peerConnection)
      sendMessage(
        {
          id,
          message,
          timestamp: new Date().toISOString(),
          sender: senderName,
          senderId: host.userId,
          messageType: "message",
        },
        host.dataChannel,
      );
    else
      sendMessage(
        {
          id,
          message,
          timestamp: new Date().toISOString(),
          sender: senderName,
          senderId: peer.userId,
          messageType: "message",
        },
        peer.dataChannel,
      );
    setMessage("");
  };

  const sendFile = (multiFile?: File) => {
    const id = crypto.randomUUID();
    if (!selectedFile && !multiFile) return;
    const file = selectedFile ?? multiFile;
    const senderName =
      savedUsername ||
      (host.peerConnection
        ? (host.username ?? "host")
        : (peer.username ?? "peer"));

    if (host.peerConnection)
      startTransfer(host.dataChannel, {
        id,
        message,
        timestamp: new Date().toISOString(),
        sender: senderName,
        senderId: host.userId,
        messageType: "file",
        file: file,
      });
    else
      startTransfer(peer.dataChannel, {
        id,
        message,
        timestamp: new Date().toISOString(),
        sender: senderName,
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
    [selectedFile],
  );

  if (!host.peerConnection && !peer.peerConnection) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 px-4">
        {/* Onboarding card */}
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold">Get Started</h2>
            <p className="text-sm text-muted-foreground">
              Follow the steps below to connect two devices
            </p>
          </div>

          {/* Same-network notice */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
            <Wifi className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-800 dark:text-amber-300">
              <strong>Both devices must be on the same Wi-Fi network</strong>{" "}
              (same router, or one device sharing a hotspot to the other). Files
              transfer directly between devices — no internet required.
            </p>
          </div>

          {/* Steps */}
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                1
              </span>
              <div>
                <p className="text-sm font-medium">Choose a connection mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  In the sidebar, pick <strong>Online</strong> (share a room
                  code — internet needed only for the handshake, not the file
                  transfer) or <strong>Offline</strong> (QR code scan — works
                  with no internet at all).
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                2
              </span>
              <div>
                <p className="text-sm font-medium">
                  Create a connection on this device
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap <strong>Create Connection</strong> above. A QR code or
                  room code will be generated.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                3
              </span>
              <div>
                <p className="text-sm font-medium">
                  Join from the other device
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  On the second device, open MeshDrop and tap{" "}
                  <strong>Join Connection</strong>, then scan the QR code or
                  enter the room code.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                4
              </span>
              <div>
                <p className="text-sm font-medium">Start sharing!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use the file picker or type a message. Files go directly
                  device-to-device.
                </p>
              </div>
            </li>
          </ol>

          {/* Fast Send upsell */}
          <div className="rounded-lg border bg-muted/40 p-3 text-sm flex items-start gap-3">
            <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Sending large files?{" "}
              <Link
                href="/fast"
                className="text-foreground font-medium underline underline-offset-2 hover:opacity-75 transition-opacity"
              >
                Try Fast Send
              </Link>{" "}
              — up to 4× faster using parallel channels.
            </p>
          </div>

          {/* Mobile action buttons */}
          <div className="md:hidden flex flex-col gap-2">
            <CreateConnectionButton className="flex items-center gap-2 cursor-pointer" />
            <JoinConnectionButton className="flex items-center gap-2 cursor-pointer" />
          </div>
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
                  {selectAppropriateChatBubble(
                    message,
                    message.senderId === (host.userId || peer.userId),
                  )}
                </div>
              );
            })}
            {/* Scroll sentinel */}
            <div ref={scrollEndRef} />
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
              sendFile();
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
        {host.connectionState !== "connected" &&
          peer.connectionState !== "connected" &&
          !!currentMessengerState.messages.length && (
            <div className="flex justify-center items-center">
              <p className="text-sm bg-destructive p-2 rounded-lg mb-2">
                Unable to establish connection to other device. Please reconnect
              </p>
            </div>
          )}
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
                className={`hover:bg-900/75 shrink-0 rounded-full bg-muted/50 p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isConnected
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                <Paperclip aria-hidden className="h-4 w-4" />
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  multiple={true}
                  disabled={!isConnected}
                  onChange={(e) => {
                    if (!e.target.files?.[0]) return;
                    if (e.target.files.length === 1) {
                      setSelectedFile(e.target.files?.[0] || null);
                    } else {
                      // if multiple files are selected, send them one by one
                      Array.from(e.target.files).forEach((file, index) => {
                        setTimeout(() => {
                          sendFile(file);
                        }, index * 500);
                      });
                    }
                  }}
                />
              </label>
            </div>
            <TextareaAutosize
              onChange={(e) => setMessage(e.target.value)}
              value={message}
              onKeyUp={(e) => {
                if (e.key === "Enter" && !e.shiftKey) send();
              }}
              autoComplete="off"
              name="message"
              ref={inputRef}
              disabled={!isConnected}
              onHeightChange={(height, {}) => {
                if (!inputRef.current) return;
                if (height >= 140) inputRef.current.style.overflowY = "auto";
                else inputRef.current.style.overflowY = "hidden";
              }}
              placeholder={
                isConnected
                  ? "Send message…"
                  : "Connect a device to start chatting…"
              }
              className="flex h-16 max-h-24 w-full resize-none border items-center overflow-hidden rounded-lg px-14 py-[22px] text-base outline-none placeholder:text-primary/60 focus:ring-1 focus:ring-primary focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="absolute right-3 flex items-center">
              <button
                title="Send Message"
                type="submit"
                aria-label="Send Message"
                disabled={!isConnected}
                className="hover:bg-900/75 shrink-0 rounded-full bg-muted/50 p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
