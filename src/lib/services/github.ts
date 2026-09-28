import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

export interface GithubRepoMeta {
  owner: string;
  repo: string;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  updatedAt: string;
  topics: string[];
  homepage?: string;
  readmeHtml?: string;
}

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchGithubRepoMeta(owner: string, repo: string): Promise<GithubRepoMeta | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github+json", ...authHeaders() },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      description: string | null;
      language: string | null;
      stargazers_count: number;
      forks_count: number;
      updated_at: string;
      topics?: string[];
      homepage: string | null;
    };

    let readmeHtml: string | undefined;
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: { Accept: "application/vnd.github.raw+json", ...authHeaders() },
      });
      if (readmeRes.ok) {
        const markdown = await readmeRes.text();
        const file = await unified()
          .use(remarkParse)
          .use(remarkRehype)
          .use(rehypeSanitize)
          .use(rehypeStringify)
          .process(markdown.slice(0, 20_000));
        readmeHtml = String(file);
      }
    } catch {
      readmeHtml = undefined;
    }

    return {
      owner,
      repo,
      description: data.description ?? undefined,
      language: data.language ?? undefined,
      stars: data.stargazers_count,
      forks: data.forks_count,
      updatedAt: data.updated_at,
      topics: data.topics ?? [],
      homepage: data.homepage ?? undefined,
      readmeHtml,
    };
  } catch {
    return null;
  }
}
