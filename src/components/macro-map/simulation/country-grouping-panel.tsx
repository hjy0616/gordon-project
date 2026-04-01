"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCorners,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { MOCK_COUNTRIES } from "@/data/mock-countries";
import type { CountryGroupType } from "@/types/macro-map";
import { cn } from "@/lib/utils";
import { CountryGroupColumn } from "./country-group-column";
import { DragOverlayCard } from "./drag-overlay-card";

const GROUP_TYPES: CountryGroupType[] = [
  "unclassified",
  "needed",
  "unnecessary",
];
const GROUP_LABELS: Record<CountryGroupType, string> = {
  unclassified: "미분류",
  needed: "필요한 국가",
  unnecessary: "필요 없는 국가",
};

export function CountryGroupingPanel() {
  const activeSuperpower = useMacroMapStore((s) => s.activeSuperpower);
  const countryGroupings = useMacroMapStore((s) => s.countryGroupings);
  const setCountryGroup = useMacroMapStore((s) => s.setCountryGroup);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [thumbStyle, setThumbStyle] = useState({ width: "0%", left: "0%" });
  const [canScroll, setCanScroll] = useState(false);

  const updateThumb = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth;
    setCanScroll(overflow);
    if (!overflow) return;
    setThumbStyle({
      width: `${(el.clientWidth / el.scrollWidth) * 100}%`,
      left: `${(el.scrollLeft / el.scrollWidth) * 100}%`,
    });
  }, []);

  useEffect(() => {
    updateThumb();
    window.addEventListener("resize", updateThumb);
    return () => window.removeEventListener("resize", updateThumb);
  }, [updateThumb]);

  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      const track = e.currentTarget;
      if (!el) return;
      const rect = track.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      el.scrollTo({
        left: ratio * el.scrollWidth - el.clientWidth / 2,
        behavior: "smooth",
      });
    },
    [],
  );

  const handleThumbDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const el = scrollRef.current;
      const track = trackRef.current;
      if (!el || !track) return;

      const trackRect = track.getBoundingClientRect();
      const startX = e.clientX;
      const startScroll = el.scrollLeft;
      const scrollRange = el.scrollWidth - el.clientWidth;
      const trackWidth = trackRect.width;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const scrollDelta = (dx / trackWidth) * el.scrollWidth;
        el.scrollLeft = Math.max(0, Math.min(scrollRange, startScroll + scrollDelta));
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [],
  );

  // 컬럼 드롭 영역만 감지하는 커스텀 충돌 감지
  const columnCollision: CollisionDetection = (args) => {
    const within = pointerWithin(args).filter((c) =>
      GROUP_TYPES.includes(c.id as CountryGroupType),
    );
    if (within.length > 0) return within;
    return closestCorners(args).filter((c) =>
      GROUP_TYPES.includes(c.id as CountryGroupType),
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const groupings = countryGroupings[activeSuperpower];

  // 현재 초강대국 자신 제외, 3그룹으로 분류
  const { unclassified, needed, unnecessary } = useMemo(() => {
    const eligible = MOCK_COUNTRIES.filter(
      (c) => c.iso_a3 !== activeSuperpower,
    );
    return {
      unclassified: eligible.filter((c) => !groupings[c.iso_a3]),
      needed: eligible.filter((c) => groupings[c.iso_a3] === "needed"),
      unnecessary: eligible.filter(
        (c) => groupings[c.iso_a3] === "unnecessary",
      ),
    };
  }, [activeSuperpower, groupings]);

  const columnData = {
    unclassified,
    needed,
    unnecessary,
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const iso = active.id as string;
    const overId = over.id as string;

    // over.id가 컬럼이면 바로 사용, 카드이면 해당 카드의 그룹 추적
    let targetGroup: CountryGroupType | undefined;
    if (GROUP_TYPES.includes(overId as CountryGroupType)) {
      targetGroup = overId as CountryGroupType;
    } else {
      targetGroup = groupings[overId] || "unclassified";
    }

    setCountryGroup(activeSuperpower, iso, targetGroup);
  }

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="shrink-0 px-4 py-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          국가 그룹화
        </h3>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={columnCollision}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={scrollRef}
          onScroll={updateThumb}
          className={cn(
            "flex flex-1 gap-3 overflow-x-scroll p-4 pt-0 hide-native-scrollbar",
            !activeDragId && "snap-x snap-mandatory",
          )}
        >
          {GROUP_TYPES.map((type) => (
            <CountryGroupColumn
              key={type}
              groupType={type}
              title={GROUP_LABELS[type]}
              countries={columnData[type]}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragId ? <DragOverlayCard iso={activeDragId} /> : null}
        </DragOverlay>
      </DndContext>

      {/* 커스텀 스크롤바 */}
      {canScroll && (
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className={cn(
            "mx-4 mb-2 h-1.5 cursor-pointer rounded-full bg-muted/40 transition-opacity duration-200",
            isHovering ? "opacity-100" : "opacity-0",
          )}
        >
          <div
            onMouseDown={handleThumbDrag}
            className="h-full cursor-grab rounded-full bg-muted-foreground/50 hover:bg-muted-foreground/70 active:cursor-grabbing active:bg-muted-foreground/80"
            style={{
              width: thumbStyle.width,
              marginLeft: thumbStyle.left,
            }}
          />
        </div>
      )}
    </div>
  );
}
