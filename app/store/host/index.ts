import { HostStateType } from "@/app/store/host/types";
import { useUpdateStore } from "@/app/store/utils/useUpdateStore";
import { atom, useAtom } from "jotai";

export const hostState = atom<HostStateType>({
  peerConnection: null,
  dataChannel: null,
  offer: null,
  connectionState: "new",
  dataChannelReady: false,
  username: null,
  id: null,
});

export const useHostState = () => {
  const [currentHostState] = useAtom(hostState);
  const { updateStore: updateHostStatePartially } =
    useUpdateStore<HostStateType>(hostState);

  return {
    currentHostState,
    updateHostStatePartially,
  };
};
