import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { all } from "lowlight";

export async function renderMarkdown(content: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkRehype)
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
