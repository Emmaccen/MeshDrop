export const CHUNK_SIZE_SAFE_LIMIT = 55 * 1024; // 55KB leaves ~5KB for metadata (Assuming 60kb max)
export const CHUNK_SIZE_MESSAGE_SAFE_LIMIT = 1 * 1024; // 1KB, why? Bc a single emoji can be ~4 bytes in UTF-8
export const BUFFER_THRESHOLD = 60 * 1024; // 60kb leave a few kb out for extreme cases, assuming 64kb max
export const MAX_QUEUE_LENGTH = 300;
