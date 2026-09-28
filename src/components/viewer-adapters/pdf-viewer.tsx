export function PdfViewer({ url }: { url: string }) {
  return (
    <iframe
      src={url}
      title="PDF"
      className="h-[75vh] w-full rounded-lg border border-border"
      loading="lazy"
    />
  );
}
