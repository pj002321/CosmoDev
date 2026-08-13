import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";

const BASE_URL = "https://cosmodev.calzykri.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/explore`, changeFrequency: "daily", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${BASE_URL}/posts/${p.slug}`,
      lastModified: p.date,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
