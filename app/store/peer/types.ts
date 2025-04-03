export interface PeerStateType {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  peerAnswer: string | null;
  connectionState: RTCPeerConnectionState;
  dataChannelReady: boolean;
  username: string | null;
  id: string | null;
}
