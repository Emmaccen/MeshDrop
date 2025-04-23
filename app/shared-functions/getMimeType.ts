const getMimeTypeMappings = () => ({
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  pdf: "application/pdf",
  doc: "application/msword",
  txt: "text/plain",
  mp4: "video/mp4",
  mov: "video/quicktime",
});

// Enhanced metadata with fallback MIME type detection
export const getMimeType = (file: File) => {
  // Store original type before normalization
  const originalType = file.type;

  // Handle iOS-specific MIME types
  if (file.type === "image/heic" || file.type === "image/heif") {
    return "image/jpeg"; // Convert HEIC/HEIF to JPEG for compatibility
  }

  // Handle empty MIME types from iOS
  if (!file.type) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const iOSMimeTypes: Record<string, string> = {
      heic: "image/jpeg", // Convert HEIC to JPEG
      heif: "image/jpeg", // Convert HEIF to JPEG
      ...getMimeTypeMappings(), // Include other MIME types
    };

    return iOSMimeTypes[extension ?? ""] || "application/octet-stream";
  }

  return originalType;
};
