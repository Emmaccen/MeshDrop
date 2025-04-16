export interface FileManagerStateType {
  isTransferring: boolean;
  transferProgress: number;
}

export type FileTransferMetadata = {
  name: string;
  type: string;
  size: number;
  id: string;
  totalChunks: number;
  isiOS?: boolean; // Add iOS flag
  originalType?: string; // Store original file type
};
