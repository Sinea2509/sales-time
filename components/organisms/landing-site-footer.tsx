import Link from "next/link";

export function LandingSiteFooter() {
  return (
    <footer className="border-border mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-foreground font-semibold">Sales Time</p>
          <p className="mt-1 max-w-sm text-sm">
            Workspace sign-in, organizations, and secure operations in one
            place.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/sign-in" className="hover:text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
          <Link href="/sign-up" className="hover:text-foreground underline-offset-4 hover:underline">
            Create account
          </Link>
          <Link href="/company" className="hover:text-foreground underline-offset-4 hover:underline">
            App
          </Link>
        </div>
      </div>
      <div className="text-muted-foreground border-border border-t py-4 text-center text-xs">
        © {new Date().getFullYear()} Sales Time. All rights reserved.
      </div>
    </footer>
  );
}
