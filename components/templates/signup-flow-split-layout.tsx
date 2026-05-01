import type { ReactNode } from "react";
import { SignupFlowIllustration } from "@/components/molecules/signup-flow-illustration";

type Props = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

/**
 * Même grille que l’onboarding / inscription : illustration à gauche, contenu à droite.
 */
export function SignupFlowSplitLayout({ title, description, children }: Props) {
  return (
    <div className="grid min-h-svh grid-cols-1 bg-white lg:grid-cols-2">
      <section className="hidden bg-brand/10 lg:flex lg:items-center lg:justify-center">
        <SignupFlowIllustration />
      </section>

      <main className="flex min-h-svh flex-col overflow-hidden bg-white">
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col justify-center overflow-y-auto px-6 py-10 sm:px-10 xl:max-w-3xl">
          <header className="mb-8 flex shrink-0 flex-col items-center">
            <div className="mx-auto w-full max-w-lg text-center">
              <h1 className="text-[36px] font-semibold leading-tight tracking-tight">
                {title}
              </h1>
              {description ? (
                <div className="text-muted-foreground mx-auto mt-3 max-w-lg text-sm leading-relaxed sm:text-base">
                  {description}
                </div>
              ) : null}
            </div>
          </header>
          <div className="mx-auto w-full max-w-lg">{children}</div>
        </div>
      </main>
    </div>
  );
}
