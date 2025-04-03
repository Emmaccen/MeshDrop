export interface HostStateType {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  offer: string | null;
  connectionState: RTCPeerConnectionState;
  dataChannelReady: boolean;
  username: string | null;
  id: string | null;
}
