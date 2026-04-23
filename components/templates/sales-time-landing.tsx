import Link from "next/link";
import { Building2, Clock3, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LandingSiteFooter } from "@/components/organisms/landing-site-footer";
import { LandingSiteHeader } from "@/components/organisms/landing-site-header";

const features = [
  {
    title: "Built for teams",
    description:
      "Organizations, roles, and switching—so everyone works in the right space without friction.",
    icon: Building2,
  },
  {
    title: "Time that sells",
    description:
      "Keep revenue motion visible: align your crew around the calendar, pipeline, and next best action.",
    icon: Clock3,
  },
  {
    title: "Trust by design",
    description:
      "Built-in auth and audited super-admin access when you need to support any tenant.",
    icon: ShieldCheck,
  },
] as const;

export function SalesTimeLanding() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-25"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.75 0.12 250 / 0.25), transparent),
            linear-gradient(to right, oklch(0 0 0 / 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(0 0 0 / 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 32px 32px, 32px 32px",
        }}
      />
      <LandingSiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-20 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-muted-foreground mb-4 text-sm font-medium tracking-wide uppercase">
              Salestime
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
              The workspace where revenue teams{" "}
              <span className="text-primary">show up on time</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg text-pretty sm:text-xl">
              Create your account on the sign-up page, then continue with
              onboarding. Returning users can sign in on the dedicated page.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex min-w-[200px] justify-center px-8 shadow-md",
                )}
              >
                Create free account
              </Link>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "inline-flex min-w-[200px] justify-center border-border/80 bg-background/80 px-8 backdrop-blur",
                )}
              >
                Sign in
              </Link>
              <Link
                href="/company"
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "inline-flex min-w-[200px] justify-center px-8 shadow-md",
                )}
              >
                Open dashboard
              </Link>
            </div>

            <p className="text-muted-foreground mt-6 text-sm">
              <Link
                href="/sign-in"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
              {" · "}
              <Link
                href="/sign-up"
                className="text-foreground font-medium underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </section>

        <section
          className="border-border bg-muted/30 border-y py-16 sm:py-20"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="features-heading"
                className="text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                Everything your org needs to move
              </h2>
              <p className="text-muted-foreground mt-3 text-sm sm:text-base">
                Multi-tenant structure, clear roles, and a path from first visit
                to productive dashboard.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {features.map(({ title, description, icon: Icon }) => (
                <Card
                  key={title}
                  className="border-border/80 bg-card/80 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
                >
                  <CardHeader className="gap-3">
                    <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Sign-in &amp; sign-up workflow
              </h2>
              <ol className="mt-8 space-y-6 text-sm sm:text-base">
                <li className="flex gap-4">
                  <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Choose how you authenticate</p>
                    <p className="text-muted-foreground mt-1">
                      New accounts use the full sign-up page. Returning users sign
                      in with e-mail and password; password reset is available
                      from the sign-in page.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Profile, then onboarding</p>
                    <p className="text-muted-foreground mt-1">
                      After sign-up you add your name and role, then the French
                      onboarding wizard (context, coach IA, process,
                      invitations), which creates your first organization.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Land on your dashboard</p>
                    <p className="text-muted-foreground mt-1">
                      You&apos;ll be redirected to the dashboard with session and
                      organization context ready.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
            <div className="border-border bg-card/60 rounded-2xl border p-6 shadow-sm backdrop-blur sm:p-8">
              <h3 className="text-lg font-semibold">Ready when you are</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                New here? Start with an account. Already using Sales Time? Sign
                in and jump back to your workspace.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "inline-flex w-full justify-center",
                  )}
                >
                  Create account
                </Link>
                <Link
                  href="/sign-in"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "secondary" }),
                    "inline-flex w-full justify-center",
                  )}
                >
                  Sign in to Sales Time
                </Link>
                <Link
                  href="/company"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "inline-flex w-full justify-center",
                  )}
                >
                  Go to dashboard
                </Link>
                <div className="text-muted-foreground flex flex-col gap-2 border-t pt-4 text-center text-xs sm:text-sm">
                  <span>Full-page flows</span>
                  <div className="flex justify-center gap-4">
                    <Link
                      href="/sign-up"
                      className="text-foreground font-medium underline-offset-4 hover:underline"
                    >
                      Sign up
                    </Link>
                    <Link
                      href="/sign-in"
                      className="text-foreground font-medium underline-offset-4 hover:underline"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingSiteFooter />
    </div>
  );
}
