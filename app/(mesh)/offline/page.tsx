"use client";
import { Button } from "@/components/ui/button";
import { WifiOffIcon } from "lucide-react";
import { useEffect } from "react";

export default function Offline() {
  useEffect(() => {
    const handleOnline = () => {
      setTimeout(() => window.location.reload(), 1000);
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-center mb-6">
              <WifiOffIcon className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-semibold text-center mb-2">
              {`You're currently offline`}
            </h1>

            <p className="text-muted-foreground text-center mb-6">
              Please check your internet connection to continue using the
              application.
            </p>

            <div className="flex justify-center space-x-4">
              <Button
                size="sm"
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex cursor-pointer"
                onClick={() => (window.location.href = "/")}
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
