import { usePeerState } from "@/app/store/peer";
import { toast } from "sonner";
import { nanoid } from "nanoid";

export const useConnect = () => {
  const { updatePeerStatePartially, currentPeerState } = usePeerState();

  const requestConnection = async (hostOffer: string) => {
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
      const offerData = JSON.parse(hostOffer);
      if (!offerData.type || !offerData.sdp) {
        toast.error("Invalid connection offer");
        throw new Error("Invalid SDP format");
      }

      await newPeerConnection.setRemoteDescription(
        new RTCSessionDescription(offerData)
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
          const userId = nanoid(24);
          const answer = newPeerConnection.localDescription;
          const offerWithMetadata = {
            type: answer?.type,
            sdp: answer?.sdp,
            id: userId,
            userName: currentPeerState.username,
          };
          updatePeerStatePartially({
            peerAnswer: JSON.stringify(offerWithMetadata),
            peerConnection: newPeerConnection,
          });
        }
      };
      toast.success("Host connection processed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to host, please try again");
    }
  };

  const acceptIncomingConnectionRequest = async (
    incomingConnectionRequest: string,
    peerConnection: RTCPeerConnection | null
  ) => {
    if (!peerConnection || !incomingConnectionRequest) {
      toast.error("Unable to process connection request");
      return;
    }

    try {
      const answer = JSON.parse(incomingConnectionRequest);
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      toast.success(`Connection established`);
    } catch (error) {
      console.error("Error processing answer:", error);
      toast.error("Error processing connection request");
    }
  };

  return {
    requestConnection,
    acceptIncomingConnectionRequest,
  };
};
