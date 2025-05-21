import { atom } from "jotai";
import { hostState } from "@/app/store/host";
import { peerState } from "@/app/store/peer";

export const Who_Im_I = atom((get) => {
  const host = get(hostState);
  const peer = get(peerState);

  return host.peerConnection ? "host" : peer.peerConnection ? "peer" : "none";
});
