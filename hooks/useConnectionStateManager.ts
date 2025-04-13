import { HostStateType } from "@/app/store/host/types";
import { PeerStateType } from "@/app/store/peer/types";
import { useUpdateStore } from "@/app/store/utils/useUpdateStore";
import { Atom } from "jotai";
import { useEffect } from "react";
import { toast } from "sonner";
import { useHandleDataChannelMessages } from "@/hooks/useHandleDataChannelMessages";

interface HostAndPeerCommonProperties
  extends Pick<
      HostStateType,
      "dataChannelReady" | "connectionState" | "peerConnection" | "dataChannel"
    >,
    Pick<
      PeerStateType,
      "connectionState" | "dataChannelReady" | "peerConnection" | "dataChannel"
    > {}

export const useConnectionStateManager = <
  T extends HostAndPeerCommonProperties
>(
  atomStore: Atom<T>,
  user: string
) => {
  const { updateStore: updateHostAndPeerCommonPropertiesPartially, values } =
    useUpdateStore<T>(atomStore);

  const { handleDataChannelMessage } = useHandleDataChannelMessages(user);

  const handlePeerConnectionStateChange = () => {
    console.info("Connection state changed:", values.connectionState);
    toast.info(`Connection state: ${values.connectionState}`);
    updateHostAndPeerCommonPropertiesPartially({
      connectionState: values.connectionState,
    } as Partial<T>);
  };

  const handleDataChannelOpen = () => {
    console.info("Data channel is open!");
    toast.success("Data channel is open");
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
    if (!values.peerConnection || !values.dataChannel) return;

    // Set initial states

    updateHostAndPeerCommonPropertiesPartially({
      dataChannelReady: values.dataChannel.readyState === "open",
    } as Partial<T>);
    updateHostAndPeerCommonPropertiesPartially({
      dataChannelReady: true,
    } as Partial<T>);

    // Add event listeners
    values.peerConnection.onconnectionstatechange =
      handlePeerConnectionStateChange;
    values.dataChannel.onopen = handleDataChannelOpen;
    values.dataChannel.onclose = handleDataChannelClose;
    values.dataChannel.onmessage = handleDataChannelMessage;
    values.dataChannel.onerror = (error) => {
      console.error("Data Channel Error:", error);
      toast.error("Data channel encountered an error.");
    };

    // Cleanup function
    return () => {
      if (values.peerConnection && values.dataChannel) {
        values.peerConnection.onconnectionstatechange = null;
        values.dataChannel.onopen = null;
        values.dataChannel.onclose = null;
        values.dataChannel.onmessage = null;
      }

      if (values.peerConnection) {
        values.peerConnection.close();
        updateHostAndPeerCommonPropertiesPartially({
          peerConnection: null,
        } as Partial<T>);
      }
      if (values.dataChannel) {
        updateHostAndPeerCommonPropertiesPartially({
          dataChannel: null,
        } as Partial<T>);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.dataChannel, values.peerConnection]);

  return { values };
};
