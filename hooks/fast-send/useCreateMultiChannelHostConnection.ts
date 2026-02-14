import { useHostMultiConnectionState } from "@/app/store/host";
import { HostMultiConnectionStateType } from "@/app/store/host/types";
import { useMultiChannelConnect } from "@/hooks/fast-send/useMultiChannelConnect";
import { FirestoreSignaling } from "@/lib/FirestoreSignaling";
import generateReadableRoomId from "@/lib/generateReadableRoomId";
import { toast } from "sonner";
// import { useMiscState } from "@/app/store/misc";
// import { useState } from "react";
export const useCreateMultiChannelHostConnection = () => {
  // const [hostConnections, setHostConnections] = useState<
  //   MultiChannelConnection[]
  // >([]);

  const { acceptMultiChannelIncomingConnectionRequestFromPeer } =
    useMultiChannelConnect();
  const { updateHostMultiConnectionStatePartially } =
    useHostMultiConnectionState();

  // const connections: MultiChannelConnection[] = [];
  // const offers: MultiChannelRoomOffer[] = [];
  let hostMultiConnectionData: HostMultiConnectionStateType = {
    peerConnection: [],
    dataChannel: [],
    offers: [],
    connectionState: [],
    dataChannelReady: [],
    userId: null,
    roomId: null,
    // index: null,
  };

  const firestore = FirestoreSignaling.getInstance();

  // const { currentMiscState } = useMiscState();

  const createMultiChannelHost = async () => {
    const userId = crypto.randomUUID();
    const roomId = generateReadableRoomId();

    for (let i = 0; i < 4; i++) {
      const newPeerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      newPeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // new candidate arrived
        } else {
          // candidate gathering completed
        }
      };

      const newDataChannel = newPeerConnection.createDataChannel(`p2p-${i}`, {
        ordered: true,
        maxRetransmits: 3,
      });
      // connections.push({
      //   peerConnection: newPeerConnection,
      //   dataChannel: newDataChannel,
      // });
      hostMultiConnectionData = {
        ...hostMultiConnectionData,
        peerConnection: [
          ...(hostMultiConnectionData.peerConnection || []),
          newPeerConnection,
        ],
        dataChannel: [
          ...(hostMultiConnectionData.dataChannel || []),
          newDataChannel,
        ],
        userId: userId,
        // index: i,
      };
    }

    try {
      for (
        let i = 0;
        i < (hostMultiConnectionData.peerConnection?.length ?? 0);
        i++
      ) {
        if (
          !hostMultiConnectionData.peerConnection ||
          !hostMultiConnectionData.dataChannel
        )
          throw new Error(
            "Peer connection or data channel is not initialized properly"
          );

        const offer = await hostMultiConnectionData.peerConnection[
          i
        ].createOffer();
        await hostMultiConnectionData.peerConnection[i].setLocalDescription(
          offer
        );
        // offers.push({
        //   type: offer.type,
        //   sdp: offer.sdp,
        //   userId: userId,
        // });
        hostMultiConnectionData = {
          ...hostMultiConnectionData,
          offers: [
            ...(hostMultiConnectionData.offers || []),
            {
              type: offer.type,
              sdp: offer.sdp,
              userId: userId,
            },
          ],
          connectionState: [
            ...(hostMultiConnectionData.connectionState || []),
            hostMultiConnectionData.peerConnection[i].connectionState,
          ],
          dataChannelReady: [
            ...(hostMultiConnectionData.dataChannelReady || []),
            hostMultiConnectionData.dataChannel[i].readyState === "open",
          ],
        };

        updateHostMultiConnectionStatePartially(hostMultiConnectionData);
      }

      const connection = await firestore.createMultiChannelRoomAsHost(
        roomId,
        hostMultiConnectionData.offers!
      );
      if (connection) {
        firestore.listenForMultiChannelPeerAnswers(
          roomId,

          hostMultiConnectionData.peerConnection,

          acceptMultiChannelIncomingConnectionRequestFromPeer
        );
        toast.success("Host connection created successfully");
        return roomId;
      } else {
        toast.error("Unable to create connection");
      }
    } catch (error) {
      console.error("Error creating connections:", error);
      toast.error("Error creating connections");
    }
  };
  return {
    createMultiChannelHost,
  };
};
