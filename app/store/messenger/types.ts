import { FileTransferMetadata } from "@/app/store/fileManager/types";

export interface Message extends FileTransferMetadata {
  id: string;
  message: string;
  timestamp: string;
  sender: string;
  senderId: string | null;
  messageType: "message" | "file" | "metadata";
}

export interface MessengerStateType {
  messages: Message[];
}
