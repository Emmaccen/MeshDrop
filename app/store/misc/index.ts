import { atom, useAtom } from "jotai";

import { MiscType } from "@/app/store/misc/types";
import { useUpdateStore } from "@/app/store/utils/useUpdateStore";

export const miscState = atom<MiscType>({
  discoveryMode: "offline",
});

export const useMiscState = () => {
  const [currentMiscState] = useAtom<MiscType>(miscState);
  const { updateStore: updateMiscStatePartially } =
    useUpdateStore<MiscType>(miscState);
  return {
    currentMiscState,
    updateMiscStatePartially,
  };
};
