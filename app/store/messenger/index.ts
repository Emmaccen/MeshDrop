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

  const updateMessage = (newMessage: Message) => {
    setCurrentMessengerState((prevState) => {
      return {
        ...prevState,
        messages: [...prevState.messages, newMessage],
      };
    });
  };
  return {
    currentMessengerState,
    updateMessengerStatePartially,
    updateMessage,
  };
};
