import { MousePointerClick } from "lucide-react";

export function EmptyCanvasHint({ readonly }: { readonly: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <MousePointerClick
            className="size-6 text-muted-foreground"
            aria-hidden
          />
        </div>
        {readonly ? (
          <p className="text-sm text-muted-foreground">
            아직 노드가 없는 마인드맵입니다.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            우하단{" "}
            <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
              +
            </span>{" "}
            버튼이나{" "}
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-xs font-medium">
              Tab
            </kbd>{" "}
            키로 첫 노드를 추가하세요.
          </p>
        )}
      </div>
    </div>
  );
}
