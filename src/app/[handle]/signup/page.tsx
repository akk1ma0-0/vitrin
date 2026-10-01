import { assertLocaleHandle } from "@/lib/handle";
import { SignupForm } from "@/components/auth/signup-form";
import { redirectIfAuthenticated } from "@/lib/auth-redirect";

export default async function SignupPage({ params }: PageProps<"/[handle]/signup">) {
  const { handle } = await params;
  const locale = assertLocaleHandle(handle);
  await redirectIfAuthenticated();
  return <SignupForm locale={locale} telegramBotUsername={process.env.TELEGRAM_BOT_USERNAME ?? null} />;
}
