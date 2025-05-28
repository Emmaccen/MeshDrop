import { Message } from "@/app/store/messenger/types";

export type FileChunk = Map<
  string,
  {
    chunks: {
      [index: number]: number[];
    };
    message: Message;
  }
>;
class FileChunksManager {
  private static instance: FileChunksManager;
  private fileChunks: FileChunk;

  private constructor() {
    this.fileChunks = new Map();
  }

  // Ensure only one instance exists
  public static getInstance(): FileChunksManager {
    if (!FileChunksManager.instance) {
      FileChunksManager.instance = new FileChunksManager();
    }
    return FileChunksManager.instance;
  }

  // Add or update file chunk
  public addChunk(fileId: string, message: Message) {
    const fileData = this.fileChunks.get(fileId);

    if (message.messageType === "metadata" && !fileData) {
      // console.log("Received metadata and adding to manager: ", message);
      this.fileChunks.set(fileId, {
        chunks: {},
        message,
      });
      return;
    }

    if (message.messageType === "file" && fileData) {
      if (
        message.chunkData !== undefined &&
        message.chunkIndex !== undefined &&
        message.totalChunks !== undefined
      )
        fileData.chunks[message.chunkIndex] = message.chunkData;
      fileData.message = message;
      return;
    }

    if (message.messageType === "message") {
      if (
        !fileData &&
        message.chunkData !== undefined &&
        message.chunkIndex !== undefined &&
        message.totalChunks !== undefined
      ) {
        this.fileChunks.set(fileId, {
          chunks: {
            [message.chunkIndex]: message.chunkData,
          },
          message,
        });
      } else if (
        fileData &&
        message.chunkData !== undefined &&
        message.chunkIndex !== undefined &&
        message.totalChunks !== undefined
      ) {
        fileData.chunks[message.chunkIndex] = message.chunkData;
        // fileData.message = message;
        return;
      }
    }
  }

  // Get file chunks by ID
  public getFileChunk(fileId: string) {
    // console.log("Getting file chunk: ", this.fileChunks.get(fileId));
    return this.fileChunks.get(fileId);
  }

  // Remove file entry
  public removeFile(fileId: string) {
    // console.log("Removing file: ", fileId);
    this.fileChunks.delete(fileId);
  }

  // Get entire Map
  public getAllFiles() {
    // console.log("Getting all files: ", this.fileChunks);
    return this.fileChunks;
  }
}

export default FileChunksManager;
