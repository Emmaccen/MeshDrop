import { BUFFER_THRESHOLD, MAX_QUEUE_LENGTH } from "@/app/store/constants";
import { toast } from "sonner";
export class SafeDataChannelSender {
  private queue: string[] = [];
  private sending = false;
  private channel: RTCDataChannel;
  private onMessageSent?: (raw: string) => void;
  public isFlushingOverflow = false; // adding this to prevent memory choking errors
  private MAX_QUEUE = MAX_QUEUE_LENGTH;

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

    if (this.queue.length > this.MAX_QUEUE) {
      this.isFlushingOverflow = true;
    }

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
        if (!nextMessage) return;
        this.channel.send(nextMessage);
        this.onMessageSent?.(nextMessage);
      } catch (err) {
        console.error("Failed to send over WebRTC:", err);
        toast.error("An error occurred in the buffer queue");
      }
    }

    this.sending = false;
    this.isFlushingOverflow = false;
  }
}
