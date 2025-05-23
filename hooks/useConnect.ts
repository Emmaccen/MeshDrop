import { useHostState } from "@/app/store/host";
import { OfferMetadata } from "@/app/store/host/types";
import { usePeerState } from "@/app/store/peer";
import { FirestoreSignaling } from "@/lib/FirestoreSignaling";
import { toast } from "sonner";

export const useConnect = () => {
  const { updatePeerStatePartially, currentPeerState } = usePeerState();
  const { updateHostStatePartially } = useHostState();
  const firestore = FirestoreSignaling.getInstance();

  const requestConnectionFromHost = async (hostOffer: string) => {
    if (!hostOffer) {
      toast.warning("No connection offer detected. Please try again");
      return;
    }

    const newPeerConnection = new RTCPeerConnection({
      iceServers: [], // empty for fully offline connections
    });

    // Set up data channel handler
    newPeerConnection.ondatachannel = (event) => {
      const newDataChannel = event.channel;
      updatePeerStatePartially({
        dataChannel: newDataChannel,
      });
    };

    try {
      // Process the host's offer
      const offerData: OfferMetadata = JSON.parse(hostOffer);
      if (!offerData.type || !offerData.sdp) {
        toast.error("Invalid connection offer");
        throw new Error("Invalid SDP format");
      }

      await newPeerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: offerData.type,
          sdp: offerData.sdp,
        })
      );

      // Create an answer
      const answer = await newPeerConnection.createAnswer();
      await newPeerConnection.setLocalDescription(answer);

      // Set up ICE candidate handler
      newPeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // new candidate arrived
        } else {
          // candidate gathering completed
          const userId = crypto.randomUUID();
          const answer = newPeerConnection.localDescription;
          const offerWithMetadata: OfferMetadata = {
            type: answer?.type,
            sdp: answer?.sdp,
            userId: userId,
            username: currentPeerState.username,
            roomId: offerData.roomId,
          };
          updatePeerStatePartially({
            peerAnswer: JSON.stringify(offerWithMetadata),
            peerConnection: newPeerConnection,
            connectedUsers: [offerData.username ?? "Host"],
          });
          if (offerData.roomId)
            firestore.setPeerAnswer(offerData.roomId, offerWithMetadata);
        }
      };
      // toast.success("Host connection processed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to host, please try again");
    }
  };

  const acceptIncomingConnectionRequestFromPeer = async (
    incomingConnectionRequestHandshake: string,
    peerConnection: RTCPeerConnection | null
  ) => {
    if (!peerConnection || !incomingConnectionRequestHandshake) {
      toast.error("Unable to process connection request");
      return;
    }

    try {
      const answer: OfferMetadata = JSON.parse(
        incomingConnectionRequestHandshake
      );
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: answer.type!,
          sdp: answer.sdp,
        })
      );
      updateHostStatePartially({
        connectedUsers: [answer.username ?? "Peer"],
      });
      // toast.success(`Connection established`);
    } catch (error) {
      console.error("Error processing answer:", error);
      toast.error("Error processing connection request");
    }
  };

  return {
    requestConnectionFromHost,
    acceptIncomingConnectionRequestFromPeer,
  };
};
