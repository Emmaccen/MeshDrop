import { HostStateType } from "@/app/store/host/types";
import { PeerStateType } from "@/app/store/peer/types";
import { useUpdateStore } from "@/app/store/utils/useUpdateStore";
import { Atom } from "jotai";
import { useEffect } from "react";
import { toast } from "sonner";
import { useHandleDataChannelMessages } from "@/hooks/useHandleDataChannelMessages";
import { useWakeLock } from "@/hooks/useWakeLock";

interface HostAndPeerCommonProperties
  extends Pick<
      HostStateType,
      | "dataChannelReady"
      | "connectionState"
      | "peerConnection"
      | "dataChannel"
      | "username"
    >,
    Pick<
      PeerStateType,
      | "connectionState"
      | "dataChannelReady"
      | "peerConnection"
      | "dataChannel"
      | "username"
    > {}

export const useConnectionStateManager = <
  T extends HostAndPeerCommonProperties
>(
  atomStore: Atom<T>
) => {
  const { updateStore: updateHostAndPeerCommonPropertiesPartially, values } =
    useUpdateStore<T>(atomStore);

  const { handleDataChannelMessage } = useHandleDataChannelMessages();
  const {
    wakeLockActive,
    wakeLockSupported,
    requestWakeLock,
    releaseWakeLock,
  } = useWakeLock();

  const handlePeerConnectionStateChange = (ev: Event) => {
    const { connectionState } = ev.currentTarget as RTCPeerConnection;
    console.info("Connection state changed:", connectionState);
    toast.info(`Connection state: ${connectionState}`);
    if (connectionState !== "connected") {
      if (wakeLockActive) {
        releaseWakeLock();
      }
    }
    updateHostAndPeerCommonPropertiesPartially({
      connectionState: connectionState,
    } as Partial<T>);
  };

  const handleDataChannelOpen = () => {
    console.info("Data channel is open!");
    toast.success("Data channel is open");
    if (wakeLockSupported) {
      requestWakeLock();
    }
    updateHostAndPeerCommonPropertiesPartially({
      dataChannelReady: true,
    } as Partial<T>);
  };

  const handleDataChannelClose = () => {
    console.error("Data channel is closed.");
    toast.error("Data channel is closed");
    updateHostAndPeerCommonPropertiesPartially({
      dataChannelReady: false,
    } as Partial<T>);
  };

  useEffect(() => {
    if (!values.dataChannel) return;

    // Set initial states

    updateHostAndPeerCommonPropertiesPartially({
      dataChannelReady: values.dataChannel.readyState === "open",
    } as Partial<T>);

    // Add event listeners
    values.dataChannel.onopen = handleDataChannelOpen;
    values.dataChannel.onclose = handleDataChannelClose;
    values.dataChannel.onmessage = handleDataChannelMessage;
    values.dataChannel.onerror = (error) => {
      console.error("Data Channel Error:", error);
      toast.error("Data channel encountered an error.");
    };

    return () => {
      if (values.dataChannel) {
        values.dataChannel.onopen = null;
        values.dataChannel.onclose = null;
        values.dataChannel.onmessage = null;

        updateHostAndPeerCommonPropertiesPartially({
          dataChannel: null,
        } as Partial<T>);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.dataChannel]);

  useEffect(() => {
    if (!values.peerConnection) return;

    values.peerConnection.onconnectionstatechange =
      handlePeerConnectionStateChange;

    return () => {
      if (values.peerConnection) {
        values.peerConnection.onconnectionstatechange = null;
        values.peerConnection.close();
        updateHostAndPeerCommonPropertiesPartially({
          peerConnection: null,
        } as Partial<T>);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.peerConnection]);

  return { values };
};
