import Link from "next/link";
import { HeartIcon, EyeIcon } from "@/components/icons";

type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  authorId?: string;
  authorName?: string;
  likeCount?: number;
  views?: number;
  status?: "draft" | "published";
  visibility?: "public" | "neighbors" | "private";
  thumbnail?: string | null;
};

export default function PostCard({
  post,
  index,
  showAuthor,
  actions,
}: {
  post: Post;
  index: number;
  showAuthor?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className="post-card group border border-border rounded-lg p-5 bg-surface hover:border-accent flex flex-col"
    >
      {post.thumbnail && (
        <div className="relative z-10 -mx-5 -mt-5 mb-3 aspect-video overflow-hidden rounded-t-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="flex items-center gap-2">
          {!!post.views && (
            <span className="flex items-center gap-1 font-mono text-xs text-muted">
              <EyeIcon className="w-3 h-3" />
              {post.views}
            </span>
          )}
          {!!post.likeCount && (
            <span className="flex items-center gap-1 font-mono text-xs text-muted">
              <HeartIcon className="w-3 h-3" filled />
              {post.likeCount}
            </span>
          )}
          <span className="font-mono text-xs text-muted">{post.date}</span>
        </span>
      </div>
      <h2 className="text-lg font-medium mb-1 group-hover:text-accent transition-colors flex items-center gap-2">
        <Link href={`/posts/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
        {post.status === "draft" && (
          <span className="relative z-10 font-mono text-[10px] text-muted border border-border rounded px-1.5 py-0.5 shrink-0">
            임시저장
          </span>
        )}
        {post.visibility === "neighbors" && (
          <span className="relative z-10 font-mono text-[10px] text-muted border border-border rounded px-1.5 py-0.5 shrink-0">
            이웃공개
          </span>
        )}
        {post.visibility === "private" && (
          <span className="relative z-10 font-mono text-[10px] text-muted border border-border rounded px-1.5 py-0.5 shrink-0">
            비공개
          </span>
        )}
      </h2>
      {showAuthor && post.authorName && post.authorId && (
        <Link
          href={`/u/${post.authorId}`}
          className="relative z-10 font-mono text-xs text-muted hover:text-accent mb-1 w-fit"
        >
          by {post.authorName}
        </Link>
      )}
      <p className="text-sm text-muted flex-1">{post.summary}</p>
      {post.tags.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[11px] uppercase tracking-wide text-muted border border-border rounded-full px-2 py-0.5 bg-background/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {actions && (
        <div className="relative z-10 flex gap-2 mt-3">{actions}</div>
      )}
    </div>
  );
}
