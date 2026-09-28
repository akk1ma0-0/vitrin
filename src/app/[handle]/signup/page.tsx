import { assertLocaleHandle } from "@/lib/handle";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage({ params }: PageProps<"/[handle]/signup">) {
  const { handle } = await params;
  const locale = assertLocaleHandle(handle);
  return <SignupForm locale={locale} />;
}
