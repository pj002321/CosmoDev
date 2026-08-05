import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

export async function renderMarkdown(content: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight, { detect: false })
    .use(rehypeStringify)
    .process(content ?? "");
  return processed
    .toString()
    .replace(
      /<pre><code class="([^"]*\blanguage-([\w-]+)\b[^"]*)"/g,
      '<pre data-lang="$2"><code class="$1"'
    );
}
