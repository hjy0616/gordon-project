"use client";

import { useState } from "react";
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
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { CategoryFormDialog } from "./category-form-dialog";
import type { AdminLinkCategory } from "@/lib/queries/use-admin-link-categories";

interface AdminLinkCategoriesProps {
  categories: AdminLinkCategory[];
  loading: boolean;
  error: string | null;
  createCategory: (name: string) => Promise<{ error: string | null }>;
  updateCategory: (id: string, name: string) => Promise<{ error: string | null }>;
  deleteCategory: (id: string) => Promise<{ error: string | null }>;
  reorderCategories: (orderedIds: string[]) => Promise<{ error: string | null }>;
}

function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: AdminLinkCategory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex-1 font-medium">{category.name}</div>
      <span className="text-xs text-muted-foreground">
        링크 {category._count.links}개
      </span>
      <Button variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

export function AdminLinkCategories({
  categories,
  loading,
  error,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
}: AdminLinkCategoriesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminLinkCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(categories, oldIndex, newIndex);
    await reorderCategories(reordered.map((c) => c.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1 size-4" />새 카테고리
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">불러오는 중...</div>
      ) : categories.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          등록된 카테고리가 없습니다.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {categories.map((c) => (
                <SortableCategoryRow
                  key={c.id}
                  category={c}
                  onEdit={() => {
                    setEditing({ id: c.id, name: c.name });
                    setDialogOpen(true);
                  }}
                  onDelete={() => {
                    setDeleteCandidate(c);
                    setDeleteError(null);
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={async (name) => {
          if (editing) return updateCategory(editing.id, name);
          return createCategory(name);
        }}
      />

      <AlertDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCandidate(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 카테고리를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate?.name}
              {deleteCandidate && deleteCandidate._count.links > 0
                ? ` — 연결된 링크 ${deleteCandidate._count.links}개를 먼저 비우거나 옮겨야 합니다.`
                : " — 이 작업은 되돌릴 수 없습니다."}
            </AlertDialogDescription>
            {deleteError ? (
              <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {deleteError}
              </div>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!deleteCandidate) return;
                const result = await deleteCategory(deleteCandidate.id);
                if (result.error) {
                  setDeleteError(result.error);
                  return;
                }
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
