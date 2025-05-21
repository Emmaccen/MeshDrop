import { useHostState } from "@/app/store/host";
import { OfferMetadata } from "@/app/store/host/types";
import { FirestoreSignaling } from "@/lib/FirestoreSignaling";
import generateReadableRoomId from "@/lib/generateReadableRoomId";
import { toast } from "sonner";
import { useConnect } from "./useConnect";
import { useMiscState } from "@/app/store/misc";
export const useCreateHostConnection = () => {
  const { updateHostStatePartially } = useHostState();
  const firestore = FirestoreSignaling.getInstance();
  const { acceptIncomingConnectionRequestFromPeer } = useConnect();
  const { currentMiscState } = useMiscState();

  const createHost = async (config: { username: string; userId: string }) => {
    const newPeerConnection = new RTCPeerConnection({
      iceServers: [], // empty for fully offline connections
    });

    newPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // new candidate arrived
      } else {
        // candidate gathering completed
      }
    };

    // Create data channel with specific options
    const newDataChannel = newPeerConnection.createDataChannel("p2p", {
      ordered: true,
    });

    // Create an offer and set it as the local description
    try {
      const offer = await newPeerConnection.createOffer();
      await newPeerConnection.setLocalDescription(offer);
      const roomId =
        currentMiscState.discoveryMode === "online"
          ? generateReadableRoomId()
          : null;
      const offerWithMetadata: OfferMetadata = {
        type: offer.type,
        sdp: offer.sdp,
        userId: config.userId,
        username: config.username,
        roomId,
      };
      updateHostStatePartially({
        offer: JSON.stringify(offerWithMetadata),
        peerConnection: newPeerConnection,
        dataChannel: newDataChannel,
        userId: config.userId,
        username: config.username,
        roomId,
      });
      if (roomId) {
        const connection = await firestore.createRoomAsHost(
          roomId,
          offerWithMetadata
        );
        if (connection) {
          firestore.listenForPeerAnswers(
            roomId,
            newPeerConnection,
            acceptIncomingConnectionRequestFromPeer
          );
          toast.success("Host connection created successfully");
        } else {
          toast.error("Unable to create connection");
        }
      }
      return offerWithMetadata;
    } catch (error) {
      console.error(error);
      toast.error("Error creating or setting local description");
    }
  };

  return {
    createHost,
  };
};
