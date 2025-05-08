import { atom, useAtom } from "jotai";

const modalVisibilityState = atom<string[]>([]);

export const useVisibilityState = () => {
  const [visibleModals, setVisibleModals] =
    useAtom<string[]>(modalVisibilityState);

  const hideModal = (id: string): void => {
    setVisibleModals((currentValues) => {
      return currentValues.filter((visible) => id !== visible);
    });
  };

  const hidePreviousThenShowNext = (
    modalToHide: string,
    modalToShow: string,
    delay?: number
  ) => {
    hideModal(modalToHide);
    setTimeout(
      () => {
        showModal(modalToShow);
      },
      delay ? delay : 500
    );
  };

  const showModal = (id: string): void => {
    if (!visibleModals.includes(id))
      setVisibleModals((currentValues) => {
        return [...currentValues, id];
      });
  };
  const imVisible = (id: string): boolean => {
    return visibleModals.includes(id);
  };
  return {
    showModal,
    hideModal,
    visibleModals,
    setVisibleModals,
    imVisible,
    hidePreviousThenShowNext,
  };
};
