import { BUFFER_THRESHOLD } from "@/app/store/constants";
import { toast } from "sonner";

export class SafeDataChannelSender {
  private queue: string[] = [];
  private sending = false;
  private channel: RTCDataChannel;

  constructor(dataChannel: RTCDataChannel, lowThreshold = BUFFER_THRESHOLD) {
    this.channel = dataChannel;
    this.channel.bufferedAmountLowThreshold = lowThreshold;
    this.channel.onbufferedamountlow = () => {
      this.tryFlush();
    };
  }

  // Add JSON-serializable message to queue
  enqueue(message: object) {
    const msgStr = JSON.stringify(message);
    this.queue.push(msgStr);
    this.tryFlush();
  }

  // Try to send as much as possible from the queue
  private tryFlush() {
    if (this.sending) return;
    this.sending = true;

    while (this.queue.length > 0) {
      if (
        this.channel.bufferedAmount >= this.channel.bufferedAmountLowThreshold
      ) {
        // Wait and retry later
        setTimeout(() => {
          this.sending = false;
          this.tryFlush();
        }, 10);
        return;
      }

      const nextMessage = this.queue.shift();
      try {
        this.channel.send(nextMessage!);
      } catch (err) {
        console.error("Failed to send over WebRTC:", err);
        toast.error("An error occurred in the buffer queue");
        // Re-add to queue?
      }
    }

    this.sending = false;
  }
}
