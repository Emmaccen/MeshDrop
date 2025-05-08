export function returnFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  // Determine the appropriate unit by calculating how many times we can divide by 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Make sure we don't exceed our size array
  const index = Math.min(i, sizes.length - 1);

  // Calculate the value with the given decimal precision
  const formattedSize = parseFloat(
    (bytes / Math.pow(k, index)).toFixed(decimals)
  );

  return `${formattedSize} ${sizes[index]}`;
}
