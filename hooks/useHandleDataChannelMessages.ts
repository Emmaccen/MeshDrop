import { useMessengerState } from "@/app/store/messenger";
import { Message } from "@/app/store/messenger/types";
import { toast } from "sonner";

export const useHandleDataChannelMessages = () => {
  const { updateMessage } = useMessengerState();

  const handleDataChannelMessage = (event: MessageEvent) => {
    const data: Message = JSON.parse(event.data);
    console.log(event);
    try {
      if (data.type === "message") {
        updateMessage(data);
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
