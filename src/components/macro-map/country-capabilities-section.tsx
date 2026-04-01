"use client";

import { useState, useCallback, useRef } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { getCountryDetail } from "@/data/mock-country-details";
import {
  CAPABILITY_CONFIG,
  EMPTY_CAPABILITIES,
  type CoreCapabilities,
  type CapabilityKey,
} from "@/types/macro-map";

interface Props {
  iso: string;
}

function buildLocal(caps: CoreCapabilities | null | undefined): CoreCapabilities {
  if (!caps) return { ...EMPTY_CAPABILITIES };
  return {
    most_wanted: [...caps.most_wanted],
    must_keep: [...caps.must_keep],
    strongest: [...caps.strongest],
    weakest: [...caps.weakest],
    longest_strength: [...caps.longest_strength],
  };
}

export function CountryCapabilitiesSection({ iso }: Props) {
  const countryEdits = useMacroMapStore((s) => s.countryEdits);
  const updateCountryEdit = useMacroMapStore((s) => s.updateCountryEdit);

  const detail = getCountryDetail(iso, countryEdits);
  const [local, setLocal] = useState(() => buildLocal(detail?.core_capabilities));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* reset on country change */
  const [prevIso, setPrevIso] = useState(iso);
  if (iso !== prevIso) {
    setPrevIso(iso);
    const d = getCountryDetail(iso, countryEdits);
    setLocal(buildLocal(d?.core_capabilities));
  }

  const handleChange = useCallback(
    (catKey: CapabilityKey, idx: 0 | 1 | 2, value: string) => {
      setLocal((prev) => {
        const next = { ...prev };
        const arr = [...prev[catKey]] as [string, string, string];
        arr[idx] = value;
        next[catKey] = arr;
        return next;
      });

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setLocal((latest) => {
          updateCountryEdit(iso, "core_capabilities", latest);
          return latest;
        });
      }, 300);
    },
    [iso, updateCountryEdit],
  );

  return (
    <div className="border-b border-border">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          5대 핵심 능력 분석
          <ChevronDown className="h-4 w-4 transition-transform [[data-panel-open]_&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 px-4 pb-4">
            {CAPABILITY_CONFIG.map((cap) => (
              <div key={cap.key} className="space-y-1.5">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  {cap.label}
                </h4>
                {([0, 1, 2] as const).map((idx) => (
                  <Input
                    key={idx}
                    type="text"
                    value={local[cap.key][idx]}
                    onChange={(e) =>
                      handleChange(cap.key, idx, e.target.value)
                    }
                    placeholder={`${cap.placeholder} ${idx + 1}`}
                    className="h-7 w-full text-sm"
                  />
                ))}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
