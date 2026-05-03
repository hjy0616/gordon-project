"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateMindMap } from "@/lib/queries/use-mind-maps";

const SUGGESTED_EMOJIS = ["🌍", "📚", "💡", "📈", "🧠", "🗺️", "🔥", "✨"];

export function NewMindMapButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState<string>("🧠");
  const router = useRouter();
  const create = useCreateMindMap();

  function handleCreate() {
    if (create.isPending) return;
    create.mutate(
      {
        title: title.trim() || "Untitled",
        emoji,
      },
      {
        onSuccess: (m) => {
          setOpen(false);
          setTitle("");
          setEmoji("🧠");
          router.push(`/mind-map/${m.id}`);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            <span>새 마인드맵</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 마인드맵</DialogTitle>
          <DialogDescription>
            제목과 이모지를 정하면 빈 캔버스로 이동합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">이모지</label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  aria-pressed={emoji === e}
                  className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-lg transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/10"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="mind-map-title" className="text-sm font-medium">
              제목
            </label>
            <Input
              id="mind-map-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 경제위기 큐"
              maxLength={200}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={create.isPending}
          >
            취소
          </Button>
          <Button onClick={handleCreate} disabled={create.isPending}>
            {create.isPending ? "생성 중..." : "만들기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
