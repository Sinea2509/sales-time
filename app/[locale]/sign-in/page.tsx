import { SignInPageShell } from "@/components/organisms/sign-in-page-shell";

type Search = { next?: string | string[]; reason?: string | string[] };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const nextRaw = sp.next;
  const next = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;
  const reasonRaw = sp.reason;
  const reason = Array.isArray(reasonRaw) ? reasonRaw[0] : reasonRaw;

  return <SignInPageShell next={next} reason={reason} />;
}
