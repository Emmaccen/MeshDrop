import {
  HostMultiConnectionStateType,
  HostStateType,
} from "@/app/store/host/types";
import { useUpdateStore } from "@/app/store/utils/useUpdateStore";
import { useAtom } from "jotai";
import { atomWithReset, useResetAtom } from "jotai/utils";
export const hostState = atomWithReset<HostStateType>({
  peerConnection: null,
  dataChannel: null,
  offer: null,
  connectionState: "new",
  dataChannelReady: false,
  username: null,
  userId: null,
  connectedUsers: [],
  roomId: null,
});

export const useHostState = () => {
  const [currentHostState] = useAtom(hostState);
  const resetHostState = useResetAtom(hostState);
  const { updateStore: updateHostStatePartially } =
    useUpdateStore<HostStateType>(hostState);

  return {
    currentHostState,
    updateHostStatePartially,
    resetHostState,
  };
};
export const hostMultiConnectionState =
  atomWithReset<HostMultiConnectionStateType>({
    peerConnection: null,
    dataChannel: null,
    offers: null,
    connectionState: [],
    dataChannelReady: [],
    userId: null,
    roomId: null,
    // index: null,
  });

export const useHostMultiConnectionState = () => {
  const [currentMultiConnectionHostState] = useAtom(hostMultiConnectionState);
  const resetHostMultiConnectionState = useResetAtom(hostMultiConnectionState);

  const { updateStore: updateHostMultiConnectionStatePartially } =
    useUpdateStore<HostMultiConnectionStateType>(hostMultiConnectionState);
  return {
    currentMultiConnectionHostState,
    updateHostMultiConnectionStatePartially,
    resetHostMultiConnectionState,
  };
};
