"use client";

import { useEffect, useRef } from "react";

/**
 * Renders Telegram's own Login Widget iframe in redirect mode: no global JS
 * callback, Telegram instead navigates the browser to `data-auth-url` with
 * the signed payload as query params (verified server-side in
 * /api/auth/telegram). The widget script finds `document.currentScript`'s
 * parent to mount its iframe into, so it has to be appended imperatively
 * rather than rendered as JSX.
 */
export function TelegramLoginButton({ botUsername, next }: { botUsername: string; next?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const authUrl = new URL("/api/auth/telegram", window.location.origin);
    if (next) authUrl.searchParams.set("next", next);

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-auth-url", authUrl.toString());
    script.setAttribute("data-request-access", "write");
    container.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [botUsername, next]);

  return <div ref={containerRef} className="flex justify-center" />;
}
