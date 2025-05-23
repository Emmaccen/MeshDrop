import { OfferMetadata } from "@/app/store/host/types";
import { getApp, getApps, initializeApp } from "firebase/app";
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
};

export class FirestoreSignaling {
  private static instance: FirestoreSignaling;
  private database: Firestore;

  private constructor() {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    this.database = getFirestore(app);
  }

  public static getInstance(): FirestoreSignaling {
    if (!FirestoreSignaling.instance) {
      FirestoreSignaling.instance = new FirestoreSignaling();
    }
    return FirestoreSignaling.instance;
  }

  public async createRoomAsHost(roomId: string, offer: OfferMetadata) {
    const roomRef = doc(this.database, "rooms", roomId);

    await setDoc(roomRef, {
      createdAt: serverTimestamp(),
      offer,
    });

    return roomRef;
  }

  public async getHostOffer(roomId: string): Promise<OfferMetadata | null> {
    const roomRef = doc(this.database, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);
    const data = roomSnap.data();
    return (data?.offer as OfferMetadata) ?? null;
  }

  public async setPeerAnswer(roomId: string, answer: OfferMetadata) {
    const roomRef = doc(this.database, "rooms", roomId);
    await updateDoc(roomRef, { answer });
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
        unsubscribe();
      }
    });
    return unsubscribe;
  };
}
