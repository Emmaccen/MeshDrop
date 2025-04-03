import { atom, useAtom } from "jotai";

import { PeerStateType } from "@/app/store/peer/types";
import { useUpdateStore } from "@/app/store/utils/useUpdateStore";

export const peerState = atom<PeerStateType>({
  peerConnection: null,
  dataChannel: null,
  peerAnswer: null,
  connectionState: "new",
  dataChannelReady: false,
  username: null,
  id: null,
});

export const usePeerState = () => {
  const [currentPeerState] = useAtom(peerState);
  const { updateStore: updatePeerStatePartially } =
    useUpdateStore<PeerStateType>(peerState);
  return {
    currentPeerState,
    updatePeerStatePartially,
  };
};
