"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type PortfolioRow,
  type Team,
} from "@/lib/finance-portfolio-schema";
import { PortfolioSummary } from "./portfolio-summary";
import { TeamColumn } from "./team-column";
import { SaveBar } from "./save-bar";

interface Props {
  initialRows: PortfolioRow[];
}

const MAX_ROWS = 50;

export function PortfolioEditor({ initialRows }: Props) {
  const [rows, setRows] = useState<PortfolioRow[]>(initialRows);
  const [savedRows, setSavedRows] =
    useState<PortfolioRow[]>(initialRows);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(rows) !== JSON.stringify(savedRows),
    [rows, savedRows],
  );

  const total = rows.reduce((s, r) => s + r.amount, 0);

  const invalidCount = rows.reduce((n, r) => {
    let count = 0;
    if (r.name.trim().length === 0) count += 1;
    if (r.memo.length > 200) count += 1;
    return n + count;
  }, 0);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleAdd = useCallback((team: Team) => {
    setRows((rs) => {
      if (rs.length >= MAX_ROWS) return rs;
      return [
        ...rs,
        {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`,
          team,
          name: "",
          amount: 0,
          memo: "",
        },
      ];
    });
  }, []);

  const handleChange = useCallback(
    (id: string, patch: Partial<PortfolioRow>) => {
      setRows((rs) =>
        rs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
    },
    [],
  );

  const handleRemove = useCallback((id: string) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    setPending(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) detail = String(data.error);
        } catch {}
        setErrorMessage(`저장 실패: ${detail}`);
        return;
      }
      const data = (await res.json()) as { rows: PortfolioRow[] };
      setSavedRows(data.rows);
      setRows(data.rows);
    } catch {
      setErrorMessage("저장 실패: 네트워크 오류");
    } finally {
      setPending(false);
    }
  }, [rows]);

  return (
    <div className="space-y-6 pb-24">
      <PortfolioSummary rows={rows} />
      <div className="grid gap-4 md:grid-cols-2">
        <TeamColumn
          team="BLUE"
          rows={rows}
          total={total}
          onAdd={() => handleAdd("BLUE")}
          onChange={handleChange}
          onRemove={handleRemove}
          disabledAdd={rows.length >= MAX_ROWS}
        />
        <TeamColumn
          team="WHITE"
          rows={rows}
          total={total}
          onAdd={() => handleAdd("WHITE")}
          onChange={handleChange}
          onRemove={handleRemove}
          disabledAdd={rows.length >= MAX_ROWS}
        />
      </div>
      <SaveBar
        dirty={dirty}
        pending={pending}
        invalidCount={invalidCount}
        errorMessage={errorMessage}
        onSave={handleSave}
      />
    </div>
  );
}
