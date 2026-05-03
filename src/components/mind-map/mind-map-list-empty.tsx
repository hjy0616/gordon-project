import { Sparkles } from "lucide-react";

export function MindMapListEmpty({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Sparkles className="size-5 text-muted-foreground" aria-hidden />
      </div>
      {filtered ? (
        <>
          <p className="text-sm font-medium">검색 결과가 없습니다</p>
          <p className="text-xs text-muted-foreground">
            다른 검색어를 시도하거나 필터를 해제해보세요.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium">아직 마인드맵이 없습니다</p>
          <p className="text-xs text-muted-foreground">
            {`"새 마인드맵" 버튼을 눌러 첫 보드를 만들어보세요.`}
          </p>
        </>
      )}
    </div>
  );
}
