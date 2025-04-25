import { returnFileSize } from "@/app/shared-functions/returnFileSize";
import { FileTransferMetadata } from "@/app/store/fileManager/types";
import { Message } from "@/app/store/messenger/types";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";

export const ChatBubble = (message: Message) => {
  return (
    <div className="m-2">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <span className="text-sm font-semibold">{message.sender}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 rounded-e-xl rounded-es-xl dark:bg-card bg-gray-100">
        <p className="text-sm font-normal py-2.5 ">{message.message}</p>
      </div>
    </div>
  );
};

export const selectAppropriateChatBubble = (message: Message) => {
  switch (message.messageType) {
    case "message":
      return <ChatBubble {...message} />;
    case "file":
      return <FileBubble {...message} />;
    default:
      return <ChatBubble {...message} />;
  }
};

export const getFilePreviewComponent = (file: FileTransferMetadata) => {
  if (!file.file) return;
  const mime = file.fileType!;
  const url = file.url ?? URL.createObjectURL(file.file);

  if (mime.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={file.fileName} className="max-w-full rounded" />;
  }

  if (mime.startsWith("video/")) {
    return (
      <video
        src={url}
        controls
        className="max-w-full rounded h-full"
        // style={{ maxHeight: "300px" }}
      />
    );
  }

  if (mime.startsWith("audio/")) {
    return <audio src={url} controls className="w-full" />;
  }

  if (
    mime === "text/plain" ||
    mime === "application/json" ||
    mime.startsWith("text/")
  ) {
    return (
      <iframe
        src={url}
        title={file.fileName}
        className="w-full h-64 border rounded"
      />
    );
  }

  // Default: generic file with download link
  return (
    <a
      href={url}
      download={file.fileName}
      className="inline-flex items-center gap-2 px-4 py-2 rounded"
    >
      <Paperclip className="h-5 w-5" /> <span>{file.fileName}</span>
    </a>
  );
};

export const FileBubble = (message: Message) => {
  return (
    <div className="m-2">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <span className="text-sm font-semibold">{message.sender}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 rounded-e-xl rounded-es-xl dark:bg-card bg-gray-100">
        <p className="text-sm font-normal py-2.5 ">{message.message}</p>
        <div className="py-1 ">{getFilePreviewComponent(message)}</div>
        <div className="flex justify-between gap-2">
          <div className="me-2">
            <span className="flex items-center gap-2 text-sm font-medium pb-2">
              {message.fileName}
            </span>
            <span className="flex text-xs font-normal text-gray-500 dark:text-gray-400 gap-2">
              {returnFileSize(message.size ?? 0)}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="self-center"
                width="3"
                height="4"
                viewBox="0 0 3 4"
                fill="none"
              >
                <circle cx="1.5" cy="2" r="1.5" fill="#6B7280" />
              </svg>
              {message.fileType}
            </span>
          </div>
          <div className="inline-flex self-center items-center">
            <Button
              variant={"outline"}
              asChild
              aria-label={`Download ${message.fileName}`}
              className="inline-flex self-center items-center p-2 text-sm font-medium text-center rounded-lg focus:ring-4 focus:outline-none focus:ring-gray-50 dark:focus:ring-gray-600"
            >
              <a download={message.fileName} href={message.url ?? ""}>
                <svg
                  className="w-4 h-4 text-gray-900 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M14.707 7.793a1 1 0 0 0-1.414 0L11 10.086V1.5a1 1 0 0 0-2 0v8.586L6.707 7.793a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.416 0l4-4a1 1 0 0 0-.002-1.414Z" />
                  <path d="M18 12h-2.55l-2.975 2.975a3.5 3.5 0 0 1-4.95 0L4.55 12H2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2Zm-3 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                </svg>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
