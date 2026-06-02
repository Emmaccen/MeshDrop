import { MultiChannelRoomAnswer } from "../host/types";

export interface PeerStateType {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  peerAnswer: string | null;
  connectionState: RTCPeerConnectionState;
  dataChannelReady: boolean;
  username: string | null;
  userId: string | null;
  connectedUsers: string[];
  roomId: string | null;
}
export interface PeerMultiConnectionStateType {
  peerConnection: RTCPeerConnection[] | null;
  dataChannel: RTCDataChannel[] | null;
  peerAnswers: MultiChannelRoomAnswer[] | null;
  connectionState: RTCPeerConnectionState[];
  dataChannelReady: boolean[];
  userId: string | null;
  roomId: string | null;
  // index: number | null;
}
