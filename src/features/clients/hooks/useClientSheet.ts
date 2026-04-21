"use client";

import { useMemo, useState } from "react";
import type { ClientListItem } from "../client.types";

type ClientSheetTab = "overview" | "projects" | "invoices" | "activity";

export function useClientSheet(clients: ClientListItem[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [tab, setTab] = useState<ClientSheetTab>("overview");

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const openClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setTab("overview");
    setIsOpen(true);
  };

  const closeSheet = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    setIsOpen,
    selectedClient,
    selectedClientId,
    tab,
    setTab,
    openClient,
    closeSheet,
  };
}
