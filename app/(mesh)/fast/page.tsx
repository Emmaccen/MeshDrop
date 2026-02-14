"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateMultiChannelHostConnection } from "@/hooks/fast-send/useCreateMultiChannelHostConnection";
import { useMultiChannelConnect } from "@/hooks/fast-send/useMultiChannelConnect";
import { FirestoreSignaling } from "@/lib/FirestoreSignaling";
import React, { useState } from "react";
import { toast } from "sonner";
const FastSend = () => {
  const { createMultiChannelHost } = useCreateMultiChannelHostConnection();
  const [roomId, setRoomId] = React.useState<string | null>(null);
  const [roomIdPeer, setRoomIdPeer] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { requestMultiChannelConnectionFromHost } = useMultiChannelConnect();
  const firestore = FirestoreSignaling.getInstance();

  const [imLoading, setImLoading] = useState({
    id: "",
  });

  return (
    <div className="p-6 w-full h-full">
      <Tabs defaultValue="account" className="w-full h-full">
        <div className="flex justify-center items-center">
          <TabsList>
            <TabsTrigger value="account">Create Connection</TabsTrigger>
            <TabsTrigger value="password">Join Connection</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="account" className="h-full">
          <div className="h-full flex flex-col items-center justify-center gap-4">
            {!roomId ? (
              <div className="flex flex-col gap-2">
                <p className="text-center text-muted-foreground">
                  No connection established yet.
                </p>
                <p className="text-center text-muted-foreground">
                  Please create a connection to start sharing files.
                </p>
              </div>
            ) : (
              <div>
                <p>Share the ID below with the other device</p>
                <h3 className="font-bold tracking-[0.5rem] text-center text-4xl p-2">
                  {roomId}
                </h3>
              </div>
            )}
            <div className="flex flex-col gap-2 px-2">
              <Button
                loading={loading}
                onClick={async () => {
                  setLoading(true);
                  const roomId = await createMultiChannelHost();
                  setLoading(false);
                  if (roomId) setRoomId(roomId);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                {!roomId ? `Create Fast Speed Connection` : `Retry?`}
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="password">
          <div className="h-full flex flex-col items-center justify-center gap-4">
            {!roomId && (
              <div className="flex flex-col gap-2">
                <p className="text-center text-muted-foreground">
                  No connection established yet.
                </p>
                <p className="text-center text-muted-foreground">
                  Please type in the room-id below to start sharing files.
                </p>
                <Input
                  value={roomIdPeer ?? ""}
                  onChange={(e) => setRoomIdPeer(e.target.value.toLowerCase())}
                  className="my-3"
                  id="roomid"
                  type="text"
                />
              </div>
            )}
            <div className="flex flex-col gap-2 px-2">
              <Button
                loading={imLoading.id === "processing-room-id"}
                onClick={async () => {
                  if (!roomIdPeer?.trim()) return;
                  setImLoading({
                    id: "processing-room-id",
                  });
                  const hostOffer = await firestore.getMultiChannelHostOffer(
                    roomIdPeer.trim()
                  );
                  if (hostOffer !== null) {
                    requestMultiChannelConnectionFromHost(
                      hostOffer.map((offer) => JSON.stringify(offer)),
                      roomIdPeer.trim()
                    );
                    console.log(hostOffer);
                  } else {
                    toast.error(
                      "Room-Id not found. Please create a new one on the other device"
                    );
                  }
                  setImLoading({
                    id: "",
                  });
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                {!roomId ? `Join Connection` : `Retry?`}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FastSend;
