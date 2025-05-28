import { WakeLockManager } from "@/lib/WakeLockManager";
// import { MAX_QUEUE_LENGTH } from "@/app/store/constants";
import { useFileManagerState } from "@/app/store/fileManager";
import { useMessengerState } from "@/app/store/messenger";
import { Message } from "@/app/store/messenger/types";
import { useVisibilityNotification } from "@/hooks/useVisibilityNotification";
import { FileStreamingManager } from "@/lib/Database";
import FileChunksManager from "@/lib/FileChunkManager";
import { toast } from "sonner";

let notificationRequested = false;

export const useHandleDataChannelMessages = () => {
  const { addNewMessage, updateMessageById } = useMessengerState();
  const fileChunksManager = FileChunksManager.getInstance();
  const fileStreamManager = new FileStreamingManager();
  fileStreamManager.init();
  const keepMyScreenOn = WakeLockManager.getInstance();
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
        if (
          keepMyScreenOn.isWakeLockSupported &&
          !keepMyScreenOn.isWakeLockActive
        ) {
          keepMyScreenOn.requestWakeLock();
        }
      } else if (data.messageType === "file") {
        const fileMetadata = fileStreamManager.getFileMetadata(data.id);

        if (!fileMetadata) {
          throw new Error("Transfer data not found!");
        }

        fileStreamManager.saveChunk(data);
        const progress = (data.chunkIndex! / data.totalChunks!) * 100;
        updateFileManagerStatePartially({
          [data.id]: {
            transferProgress: progress,
            isTransferring: true,
          },
        });
        if (data.chunkIndex! === data.totalChunks) {
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
          if (
            keepMyScreenOn.isWakeLockSupported &&
            keepMyScreenOn.isWakeLockActive &&
            fileChunksManager.getAllFiles().size === 0
          ) {
            keepMyScreenOn.stop();
          }
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);
      toast.error("An error occurred while handling the message");
      updateFileManagerStatePartially({
        [data.id]: {
          transferProgress:
            currentFileManagerState[data.id]?.transferProgress || 0,
          isTransferring: false,
        },
      });
      // throw error;
      // fileChunksManager.removeFile(data.id);
      if (
        keepMyScreenOn.isWakeLockSupported &&
        keepMyScreenOn.isWakeLockActive
      ) {
        keepMyScreenOn.stop();
      }
    }
  };

  return { handleDataChannelMessage };
};
