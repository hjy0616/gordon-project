import { MindMapList } from "@/components/mind-map/mind-map-list";

export const dynamic = "force-dynamic";

export default function MindMapListPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Mind Map</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          학습·리서치 내용을 자유롭게 정리하는 화이트보드입니다.
        </p>
      </div>
      <MindMapList />
    </div>
  );
}
