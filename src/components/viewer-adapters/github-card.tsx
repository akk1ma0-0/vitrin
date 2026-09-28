import { ExternalLink, GitFork, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Json } from "@/lib/supabase/database.types";

interface GithubMeta {
  owner?: string;
  repo?: string;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  updatedAt?: string;
  topics?: string[];
  homepage?: string;
  readmeHtml?: string;
}

function parseMeta(raw: Json): GithubMeta {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as GithubMeta;
}

export function GithubCard({ sourceUrl, meta: rawMeta }: { sourceUrl: string; meta: Json }) {
  const meta = parseMeta(rawMeta);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-mono text-lg font-semibold">
            {meta.owner}/{meta.repo}
          </h3>
          {meta.description && <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>}
        </div>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {meta.language && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            {meta.language}
          </span>
        )}
        {typeof meta.stars === "number" && (
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4" /> {meta.stars}
          </span>
        )}
        {typeof meta.forks === "number" && (
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-4 w-4" /> {meta.forks}
          </span>
        )}
      </div>

      {meta.topics && meta.topics.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {meta.topics.map((topic) => (
            <Badge key={topic} variant="outline">
              {topic}
            </Badge>
          ))}
        </div>
      )}

      {meta.homepage && (
        <a
          href={meta.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          {meta.homepage}
        </a>
      )}

      {meta.readmeHtml && (
        // README HTML is sanitized server-side at ingest time (rehype-sanitize) before being stored here.
        <div
          className="prose prose-sm dark:prose-invert mt-6 max-w-none border-t border-border pt-4"
          dangerouslySetInnerHTML={{ __html: meta.readmeHtml }}
        />
      )}
    </div>
  );
}
