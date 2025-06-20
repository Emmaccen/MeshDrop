import { getMimeType } from "@/app/shared-functions/getMimeType";
import {
  CHUNK_SIZE_MESSAGE_SAFE_LIMIT,
  CHUNK_SIZE_SAFE_LIMIT,
} from "@/app/store/constants";
import { useFileManagerState } from "@/app/store/fileManager";
import { useMessengerState } from "@/app/store/messenger";
import { Message } from "@/app/store/messenger/types";
import { FirestoreSignaling } from "@/lib/FirestoreSignaling";
import { SafeDataChannelSender } from "@/lib/SafeDataChannelSender";
import { toast } from "sonner";
import { logEvent } from "firebase/analytics";
import { WakeLockManager } from "@/lib/WakeLockManager";
export const useSendDataInChunks = () => {
  const { updateFileManagerStatePartially } = useFileManagerState();
  const keepMyScreenOn = WakeLockManager.getInstance();

  const signaling = FirestoreSignaling.getInstance();
  const analytics = signaling.getAnalytics();
  const chunkSender = async (
    dataChannel: RTCDataChannel | null,
    message: Message
  ) => {
    // use dataChannelReady for this check
    if (!dataChannel) return;

    if (analytics) {
      logEvent(analytics, "files_sent", {
        timestamp: new Date().toISOString(),
      });
    }

    switch (message.messageType) {
      case "message":
      case "metadata":
        const encoded = new TextEncoder().encode(JSON.stringify(message));
        const byteSize = encoded.length;
        const totalChunks = Math.ceil(encoded.length / CHUNK_SIZE_SAFE_LIMIT);

        if (byteSize <= CHUNK_SIZE_SAFE_LIMIT) {
          dataChannel.send(JSON.stringify(message));
          return;
        }
        let messageChunksSent = 0;
        const MessageSafeSender = new SafeDataChannelSender(
          dataChannel,
          undefined,
          (message) => {
            const parsed = JSON.parse(message) as Message;
            if (parsed.messageType === "file") {
              messageChunksSent++;
              updateFileManagerStatePartially({
                [parsed.id]: {
                  transferProgress: (messageChunksSent / totalFileChunks) * 100,
                  isTransferring: true,
                },
              });
            }
          }
        );

        // Send each chunk with metadata
        // Potential 🐛 here. Edit with caution, if user sends 10k emojis and we've calc/assumed size for CHUNK_SIZE_SAFE_LIMIT above
        // additional Array.from(chunk) and metadata increases this limit, so we're going with CHUNK_SIZE_MESSAGE_SAFE_LIMIT

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE_MESSAGE_SAFE_LIMIT;
          const end = Math.min(start + CHUNK_SIZE_MESSAGE_SAFE_LIMIT, byteSize);
          const chunk = encoded.slice(start, end);

          const messageData: Message = {
            ...message,
            message: "", // Clear the message field we don't want to send un-chunked
            chunkData: Array.from(chunk), // Convert to array for JSON serialization
            chunkIndex: i,
            totalChunks,
          };

          MessageSafeSender.enqueue(messageData);
        }
        break;
      case "file":
        // Handle file transfer here
        if (!message.file) return;

        if (
          keepMyScreenOn.isWakeLockSupported &&
          !keepMyScreenOn.isWakeLockActive
        ) {
          keepMyScreenOn.requestWakeLock();
        }

        const file = message.file;
        const totalFileChunks = Math.ceil(file.size / CHUNK_SIZE_SAFE_LIMIT);
        let fileChunksSent = 0;
        const safeSender = new SafeDataChannelSender(
          dataChannel,
          undefined,
          (message) => {
            const parsed = JSON.parse(message) as Message;
            if (parsed.messageType === "file") {
              fileChunksSent++;
              updateFileManagerStatePartially({
                [parsed.id]: {
                  transferProgress: (fileChunksSent / totalFileChunks) * 100,
                  isTransferring: true,
                },
              });
            }
            if (parsed.chunkIndex === parsed.totalChunks) {
              if (
                keepMyScreenOn.isWakeLockSupported &&
                keepMyScreenOn.isWakeLockActive
              ) {
                keepMyScreenOn.stop();
              }
            }
          }
        );
        for (let i = 0; i < totalFileChunks; i++) {
          const slice = file.slice(
            i * CHUNK_SIZE_SAFE_LIMIT,
            (i + 1) * CHUNK_SIZE_SAFE_LIMIT
          );
          const buffer = await slice.arrayBuffer();
          const chunkMessage: Message = {
            ...message,
            chunkData: Array.from(new Uint8Array(buffer)),
            chunkIndex: i + 1,
            totalChunks: totalFileChunks,
          };
          // Wait if overflow flag is active
          while (safeSender.isFlushingOverflow) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }

          safeSender.enqueue(chunkMessage);
        }

        break;

      default:
        break;
    }
  };
  return { chunkSender };
};

export const useSendMessage = () => {
  const { updateIfExistAddIfNot } = useMessengerState();
  const { chunkSender } = useSendDataInChunks();

  const sendMessage = (
    message: Message,
    dataChannel: RTCDataChannel | null
  ) => {
    if (dataChannel && dataChannel?.readyState === "open") {
      try {
        chunkSender(dataChannel, message);
        updateIfExistAddIfNot(message.id, message);

        if (!message.file) return;
        const normalizedType = getMimeType(message.file);
        const messageWithMetaData: Message = {
          ...message,
          url: URL.createObjectURL(message.file!),
          size: message.size,
          fileName: message.fileName,
          fileType: normalizedType,
        };
        updateIfExistAddIfNot(messageWithMetaData.id, messageWithMetaData);
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message. Please check connection.");
      }
    } else {
      console.error(
        "Data channel is not open. Current state:",
        dataChannel?.readyState
      );
      toast.error(
        `Connection is not ready. Current state: ${dataChannel?.readyState}`
      );
    }
  };

  return { sendMessage };
};
