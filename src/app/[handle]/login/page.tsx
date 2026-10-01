import { assertLocaleHandle } from "@/lib/handle";
import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/lib/auth-redirect";

export default async function LoginPage({ params }: PageProps<"/[handle]/login">) {
  const { handle } = await params;
  const locale = assertLocaleHandle(handle);
  await redirectIfAuthenticated();
  return <LoginForm locale={locale} />;
}
