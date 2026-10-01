interface BrokenLinkEmailProps {
  freelancerName: string;
  workTitle: string | null;
  sourceUrl: string;
  dashboardUrl: string;
}

/** Sent when the daily recheck (spec section 9) finds a work's link unreachable. */
export function BrokenLinkEmail({ freelancerName, workTitle, sourceUrl, dashboardUrl }: BrokenLinkEmailProps) {
  return (
    <div style={{ fontFamily: "sans-serif", color: "#0a0a0a", maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 4 }}>A link on your Vitrin page looks broken</h2>
      <p style={{ color: "#6b6b6b", marginTop: 0 }}>
        Hi {freelancerName}, we couldn&apos;t reach this link during our regular check:
      </p>

      <p style={{ marginTop: 16, padding: 16, background: "#f5f5f5", borderRadius: 12 }}>
        {workTitle && (
          <>
            <strong>{workTitle}</strong>
            <br />
          </>
        )}
        <a href={sourceUrl} style={{ color: "#ff6b00" }}>
          {sourceUrl}
        </a>
      </p>

      <p style={{ color: "#6b6b6b" }}>
        It&apos;s marked as broken on your page for now. If this was temporary, we&apos;ll clear it automatically
        the next time it&apos;s reachable — otherwise, update or remove the link from your dashboard.
      </p>

      <p style={{ marginTop: 24 }}>
        <a href={dashboardUrl} style={{ color: "#ff6b00" }}>
          Open your works
        </a>
      </p>
    </div>
  );
}
