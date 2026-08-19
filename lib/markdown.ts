import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { all } from "lowlight";
import { HIGHLIGHT_COLORS } from "@/lib/colors";

// Editor's text-color/highlight buttons emit `<span class="text-hl-{color}">`
// and `<span class="bg-hl-{color}">` — allow only those known class names
// through sanitize, same technique hast-util-sanitize itself uses for
// `language-*` code classes.
const colorNames = HIGHLIGHT_COLORS.map((c) => c.name).join("|");
const schema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [["className", new RegExp(`^(?:text|bg)-hl-(?:${colorNames})$`)]],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function textContent(node: any): string {
  if (node.type === "text") return node.value ?? "";
  if (node.children) return node.children.map(textContent).join("");
  return "";
}

function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-") || "section"
  );
}

// Assigns stable ids to h1-h3 so the reading-progress table of contents can
// deep-link into the article body; rehype-sanitize's default schema already
// allows the `id` attribute, so no schema change is needed here.
function rehypeHeadingIds() {
  const seen = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walk = (node: any) => {
      if (node.type === "element" && /^h[1-3]$/.test(node.tagName)) {
        const base = slugifyHeading(textContent(node));
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        node.properties = { ...node.properties, id: count ? `${base}-${count}` : base };
      }
      node.children?.forEach(walk);
    };
    tree.children.forEach(walk);
  };
}

export async function renderMarkdown(content: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    .use(rehypeHeadingIds)
    .use(rehypeHighlight, { detect: true, languages: all })
    .use(rehypeStringify)
    .process(content ?? "");
  return processed
    .toString()
    .replace(
      /<pre><code class="([^"]*\blanguage-([\w-]+)\b[^"]*)"/g,
      '<pre data-lang="$2"><code class="$1"'
    );
}
