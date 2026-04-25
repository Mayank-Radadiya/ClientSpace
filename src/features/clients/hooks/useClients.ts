"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type {
  ClientDisplayStatus,
  ClientListItem,
  ClientSortOption,
} from "../client.types";

const PAGE_SIZE = 24;
const VIEW_STORAGE_KEY = "clients-view-preference";

type ViewMode = "grid" | "list";
type StatusFilter = ClientDisplayStatus | "all";
type StatFilter = "all" | "has_projects" | "has_outstanding";

type UseClientsParams = {
  clients: ClientListItem[];
};

function parseMoney(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function useClients({ clients }: UseClientsParams) {
  const [search, setSearchRaw] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [statusFilter, setStatusFilterRaw] = useState<StatusFilter>("all");
  const [statFilter, setStatFilterRaw] = useState<StatFilter>("all");
  const [sort, setSortRaw] = useState<ClientSortOption>("last_activity_desc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return stored === "grid" || stored === "list" ? stored : "grid";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const byStatusCounts = useMemo(() => {
    const counts: Record<ClientDisplayStatus, number> = {
      active: 0,
      inactive: 0,
      pending: 0,
      archived: 0,
    };

    for (const client of clients) {
      counts[client.displayStatus] += 1;
    }

    return counts;
  }, [clients]);

  const filtered = useMemo(() => {
    const normalizedQuery = debouncedSearch.trim().toLowerCase();

    return clients.filter((client) => {
      if (statusFilter !== "all" && client.displayStatus !== statusFilter) {
        return false;
      }

      if (statFilter === "has_projects" && client.activeProjectCount <= 0) {
        return false;
      }

      if (
        statFilter === "has_outstanding" &&
        parseMoney(client.outstandingAmountCents) <= 0
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        client.companyName ?? "",
        client.contactName ?? "",
        client.email,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [clients, debouncedSearch, statusFilter, statFilter]);

  const sorted = useMemo(() => {
    const rows = [...filtered];

    const activityValue = (iso: string | null) =>
      iso ? new Date(iso).getTime() : 0;

    rows.sort((a, b) => {
      if (sort === "name_asc") {
        return (a.companyName ?? a.contactName ?? a.email).localeCompare(
          b.companyName ?? b.contactName ?? b.email,
        );
      }

      if (sort === "name_desc") {
        return (b.companyName ?? b.contactName ?? b.email).localeCompare(
          a.companyName ?? a.contactName ?? a.email,
        );
      }

      if (sort === "last_activity_desc") {
        return (
          activityValue(b.lastActivityAt) - activityValue(a.lastActivityAt)
        );
      }

      if (sort === "last_activity_asc") {
        return (
          activityValue(a.lastActivityAt) - activityValue(b.lastActivityAt)
        );
      }

      if (sort === "revenue_desc") {
        return (
          parseMoney(b.totalRevenueCents) - parseMoney(a.totalRevenueCents)
        );
      }

      return (
        parseMoney(b.outstandingAmountCents) -
        parseMoney(a.outstandingAmountCents)
      );
    });

    return rows;
  }, [filtered, sort]);

  const visibleClients = useMemo(
    () => sorted.slice(0, visibleCount),
    [sorted, visibleCount],
  );

  const canLoadMore = visibleCount < sorted.length;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sorted.length));
  };

  const clearFilters = () => {
    setSearchRaw("");
    setStatusFilterRaw("all");
    setStatFilterRaw("all");
    setSortRaw("last_activity_desc");
    setVisibleCount(PAGE_SIZE);
  };

  const setSearch = (value: string) => {
    setSearchRaw(value);
    setVisibleCount(PAGE_SIZE);
  };

  const setStatusFilter = (value: StatusFilter) => {
    setStatusFilterRaw(value);
    setVisibleCount(PAGE_SIZE);
  };

  const setStatFilter = (value: StatFilter) => {
    setStatFilterRaw(value);
    setVisibleCount(PAGE_SIZE);
  };

  const setSort = (value: ClientSortOption) => {
    setSortRaw(value);
    setVisibleCount(PAGE_SIZE);
  };

  return {
    view,
    setView,
    search,
    setSearch,
    debouncedSearch,
    statusFilter,
    setStatusFilter,
    statFilter,
    setStatFilter,
    sort,
    setSort,
    counts: {
      all: clients.length,
      ...byStatusCounts,
    },
    totalFiltered: sorted.length,
    visibleClients,
    canLoadMore,
    loadMore,
    clearFilters,
  };
}
