import { useHostState } from "@/app/store/host";
import { toast } from "sonner";
export const useCreateHostConnection = () => {
  const { updateHostStatePartially, currentHostState } = useHostState();

  const createHost = async () => {
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
      const userId = crypto.randomUUID();
      const offerWithMetadata = {
        type: offer.type,
        sdp: offer.sdp,
        userId,
        userName: currentHostState.username,
      };
      updateHostStatePartially({
        offer: JSON.stringify(offerWithMetadata),
        peerConnection: newPeerConnection,
        dataChannel: newDataChannel,
        userId,
      });
      toast.success("Host connection created successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error creating or setting local description");
    }
  };

  return {
    createHost,
  };
};
