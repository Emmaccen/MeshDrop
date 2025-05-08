import { Atom, useAtom } from "jotai";
import { useCallback } from "react";

// TODO: Confirm if this isn't madness later 💔
/**
 *
 * @param atomStore
 * @returns values: T; updateStore: (updatedValues: Partial<T>) => void;
 * @toUse const { values: renamed, updateStore: renamed } = useUpdateStore<Type>(jotaiState);
 */
export const useUpdateStore = <T>(atomStore: Atom<T>) => {
  const [values, setter] = useAtom<T>(atomStore);

  const updateStore = useCallback(
    (updatedValues: Partial<T>) => {
      // Type assertion to make sure setter accepts a function
      (setter as (updater: (prev: T) => T) => void)((prev) => {
        return { ...prev, ...updatedValues };
      });
    },
    [setter]
  );
  return { values, updateStore };
};
