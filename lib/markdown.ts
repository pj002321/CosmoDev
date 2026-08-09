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

export async function renderMarkdown(content: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
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
