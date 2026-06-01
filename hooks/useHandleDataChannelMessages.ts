// import { MAX_QUEUE_LENGTH } from "@/app/store/constants";
import { useFileManagerState } from "@/app/store/fileManager";
import { useMessengerState } from "@/app/store/messenger";
import { Message } from "@/app/store/messenger/types";
import { useSilentAudioKeepAlive } from "@/hooks/useSilentAudioKeepAlive";
import { useVisibilityNotification } from "@/hooks/useVisibilityNotification";
import { FileDatabaseManager } from "@/lib/Database";
import FileChunksManager from "@/lib/FileChunkManager";
import { toast } from "sonner";

let notificationRequested = false;

// Tracks transfers that have failed so we can suppress further toasts for them
const failedTransfers = new Set<string>();

export const useHandleDataChannelMessages = () => {
  const { addNewMessage, updateMessageById } = useMessengerState();
  const fileChunksManager = FileChunksManager.getInstance();
  const fileStreamManager = new FileDatabaseManager();
  fileStreamManager.init();

  // Use silent audio keep-alive directly — this hook is a React hook so it's allowed
  const { start: startKeepAlive, stop: stopKeepAlive } =
    useSilentAudioKeepAlive();

  const {
    notifyIfPageHiddenOrInBackground,
    requestPermissionToShowNotification,
  } = useVisibilityNotification();

  const { updateFileManagerStatePartially, currentFileManagerState } =
    useFileManagerState();

  const handleDataChannelMessage = async (event: MessageEvent) => {
    const data: Message = JSON.parse(event.data);
    if (!notificationRequested) {
      requestPermissionToShowNotification();
      notificationRequested = true;
    }

    // Skip processing chunks for already-failed transfers to prevent toast storms
    if (data.messageType === "file" && failedTransfers.has(data.id)) {
      return;
    }

    try {
      if (data.messageType === "message") {
        if (!data.totalChunks) {
          // Handle single message
          addNewMessage(data);
          return;
        } else {
          // Handle chunked message
          const fileData = fileChunksManager.getFileChunk(data.id);
          fileChunksManager.addChunk(data.id, data);
          if (
            fileData &&
            Object.entries(fileData.chunks).length === data.totalChunks
          ) {
            // assemble chunks
            const fullData = Object.values(fileData.chunks)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .flat();

            const decoded = new TextDecoder().decode(new Uint8Array(fullData));
            const completeMessage: Message = {
              ...fileData.message,
              message: decoded,
              chunkData: undefined,
              chunkIndex: undefined,
              totalChunks: undefined,
            };
            updateMessageById(completeMessage.id, completeMessage);
            fileChunksManager.removeFile(data.id);
          }
        }
        notifyIfPageHiddenOrInBackground({
          title: "New message received",
          body: data.message,
        });
      } else if (data.messageType === "metadata") {
        fileChunksManager.addChunk(data.id, data);
        fileStreamManager.saveFileMetadata(data);
        updateFileManagerStatePartially({
          [data.id]: {
            transferProgress: 0,
            isTransferring: true,
          },
        });
        addNewMessage(data);
        // Start silent audio keep-alive when a file transfer begins
        startKeepAlive();
      } else if (data.messageType === "file") {
        const fileMetadata = fileStreamManager.getFileMetadata(data.id);

        if (!fileMetadata) {
          throw new Error("Transfer data not found!");
        }

        // IMPORTANT: await the save so the chunk is in IndexedDB before we check completion
        await fileStreamManager.saveChunk(data);

        // Ensure fileChunksManager has an entry for this file
        // With multichannel, file chunks can race ahead of the metadata entry
        if (!fileChunksManager.getFileChunk(data.id)) {
          // Initialize with a dummy metadata entry so addChunk("file") works
          fileChunksManager.addChunk(data.id, {
            ...data,
            messageType: "metadata",
          });
        }

        // Track received chunks using fileChunksManager as a counter
        fileChunksManager.addChunk(data.id, data);
        const receivedChunks = fileChunksManager.getFileChunk(data.id);
        const receivedCount = receivedChunks
          ? Object.keys(receivedChunks.chunks).length
          : 0;

        const progress = (receivedCount / data.totalChunks!) * 100;

        updateFileManagerStatePartially({
          [data.id]: {
            transferProgress: progress,
            isTransferring: true,
          },
        });

        // Only assemble when ALL chunks have been received and saved
        if (receivedCount === data.totalChunks!) {
          const downloadUrl = await fileStreamManager.getDownloadUrl(data.id);
          if (downloadUrl) {
            updateMessageById(data.id, {
              ...data,
              url: downloadUrl,
            });
          }
          updateFileManagerStatePartially({
            [data.id]: {
              transferProgress: 100,
              isTransferring: false,
            },
          });
          notifyIfPageHiddenOrInBackground({
            title: "New file received",
            body: data.fileName,
          });
          fileChunksManager.removeFile(data.id);

          // Stop keep-alive once all transfers are done
          if (fileChunksManager.getAllFiles().size === 0) {
            stopKeepAlive();
          }
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);

      // Only show the error toast once per failed transfer ID
      if (!failedTransfers.has(data.id)) {
        failedTransfers.add(data.id);
        toast.error("An error occurred while receiving the file");
      }

      updateFileManagerStatePartially({
        [data.id]: {
          transferProgress:
            currentFileManagerState[data.id]?.transferProgress || 0,
          isTransferring: false,
        },
      });

      // Stop keep-alive on error if nothing else is in flight
      if (fileChunksManager.getAllFiles().size === 0) {
        stopKeepAlive();
      }
    }
  };

  /**
   * Call this when the data channel closes mid-transfer to clean up
   * all in-flight transfers and stop the keep-alive.
   */
  const handleChannelClose = () => {
    stopKeepAlive();
    // Mark all in-flight transfers as failed so future chunks are suppressed
    const inFlight = fileChunksManager.getAllFiles();
    inFlight.forEach((_, fileId) => {
      failedTransfers.add(fileId);
      updateFileManagerStatePartially({
        [fileId]: {
          transferProgress: 0,
          isTransferring: false,
        },
      });
    });
  };

  return { handleDataChannelMessage, handleChannelClose };
};
