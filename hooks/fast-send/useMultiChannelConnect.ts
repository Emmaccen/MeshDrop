import { OfferMetadata } from "@/app/store/host/types";
import { PeerMultiConnectionStateType } from "@/app/store/peer/types";
import { FirestoreSignaling } from "@/lib/FirestoreSignaling";
import { toast } from "sonner";

export const useMultiChannelConnect = () => {
  const firestore = FirestoreSignaling.getInstance();

  const requestMultiChannelConnectionFromHost = async (
    hostOffer: string[],
    roomId: string
  ) => {
    if (!hostOffer.length) {
      toast.warning("No connection offer detected. Please try again");
      return;
    }
    // const peerConnections: RTCPeerConnection[] = [];
    // const answers: MultiChannelRoomAnswer[] = [];

    const userId = crypto.randomUUID();

    let peerMultiConnectionData: PeerMultiConnectionStateType = {
      peerConnection: null,
      dataChannel: null,
      peerAnswers: null,
      connectionState: [],
      dataChannelReady: [],
      userId: null,
      roomId: null,
      // index: null,
    };

    for (let i = 0; i < 4; i++) {
      const newPeerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      // peerConnections.push(newPeerConnection);
      peerMultiConnectionData = {
        ...peerMultiConnectionData,
        peerConnection: [
          ...(peerMultiConnectionData.peerConnection || []),
          newPeerConnection,
        ],
      };

      // Confirm later if this can actually arrive out of order
      newPeerConnection.ondatachannel = (event) => {
        const newDataChannel = event.channel;
        const currentDataChannels = peerMultiConnectionData.dataChannel || [];
        currentDataChannels[i] = newDataChannel;
        peerMultiConnectionData = {
          ...peerMultiConnectionData,
          dataChannel: currentDataChannels,
        };
      };
    }

    try {
      if (!peerMultiConnectionData.peerConnection) {
        toast.error("No peer connections available");
        throw new Error("No peer connections available");
      }
      for (let i = 0; i < peerMultiConnectionData.peerConnection.length; i++) {
        // Process the host's offer
        const offerData: OfferMetadata = JSON.parse(hostOffer[i]);
        if (!offerData.type || !offerData.sdp) {
          toast.error("Invalid connection offer");
          throw new Error("Invalid SDP format");
        }

        await peerMultiConnectionData.peerConnection[i].setRemoteDescription(
          new RTCSessionDescription({
            type: offerData.type,
            sdp: offerData.sdp,
          })
        );
        // Create an answer
        const answer = await peerMultiConnectionData.peerConnection[
          i
        ].createAnswer();
        await peerMultiConnectionData.peerConnection[i].setLocalDescription(
          answer
        );
        // Set up ICE candidate handler
        peerMultiConnectionData.peerConnection[i].onicecandidate = (event) => {
          if (event.candidate) {
            // new candidate arrived
          } else {
            // candidate gathering completed
            if (!peerMultiConnectionData.peerConnection) return;
            const answer =
              peerMultiConnectionData.peerConnection[i].localDescription;
            // answers.push({
            //   type: answer?.type,
            //   sdp: answer?.sdp,
            //   userId: userId,
            // });
            peerMultiConnectionData = {
              ...peerMultiConnectionData,
              peerAnswers: [
                ...(peerMultiConnectionData.peerAnswers || []),
                {
                  type: answer?.type,
                  sdp: answer?.sdp,
                  userId: userId,
                },
              ],
              userId: userId,
              roomId: roomId,
              // index: i,
            };

            if (roomId)
              firestore.setMultiChannelPeerAnswers(
                roomId,
                peerMultiConnectionData.peerAnswers || []
              );
          }
        };
      }

      toast.success("Host connection processed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to host, please try again");
    }
  };

  const acceptMultiChannelIncomingConnectionRequestFromPeer = async (
    incomingConnectionRequestHandshake: string[],
    peerConnections: RTCPeerConnection[] | null
  ) => {
    if (!incomingConnectionRequestHandshake || !peerConnections) {
      toast.error("No incoming connection request detected");
      return;
    }
    if (!peerConnections.length || !incomingConnectionRequestHandshake.length) {
      toast.error("Unable to process connection request");
      return;
    }

    try {
      for (let i = 0; i < incomingConnectionRequestHandshake.length; i++) {
        const peerConnection = peerConnections[i];
        if (!peerConnection) continue;

        const answer: OfferMetadata = JSON.parse(
          incomingConnectionRequestHandshake[i]
        );
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription({
            type: answer.type!,
            sdp: answer.sdp,
          })
        );
      }

      toast.success(`Connection established`);
    } catch (error) {
      console.error("Error processing answer:", error);
      toast.error("Error processing connection request");
    }
  };

  return {
    requestMultiChannelConnectionFromHost,
    acceptMultiChannelIncomingConnectionRequestFromPeer,
  };
};
