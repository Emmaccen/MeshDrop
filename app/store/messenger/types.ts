export interface Message {
  id: string;
  message: string | File;
  timestamp: string;
  sender: string;
  senderId: string | null;
  type: "message" | "file";
  fileName?: string;
  url?: string;
  size?: number;
}

export interface MessengerStateType {
  messages: Message[];
}
