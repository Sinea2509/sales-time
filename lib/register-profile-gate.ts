export function needsRegisterProfile(
  user: { registerProfileCompletedAt: Date | null } | null,
): boolean {
  if (!user) return true;
  return user.registerProfileCompletedAt == null;
}
