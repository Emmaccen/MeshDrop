import { Message } from "@/app/store/messenger/types";

const DB_NAME = "meshdrop";
const CHUNK_STORE = "mesh-chunks";
const METADATA_STORE = "mesh-metadata";

export class FileStreamingManager {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Chunks store
        if (!db.objectStoreNames.contains(CHUNK_STORE)) {
          const chunkStore = db.createObjectStore(CHUNK_STORE, {
            keyPath: "id",
          });
          chunkStore.createIndex("fileIds", "fileId", { unique: false });
        }

        // Metadata store
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: "id" });
        }
      };
    });
  }

  public async clearChunkStore(): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(
        [CHUNK_STORE, METADATA_STORE],
        "readwrite"
      );

      const chunkStore = tx.objectStore(CHUNK_STORE);
      const metadataStore = tx.objectStore(METADATA_STORE);

      const chunkClear = chunkStore.clear();
      const metaClear = metadataStore.clear();

      let cleared = 0;

      const checkDone = () => {
        cleared++;
        if (cleared === 2) resolve();
      };

      chunkClear.onsuccess = checkDone;
      metaClear.onsuccess = checkDone;

      chunkClear.onerror = () => reject(chunkClear.error);
      metaClear.onerror = () => reject(metaClear.error);
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  async saveFileMetadata(metadata: Message): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(METADATA_STORE, "readwrite");
      const store = tx.objectStore(METADATA_STORE);

      const request = store.put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFileMetadata(fileId: string): Promise<Message | null> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(METADATA_STORE, "readonly");
      const store = tx.objectStore(METADATA_STORE);

      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveChunk(chunk: Message): Promise<void> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(CHUNK_STORE, "readwrite");
      const store = tx.objectStore(CHUNK_STORE);

      const chunkData = {
        id: `${chunk.id}-${chunk.chunkIndex}`,
        fileId: chunk.id,
        chunkData: chunk.chunkData,
        chunkIndex: chunk.chunkIndex,
        totalChunks: chunk.totalChunks,
      };
      const request = store.put(chunkData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getChunk(
    fileId: string,
    chunkIndex: number
  ): Promise<{
    id: string;
    fileId: string;
    chunkData: number[] | undefined;
    chunkIndex: number | undefined;
    totalChunks: number | undefined;
  } | null> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(CHUNK_STORE, "readonly");
      const store = tx.objectStore(CHUNK_STORE);

      const request = store.get(`${fileId}-${chunkIndex}`);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null); // Return the entire result object, not result.data
      };
      request.onerror = () => reject(request.error);
    });
  }

  async createDownloadStream(
    fileId: string
  ): Promise<ReadableStream<Uint8Array>> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      throw new Error(`File ${fileId} not found`);
    }

    let currentChunk = 1;
    const getChunkMethod = this.getChunk.bind(this);

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          // Check if we've processed all chunks
          if (currentChunk > metadata.totalChunks!) {
            controller.close();
            return;
          }

          const chunk = await getChunkMethod(fileId, currentChunk);

          if (!chunk || !chunk.chunkData) {
            controller.error(
              new Error(`Missing chunk ${currentChunk} for file ${fileId}`)
            );
            return;
          }

          let dataToEnqueue: Uint8Array;
          if (Array.isArray(chunk.chunkData)) {
            dataToEnqueue = new Uint8Array(chunk.chunkData);
          } else if ((chunk.chunkData as unknown) instanceof Uint8Array) {
            dataToEnqueue = chunk.chunkData;
          } else {
            // Handle other potential formats
            dataToEnqueue = new Uint8Array(Object.values(chunk.chunkData));
          }

          controller.enqueue(dataToEnqueue);
          currentChunk++;
        } catch (error) {
          console.error("Error in stream pull:", error);
          controller.error(error);
        }
      },
    });
  }

  async createDownloadUrl(fileId: string): Promise<string> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      throw new Error(`File ${fileId} not found`);
    }
    // Create stream and convert to blob
    const stream = await this.createDownloadStream(fileId);
    const response = new Response(stream);
    const blob = await response.blob();

    return URL.createObjectURL(blob);
  }

  async getDownloadUrl(fileId: string): Promise<string> {
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      throw new Error(`File ${fileId} not found`);
    }
    const url = await this.createDownloadUrl(fileId);

    return url;
  }

  async listFiles(): Promise<Message[]> {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(METADATA_STORE, "readonly");
      const store = tx.objectStore(METADATA_STORE);

      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.ensureDB();

    // Get metadata to know how many chunks to delete
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) return;

    const tx = this.db!.transaction([CHUNK_STORE, METADATA_STORE], "readwrite");

    // Delete all chunks
    const chunkStore = tx.objectStore(CHUNK_STORE);
    for (let i = 0; i < metadata.totalChunks!; i++) {
      chunkStore.delete(`${fileId}-${i}`);
    }

    // Delete metadata
    const metadataStore = tx.objectStore(METADATA_STORE);
    metadataStore.delete(fileId);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
