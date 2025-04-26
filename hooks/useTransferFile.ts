import { getMimeType } from "@/app/shared-functions/getMimeType";
import { CHUNK_SIZE_SAFE_LIMIT } from "@/app/store/constants";
import { useFileManagerState } from "@/app/store/fileManager";
import { FileTransferMetadata } from "@/app/store/fileManager/types";
import { Message } from "@/app/store/messenger/types";
import { useSendMessage } from "@/hooks/useSendMessage";

export const useTransferFile = () => {
  const { updateFileManagerStatePartially } = useFileManagerState();
  const { sendMessage } = useSendMessage();
  const startTransfer = async (
    dataChannel: RTCDataChannel | null,
    message: Message
  ) => {
    if (!message.file || !dataChannel || dataChannel.readyState !== "open")
      return;

    updateFileManagerStatePartially({
      [message.id]: {
        transferProgress: 0,
        isTransferring: true,
      },
    });

    const totalChunks = Math.ceil(message.file.size / CHUNK_SIZE_SAFE_LIMIT);

    // Detect iOS device
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Get original and normalized MIME types
    const originalType = message.file.type;
    const normalizedType = getMimeType(message.file);

    const metadata: FileTransferMetadata = {
      fileName: message.file.name,
      fileType: normalizedType,
      size: message.file.size,
      totalChunks,
      isiOS,
      originalType,
    };

    const fileMetadata: Message = {
      ...message,
      ...metadata,
      messageType: "metadata",
    };

    // // Send enhanced metadata first
    sendMessage(fileMetadata, dataChannel);

    const restOfChunks: Message = {
      ...fileMetadata,
      messageType: "file",
    };
    // Send file chunks
    sendMessage(restOfChunks, dataChannel);
  };
  return {
    startTransfer,
  };
};
