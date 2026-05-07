"use client";

import { useCallback, useRef } from "react";
import { useState } from "react";

type UseBulkSelectOptions = {
  ids: string[];
};

export function useBulkSelect({ ids }: UseBulkSelectOptions) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<string | null>(null);

  const toggle = useCallback(
    (id: string, shiftHeld: boolean) => {
      setSelected((prev) => {
        const next = new Set(prev);

        if (shiftHeld && lastClickedRef.current) {
          const fromIdx = ids.indexOf(lastClickedRef.current);
          const toIdx = ids.indexOf(id);
          if (fromIdx !== -1 && toIdx !== -1) {
            const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
            const rangeIds = ids.slice(start, end + 1);
            const allSelected = rangeIds.every((rid) => prev.has(rid));
            if (allSelected) {
              rangeIds.forEach((rid) => next.delete(rid));
            } else {
              rangeIds.forEach((rid) => next.add(rid));
            }
          }
        } else {
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
        }

        lastClickedRef.current = id;
        return next;
      });
    },
    [ids],
  );

  const selectAll = useCallback(() => {
    setSelected(new Set(ids));
  }, [ids]);

  const clearAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  return {
    selected,
    toggle,
    selectAll,
    clearAll,
    isSelected,
    count: selected.size,
    allSelected: ids.length > 0 && selected.size === ids.length,
    someSelected: selected.size > 0 && selected.size < ids.length,
  };
}
