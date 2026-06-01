import { returnFileSize } from "@/app/shared-functions/returnFileSize";
import { useFileManagerState } from "@/app/store/fileManager";
import { FileTransferMetadata } from "@/app/store/fileManager/types";
import { Message } from "@/app/store/messenger/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, File as FileIcon } from "lucide-react";

export const ChatBubble = (message: Message) => {
  return (
    <div className="animate-slide-in-right max-w-[320px]">
      <div className="flex items-baseline gap-1.5 mb-1 px-1">
        <span className="text-xs font-semibold">{message.sender}</span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm bg-muted/60 dark:bg-card">
        <p className="text-sm leading-relaxed">{message.message}</p>
      </div>
    </div>
  );
};

export const SentChatBubble = (message: Message) => {
  return (
    <div className="animate-slide-in-left max-w-[320px]">
      <div className="flex items-baseline gap-1.5 mb-1 px-1 justify-end">
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="text-xs font-semibold">You</span>
      </div>
      <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm bg-primary text-primary-foreground">
        <p className="text-sm leading-relaxed">{message.message}</p>
      </div>
    </div>
  );
};

export const selectAppropriateChatBubble = (
  message: Message,
  isSender?: boolean,
) => {
  switch (message.messageType) {
    case "message":
      return isSender ? (
        <SentChatBubble {...message} />
      ) : (
        <ChatBubble {...message} />
      );
    case "file":
    case "metadata":
      return isSender ? (
        <SentFileBubble {...message} />
      ) : (
        <FileBubble {...message} />
      );
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
    return (
      <img
        src={url}
        alt={file.fileName}
        className="max-w-full rounded-xl object-cover"
      />
    );
  }

  if (mime.startsWith("video/")) {
    return (
      <video
        src={url}
        controls
        className="max-w-full rounded-xl h-full max-h-[300px] md:max-h-[600px]"
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
        className="w-full h-64 border rounded-xl"
      />
    );
  }

  // Default: generic file icon
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl border">
      <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium truncate break-all">
        {file.fileName}
      </span>
    </div>
  );
};

const FileBubbleBase = ({
  message,
  sent,
}: {
  message: Message;
  sent: boolean;
}) => {
  const { currentFileManagerState } = useFileManagerState();
  const isTransferring = currentFileManagerState[message.id]?.isTransferring;
  const progress = currentFileManagerState[message.id]?.transferProgress ?? 0;

  return (
    <div
      className={`${sent ? "animate-slide-in-left" : "animate-slide-in-right"} max-w-[320px] w-full`}
    >
      <div
        className={`flex items-baseline gap-1.5 mb-1 px-1 ${sent ? "justify-end" : ""}`}
      >
        {!sent && (
          <span className="text-xs font-semibold">{message.sender}</span>
        )}
        <span className="text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {sent && <span className="text-xs font-semibold">You</span>}
      </div>
      <div
        className={`rounded-2xl ${sent ? "rounded-tr-sm" : "rounded-tl-sm"} px-4 py-3 shadow-sm ${
          sent
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60 dark:bg-card"
        } w-full`}
      >
        {/* Caption */}
        {message.message && (
          <p className="text-sm leading-relaxed mb-2">{message.message}</p>
        )}

        {/* File preview or skeleton */}
        {!message.url && isTransferring ? (
          <Skeleton className="h-[160px] rounded-xl w-full my-1" />
        ) : (
          message.url && (
            <div className="py-1 rounded-xl overflow-hidden">
              {getFilePreviewComponent(message)}
            </div>
          )
        )}

        {/* File name */}
        <p className="text-xs font-medium mt-2 truncate break-all opacity-80">
          {message.fileName}
        </p>

        {/* Size + type + download */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-[10px] opacity-60 flex items-center gap-1">
            {returnFileSize(message.size ?? 0)}
            {message.fileType && (
              <>
                <span>·</span>
                <span>{message.fileType}</span>
              </>
            )}
          </span>
          {message.url && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 w-7 p-0 rounded-full"
              aria-label={`Download ${message.fileName}`}
            >
              <a download={message.fileName} href={message.url ?? ""}>
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>

        {/* Transfer progress */}
        {isTransferring && progress < 100 && (
          <Progress className="mt-2 h-1" value={progress} />
        )}
      </div>
    </div>
  );
};

export const FileBubble = (message: Message) => (
  <FileBubbleBase message={message} sent={false} />
);

export const SentFileBubble = (message: Message) => (
  <FileBubbleBase message={message} sent={true} />
);
