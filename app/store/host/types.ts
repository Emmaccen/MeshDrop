export interface HostStateType {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  offer: string | null;
  connectionState: RTCPeerConnectionState;
  dataChannelReady: boolean;
  username: string | null;
  userId: string | null;
  connectedUsers: string[];
  roomId: string | null;
}
export interface HostMultiConnectionStateType {
  peerConnection: RTCPeerConnection[] | null;
  dataChannel: RTCDataChannel[] | null;
  offers: MultiChannelRoomOffer[] | null;
  connectionState: RTCPeerConnectionState[];
  dataChannelReady: boolean[];
  userId: string | null;
  roomId: string | null;
  // index: number | null;
}

export interface OfferMetadata {
  type: RTCSdpType | undefined;
  sdp: string | undefined;
  userId: string;
  username: string | null;
  roomId: string | null;
}
export interface MultiChannelRoomOffer {
  type: RTCSdpType | undefined;
  sdp: string | undefined;
  userId: string;
}
export interface MultiChannelRoomAnswer {
  type: RTCSdpType | undefined;
  sdp: string | undefined;
  userId: string;
}

export interface MultiChannelConnection {
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
}
