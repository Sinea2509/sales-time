import { UserProfile } from "@clerk/nextjs";

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Profile, security, password reset, and sessions are managed in Clerk.
        </p>
      </div>
      <div className="flex justify-center">
        <UserProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-border rounded-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
