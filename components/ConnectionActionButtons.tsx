import { useVisibilityState } from "@/app/store/modals";
import { ModalIds } from "@/app/store/modals/types";
import { Button } from "@/components/ui/button";
import * as React from "react";

const CreateConnectionButton = (props: React.ComponentProps<"button">) => {
  const { showModal } = useVisibilityState();

  return (
    <Button
      size="sm"
      className="hidden md:flex items-center gap-2 cursor-pointer"
      onClick={() => {
        showModal(ModalIds.createConnectionUserNameModal);
      }}
      {...props}
    >
      Create Connection
    </Button>
  );
};
const JoinConnectionButton = (props: React.ComponentProps<"button">) => {
  const { showModal } = useVisibilityState();

  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden md:flex cursor-pointer"
      onClick={() => {
        showModal(ModalIds.joinConnectionUserNameModal);
      }}
      {...props}
    >
      Join connection
    </Button>
  );
};

export { CreateConnectionButton, JoinConnectionButton };
