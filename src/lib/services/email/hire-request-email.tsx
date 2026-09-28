interface HireRequestEmailProps {
  freelancerName: string;
  clientName: string;
  clientEmail: string;
  budget?: string;
  message: string;
  workTitle?: string;
  profileUrl: string;
}

/**
 * Plain-JSX email template (Resend renders React elements server-side
 * without needing the full @react-email/components package). Keep styles
 * inline — most email clients strip <style> blocks.
 */
export function HireRequestEmail({
  freelancerName,
  clientName,
  clientEmail,
  budget,
  message,
  workTitle,
  profileUrl,
}: HireRequestEmailProps) {
  return (
    <div style={{ fontFamily: "sans-serif", color: "#0a0a0a", maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 4 }}>New request from your Vitrin page</h2>
      <p style={{ color: "#6b6b6b", marginTop: 0 }}>Hi {freelancerName}, you&apos;ve got a new message.</p>

      {workTitle && (
        <p style={{ fontSize: 14, color: "#6b6b6b" }}>
          Regarding: <strong>{workTitle}</strong>
        </p>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <tbody>
          <tr>
            <td style={{ padding: "4px 0", color: "#6b6b6b", width: 100 }}>From</td>
            <td style={{ padding: "4px 0" }}>
              {clientName} &lt;{clientEmail}&gt;
            </td>
          </tr>
          {budget && (
            <tr>
              <td style={{ padding: "4px 0", color: "#6b6b6b" }}>Budget</td>
              <td style={{ padding: "4px 0" }}>{budget}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p style={{ whiteSpace: "pre-wrap", marginTop: 16, padding: 16, background: "#f5f5f5", borderRadius: 12 }}>
        {message}
      </p>

      <p style={{ marginTop: 24 }}>
        <a href={profileUrl} style={{ color: "#ff6b00" }}>
          View on your Vitrin dashboard
        </a>
      </p>

      <p style={{ fontSize: 12, color: "#9a9a9a", marginTop: 32 }}>
        Reply directly to this email to respond to {clientName}.
      </p>
    </div>
  );
}
