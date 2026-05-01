import { prisma } from "./prisma";

export async function findMutablePost(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      board: { select: { id: true, isActive: true } },
    },
  });
  if (!post || !post.board.isActive) return null;
  return post;
}

export async function findMutableComment(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      authorId: true,
      post: {
        select: {
          board: { select: { isActive: true } },
        },
      },
    },
  });
  if (!comment || !comment.post.board.isActive) return null;
  return comment;
}
