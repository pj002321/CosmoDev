import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import html from "remark-html";

const postsDir = path.join(process.cwd(), "content/posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
};

export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
    const { data } = matter(raw);
    return {
      slug: file.replace(/\.md$/, ""),
      title: data.title as string,
      date: toDateString(data.date),
      summary: data.summary as string,
      tags: (data.tags as string[]) ?? [],
    };
  });
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string) {
  const raw = fs.readFileSync(path.join(postsDir, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(remarkGfm).use(html).process(content);
  return {
    slug,
    title: data.title as string,
    date: toDateString(data.date),
    summary: data.summary as string,
    tags: (data.tags as string[]) ?? [],
    contentHtml: processed.toString(),
  };
}

function toDateString(date: unknown): string {
  return date instanceof Date ? date.toISOString().slice(0, 10) : String(date);
}
