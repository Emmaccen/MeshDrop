import { atom, useAtom } from "jotai";

import { FileManagerStateType } from "@/app/store/fileManager/types";
import { useUpdateStore } from "@/app/store/utils/useUpdateStore";

export const fileManagerState = atom<FileManagerStateType>({});

export const useFileManagerState = () => {
  const [currentFileManagerState] =
    useAtom<FileManagerStateType>(fileManagerState);
  const { updateStore: updateFileManagerStatePartially } =
    useUpdateStore<FileManagerStateType>(fileManagerState);
  return {
    currentFileManagerState,
    updateFileManagerStatePartially,
  };
};
