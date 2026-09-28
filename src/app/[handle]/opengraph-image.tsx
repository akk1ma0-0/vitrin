import { ImageResponse } from "next/og";

import { isLocale } from "@/i18n/locales";
import { getPublicProfileByUsername, getWorksForProfile } from "@/lib/profiles";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  if (isLocale(handle)) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000000",
            color: "#fafafa",
            fontSize: 96,
            fontWeight: 600,
          }}
        >
          vitrin
          <span style={{ color: "#FF6B00" }}>.</span>
        </div>
      ),
      size,
    );
  }

  const profile = await getPublicProfileByUsername(handle);
  if (!profile) {
    return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#000" }} />, size);
  }

  const works = await getWorksForProfile(profile.id);
  const covers = works.map((w) => w.cover_url).filter((c): c is string => Boolean(c)).slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#000000",
          color: "#fafafa",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ fontSize: 64, fontWeight: 600, display: "flex" }}>{profile.display_name}</div>
          {profile.headline && (
            <div style={{ fontSize: 32, color: "#9a9a9a", marginTop: 12, display: "flex" }}>{profile.headline}</div>
          )}
        </div>
        {covers.length > 0 && (
          <div style={{ display: "flex", gap: 16 }}>
            {covers.map((cover) => (
              <img
                key={cover}
                src={cover}
                width={200}
                height={150}
                style={{ borderRadius: 12, objectFit: "cover" }}
                alt=""
              />
            ))}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", marginTop: 32, fontSize: 28, color: "#FF6B00" }}>
          vitrin.work/{profile.username}
        </div>
      </div>
    ),
    size,
  );
}
