import { useMessengerState } from "@/app/store/messenger";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export const useHandleDataChannelMessages = (user: string) => {
  const { updateMessage } = useMessengerState();

  const handleDataChannelMessage = (event: MessageEvent) => {
    try {
      if (typeof event.data === "string") {
        updateMessage({
          id: nanoid(24),
          message: event.data,
          timestamp: new Date().toISOString(),
          sender: user,
          type: "message",
        });
      } else {
        // Handle binary chunk
      }
    } catch (error) {
      console.error("Error handling message:", error);
      toast.error("An error occurred while handling the message");
    }
  };

  return { handleDataChannelMessage };
};
