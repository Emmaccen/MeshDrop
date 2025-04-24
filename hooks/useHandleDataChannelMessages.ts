import { useFileManagerState } from "@/app/store/fileManager";
import { useMessengerState } from "@/app/store/messenger";
import { Message } from "@/app/store/messenger/types";
import FileChunksManager from "@/lib/FileChunkManager";
import { toast } from "sonner";

export const useHandleDataChannelMessages = () => {
  const { addNewMessage, updateMessageById } = useMessengerState();
  const fileChunksManager = FileChunksManager.getInstance();
  const { updateFileManagerStatePartially } = useFileManagerState();
  const handleDataChannelMessage = (event: MessageEvent) => {
    const data: Message = JSON.parse(event.data);
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
      } else if (data.messageType === "metadata") {
        fileChunksManager.addChunk(data.id, data);
        updateFileManagerStatePartially({
          isTransferring: true,
        });
        addNewMessage(data);
      } else if (data.messageType === "file") {
        // Handle file transfer here

        const fileData = fileChunksManager.getFileChunk(data.id);

        if (!fileData) {
          fileChunksManager.addChunk(data.id, data); // initialize it
        }
        const finalData = fileChunksManager.getFileChunk(data.id);

        if (!finalData) {
          // toast.error("Transfer data not found!");
          throw new Error("Transfer data not found!");
        }

        finalData.message = data;
        finalData.chunks[data.chunkIndex!] = data.chunkData!;
        const progress =
          (finalData.message.chunkIndex! / finalData.message.totalChunks!) *
          100;
        updateFileManagerStatePartially({
          transferProgress: progress,
        });
        if (
          finalData &&
          Object.entries(finalData.chunks).length === data.totalChunks
        ) {
          const fullData = Object.entries(finalData.chunks)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([, chunk]) => chunk)
            .flat();

          const blob = new Blob([new Uint8Array(fullData)], {
            type: finalData.message.fileType,
          });
          const file = new File([blob], finalData.message.fileName!, {
            type: finalData.message.fileType,
          });
          const url = URL.createObjectURL(blob);
          updateMessageById(finalData.message.id, { ...data, file, url });
          updateFileManagerStatePartially({
            isTransferring: false,
          });
          updateFileManagerStatePartially({
            transferProgress: 0,
          });
          fileChunksManager.removeFile(data.id);
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);
      toast.error("An error occurred while handling the message");
      updateFileManagerStatePartially({
        isTransferring: false,
      });
      // fileChunksManager.removeFile(data.id);
    }
  };

  return { handleDataChannelMessage };
};
