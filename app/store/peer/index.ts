import { useAtom } from "jotai";

import { PeerStateType } from "@/app/store/peer/types";
import { useUpdateStore } from "@/app/store/utils/useUpdateStore";
import { atomWithReset, useResetAtom } from "jotai/utils";

export const peerState = atomWithReset<PeerStateType>({
  peerConnection: null,
  dataChannel: null,
  peerAnswer: null,
  connectionState: "new",
  dataChannelReady: false,
  username: null,
  userId: null,
  connectedUsers: [],
});

export const usePeerState = () => {
  const [currentPeerState] = useAtom(peerState);
  const resetPeerState = useResetAtom(peerState);

  const { updateStore: updatePeerStatePartially } =
    useUpdateStore<PeerStateType>(peerState);
  return {
    currentPeerState,
    updatePeerStatePartially,
    resetPeerState,
  };
};
