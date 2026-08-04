---
title: Next.js로 정적 블로그 구조 잡기
date: 2026-03-02
summary: gray-matter와 remark로 마크다운 파일을 파싱해서 정적 페이지를 생성했다.
tags: [nextjs, markdown]
---

블로그 엔진을 새로 만들 필요는 없었다. `content/posts/*.md` 파일을 읽어서
`gray-matter`로 프론트매터를 뽑고, `remark`로 HTML로 변환하는 것만으로 충분했다.

```ts
const { data, content } = matter(raw);
const html = await remark().use(remarkGfm).use(html).process(content);
```

## 배운 것

- App Router의 서버 컴포넌트에서 `fs`를 바로 써도 된다. 빌드 타임에 실행되니까
  클라이언트로 넘어갈 걱정이 없다.
- 정적 생성이라 Vercel에 그냥 올리면 CDN에서 바로 서빙된다. 서버 비용 걱정 없음.

다음엔 태그 필터링을 추가할지 고민 중인데, 글이 5개도 안 되는 지금은 굳이
필요 없을 것 같다.
