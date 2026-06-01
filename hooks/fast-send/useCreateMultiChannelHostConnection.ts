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
        // No maxRetransmits = reliable delivery (like TCP)
        // maxRetransmits: 3 was causing silent chunk loss under multichannel congestion
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
      let isRoomCreated = false;
      const candidatesBuffer: {
        roomId: string;
        candidate: RTCIceCandidate;
        fromHost: boolean;
        pcIndex: number;
      }[] = [];

      for (
        let i = 0;
        i < (hostMultiConnectionData.peerConnection?.length ?? 0);
        i++
      ) {
        const pc = hostMultiConnectionData.peerConnection![i];
        if (!pc || !hostMultiConnectionData.dataChannel)
          throw new Error(
            "Peer connection or data channel is not initialized properly",
          );

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidateData = {
              roomId,
              candidate: event.candidate,
              fromHost: true,
              pcIndex: i,
            };
            if (isRoomCreated) {
              firestore.sendMultiChannelIceCandidate(candidateData);
            } else {
              candidatesBuffer.push(candidateData);
            }
          }
        };

        pc.onconnectionstatechange = () => {
          console.log(`PC ${i} state change: ${pc.connectionState}`);
          hostMultiConnectionData.connectionState[i] = pc.connectionState;
          updateHostMultiConnectionStatePartially({
            connectionState: [...hostMultiConnectionData.connectionState],
          });
        };

        const dc = hostMultiConnectionData.dataChannel![i];
        dc.onopen = () => {
          console.log(`DC ${i} open`);
          hostMultiConnectionData.dataChannelReady[i] = true;
          updateHostMultiConnectionStatePartially({
            dataChannelReady: [...hostMultiConnectionData.dataChannelReady],
          });
        };
        dc.onclose = () => {
          console.log(`DC ${i} closed`);
          hostMultiConnectionData.dataChannelReady[i] = false;
          updateHostMultiConnectionStatePartially({
            dataChannelReady: [...hostMultiConnectionData.dataChannelReady],
          });
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

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
            pc.connectionState,
          ],
          dataChannelReady: [
            ...(hostMultiConnectionData.dataChannelReady || []),
            hostMultiConnectionData.dataChannel[i].readyState === "open",
          ],
        };

        hostMultiConnectionData = {
          ...hostMultiConnectionData,
          roomId: roomId,
          userId: userId,
        };

        updateHostMultiConnectionStatePartially(hostMultiConnectionData);
      }

      const connection = await firestore.createMultiChannelRoomAsHost(
        roomId,
        hostMultiConnectionData.offers!,
      );

      let unsubscribeFromAnswers: (() => void) | undefined;

      if (connection) {
        isRoomCreated = true;
        // Flush buffer
        candidatesBuffer.forEach((candidateData) => {
          firestore.sendMultiChannelIceCandidate(candidateData);
        });

        unsubscribeFromAnswers =
          await firestore.listenForMultiChannelPeerAnswers(
            roomId,
            hostMultiConnectionData.peerConnection,
            acceptMultiChannelIncomingConnectionRequestFromPeer,
          );

        firestore.listenForMultiChannelIceCandidates(
          roomId,
          hostMultiConnectionData.peerConnection,
          "host",
        );

        toast.success("Host connection created successfully");
        return roomId;
      } else {
        toast.error("Unable to create connection");
      }
    } catch (error) {
      console.error("Error creating connections:", error);
      toast.error("Error creating connections");
      // Cleanup on error
      hostMultiConnectionData.peerConnection?.forEach((pc) => pc.close());
    }
  };
  return {
    createMultiChannelHost,
  };
};
