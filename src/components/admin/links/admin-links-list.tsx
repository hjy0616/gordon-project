"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminLinks, type AdminLink } from "@/lib/queries/use-admin-links";
import type { AdminLinkCategory } from "@/lib/queries/use-admin-link-categories";
import { LinkFormDialog } from "./link-form-dialog";

const ALL = "__all__";

interface AdminLinksListProps {
  categories: AdminLinkCategory[];
}

function SortableRow({
  link,
  draggable,
  onEdit,
  onDelete,
  onChangeCategory,
  categories,
}: {
  link: AdminLink;
  draggable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onChangeCategory: (categoryId: string) => void;
  categories: AdminLinkCategory[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id, disabled: !draggable });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border-b border-border"
    >
      <td className="w-8 px-2 py-2">
        {draggable ? (
          <button
            type="button"
            className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : (
          <GripVertical className="size-4 opacity-20" />
        )}
      </td>
      <td className="px-2 py-2">
        <Select
          value={link.categoryId}
          onValueChange={(v) => v && onChangeCategory(v)}
        >
          <SelectTrigger className="h-8 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-2 py-2 font-medium">{link.title}</td>
      <td className="px-2 py-2 font-mono text-xs text-muted-foreground">
        {link.author}
      </td>
      <td className="max-w-xs truncate px-2 py-2 text-sm text-muted-foreground">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
        >
          {link.url}
          <ExternalLink className="size-3" />
        </a>
      </td>
      <td className="px-2 py-2 text-right">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  );
}

export function AdminLinksList({ categories }: AdminLinksListProps) {
  const {
    links,
    loading,
    error,
    createLink,
    updateLink,
    deleteLink,
    reorderLinks,
  } = useAdminLinks();

  const [filterCategory, setFilterCategory] = useState<string>(ALL);
  const [editing, setEditing] = useState<AdminLink | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminLink | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const visibleLinks = useMemo(() => {
    const sorted = [...links].sort((a, b) => {
      if (a.categoryId !== b.categoryId) {
        const ac = categories.find((c) => c.id === a.categoryId)?.sortOrder ?? 0;
        const bc = categories.find((c) => c.id === b.categoryId)?.sortOrder ?? 0;
        if (ac !== bc) return ac - bc;
      }
      return a.sortOrder - b.sortOrder;
    });
    if (filterCategory === ALL) return sorted;
    return sorted.filter((l) => l.categoryId === filterCategory);
  }, [links, categories, filterCategory]);

  const draggable = filterCategory !== ALL;

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleLinks.findIndex((l) => l.id === active.id);
    const newIndex = visibleLinks.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(visibleLinks, oldIndex, newIndex);
    await reorderLinks(filterCategory, reordered.map((l) => l.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select
          value={filterCategory}
          onValueChange={(v) => v && setFilterCategory(v)}
        >
          <SelectTrigger className="w-60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>전체 카테고리</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1 size-4" />새 링크
        </Button>
      </div>

      {!draggable ? (
        <p className="text-xs text-muted-foreground">
          정렬을 변경하려면 위에서 단일 카테고리를 선택하세요.
        </p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="rounded-md border border-border">
        <table className="w-full">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="w-8 px-2 py-2"></th>
              <th className="px-2 py-2">카테고리</th>
              <th className="px-2 py-2">제목</th>
              <th className="px-2 py-2">작성자</th>
              <th className="px-2 py-2">URL</th>
              <th className="px-2 py-2 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-sm text-muted-foreground">
                  불러오는 중...
                </td>
              </tr>
            ) : visibleLinks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-6 text-center text-sm text-muted-foreground">
                  링크가 없습니다.
                </td>
              </tr>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={visibleLinks.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {visibleLinks.map((link) => (
                    <SortableRow
                      key={link.id}
                      link={link}
                      draggable={draggable}
                      categories={categories}
                      onEdit={() => {
                        setEditing(link);
                        setDialogOpen(true);
                      }}
                      onDelete={() => setDeleteCandidate(link)}
                      onChangeCategory={(newCatId) =>
                        updateLink(link.id, {
                          title: link.title,
                          url: link.url,
                          author: link.author,
                          description: link.description,
                          categoryId: newCatId,
                        })
                      }
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </tbody>
        </table>
      </div>

      <LinkFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        categories={categories}
        onSubmit={async (payload) => {
          if (editing) return updateLink(editing.id, payload);
          return createLink(payload);
        }}
      />

      <AlertDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 링크를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate?.title} — 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteCandidate) await deleteLink(deleteCandidate.id);
                setDeleteCandidate(null);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
