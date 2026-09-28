/**
 * OpenAI Moderation API wrapper (spec section 8.1). Behind this interface
 * so the model/provider can change without touching call sites.
 */
export interface ModerationResult {
  flagged: boolean;
  categories: string[];
}

export async function moderateText(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !text.trim()) {
    return { flagged: false, categories: [] };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });

    if (!res.ok) return { flagged: false, categories: [] };

    const data = (await res.json()) as {
      results: Array<{ flagged: boolean; categories: Record<string, boolean> }>;
    };
    const result = data.results?.[0];
    if (!result) return { flagged: false, categories: [] };

    return {
      flagged: result.flagged,
      categories: Object.entries(result.categories)
        .filter(([, v]) => v)
        .map(([k]) => k),
    };
  } catch {
    // Moderation being unreachable must never block the whole flow; the
    // content stays `pending` for manual review either way.
    return { flagged: false, categories: [] };
  }
}
