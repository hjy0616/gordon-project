"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useAdminBoards, type AdminBoard } from "@/components/admin/use-admin-boards";
import { BoardFormDialog } from "@/components/admin/board-form-dialog";

export default function AdminBoardsPage() {
  const { boards, loading, error, createBoard, updateBoard, deleteBoard } =
    useAdminBoards();
  const [editing, setEditing] = useState<AdminBoard | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (board: AdminBoard) => {
    setEditing(board);
    setDialogOpen(true);
  };

  const handleDelete = async (board: AdminBoard) => {
    if (
      !window.confirm(
        `"${board.name}" 게시판을 삭제하시겠습니까?\n게시글과 댓글도 함께 삭제됩니다.`,
      )
    ) {
      return;
    }
    await deleteBoard(board.id);
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">게시판 관리</h1>
          <p className="text-sm text-muted-foreground">
            게시판을 생성·수정·비활성화할 수 있습니다.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />새 게시판
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>slug</TableHead>
              <TableHead>설명</TableHead>
              <TableHead className="w-20 text-center">정렬</TableHead>
              <TableHead className="w-24 text-center">게시글</TableHead>
              <TableHead className="w-24 text-center">상태</TableHead>
              <TableHead className="w-32 text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  불러오는 중...
                </TableCell>
              </TableRow>
            ) : boards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  등록된 게시판이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              boards.map((board) => (
                <TableRow key={board.id}>
                  <TableCell className="font-medium">{board.name}</TableCell>
                  <TableCell className="font-mono text-xs">{board.slug}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {board.description ?? "-"}
                  </TableCell>
                  <TableCell className="text-center text-sm">{board.sortOrder}</TableCell>
                  <TableCell className="text-center text-sm">
                    {board._count.posts}
                  </TableCell>
                  <TableCell className="text-center">
                    {board.isActive ? (
                      <Badge>활성</Badge>
                    ) : (
                      <Badge variant="secondary">비활성</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="수정"
                        onClick={() => openEdit(board)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="삭제"
                        onClick={() => handleDelete(board)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {dialogOpen && (
        <BoardFormDialog
          onClose={() => setDialogOpen(false)}
          initial={editing}
          onSubmit={(payload) =>
            editing ? updateBoard(editing.id, payload) : createBoard(payload)
          }
        />
      )}
    </div>
  );
}
