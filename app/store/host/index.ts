import { HostStateType } from "@/app/store/host/types";
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
