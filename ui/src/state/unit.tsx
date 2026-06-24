import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api, type Unit } from "../api/client";

interface UnitCtx {
  units: Unit[];
  selected: Unit | null;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<UnitCtx | null>(null);

export function UnitProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(
    () => localStorage.getItem("meridian.unit"),
  );

  async function refresh() {
    const u = await api.listUnits();
    setUnits(u);
    setSelectedIdState((cur) => cur ?? u[0]?.id ?? null);
  }

  useEffect(() => {
    void refresh();
  }, []);

  function setSelectedId(id: string) {
    localStorage.setItem("meridian.unit", id);
    setSelectedIdState(id);
  }

  const selected = units.find((u) => u.id === selectedId) ?? null;

  return (
    <Ctx.Provider value={{ units, selected, selectedId, setSelectedId, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUnits(): UnitCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUnits must be used within UnitProvider");
  return ctx;
}
