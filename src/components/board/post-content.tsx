import { cn } from "@/lib/utils";

interface PostContentProps {
  html: string;
  className?: string;
}

export function PostContent({ html, className }: PostContentProps) {
  return (
    <div
      className={cn(
        "post-rich-text prose dark:prose-invert max-w-none [&_ol]:list-decimal [&_ul]:list-disc",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
