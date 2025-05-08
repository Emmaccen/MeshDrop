import { atom, useAtom } from "jotai";

const loaderState = atom<string[]>([]);

export const useLoadingState = () => {
  const [currentLoaders, setCurrentLoaders] = useAtom<string[]>(loaderState);

  const stopLoader = (id: string): void => {
    setCurrentLoaders((currentValues) => {
      return currentValues.filter((visible) => id !== visible);
    });
  };

  const stopPreviousThenLoadNext = (
    loaderToStop: string,
    loaderToStart: string,
    delay?: number
  ) => {
    stopLoader(loaderToStop);
    setTimeout(
      () => {
        startLoader(loaderToStart);
      },
      delay ? delay : 500
    );
  };

  const startLoader = (id: string): void => {
    if (!currentLoaders.includes(id))
      setCurrentLoaders((currentValues) => {
        return [...currentValues, id];
      });
  };
  const imLoading = (id: string): boolean => {
    return currentLoaders.includes(id);
  };

  const resetAllLoaders = () => {
    setCurrentLoaders([]);
  };

  const resetAllLoadersTo = (id: string) => {
    setCurrentLoaders([id]);
  };
  return {
    startLoader,
    stopLoader,
    currentLoaders,
    setCurrentLoaders,
    imLoading,
    stopPreviousThenLoadNext,
    resetAllLoaders,
    resetAllLoadersTo,
  };
};
