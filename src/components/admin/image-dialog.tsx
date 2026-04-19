"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserRow } from "./status-badge";

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.3;
const WHEEL_STEP = 1.15;

interface ImageDialogProps {
  user: UserRow | null;
  onClose: () => void;
  imageType: "verification" | "renewal";
}

export function ImageDialog({ user, onClose, imageType }: ImageDialogProps) {
  const title = imageType === "verification" ? "인증 이미지" : "재인증 이미지";

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[95vh] w-[95vw] max-w-[95vw] flex-col gap-0 p-0 sm:max-w-[95vw]">
        <DialogHeader className="p-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {user?.name || user?.email}
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <ImageDialogBody
            key={`${user.id}-${imageType}`}
            userId={user.id}
            imageType={imageType}
            title={title}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface ImageDialogBodyProps {
  userId: string;
  imageType: "verification" | "renewal";
  title: string;
}

function ImageDialogBody({ userId, imageType, title }: ImageDialogBodyProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const endpoint =
      imageType === "verification"
        ? `/api/admin/users/${userId}/image`
        : `/api/admin/users/${userId}/renewal`;

    fetch(endpoint)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        setImageUrl(data?.url ?? null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, imageType]);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-xl bg-black/50">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          로딩 중...
        </div>
      ) : imageUrl ? (
        <ZoomableImage src={imageUrl} alt={title} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          이미지를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}

interface Point {
  x: number;
  y: number;
}

interface ViewState {
  scale: number;
  x: number;
  y: number;
  animating: boolean;
}

const INITIAL_VIEW: ViewState = { scale: 1, x: 0, y: 0, animating: true };

function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewState>(INITIAL_VIEW);

  const pointers = useRef<Map<number, Point>>(new Map());
  const pinchRef = useRef<{ dist: number } | null>(null);
  const panRef = useRef<{ pointer: Point } | null>(null);

  const updateZoom = useCallback(
    (
      computeNext: (currentScale: number) => number,
      focal: Point | null,
      animate: boolean,
    ) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      setView((curr) => {
        const next = computeNext(curr.scale);
        const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
        if (clamped <= MIN_SCALE) {
          return { scale: MIN_SCALE, x: 0, y: 0, animating: animate };
        }
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const fx = focal?.x ?? cx;
        const fy = focal?.y ?? cy;
        const localX = (fx - cx - curr.x) / curr.scale;
        const localY = (fy - cy - curr.y) / curr.scale;
        return {
          scale: clamped,
          x: fx - cx - localX * clamped,
          y: fy - cy - localY * clamped,
          animating: animate,
        };
      });
    },
    [],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1 / WHEEL_STEP : WHEEL_STEP;
      updateZoom((s) => s * factor, { x: e.clientX, y: e.clientY }, false);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [updateZoom]);

  const reset = () => setView(INITIAL_VIEW);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      pinchRef.current = {
        dist: Math.hypot(p2.x - p1.x, p2.y - p1.y),
      };
      panRef.current = null;
    } else if (pointers.current.size === 1) {
      panRef.current = { pointer: { x: e.clientX, y: e.clientY } };
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchRef.current) {
      const [p1, p2] = Array.from(pointers.current.values());
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const ratio = dist / pinchRef.current.dist;
      updateZoom((s) => s * ratio, mid, false);
      pinchRef.current = { dist };
    } else if (pointers.current.size === 1 && panRef.current) {
      const dx = e.clientX - panRef.current.pointer.x;
      const dy = e.clientY - panRef.current.pointer.y;
      panRef.current.pointer = { x: e.clientX, y: e.clientY };
      setView((curr) => {
        if (curr.scale <= MIN_SCALE) return curr;
        return {
          ...curr,
          x: curr.x + dx,
          y: curr.y + dy,
          animating: false,
        };
      });
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) panRef.current = null;
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (view.scale > 1) {
      reset();
    } else {
      updateZoom(() => 2.5, { x: e.clientX, y: e.clientY }, true);
    }
  };

  const zoomInBtn = () =>
    updateZoom((s) => s * ZOOM_STEP, null, true);
  const zoomOutBtn = () =>
    updateZoom((s) => s / ZOOM_STEP, null, true);

  const canPan = view.scale > MIN_SCALE;
  const isPristine = view.scale === 1 && view.x === 0 && view.y === 0;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      style={{ cursor: canPan ? "grab" : "zoom-in" }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          transformOrigin: "center center",
          transition: view.animating ? "transform 140ms ease-out" : "none",
          willChange: "transform",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="pointer-events-none max-h-full max-w-full object-contain"
          draggable={false}
        />
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-background/90 p-1 shadow ring-1 ring-border backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={zoomOutBtn}
          title="축소"
          disabled={view.scale <= MIN_SCALE}
        >
          <ZoomOut className="size-4" />
        </Button>
        <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(view.scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={zoomInBtn}
          title="확대"
          disabled={view.scale >= MAX_SCALE}
        >
          <ZoomIn className="size-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={reset}
          title="원래 크기"
          disabled={isPristine}
        >
          <Maximize2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
