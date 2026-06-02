import {
  MultiChannelRoomAnswer,
  MultiChannelRoomOffer,
  OfferMetadata,
} from "@/app/store/host/types";
import { Analytics, getAnalytics } from "firebase/analytics";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  arrayUnion,
  doc,
  Firestore,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export class FirestoreSignaling {
  private static instance: FirestoreSignaling;
  private database: Firestore;
  private analytics: Analytics | null = null;

  private constructor() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    this.database = getFirestore(app);

    if (typeof window !== "undefined") {
      this.analytics = getAnalytics(app);
    }
  }

  public static getInstance(): FirestoreSignaling {
    if (!FirestoreSignaling.instance) {
      FirestoreSignaling.instance = new FirestoreSignaling();
    }
    return FirestoreSignaling.instance;
  }

  public getAnalytics(): Analytics | null {
    return this.analytics;
  }

  public async createRoomAsHost(roomId: string, offer: OfferMetadata) {
    const roomRef = doc(this.database, "rooms", roomId);

    await setDoc(roomRef, {
      createdAt: serverTimestamp(),
      offer,
    });

    if (this.analytics) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(this.analytics, "room_created", {
        room_id: roomId,
      });
    }

    return roomRef;
  }

  sendIceCandidate = async ({
    roomId,
    candidate,
    fromHost,
  }: {
    roomId: string;
    candidate: RTCIceCandidate;
    fromHost: boolean;
  }) => {
    const roomRef = doc(this.database, "rooms", roomId);
    await updateDoc(
      roomRef,
      "candidates",
      arrayUnion({
        candidate: candidate.toJSON(),
        fromHost,
        timestamp: Date.now(),
      }),
    );
  };

  public async createMultiChannelRoomAsHost(
    roomId: string,
    offers: MultiChannelRoomOffer[],
  ) {
    const roomRef = doc(this.database, "multi-channel-rooms", roomId);

    await setDoc(roomRef, {
      createdAt: serverTimestamp(),
      offers,
    });

    if (this.analytics) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(this.analytics, "multi_channel_room_created", {
        room_id: roomId,
      });
    }

    return roomRef;
  }

  public async getHostOffer(roomId: string): Promise<OfferMetadata | null> {
    const roomRef = doc(this.database, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    const data = roomSnap.data();

    if (this.analytics && data?.offer) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(this.analytics, "offer_retrieved", {
        room_id: roomId,
      });
    }

    return (data?.offer as OfferMetadata) ?? null;
  }
  public async getMultiChannelHostOffer(
    roomId: string,
  ): Promise<MultiChannelRoomOffer[] | null> {
    const roomRef = doc(this.database, "multi-channel-rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    const data = roomSnap.data();

    if (this.analytics && data?.offer) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(this.analytics, "multi_channel_offer_retrieved", {
        room_id: roomId,
      });
    }
    return (data?.offers as MultiChannelRoomOffer[]) ?? null;
  }

  public async setPeerAnswer(
    roomId: string,
    answer: OfferMetadata,
    peerConnection: RTCPeerConnection,
  ) {
    const roomRef = doc(this.database, "rooms", roomId);
    await updateDoc(roomRef, { answer });
    this.listenForIceCandidates(roomId, peerConnection, "peer");
    if (this.analytics) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(this.analytics, "peer_answer_set", {
        room_id: roomId,
      });
    }
  }
  public async setMultiChannelPeerAnswers(
    roomId: string,
    answers: MultiChannelRoomAnswer[],
  ) {
    const roomRef = doc(this.database, "multi-channel-rooms", roomId);
    await updateDoc(roomRef, { answers });

    if (this.analytics) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(this.analytics, "multi_channel_peer_answer_set", {
        room_id: roomId,
      });
    }
  }

  listenForPeerAnswers = async (
    roomId: string,
    peerConnection: RTCPeerConnection | null,
    onAnswer: (
      incomingConnectionRequestHandshake: string,
      peerConnection: RTCPeerConnection | null,
    ) => void,
  ) => {
    const roomRef = doc(this.database, "rooms", roomId);

    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      const data = docSnap.data();
      if (data?.answer) {
        onAnswer(JSON.stringify(data.answer), peerConnection);

        if (this.analytics) {
          import("firebase/analytics").then(({ logEvent }) => {
            logEvent(this.analytics!, "peer_answer_received", {
              room_id: roomId,
            });
          });
        }
        this.listenForIceCandidates(roomId, peerConnection, "host");
        unsubscribe();
      }
    });
    return unsubscribe;
  };

  listenForIceCandidates = async (
    roomId: string,
    peerConnection: RTCPeerConnection | null,
    listenAs: string = "host",
  ) => {
    const roomRef = doc(this.database, "rooms", roomId);
    const processedCandidates = new Set<string>();

    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      const data = docSnap.data();
      if (data?.candidates) {
        const candidates = data.candidates as {
          candidate: RTCIceCandidate;
          fromHost: boolean;
          timestamp: number;
        }[];
        candidates
          .filter((candidate) =>
            listenAs === "host"
              ? candidate.fromHost === false
              : candidate.fromHost,
          )
          .filter((candidateData) => {
            const key = `${candidateData.timestamp}-${candidateData.fromHost}`;
            if (processedCandidates.has(key)) {
              return false; // Already processed
            }
            processedCandidates.add(key);
            return true;
          })

          .forEach((candidateData) => {
            console.log("Received ICE candidate:", candidateData);
            const candidate = candidateData.candidate;
            if (peerConnection && candidate) {
              peerConnection.addIceCandidate(candidate);
            }
          });
      }
    });
    return unsubscribe;
  };

  listenForMultiChannelPeerAnswers = async (
    roomId: string,
    peerConnections: RTCPeerConnection[] | null,
    onAnswer: (
      incomingConnectionRequestHandshake: string[],
      peerConnections: RTCPeerConnection[] | null,
    ) => void,
  ) => {
    const roomRef = doc(this.database, "multi-channel-rooms", roomId);

    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      const data = docSnap.data();
      if (data?.answers) {
        const answers = data.answers as MultiChannelRoomAnswer[];

        const answerStrings = answers.map((answer) => JSON.stringify(answer));
        onAnswer(answerStrings, peerConnections);

        if (this.analytics) {
          import("firebase/analytics").then(({ logEvent }) => {
            logEvent(this.analytics!, "multi_channel_peer_answer_received", {
              room_id: roomId,
            });
          });
        }
        this.listenForMultiChannelIceCandidates(
          roomId,
          peerConnections,
          "host",
        );
        unsubscribe();
      }
    });
    return unsubscribe;
  };

  sendMultiChannelIceCandidate = async ({
    roomId,
    candidate,
    fromHost,
    pcIndex,
  }: {
    roomId: string;
    candidate: RTCIceCandidate;
    fromHost: boolean;
    pcIndex: number;
  }) => {
    const roomRef = doc(this.database, "multi-channel-rooms", roomId);
    await updateDoc(
      roomRef,
      "candidates",
      arrayUnion({
        candidate: candidate.toJSON(),
        fromHost,
        pcIndex,
        timestamp: Date.now(),
      }),
    );
  };

  listenForMultiChannelIceCandidates = async (
    roomId: string,
    peerConnections: RTCPeerConnection[] | null,
    listenAs: string = "host",
  ) => {
    const roomRef = doc(this.database, "multi-channel-rooms", roomId);
    const processedCandidates = new Set<string>();

    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      const data = docSnap.data();
      if (data?.candidates) {
        const candidates = data.candidates as {
          candidate: RTCIceCandidate;
          fromHost: boolean;
          timestamp: number;
          pcIndex: number;
        }[];
        candidates
          .filter((candidate) =>
            listenAs === "host"
              ? candidate.fromHost === false
              : candidate.fromHost,
          )
          .filter((candidateData) => {
            const key = `${candidateData.timestamp}-${candidateData.fromHost}-${candidateData.pcIndex}`;
            if (processedCandidates.has(key)) {
              return false; // Already processed
            }
            processedCandidates.add(key);
            return true;
          })

          .forEach((candidateData) => {
            // console.log("Received ICE candidate:", candidateData);
            const candidate = candidateData.candidate;
            const pcIndex = candidateData.pcIndex;
            if (peerConnections && peerConnections[pcIndex] && candidate) {
              try {
                // Ensure candidate is a valid RTCIceCandidate
                const rtcCandidate = new RTCIceCandidate(candidate);
                console.log(
                  `Adding ICE candidate to PC ${pcIndex}:`,
                  rtcCandidate.candidate,
                );
                peerConnections[pcIndex].addIceCandidate(rtcCandidate);
              } catch (e) {
                console.error(
                  `Error adding ICE candidate to PC ${pcIndex}:`,
                  e,
                );
              }
            } else {
              console.warn(
                `Skipping candidate for PC ${pcIndex} - PC exists: ${!!(
                  peerConnections && peerConnections[pcIndex]
                )}`,
              );
            }
          });
      }
    });
    return unsubscribe;
  };
}
