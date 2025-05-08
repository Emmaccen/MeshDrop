import { BUFFER_THRESHOLD } from "@/app/store/constants";
import { toast } from "sonner";

export class SafeDataChannelSender {
  private queue: string[] = [];
  private sending = false;
  private channel: RTCDataChannel;
  private onMessageSent?: (raw: string) => void;

  constructor(
    dataChannel: RTCDataChannel,
    lowThreshold = BUFFER_THRESHOLD,
    onMessageSent?: (raw: string) => void
  ) {
    this.channel = dataChannel;
    this.channel.bufferedAmountLowThreshold = lowThreshold;
    this.channel.onbufferedamountlow = () => {
      this.tryFlush();
    };
    this.onMessageSent = onMessageSent;
  }

  enqueue(message: object) {
    const msgStr = JSON.stringify(message);
    this.queue.push(msgStr);
    this.tryFlush();
  }

  private tryFlush() {
    if (this.sending) return;
    this.sending = true;

    while (this.queue.length > 0) {
      if (
        this.channel.bufferedAmount >= this.channel.bufferedAmountLowThreshold
      ) {
        // Buffer is full, wait for it to drain
        setTimeout(() => {
          this.sending = false;
          this.tryFlush();
        }, 10);
        return;
      }

      const nextMessage = this.queue.shift();
      try {
        this.channel.send(nextMessage!);
        // ✅ Notify progress
        if (this.onMessageSent) this.onMessageSent(nextMessage!);
      } catch (err) {
        console.error("Failed to send over WebRTC:", err);
        toast.error("An error occurred in the buffer queue");
      }
    }

    this.sending = false;
  }
}
