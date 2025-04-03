import { useHostState } from "@/app/store/host";
import { toast } from "sonner";
import { nanoid } from "nanoid";
export const useCreateHostConnection = () => {
  const { updateHostStatePartially } = useHostState();

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
      updateHostStatePartially({
        offer: JSON.stringify(offer),
        peerConnection: newPeerConnection,
        dataChannel: newDataChannel,
        id: nanoid(24),
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
