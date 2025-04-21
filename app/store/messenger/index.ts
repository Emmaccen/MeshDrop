import { atom, useAtom } from "jotai";

import { Message, MessengerStateType } from "@/app/store/messenger/types";
import { useUpdateStore } from "@/app/store/utils/useUpdateStore";

export const fileManagerState = atom<MessengerStateType>({
  messages: [],
});

export const useMessengerState = () => {
  const [currentMessengerState, setCurrentMessengerState] =
    useAtom<MessengerStateType>(fileManagerState);
  const { updateStore: updateMessengerStatePartially } =
    useUpdateStore<MessengerStateType>(fileManagerState);

  const addNewMessage = (newMessage: Message) => {
    setCurrentMessengerState((prevState) => {
      return {
        messages: [...prevState.messages, newMessage],
      };
    });
  };

  const updateMessageById = (id: string, updatedMessage: Message) => {
    setCurrentMessengerState((prevState) => {
      const updatedMessages = prevState.messages.map((message) =>
        message.id === id ? { ...message, ...updatedMessage } : message
      );
      return {
        messages: updatedMessages,
      };
    });
  };
  const getMessageById = (id: string) => {
    const message = currentMessengerState.messages.find(
      (message) => message.id === id
    );
    if (!message) {
      console.error("Message not found");
      return null;
    }
    return message;
  };
  return {
    currentMessengerState,
    updateMessengerStatePartially,
    addNewMessage,
    updateMessageById,
    getMessageById,
  };
};
