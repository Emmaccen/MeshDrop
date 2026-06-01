import { getMimeType } from "@/app/shared-functions/getMimeType";
import { CHUNK_SIZE_SAFE_LIMIT } from "@/app/store/constants";
import { useFileManagerState } from "@/app/store/fileManager";
import { FileTransferMetadata } from "@/app/store/fileManager/types";
import { useMessengerState } from "@/app/store/messenger";
import { Message } from "@/app/store/messenger/types";
import { SafeDataChannelSender } from "@/lib/SafeDataChannelSender";

export const useMultiChannelTransferFile = () => {
  const { updateFileManagerStatePartially } = useFileManagerState();
  const { updateIfExistAddIfNot } = useMessengerState();

  const startMultiChannelTransfer = async (
    dataChannels: RTCDataChannel[],
    message: Message,
  ) => {
    if (
      !message.file ||
      !dataChannels ||
      dataChannels.length === 0 ||
      dataChannels.some((dc) => dc.readyState !== "open")
    ) {
      console.warn("Channels not ready for transfer", {
        hasFile: !!message.file,
        channelCount: dataChannels?.length,
        channelStates: dataChannels?.map((dc) => dc.readyState),
      });
      return;
    }

    const fileId = message.id;
    const file = message.file;

    // Update UI immediately with sender-side message
    const normalizedType = getMimeType(file);
    const messageWithMetaData: Message = {
      ...message,
      url: URL.createObjectURL(file),
      fileType: normalizedType,
    };
    updateIfExistAddIfNot(messageWithMetaData.id, messageWithMetaData);

    updateFileManagerStatePartially({
      [fileId]: {
        transferProgress: 0,
        isTransferring: true,
      },
    });

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE_SAFE_LIMIT);

    // Detect iOS device
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Get original and normalized MIME types
    const originalType = file.type;

    const metadata: FileTransferMetadata = {
      fileName: file.name,
      fileType: normalizedType,
      size: file.size,
      totalChunks,
      isiOS,
      originalType,
    };

    const fileMetadata: Message = {
      ...message,
      ...metadata,
      messageType: "metadata",
    };

    // Send metadata on the FIRST channel directly (small enough, no chunking needed)
    dataChannels[0].send(JSON.stringify(fileMetadata));

    // Create SafeDataChannelSenders for each channel to handle backpressure
    let totalSent = 0;
    const senders = dataChannels.map(
      (dc) =>
        new SafeDataChannelSender(dc, undefined, (_raw) => {
          totalSent++;
          updateFileManagerStatePartially({
            [fileId]: {
              transferProgress: (totalSent / totalChunks) * 100,
              isTransferring: totalSent < totalChunks,
            },
          });
        }),
    );

    // Send chunks distributed across channels using round-robin
    // chunkIndex is 1-indexed to match the receiver's completion check:
    //   receiver checks `chunkIndex === totalChunks`
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE_SAFE_LIMIT;
      const end = Math.min(file.size, start + CHUNK_SIZE_SAFE_LIMIT);
      const chunk = file.slice(start, end);

      const buffer = await chunk.arrayBuffer();
      const chunkData = Array.from(new Uint8Array(buffer));

      const chunkMessage: Message = {
        id: fileId,
        timestamp: new Date().toISOString(),
        sender: message.sender,
        senderId: message.senderId,
        messageType: "file",
        fileName: file.name,
        chunkIndex: i + 1, // 1-indexed to match receiver completion check
        totalChunks: totalChunks,
        chunkData: chunkData,
        message: "", // Empty message for file chunks
      };

      const targetSenderIndex = i % senders.length;
      const targetSender = senders[targetSenderIndex];

      // Wait if any sender is flushing overflow to prevent memory issues
      while (targetSender.isFlushingOverflow) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }

      targetSender.enqueue(chunkMessage);
    }
  };

  return {
    startMultiChannelTransfer,
  };
};
