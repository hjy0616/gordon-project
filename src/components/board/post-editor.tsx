"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
  ImagePlus,
  Table as TableIcon,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PostEditorProps {
  boardSlug: string;
  initialTitle?: string;
  initialContent?: string;
  postId?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(active && "bg-muted text-foreground")}
    >
      {children}
    </Button>
  );
}

function ToolbarTextButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      aria-label={ariaLabel}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function Toolbar({
  editor,
  onImageClick,
  uploading,
}: {
  editor: Editor | null;
  onImageClick: () => void;
  uploading: boolean;
}) {
  if (!editor) return null;

  const inTable = editor.isActive("table");

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL을 입력하세요", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertTable = () => {
    const input = window.prompt("표 크기 입력 (행x열, 최대 20x10)", "3x3");
    if (!input) return;
    const parts = input.toLowerCase().split("x");
    const rows = Math.min(Math.max(Number(parts[0]?.trim()) || 0, 1), 20);
    const cols = Math.min(Math.max(Number(parts[1]?.trim()) || 0, 1), 10);
    if (!rows || !cols) return;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        ariaLabel="굵게"
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        ariaLabel="기울임"
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        ariaLabel="취소선"
      >
        <Strikethrough />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        ariaLabel="제목 H1"
      >
        <Heading1 />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        ariaLabel="제목 H2"
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        ariaLabel="제목 H3"
      >
        <Heading3 />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        ariaLabel="순서 없는 목록"
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        ariaLabel="순서 있는 목록"
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        ariaLabel="인용문"
      >
        <Quote />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        ariaLabel="코드 블록"
      >
        <Code />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton
        onClick={setLink}
        active={editor.isActive("link")}
        ariaLabel="링크"
      >
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton
        onClick={onImageClick}
        disabled={uploading}
        ariaLabel="이미지"
      >
        <ImagePlus />
      </ToolbarButton>
      <ToolbarButton
        onClick={insertTable}
        active={inTable}
        ariaLabel="표 삽입"
      >
        <TableIcon />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border" />
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        ariaLabel="왼쪽 정렬"
      >
        <AlignLeft />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        ariaLabel="가운데 정렬"
      >
        <AlignCenter />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        ariaLabel="오른쪽 정렬"
      >
        <AlignRight />
      </ToolbarButton>

      {inTable && (
        <>
          <span className="mx-1 h-4 w-px bg-border" />
          <ToolbarTextButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            ariaLabel="행 추가"
          >
            +행
          </ToolbarTextButton>
          <ToolbarTextButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            ariaLabel="열 추가"
          >
            +열
          </ToolbarTextButton>
          <ToolbarTextButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            ariaLabel="행 삭제"
          >
            −행
          </ToolbarTextButton>
          <ToolbarTextButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            ariaLabel="열 삭제"
          >
            −열
          </ToolbarTextButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            ariaLabel="표 삭제"
          >
            <Trash2 />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

export function PostEditor({
  boardSlug,
  initialTitle = "",
  initialContent = "",
  postId,
}: PostEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      }),
      Image.configure({
        HTMLAttributes: { class: "mx-auto block rounded-md" },
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: "tiptap-table not-prose" },
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ["heading", "paragraph", "tableCell", "tableHeader"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "post-rich-text prose dark:prose-invert max-w-none [&_ol]:list-decimal [&_ul]:list-disc min-h-[320px] px-4 py-3",
      },
    },
  });

  const handleImageButtonClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/posts/images", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "이미지 업로드에 실패했습니다.");
      setUploading(false);
      return;
    }

    const data: { url: string } = await res.json();
    editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (trimmedTitle.length > 200) {
      setError("제목은 200자 이내로 입력해주세요.");
      return;
    }

    const html = editor?.getHTML() ?? "";
    const text = editor?.getText().trim() ?? "";
    const hasImage = html.includes("<img");
    const hasTable = html.includes("<table");
    if (!text && !hasImage && !hasTable) {
      setError("내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);

    const url = postId
      ? `/api/posts/${postId}`
      : `/api/boards/${boardSlug}/posts`;
    const method = postId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmedTitle, content: html }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "저장에 실패했습니다.");
      setSubmitting(false);
      return;
    }

    const data = await res.json();
    router.push(`/board/${boardSlug}/${data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className="text-base"
        disabled={submitting}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="rounded-lg border border-border bg-background">
        <Toolbar
          editor={editor}
          onImageClick={handleImageButtonClick}
          uploading={uploading}
        />
        <EditorContent editor={editor} />
      </div>
      {uploading && (
        <p className="text-xs text-muted-foreground">이미지 업로드 중...</p>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={submitting}
          onClick={() => router.back()}
        >
          취소
        </Button>
        <Button type="submit" disabled={submitting || uploading}>
          {submitting ? "저장 중..." : postId ? "수정" : "등록"}
        </Button>
      </div>
    </form>
  );
}
