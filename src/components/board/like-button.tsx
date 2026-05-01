"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ postId, initialLiked, initialCount }: LikeButtonProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const canLike = !!session?.user && session.user.status === "ACTIVE";

  const handleClick = async () => {
    if (!canLike || pending) return;
    setPending(true);

    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(prevLiked ? prevCount - 1 : prevCount + 1);

    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (!res.ok) {
      setLiked(prevLiked);
      setCount(prevCount);
      setPending(false);
      return;
    }
    const data = await res.json();
    setLiked(data.liked);
    setCount(data.count);
    setPending(false);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={!canLike || pending}
      aria-pressed={liked}
      className={cn(liked && "border-primary/40 bg-primary/10 text-primary")}
    >
      <Heart className={cn(liked && "fill-current")} />
      좋아요 {count}
    </Button>
  );
}
