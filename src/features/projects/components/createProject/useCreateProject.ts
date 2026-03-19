"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createProjectAction } from "../../server/actions";
import { trpc } from "@/lib/trpc/client";
import { gooeyToast as toast } from "@/components/ui/goey-toaster";

export function useCreateProject(onSuccess?: () => void) {
  const [state, formAction] = useActionState(createProjectAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const utils = trpc.useUtils();

  const [startDate, setStartDate] = useState<Date>();
  const [deadline, setDeadline] = useState<Date>();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setStartDate(undefined);
      setDeadline(undefined);
      utils.project.getAll.invalidate();
      toast.success("Project launched successfully!");
      onSuccess?.();
    }
  }, [state.success, utils.project.getAll, onSuccess]);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(
    "not_started",
  );
  const [selectedPriority, setSelectedPriority] = useState<string | null>(
    "medium",
  );

  return {
    state,
    formAction,
    formRef,
    startDate,
    setStartDate,
    deadline,
    setDeadline,
    startDateOpen,
    setStartDateOpen,
    deadlineOpen,
    setDeadlineOpen,
    selectedClientId,
    setSelectedClientId,
    selectedStatus,
    setSelectedStatus,
    selectedPriority,
    setSelectedPriority,
  };
}
