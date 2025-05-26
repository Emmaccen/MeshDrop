import { OfferMetadata } from "@/app/store/host/types";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import {
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

  public async setPeerAnswer(roomId: string, answer: OfferMetadata) {
    const roomRef = doc(this.database, "rooms", roomId);
    await updateDoc(roomRef, { answer });

    if (this.analytics) {
      const { logEvent } = await import("firebase/analytics");
      logEvent(this.analytics, "peer_answer_set", {
        room_id: roomId,
      });
    }
  }

  listenForPeerAnswers = async (
    roomId: string,
    peerConnection: RTCPeerConnection | null,
    onAnswer: (
      incomingConnectionRequestHandshake: string,
      peerConnection: RTCPeerConnection | null
    ) => void
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
        unsubscribe();
      }
    });
    return unsubscribe;
  };
}
