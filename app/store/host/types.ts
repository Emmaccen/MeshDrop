export interface HostStateType {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  offer: string | null;
  connectionState: RTCPeerConnectionState;
  dataChannelReady: boolean;
  username: string | null;
  userId: string | null;
  connectedUsers: string[];
}

export interface OfferMetadata {
  type: RTCSdpType | undefined;
  sdp: string | undefined;
  userId: string;
  username: string | null;
}
