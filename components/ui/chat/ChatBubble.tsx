import { Message } from "@/app/store/messenger/types";
import React from "react";

export const ChatBubble = (message: Message) => {
  return (
    <div className="m-2">
      <div className="flex flex-col w-full max-w-[320px] leading-1.5 p-4 rounded-e-xl rounded-es-xl dark:bg-card bg-gray-100">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm font-semibold">{message.sender}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {typeof message.message === "string" && (
          <p className="text-sm font-normal py-2.5 ">{message.message}</p>
        )}
      </div>
    </div>
  );
};
