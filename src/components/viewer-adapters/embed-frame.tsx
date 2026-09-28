/** Shared full-bleed iframe for embeds we don't control the content of (Figma, Google Docs, video players, Telegram posts). */
export function EmbedFrame({ url, title, aspect = "16/9" }: { url: string; title: string; aspect?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-lg" style={{ aspectRatio: aspect }}>
      <iframe
        src={url}
        title={title}
        className="h-full w-full border-0"
        allow="fullscreen; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
