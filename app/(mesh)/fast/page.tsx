"use client";
import { AlertCircle, Paperclip, Send, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  getFilePreviewComponent,
  selectAppropriateChatBubble,
} from "@/components/ui/chat/ChatBubble";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useCreateMultiChannelHostConnection } from "@/hooks/fast-send/useCreateMultiChannelHostConnection";
import { useMultiChannelConnect } from "@/hooks/fast-send/useMultiChannelConnect";
import { useMultiChannelTransferFile } from "@/hooks/fast-send/useMultiChannelTransferFile";
import { useHandleDataChannelMessages } from "@/hooks/useHandleDataChannelMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useSilentAudioKeepAlive } from "@/hooks/useSilentAudioKeepAlive";

import { FirestoreSignaling } from "@/lib/FirestoreSignaling";

import { useHostMultiConnectionState } from "@/app/store/host";
import { useMessengerState } from "@/app/store/messenger";
import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
import { usePeerMultiConnectionState } from "@/app/store/peer";

const USERNAME_KEY = "meshdrop_username";

const FastSend = () => {
  // Store hooks
  const { currentMultiConnectionHostState: hostMulti } =
    useHostMultiConnectionState();
  const { currentMultiConnectionPeerState: peerMulti } =
    usePeerMultiConnectionState();
  const { currentMessengerState } = useMessengerState();
  const { showModal, imVisible, hideModal } = useVisibilityState();

  // Logic hooks
  const { createMultiChannelHost } = useCreateMultiChannelHostConnection();
  const { requestMultiChannelConnectionFromHost } = useMultiChannelConnect();
  const { startMultiChannelTransfer } = useMultiChannelTransferFile();
  const { handleDataChannelMessage, handleChannelClose } =
    useHandleDataChannelMessages();
  const { sendMessage } = useSendMessage();
  const { start: startKeepAlive, stop: stopKeepAlive } =
    useSilentAudioKeepAlive();
  const firestore = FirestoreSignaling.getInstance();

  // Local state
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomIdPeer, setRoomIdPeer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [peerLoading, setPeerLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persisted username
  const savedUsername =
    typeof window !== "undefined"
      ? (localStorage.getItem(USERNAME_KEY) ?? "")
      : "";

  // Determine if we are connected
  const isHostConnected =
    hostMulti.dataChannelReady &&
    hostMulti.dataChannelReady.length > 0 &&
    hostMulti.dataChannelReady.every((ready: boolean) => ready);
  const isPeerConnected =
    peerMulti.dataChannelReady &&
    peerMulti.dataChannelReady.length > 0 &&
    peerMulti.dataChannelReady.every((ready: boolean) => ready);
  const isConnected = isHostConnected || isPeerConnected;

  // Derive connection health from connection states
  const connectionStates = isHostConnected
    ? hostMulti.connectionState
    : peerMulti.connectionState;
  const hasDisconnectedChannel =
    isConnected &&
    connectionStates &&
    connectionStates.length > 0 &&
    connectionStates.some(
      (state: RTCPeerConnectionState) =>
        state === "disconnected" || state === "failed" || state === "closed",
    );
  const allChannelsHealthy =
    isConnected &&
    connectionStates &&
    connectionStates.length > 0 &&
    connectionStates.every(
      (state: RTCPeerConnectionState) => state === "connected",
    );

  // Use a ref to hold the latest handler to avoid re-binding onmessage on every render
  const handleMessageRef = useRef(handleDataChannelMessage);
  handleMessageRef.current = handleDataChannelMessage;

  // Listen for messages on all channels - only re-bind when channels actually change
  useEffect(() => {
    const channels = hostMulti.dataChannel || peerMulti.dataChannel;
    if (channels) {
      channels.forEach((channel: RTCDataChannel) => {
        channel.onmessage = (event) => handleMessageRef.current(event);
      });
    }
  }, [hostMulti.dataChannel, peerMulti.dataChannel]);

  // Start silent audio keep-alive when connected, stop on disconnect
  useEffect(() => {
    if (isConnected) {
      startKeepAlive();
    } else {
      stopKeepAlive();
    }
  }, [isConnected, startKeepAlive, stopKeepAlive]);

  // When a channel disconnects mid-transfer: single toast + clean up in-flight transfers
  const disconnectHandledRef = useRef(false);
  useEffect(() => {
    if (hasDisconnectedChannel && !disconnectHandledRef.current) {
      disconnectHandledRef.current = true;
      stopKeepAlive();
      handleChannelClose();
      toast.error(
        "Connection lost. Any active transfers have been cancelled.",
        {
          id: "channel-disconnect", // deduplication key
        },
      );
    }
    if (!hasDisconnectedChannel) {
      disconnectHandledRef.current = false;
    }
  }, [hasDisconnectedChannel, stopKeepAlive, handleChannelClose]);

  // Scroll to bottom on new message using scrollIntoView on a sentinel element
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [currentMessengerState.messages.length]);

  // Handle file selection modal
  useEffect(() => {
    if (selectedFile) {
      showModal(ModalIds.fileMessageCaptionModal);
    }
  }, [selectedFile, showModal]);

  const sendFile = () => {
    if (!selectedFile) return;
    if (hasDisconnectedChannel) {
      toast.error("Connection lost. Please reconnect before sending.", {
        id: "no-channel",
      });
      return;
    }

    const channels = hostMulti.dataChannel || peerMulti.dataChannel;
    if (!channels || channels.length === 0) {
      toast.error("No active channels available.");
      return;
    }

    const id = crypto.randomUUID();
    const senderId = hostMulti.userId || peerMulti.userId || "unknown";
    const sender = savedUsername || (isHostConnected ? "host" : "peer");

    startMultiChannelTransfer(channels, {
      id,
      message, // Caption
      timestamp: new Date().toISOString(),
      sender,
      senderId,
      messageType: "file",
      file: selectedFile,
      size: selectedFile.size,
      fileName: selectedFile.name,
    });

    setMessage("");
    hideModal(ModalIds.fileMessageCaptionModal);
    setSelectedFile(null);
  };

  const sendText = () => {
    if (!message.trim() || hasDisconnectedChannel) return;

    const channels = hostMulti.dataChannel || peerMulti.dataChannel;
    if (!channels || channels.length === 0) return;

    const sender = savedUsername || (isHostConnected ? "host" : "peer");
    const senderId = hostMulti.userId || peerMulti.userId || "unknown";

    sendMessage(
      {
        id: crypto.randomUUID(),
        message: message.trim(),
        timestamp: new Date().toISOString(),
        sender,
        senderId,
        messageType: "message",
      },
      channels[0],
    );
    setMessage("");
  };

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

  // Connection handlers
  const handleCreateConnection = async () => {
    setLoading(true);
    const id = await createMultiChannelHost();
    setLoading(false);
    if (id) setRoomId(id);
  };

  const handleJoinConnection = async () => {
    if (!roomIdPeer?.trim()) return;
    setPeerLoading(true);
    const hostOffer = await firestore.getMultiChannelHostOffer(
      roomIdPeer.trim(),
    );

    if (hostOffer !== null) {
      requestMultiChannelConnectionFromHost(
        hostOffer.map((offer) => JSON.stringify(offer)),
        roomIdPeer.trim(),
      );
    } else {
      toast.error("Room ID not found.");
    }
    setPeerLoading(false);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 w-full max-w-md mx-auto gap-6">
        {!roomId ? (
          <div className="w-full flex flex-col gap-6">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">Fast Send</h2>
              <p className="text-sm text-muted-foreground">
                Transfers large files up to 4× faster using parallel
                connections.
              </p>
            </div>

            {/* How it works */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How it works</p>
              <ol className="space-y-1.5 list-decimal list-inside">
                <li>
                  One device creates a session and shares the{" "}
                  <strong>Room ID</strong>.
                </li>
                <li>The other device enters the Room ID to join.</li>
                <li>
                  MeshDrop opens 4 parallel channels for maximum throughput.
                </li>
                <li>Files fly across — fully device-to-device, no cloud.</li>
              </ol>
            </div>

            {/* Same-network notice */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-800 dark:text-amber-300">
                Both devices must be on the <strong>same Wi-Fi network</strong>{" "}
                (same router or hotspot). The Room ID is shared via internet for
                the handshake only — actual file transfer is local.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Button
                loading={loading}
                onClick={handleCreateConnection}
                className="w-full h-12 text-lg"
              >
                Create Fast Session
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or join existing
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Room ID"
                  value={roomIdPeer ?? ""}
                  onChange={(e) => setRoomIdPeer(e.target.value.toLowerCase())}
                  onKeyUp={(e) => e.key === "Enter" && handleJoinConnection()}
                />
                <Button loading={peerLoading} onClick={handleJoinConnection}>
                  Join
                </Button>
              </div>
            </div>

            {/* Back to Standard */}
            <p className="text-center text-xs text-muted-foreground">
              Want to chat too?{" "}
              <Link
                href="/"
                className="text-foreground underline underline-offset-2 hover:opacity-75 transition-opacity"
              >
                Use Standard mode
              </Link>
            </p>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-muted-foreground">Share this Room ID</p>
              <h3 className="text-5xl font-mono font-bold tracking-wider select-all">
                {roomId}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
              Waiting for peer to connect…
            </p>
            <p className="text-xs text-muted-foreground">
              Make sure the other device is on the same Wi-Fi network.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full w-full relative overflow-hidden min-h-0">
      {/* Connection status indicator */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b bg-background/95">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isHostConnected ? "HOST" : "PEER"} • MULTI-CHANNEL •{" "}
          {connectionStates?.length || 0} shards
        </div>
        <div className="flex items-center gap-1.5">
          {allChannelsHealthy ? (
            <span className="flex items-center gap-1 text-xs text-emerald-500">
              <Wifi className="h-3 w-3" />
              Connected
            </span>
          ) : hasDisconnectedChannel ? (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <WifiOff className="h-3 w-3" />
              Connection lost
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-500 animate-pulse">
              <Wifi className="h-3 w-3" />
              Connecting…
            </span>
          )}
        </div>
      </div>

      {/* Disconnection banner */}
      {hasDisconnectedChannel && (
        <div className="flex justify-center items-center">
          <p className="text-sm bg-destructive text-destructive-foreground w-full text-center p-2">
            Connection lost. Please start a new session to continue.
          </p>
        </div>
      )}

      <ScrollArea className="flex-1 min-h-0 p-4 max-w-[800px] mx-auto w-full">
        <div className="flex flex-col gap-4 pb-4">
          {currentMessengerState.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === (hostMulti.userId || peerMulti.userId)
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {selectAppropriateChatBubble(
                msg,
                msg.senderId === (hostMulti.userId || peerMulti.userId),
              )}
            </div>
          ))}
          {/* Scroll sentinel */}
          <div ref={scrollEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full border-t">
        <form
          className="relative flex items-center gap-2 max-w-[800px] mx-auto w-full"
          onSubmit={(e) => e.preventDefault()}
        >
          <label
            className={`p-3 rounded-full hover:bg-muted/50 transition-colors ${
              isConnected && !hasDisconnectedChannel
                ? "cursor-pointer"
                : "cursor-not-allowed opacity-50"
            }`}
            title="Upload file"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
            <input
              type="file"
              className="hidden"
              multiple
              disabled={!isConnected || !!hasDisconnectedChannel}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
          </label>

          <TextareaAutosize
            ref={inputRef}
            minRows={1}
            maxRows={4}
            placeholder={
              hasDisconnectedChannel ? "Connection lost…" : "Caption…"
            }
            disabled={!!hasDisconnectedChannel}
            className="flex-1 bg-muted/30 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none disabled:cursor-not-allowed disabled:opacity-50"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
          />
          <div className="absolute right-3 flex items-center">
            <button
              title="Send Message"
              type="button"
              aria-label="Send Message"
              disabled={!!hasDisconnectedChannel || !message.trim()}
              onClick={sendText}
              className={`p-2 rounded-full transition-colors ${
                message.trim() && !hasDisconnectedChannel
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  : "bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed"
              }`}
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </div>
        </form>
      </div>

      <Dialog
        open={imVisible(ModalIds.fileMessageCaptionModal)}
        onOpenChange={() => {
          setSelectedFile(null);
          hideModal(ModalIds.fileMessageCaptionModal);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="truncate">{selectedFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">{chatBubble}</div>
          <Input
            placeholder="Add a caption…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendFile()}
          />
          <DialogFooter>
            <Button onClick={sendFile}>Send File</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FastSend;
