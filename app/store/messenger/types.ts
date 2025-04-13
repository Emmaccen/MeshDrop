export interface Message {
  id: string;
  message?: string | File;
  timestamp: string;
  sender: string;
  type: "message" | "file";
  fileName?: string;
  url?: string;
  size?: number;
}

export interface MessengerStateType {
  messages: Message[];
}
