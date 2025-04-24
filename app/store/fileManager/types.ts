export interface FileManagerStateType {
  isTransferring: boolean;
  transferProgress: number;
}

export interface FileTransferMetadata {
  file?: File;
  fileName?: string;
  fileType?: string;
  url?: string;
  size?: number;
  totalChunks?: number;
  chunkIndex?: number;
  chunkData?: number[];
  isiOS?: boolean;
  originalType?: string;
}
