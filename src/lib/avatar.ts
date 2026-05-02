import { getSignedImageUrl } from "@/lib/s3";

export async function resolveAvatarUrl(
  key: string | null | undefined
): Promise<string | null> {
  if (!key) return null;
  return getSignedImageUrl(key);
}

type AuthorLike = { image: string | null };
type WithAuthor = { author: AuthorLike };

export async function withResolvedAuthorImage<T extends WithAuthor>(
  item: T
): Promise<T> {
  const image = await resolveAvatarUrl(item.author.image);
  return { ...item, author: { ...item.author, image } };
}

export async function withResolvedAuthorImages<T extends WithAuthor>(
  items: T[]
): Promise<T[]> {
  return Promise.all(items.map(withResolvedAuthorImage));
}
