import { assertLocaleHandle } from "@/lib/handle";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ params }: PageProps<"/[handle]/login">) {
  const { handle } = await params;
  const locale = assertLocaleHandle(handle);
  return <LoginForm locale={locale} />;
}
