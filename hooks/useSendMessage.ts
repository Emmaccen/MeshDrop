import { useMessengerState } from "@/app/store/messenger";
import { Message } from "@/app/store/messenger/types";
import { toast } from "sonner";

export const useSendMessage = () => {
  const { updateMessage } = useMessengerState();

  const sendMessage = (
    message: Message,
    dataChannel: RTCDataChannel | null
  ) => {
    if (typeof message.message === "string" && !message.message?.trim()) return;

    if (dataChannel?.readyState === "open") {
      try {
        dataChannel.send(JSON.stringify(message));
        updateMessage(message);
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message. Please check connection.");
      }
    } else {
      console.error(
        "Data channel is not open. Current state:",
        dataChannel?.readyState
      );
      toast.error(
        `Connection is not ready. Current state: ${dataChannel?.readyState}`
      );
    }
  };

  return { sendMessage };
};
