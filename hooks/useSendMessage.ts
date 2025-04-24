import { getMimeType } from "@/app/shared-functions/getMimeType";
import {
  CHUNK_SIZE_MESSAGE_SAFE_LIMIT,
  CHUNK_SIZE_SAFE_LIMIT,
} from "@/app/store/constants";
import { useFileManagerState } from "@/app/store/fileManager";
import { useMessengerState } from "@/app/store/messenger";
import { Message } from "@/app/store/messenger/types";
import { SafeDataChannelSender } from "@/lib/SafeDataChannelSender";
import { toast } from "sonner";

// export function* chunkUint8Array(data: Uint8Array, chunkSize: number) {
//   for (let i = 0; i < data.length; i += chunkSize) {
//     yield data.slice(i, i + chunkSize);
//   }
// }
export const useSendDataInChunks = () => {
  const { updateFileManagerStatePartially } = useFileManagerState();
  const chunkSender = async (
    dataChannel: RTCDataChannel | null,
    message: Message
  ) => {
    if (!dataChannel) return;
    const safeSender = new SafeDataChannelSender(dataChannel);

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

        // Send each chunk with metadata
        // Potential 🐛 here if you edit without thinking, if user sends 10k emojis and we've calc/assumed size for CHUNK_SIZE_SAFE_LIMIT above
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

          safeSender.enqueue(messageData);
        }
        break;
      case "file":
        // Handle file transfer here
        if (!message.file) return;

        const file = message.file;
        const totalFileChunks = Math.ceil(file.size / CHUNK_SIZE_SAFE_LIMIT);

        for (let i = 0; i < totalFileChunks; i++) {
          const slice = file.slice(
            i * CHUNK_SIZE_SAFE_LIMIT,
            (i + 1) * CHUNK_SIZE_SAFE_LIMIT
          );
          const buffer = await slice.arrayBuffer();
          const chunkMessage: Message = {
            ...message,
            chunkData: Array.from(new Uint8Array(buffer)),
            chunkIndex: i,
            totalChunks: totalFileChunks,
          };
          safeSender.enqueue(chunkMessage);
          updateFileManagerStatePartially({
            transferProgress: ((i + 1) / totalFileChunks) * 100,
          });
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
